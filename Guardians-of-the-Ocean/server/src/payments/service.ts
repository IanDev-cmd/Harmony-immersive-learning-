import { type Env, mockAllowed } from "../env.js";
import type { Messenger } from "../comms/africastalking.js";
import { HttpError } from "../http.js";
import { maskPhone, networkOf, normalizeKePhone } from "../lib/phone.js";
import { kes } from "../lib/text.js";
import type { Channel, MobilePayment, Provider, Store } from "../store/types.js";
import { parseAirtelCallback } from "./airtel.js";
import { parseStkCallback } from "./mpesa.js";
import { MobileMoney, Outcome, ProviderError } from "./types.js";

export const PROVIDER_LABEL: Record<Provider, string> = { mpesa: "M-Pesa", airtel: "Airtel Money" };

// Ask the provider directly once a prompt has been open this long without a callback.
const QUERY_AFTER_MS = 20_000;
// Customers get about a minute to enter a PIN; after this we stop waiting.
const GIVE_UP_AFTER_MS = 3 * 60_000;

export interface StartPayment {
  phone: unknown;
  amount: unknown;
  provider?: Provider;
  purpose?: string;
  channel: Channel;
}

export interface PaymentView {
  id: string;
  provider: Provider;
  providerLabel: string;
  phone: string;
  amount: number;
  amountLabel: string;
  status: MobilePayment["status"];
  receipt: string | null;
  failureReason: string | null;
  purpose: string;
  createdAt: string;
  mode: string;
  message?: string;
}

export function providerForPhone(phone: string): Provider | null {
  const net = networkOf(phone);
  if (net === "safaricom") return "mpesa";
  if (net === "airtel") return "airtel";
  return null;
}

export class Payments {
  private sweeper: NodeJS.Timeout | null = null;

  constructor(
    private env: Env,
    private store: Store,
    private messenger: Messenger,
    readonly providers: Record<Provider, MobileMoney>,
    private now: () => number = Date.now
  ) {}

  view(p: MobilePayment, message?: string): PaymentView {
    return {
      id: p.id,
      provider: p.provider,
      providerLabel: PROVIDER_LABEL[p.provider],
      phone: maskPhone(p.phone),
      amount: p.amount,
      amountLabel: kes(p.amount),
      status: p.status,
      receipt: p.receipt,
      failureReason: p.failureReason,
      purpose: p.purpose,
      createdAt: p.createdAt.toISOString(),
      mode: this.providers[p.provider].mode,
      ...(message ? { message } : {}),
    };
  }

  available(provider: Provider): boolean {
    return this.providers[provider].mode !== "mock" || mockAllowed(this.env);
  }

  async start(input: StartPayment): Promise<{ payment: MobilePayment; message: string }> {
    const phone = normalizeKePhone(input.phone);
    if (!phone) throw new HttpError(400, "Enter a valid Kenyan mobile number, e.g. 0712 345 678");

    const detected = providerForPhone(phone);
    const provider = input.provider ?? detected;
    if (!provider) throw new HttpError(400, "Use a Safaricom (M-Pesa) or Airtel (Airtel Money) number");
    if (input.provider && detected && detected !== input.provider) {
      throw new HttpError(400, `That looks like ${detected === "mpesa" ? "a Safaricom" : "an Airtel"} number. Switch to ${PROVIDER_LABEL[detected]} or use another number.`);
    }
    if (!this.available(provider)) throw new HttpError(503, `${PROVIDER_LABEL[provider]} is not set up on this server yet`);

    const amount = Number(input.amount);
    if (!Number.isInteger(amount) || amount < this.env.MOBILE_MIN_KES || amount > this.env.MOBILE_MAX_KES) {
      throw new HttpError(400, `Amount must be a whole number between ${kes(this.env.MOBILE_MIN_KES)} and ${kes(this.env.MOBILE_MAX_KES)}`);
    }

    const purpose = (input.purpose || "restoration").replace(/[^a-z0-9 _-]/gi, "").slice(0, 40) || "restoration";
    const payment = await this.store.createPayment({ provider, phone, amount, purpose, channel: input.channel });

    try {
      const pushed = await this.providers[provider].push({
        paymentId: payment.id,
        phone,
        amount,
        reference: this.env.MPESA_ACCOUNT_REF,
        description: "Harmony coast",
      });
      const updated = await this.store.updatePayment(payment.id, {
        providerRef: pushed.providerRef,
        merchantRef: pushed.merchantRef || null,
      });
      console.log(`[pay] ${provider} prompt sent to ${maskPhone(phone)} for ${kes(amount)} (${payment.id})`);
      return { payment: updated ?? payment, message: pushed.message };
    } catch (err) {
      const reason = err instanceof ProviderError ? err.userMessage : "Could not reach the payment provider";
      console.warn(`[pay] ${provider} push failed (${payment.id}):`, (err as Error).message);
      await this.store.settlePayment(payment.id, { status: "failed", failureReason: reason });
      throw new HttpError(502, reason);
    }
  }

