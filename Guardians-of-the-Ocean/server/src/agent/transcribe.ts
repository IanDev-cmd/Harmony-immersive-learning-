import type { Env } from "../env.js";

/**
 * Turns a voice-call recording into text with Gemini, so a student on a feature phone can
 * just say their question. Only Africa's Talking recording URLs are fetched (no SSRF).
 */

const ALLOWED_HOSTS = [/\.africastalking\.com$/i, /^africastalking\.com$/i];

export function isAllowedRecordingUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && ALLOWED_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

export async function transcribe(env: Env, recordingUrl: string, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  if (!env.GOOGLE_API_KEY || !isAllowedRecordingUrl(recordingUrl)) return null;
  try {
    const audioRes = await fetchImpl(recordingUrl, { signal: AbortSignal.timeout(15_000) });
    if (!audioRes.ok) return null;
    const audio = Buffer.from(await audioRes.arrayBuffer());
    if (audio.length === 0 || audio.length > 8 * 1024 * 1024) return null;
    const mime = audioRes.headers.get("content-type")?.split(";")[0] || "audio/mpeg";

    const res = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GOOGLE_CHAT_MODEL)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GOOGLE_API_KEY },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Transcribe the caller's question exactly. The caller may speak English, Kiswahili or Sheng; answer with the transcript only, translated to English if needed. If nothing intelligible was said, reply with an empty string." },
                { inline_data: { mime_type: mime, data: audio.toString("base64") } },
              ],
            },
          ],
          generationConfig: { temperature: 0 },
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join(" ").trim() ?? "";
    return text.replace(/^["']|["']$/g, "").trim() || null;
  } catch {
    return null;
  }
}
