/**
 * Text shaping for feature phones. USSD screens and SMS use the GSM-7 alphabet; anything
 * outside it (emoji, smart quotes) either breaks the screen or doubles the SMS cost.
 */

// One USSD screen. Networks differ; 182 is the common ceiling, stay under it.
export const USSD_MAX = 182;
// Three concatenated GSM-7 SMS parts (153 chars each).
export const SMS_MAX = 459;
export const SMS_ONE = 160;

const GSM7 =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

const REPLACE: Array<[RegExp, string]> = [
  [/[‘’‚′]/g, "'"],
  [/[“”„″]/g, '"'],
  [/[–—−]/g, "-"],
  [/…/g, "..."],
  [/[   ]/g, " "],
  [/•/g, "-"],
  [/·/g, "-"],
  [/[°]/g, " deg "],
];

export function toGsm7(input: string): string {
  let out = String(input ?? "");
  for (const [re, rep] of REPLACE) out = out.replace(re, rep);
  out = out.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  let clean = "";
  for (const ch of out) clean += GSM7.includes(ch) ? ch : "";
  return clean.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
}

export function isGsm7(input: string): boolean {
  for (const ch of input) if (!GSM7.includes(ch)) return false;
  return true;
}

/** Strips markdown, citation markers and URLs that make no sense on a feature phone. */
export function plainText(input: string): string {
  return String(input ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[(?:\d+(?:[,\s-]+\d+)*|source[^\]]*|S\d+)\]/gi, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    // Single-star emphasis only around words, so USSD codes like *384*2026# survive.
    .replace(/\*([A-Za-z][^*\n]*?)\*/g, "$1")
    .replace(/`/g, "")
    .replace(/^\s*[-*+]\s+/gm, "- ")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ +([.,;:!?])/g, "$1")
    .trim();
}

/** Cuts at a sentence (or word) boundary so the reader never gets half a word. */
export function fitTo(input: string, max: number, ellipsis = "..."): string {
  const text = input.trim();
  if (text.length <= max) return text;
  const room = max - ellipsis.length;
  const slice = text.slice(0, room);
  const sentenceEnd = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "), slice.lastIndexOf(".\n"));
  if (sentenceEnd > room * 0.55) return slice.slice(0, sentenceEnd + 1);
  const space = slice.lastIndexOf(" ");
  return (space > room * 0.5 ? slice.slice(0, space) : slice).replace(/[,;:\-\s]+$/, "") + ellipsis;
}

export function forSms(input: string, max = SMS_MAX): string {
  return fitTo(toGsm7(plainText(input)), max);
}

export function kes(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString("en-US")}`;
}