  /** Current state, asking the provider directly if the callback is late. */
  async refresh(id: string): Promise<MobilePayment | null> {
    const payment = await this.store.getPayment(id);
    if (!payment || payment.status !== "pending" || !payment.providerRef) return payment;
    const age = this.now() - payment.createdAt.getTime();
    if (age < QUERY_AFTER_MS && this.providers[payment.provider].mode !== "mock") return payment;

    let outcome: Outcome = { status: "pending" };
    try {
      outcome = await this.providers[payment.provider].query(payment.providerRef);
    } catch (err) {
      console.warn(`[pay] status query failed (${payment.id}):`, (err as Error).message);
    }
    if (outcome.status === "pending" && age > GIVE_UP_AFTER_MS) {
      outcome = { status: "timeout", reason: "No response from the phone. Nothing was charged." };
    }
    if (outcome.status === "pending") return payment;
    return (await this.apply(payment, outcome)) ?? (await this.store.getPayment(id));
  }

  async onProviderOutcome(provider: Provider, providerRef: string, outcome: Outcome): Promise<MobilePayment | null> {
    const payment = await this.store.findPaymentByRef(provider, providerRef);
    if (!payment) {
      console.warn(`[pay] ${provider} callback for unknown ref ${providerRef}`);
      return null;
    }
    return this.apply(payment, outcome);
  }

  async handleMpesaCallback(body: unknown): Promise<boolean> {
    const parsed = parseStkCallback(body);
    if (!parsed) return false;
    await this.onProviderOutcome("mpesa", parsed.checkoutRequestId, parsed.outcome);
    return true;
  }

  async handleAirtelCallback(body: unknown): Promise<boolean> {
    const parsed = parseAirtelCallback(body);
    if (!parsed) return false;
    await this.onProviderOutcome("airtel", parsed.transactionId, parsed.outcome);
    return true;
  }

  private async apply(payment: MobilePayment, outcome: Outcome): Promise<MobilePayment | null> {
    if (outcome.status === "pending") return payment;
    const settled = await this.store.settlePayment(
      payment.id,
      outcome.status === "paid"
        ? { status: "paid", receipt: outcome.receipt ?? payment.receipt }
        : { status: outcome.status, failureReason: outcome.reason }
    );
    if (!settled) return null; // already settled by the callback or a poll
    console.log(`[pay] ${settled.id} -> ${settled.status}`);
    await this.notify(settled);
    return settled;
  }

  private async notify(p: MobilePayment): Promise<void> {
    const label = PROVIDER_LABEL[p.provider];
    if (p.status === "paid") {
      const ref = p.receipt ? ` Ref ${p.receipt}.` : "";
      await this.messenger.sendSms(
        p.phone,
        `Asante! ${kes(p.amount)} received via ${label}.${ref} Your support helps plant mangroves and restore the coast. - Harmony`
      );
      return;
    }
    // Web users see the result on screen; feature-phone users need to hear back.
    if (p.channel !== "web") {
      await this.messenger.sendSms(
        p.phone,
        `Harmony: your ${label} payment of ${kes(p.amount)} did not go through (${p.failureReason ?? p.status}). Nothing was charged. Dial ${this.env.USSD_CODE} to try again.`
      );
    }
  }

  startSweeper(intervalMs = 30_000): void {
    if (this.sweeper) return;
    this.sweeper = setInterval(() => {
      void this.sweep().catch((err) => console.warn("[pay] sweep failed:", (err as Error).message));
    }, intervalMs);
    this.sweeper.unref?.();
  }

  stopSweeper(): void {
    if (this.sweeper) clearInterval(this.sweeper);
    this.sweeper = null;
  }

  async sweep(): Promise<void> {
    const stale = await this.store.listPending(new Date(this.now() - QUERY_AFTER_MS), 25);
    for (const p of stale) await this.refresh(p.id);
  }
}
