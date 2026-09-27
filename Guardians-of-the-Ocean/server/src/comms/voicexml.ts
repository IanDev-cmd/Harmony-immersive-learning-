/**
 * Africa's Talking voice actions. https://developers.africastalking.com/docs/voice/actions/overview
 */

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function attrs(map: Record<string, string | number | boolean | undefined>): string {
  return Object.entries(map)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => ` ${k}="${esc(String(v))}"`)
    .join("");
}

export const VOICE = "en-US-Standard-C";

export function say(text: string, opts: { playBeep?: boolean } = {}): string {
  return `<Say${attrs({ voice: VOICE, playBeep: opts.playBeep })}>${esc(text)}</Say>`;
}

export function getDigits(prompt: string, opts: { callbackUrl: string; numDigits?: number; finishOnKey?: string; timeout?: number }): string {
  return `<GetDigits${attrs({
    timeout: opts.timeout ?? 12,
    finishOnKey: opts.finishOnKey ?? "#",
    numDigits: opts.numDigits,
    callbackUrl: opts.callbackUrl,
  })}>${say(prompt)}</GetDigits>`;
}

export function record(prompt: string, opts: { callbackUrl: string; maxLength?: number }): string {
  return `<Record${attrs({
    finishOnKey: "#",
    maxLength: opts.maxLength ?? 30,
    trimSilence: true,
    playBeep: true,
    callbackUrl: opts.callbackUrl,
  })}>${say(prompt)}</Record>`;
}

export function dial(phoneNumbers: string[], opts: { record?: boolean } = {}): string {
  return `<Dial${attrs({ phoneNumbers: phoneNumbers.join(","), sequential: true, record: opts.record ?? false })}/>`;
}

export function reject(): string {
  return "<Reject/>";
}

export function response(...actions: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${actions.join("")}</Response>`;
}
