import type { Env, Mode } from "../env.js";
import { MobileMoney, Outcome, ProviderError, PushRequest, PushResult, readJson } from "./types.js";

/**
 * Safaricom Daraja M-Pesa Express (STK push).
 * https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
 */

const BASE = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
};

/** YYYYMMDDHHmmss in East Africa Time (UTC+3, no DST), as Daraja requires. */
export function darajaTimestamp(at: Date = new Date()): string {
  const eat = new Date(at.getTime() + 3 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    eat.getUTCFullYear() +
    p(eat.getUTCMonth() + 1) +
    p(eat.getUTCDate()) +
    p(eat.getUTCHours()) +
    p(eat.getUTCMinutes()) +
    p(eat.getUTCSeconds())
  );
}

export function darajaPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(shortcode + passkey + timestamp).toString("base64");
}

/** Maps a Daraja ResultCode to our outcome. */
export function outcomeForResult(code: number, desc: string, receipt: string | null = null): Outcome {
  switch (code) {
    case 0:
      return { status: "paid", receipt };
    case 1032:
      return { status: "cancelled", reason: "Cancelled on the phone" };
    case 1037:
    case 1019:
      return { status: "timeout", reason: "The phone did not respond in time" };
    case 1:
      return { status: "failed", reason: "Insufficient M-Pesa balance" };
    case 2001:
      return { status: "failed", reason: "Wrong M-Pesa PIN" };
    case 1001:
      return { status: "failed", reason: "Another M-Pesa request is already open on this phone" };
    default:
      return { status: "failed", reason: desc || `M-Pesa error ${code}` };
  }
}

export interface StkCallback {
  checkoutRequestId: string;
  merchantRequestId: string;
  outcome: Outcome;
  amount: number | null;
  phone: string | null;
}

/** Parses the body Daraja POSTs to CallBackURL. Returns null for anything that is not an STK callback. */
export function parseStkCallback(body: unknown): StkCallback | null {
  const cb = (body as { Body?: { stkCallback?: Record<string, unknown> } })?.Body?.stkCallback;
  if (!cb || typeof cb.CheckoutRequestID !== "string") return null;
  const items = ((cb.CallbackMetadata as { Item?: Array<{ Name: string; Value?: unknown }> })?.Item) ?? [];
  const meta = (name: string) => items.find((i) => i.Name === name)?.Value;
  const receipt = meta("MpesaReceiptNumber");
  const amount = meta("Amount");
  const phone = meta("PhoneNumber");
  return {
    checkoutRequestId: cb.CheckoutRequestID,
    merchantRequestId: String(cb.MerchantRequestID ?? ""),
    outcome: outcomeForResult(Number(cb.ResultCode), String(cb.ResultDesc ?? ""), receipt ? String(receipt) : null),
    amount: amount == null ? null : Number(amount),
    phone: phone == null ? null : String(phone),
  };
}

export class Mpesa implements MobileMoney {
  readonly name = "mpesa" as const;
  readonly mode: Mode;
  private base: string;
  private token: { value: string; expiresAt: number } | null = null;

  constructor(private env: Env, private callbackUrl: string, private fetchImpl: typeof fetch = fetch) {
    this.mode = env.mpesaMode;
    this.base = BASE[env.MPESA_ENV];
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;
    const basic = Buffer.from(`${this.env.MPESA_CONSUMER_KEY}:${this.env.MPESA_CONSUMER_SECRET}`).toString("base64");
    const res = await this.fetchImpl(`${this.base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${basic}` },
      signal: AbortSignal.timeout(10_000),
    });
    const body = await readJson(res);
    if (!res.ok || typeof body.access_token !== "string") {
      throw new ProviderError("mpesa", `Daraja auth failed (${res.status})`, "M-Pesa is unavailable right now. Try again shortly.");
    }
    this.token = { value: body.access_token, expiresAt: Date.now() + Number(body.expires_in ?? 3599) * 1000 };
    return this.token.value;
  }

  private credentials() {
    const timestamp = darajaTimestamp();
    return {
      BusinessShortCode: this.env.MPESA_SHORTCODE,
      Password: darajaPassword(this.env.MPESA_SHORTCODE, this.env.MPESA_PASSKEY, timestamp),
      Timestamp: timestamp,
    };
  }

  async push(req: PushRequest): Promise<PushResult> {
    const token = await this.accessToken();
    const till = this.env.MPESA_TYPE === "till";
    const res = await this.fetchImpl(`${this.base}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...this.credentials(),
        TransactionType: till ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",
        Amount: req.amount,
        PartyA: req.phone,
        PartyB: this.env.MPESA_PARTY_B || this.env.MPESA_SHORTCODE,
        PhoneNumber: req.phone,
        CallBackURL: this.callbackUrl,
        AccountReference: req.reference.slice(0, 12),
        TransactionDesc: req.description.slice(0, 13),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = await readJson(res);
    if (!res.ok || String(body.ResponseCode) !== "0" || typeof body.CheckoutRequestID !== "string") {
      const detail = String(body.errorMessage ?? body.ResponseDescription ?? res.status);
      throw new ProviderError("mpesa", `STK push rejected: ${detail}`, "M-Pesa could not send the prompt. Check the number and try again.");
    }
    return {
      providerRef: body.CheckoutRequestID,
      merchantRef: String(body.MerchantRequestID ?? ""),
      message: String(body.CustomerMessage ?? "Check your phone and enter your M-Pesa PIN."),
    };
  }

  async query(checkoutRequestId: string): Promise<Outcome> {
    const token = await this.accessToken();
    const res = await this.fetchImpl(`${this.base}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...this.credentials(), CheckoutRequestID: checkoutRequestId }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await readJson(res);
    // While the customer is still looking at the prompt Daraja answers with an error body.
    if (!res.ok || body.ResultCode == null) return { status: "pending" };
    return outcomeForResult(Number(body.ResultCode), String(body.ResultDesc ?? ""));
  }
}
