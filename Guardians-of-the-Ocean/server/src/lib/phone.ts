/**
 * Kenyan MSISDN helpers. Everything is stored as E.164 without the plus: 2547XXXXXXXX / 2541XXXXXXXX.
 */

export type Network = "safaricom" | "airtel" | "telkom" | "unknown";

const SAFARICOM = [
  [700, 729], [740, 746], [748, 748], [757, 759], [768, 769], [790, 799], [110, 115],
];
const AIRTEL = [
  [730, 739], [750, 756], [762, 762], [780, 789], [100, 102],
];
const TELKOM = [[770, 779]];

function inRanges(prefix: number, ranges: number[][]): boolean {
  return ranges.some(([lo, hi]) => prefix >= lo && prefix <= hi);
}

/** Returns 2547XXXXXXXX / 2541XXXXXXXX, or "" if the input is not a Kenyan mobile number. */
export function normalizeKePhone(raw: unknown): string {
  let digits = String(raw ?? "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  digits = digits.replace(/\D/g, "");
  if (digits.startsWith("00254")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) digits = "254" + digits.slice(1);
  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) digits = "254" + digits;
  if (!/^254[17]\d{8}$/.test(digits)) return "";
  return digits;
}

export function networkOf(phone: string): Network {
  const normalized = normalizeKePhone(phone);
  if (!normalized) return "unknown";
  const prefix = Number(normalized.slice(3, 6));
  if (inRanges(prefix, SAFARICOM)) return "safaricom";
  if (inRanges(prefix, AIRTEL)) return "airtel";
  if (inRanges(prefix, TELKOM)) return "telkom";
  return "unknown";
}

/** +2547XXXXXXXX, the form Africa's Talking expects. */
export function e164(phone: string): string {
  const normalized = normalizeKePhone(phone);
  return normalized ? `+${normalized}` : "";
}

/** 07XX XXX 123 style, for receipts and screens. */
export function prettyPhone(phone: string): string {
  const n = normalizeKePhone(phone);
  if (!n) return String(phone || "");
  const local = "0" + n.slice(3);
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** 07XX ***123, for logs and anything a third party might read. */
export function maskPhone(phone: string): string {
  const n = normalizeKePhone(phone);
  if (!n) return "unknown";
  const local = "0" + n.slice(3);
  return `${local.slice(0, 4)} ***${local.slice(7)}`;
}
