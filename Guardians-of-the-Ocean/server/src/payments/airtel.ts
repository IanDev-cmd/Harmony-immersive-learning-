import type { Env, Mode } from "../env.js";
import { MobileMoney, Outcome, ProviderError, PushRequest, PushResult, readJson } from "./types.js";

/**
 * Airtel Africa Open API, Collection (USSD push).
 * https://developers.airtel.africa/documentation/collection-api
 *
 * The collection callback URL is configured on the Airtel app, not per request:
 *   {PUBLIC_API_URL}/api/pay/airtel/callback/{CALLBACK_TOKEN}
 */

const BASE = {
  sandbox: "https://openapiuat.airtel.africa",
  production: "https://openapi.airtel.africa",
};

/** Airtel transaction status codes: TS success, TF failed, TA ambiguous, TIP in progress, TE expired. */
export function outcomeForStatus(code: string, message: string, receipt: string | null = null): Outcome {
  switch (code) {
    case "TS":
      return { status: "paid", receipt };
    case "TF":
      return /cancel|declin|reject/i.test(message)
        ? { status: "cancelled", reason: "Cancelled on the phone" }
        : { status: "failed", reason: message || "Airtel Money payment failed" };
    case "TE":
      return { status: "timeout", reason: "The phone did not respond in time" };
    default:
      return { status: "pending" };
  }
}

export interface AirtelCallback {
  transactionId: string;
  outcome: Outcome;
}

export function parseAirtelCallback(body: unknown): AirtelCallback | null {
  const tx = (body as { transaction?: Record<string, unknown> })?.transaction;
  if (!tx || typeof tx.id !== "string") return null;
  const code = String(tx.status_code ?? tx.status ?? "");
  const receipt = tx.airtel_money_id ? String(tx.airtel_money_id) : null;
  return { transactionId: tx.id, outcome: outcomeForStatus(code, String(tx.message ?? ""), receipt) };
}

export class Airtel implements MobileMoney {
  readonly name = "airtel" as const;
  readonly mode: Mode;
  private base: string;
  private token: { value: string; expiresAt: number } | null = null;

  constructor(private env: Env, private fetchImpl: typeof fetch = fetch) {
    this.mode = env.airtelMode;
    this.base = BASE[env.AIRTEL_ENV];
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;
    const res = await this.fetchImpl(`${this.base}/auth/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "*/*" },
      body: JSON.stringify({
        client_id: this.env.AIRTEL_CLIENT_ID,
        client_secret: this.env.AIRTEL_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await readJson(res);
    if (!res.ok || typeof body.access_token !== "string") {
      throw new ProviderError("airtel", `Airtel auth failed (${res.status})`, "Airtel Money is unavailable right now. Try again shortly.");
    }
    this.token = { value: body.access_token, expiresAt: Date.now() + Number(body.expires_in ?? 180) * 1000 };
    return this.token.value;
  }

  private headers(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "*/*",
      "X-Country": this.env.AIRTEL_COUNTRY,
      "X-Currency": this.env.AIRTEL_CURRENCY,
    };
  }

  async push(req: PushRequest): Promise<PushResult> {
    const token = await this.accessToken();
    // Airtel wants the subscriber number without the country code.
    const msisdn = req.phone.replace(/^254/, "");
    const res = await this.fetchImpl(`${this.base}/merchant/v2/payments/`, {
      method: "POST",
      headers: this.headers(token),
      body: JSON.stringify({
        reference: req.description.slice(0, 64),
        subscriber: { country: this.env.AIRTEL_COUNTRY, currency: this.env.AIRTEL_CURRENCY, msisdn },
        transaction: {
          amount: req.amount,
          country: this.env.AIRTEL_COUNTRY,
          currency: this.env.AIRTEL_CURRENCY,
          id: req.paymentId,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = await readJson(res);
    const status = body.status as { success?: boolean; message?: string } | undefined;
    if (!res.ok || status?.success === false) {
      throw new ProviderError(
        "airtel",
        `Airtel push rejected: ${status?.message ?? res.status}`,
        "Airtel Money could not send the prompt. Check the number and try again."
      );
    }
    return {
      providerRef: req.paymentId,
      merchantRef: String((body.data as { transaction?: { id?: string } })?.transaction?.id ?? ""),
      message: "Check your phone and enter your Airtel Money PIN.",
    };
  }

  async query(transactionId: string): Promise<Outcome> {
    const token = await this.accessToken();
    const res = await this.fetchImpl(`${this.base}/standard/v1/payments/${encodeURIComponent(transactionId)}`, {
      headers: this.headers(token),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await readJson(res);
    const tx = (body.data as { transaction?: Record<string, unknown> })?.transaction;
    if (!res.ok || !tx) return { status: "pending" };
    return outcomeForStatus(
      String(tx.status ?? ""),
      String(tx.message ?? ""),
      tx.airtel_money_id ? String(tx.airtel_money_id) : null
    );
  }
}
