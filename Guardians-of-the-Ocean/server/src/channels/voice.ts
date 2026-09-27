import { lessonAt } from "../agent/lessons.js";
import { transcribe } from "../agent/transcribe.js";
import { dial, getDigits, record, response, say } from "../comms/voicexml.js";
import type { Deps } from "../deps.js";
import { normalizeKePhone } from "../lib/phone.js";
import { SMS_MAX, fitTo, kes } from "../lib/text.js";
import { PROVIDER_LABEL, providerForPhone } from "../payments/service.js";

/**
 * Voice IVR over Africa's Talking. Students call our number (or get a free callback) and use
 * the keypad; option 2 records a spoken question that is transcribed and answered by SMS.
 */

export interface VoiceRequest {
  isActive?: string;
  sessionId?: string;
  direction?: string;
  callerNumber?: string;
  destinationNumber?: string;
  clientRequestId?: string;
  dtmfDigits?: string;
  recordingUrl?: string;
  /** Simulator only: typed stand-in for a recording. */
  transcript?: string;
}

const MENU =
  "Press 1 for today's lesson. Press 2 to ask a question. Press 3 to speak to a Harmony guide. Press 4 to support the coast with mobile money.";

function studentPhone(req: VoiceRequest): string {
  const raw = String(req.direction ?? "").toLowerCase() === "outbound" ? req.destinationNumber : req.callerNumber;
  return normalizeKePhone(raw);
}

function menu(base: string, intro = ""): string {
  return response(getDigits(`${intro}${MENU}`, { callbackUrl: `${base}/voice/menu`, numDigits: 1 }));
}

export async function handleVoiceCall(deps: Deps, base: string, req: VoiceRequest): Promise<string> {
  if (req.isActive === "0") return ""; // end-of-call notification
  const phone = studentPhone(req);
  if (!phone) return response(say("Sorry, Harmony only supports Kenyan mobile numbers. Goodbye."));

  if (String(req.clientRequestId ?? "").startsWith("agent:")) {
    if (!deps.desk.hasGuides) {
      return response(say("Hello from Harmony. All guides are busy right now, so a guide will reply to you by SMS. Goodbye."));
    }
    return response(say("Hello from Harmony. Connecting you to a guide now. Please hold."), dial(deps.env.agentPhones));
  }

  await deps.store.upsertStudent(phone);
  return menu(base, "Welcome to Harmony, learning about the ocean. ");
}

export async function handleVoiceMenu(deps: Deps, base: string, req: VoiceRequest): Promise<string> {
  const phone = studentPhone(req);
  if (!phone) return response(say("Goodbye."));
  const digit = String(req.dtmfDigits ?? "").trim();

  switch (digit) {
    case "1": {
      const student = await deps.store.upsertStudent(phone);
      const lesson = lessonAt(student.lessonIndex);
      await deps.store.upsertStudent(phone, { lessonIndex: student.lessonIndex + 1 });
      return response(
        say(lesson.voice),
        getDigits(`Press 1 for the next lesson, or 9 for the main menu.`, { callbackUrl: `${base}/voice/menu`, numDigits: 1 })
      );
    }
    case "2":
      return response(
        record("After the beep, ask your question in English or Kiswahili, then press the hash key.", {
          callbackUrl: `${base}/voice/question`,
          maxLength: 30,
        })
      );
    case "3": {
      if (!deps.desk.hasGuides) {
        deps.background(() => deps.desk.requestHuman(phone, "voice", "Called and asked for a guide", { call: false }));
        return response(say("All guides are busy right now. A guide will reply to you by SMS soon. Goodbye."));
      }
      return response(say("Connecting you to a Harmony guide. Please hold."), dial(deps.env.agentPhones));
    }
    case "4": {
      const provider = providerForPhone(phone);
      if (!provider) return menu(base, "Mobile money support needs a Safaricom or Airtel line. ");
      return response(
        getDigits(`Enter the amount in shillings, then press the hash key.`, { callbackUrl: `${base}/voice/pay`, finishOnKey: "#" })
      );
    }
    default:
      return menu(base);
  }
}

export async function handleVoiceQuestion(deps: Deps, base: string, req: VoiceRequest): Promise<string> {
  const phone = studentPhone(req);
  if (!phone) return response(say("Goodbye."));
  const recordingUrl = String(req.recordingUrl ?? "");
  const typed = deps.env.devTools ? String(req.transcript ?? "").trim() : "";

  deps.background(async () => {
    const question = typed || (recordingUrl ? await transcribe(deps.env, recordingUrl) : null);
    if (!question) {
      await deps.desk.requestHuman(phone, "voice", `Voice question (not transcribed)${recordingUrl ? `: ${recordingUrl}` : ""}`, { call: false });
      return;
    }
    const heard = `You asked: "${fitTo(question, 80)}". `;
    const answer = await deps.agent.answer(question, SMS_MAX - heard.length - 10);
    await deps.messenger.sendSms(phone, `Harmony: ${heard}${answer.text}`);
    await deps.desk.logAnswered(phone, "voice", question, answer.text);
  });

  return response(say("Thank you. Your answer will arrive by SMS in about a minute. Goodbye."));
}

export async function handleVoicePay(deps: Deps, base: string, req: VoiceRequest): Promise<string> {
  const phone = studentPhone(req);
  if (!phone) return response(say("Goodbye."));
  const amount = Number(String(req.dtmfDigits ?? "").replace(/\D/g, ""));
  const provider = providerForPhone(phone);
  if (!provider) return menu(base);
  if (!Number.isInteger(amount) || amount < deps.env.MOBILE_MIN_KES || amount > deps.env.MOBILE_MAX_KES) {
    return response(
      getDigits(
        `Please enter an amount between ${deps.env.MOBILE_MIN_KES} and ${deps.env.MOBILE_MAX_KES} shillings, then press hash.`,
        { callbackUrl: `${base}/voice/pay`, finishOnKey: "#" }
      )
    );
  }
  const label = PROVIDER_LABEL[provider];
  deps.background(async () => {
    try {
      await deps.payments.start({ phone, amount, provider, channel: "voice" });
    } catch (err) {
      await deps.messenger.sendSms(phone, `Harmony: ${(err as Error).message}`);
    }
  });
  return response(say(`Thank you. After this call, enter your ${label} PIN on the prompt to give ${kes(amount).replace("KES", "")} shillings. Goodbye.`));
}
