import { LESSONS, LETTERS, lessonAt, quizText } from "../agent/lessons.js";
import type { Deps } from "../deps.js";
import { normalizeKePhone } from "../lib/phone.js";
import { SMS_MAX, kes } from "../lib/text.js";

/**
 * Two-way SMS on the shortcode. The first word is the command (English or Kiswahili);
 * anything else is treated as a question for the agent. Returns the reply to send, or null.
 */

export function helpText(deps: Deps): string {
  return `Harmony SMS: LESSON - next lesson. QUIZ - test yourself. ASK <question>. AGENT - talk to a person. PAY <amount> - support the coast. POINTS. STOP to quit. Or dial ${deps.env.USSD_CODE}.`;
}

export async function handleSms(deps: Deps, rawFrom: string, rawText: string): Promise<string | null> {
  const phone = normalizeKePhone(rawFrom);
  if (!phone) return null;
  const text = String(rawText ?? "").trim();
  await deps.store.logMessage({ direction: "in", channel: "sms", phone, body: text.slice(0, 500), status: "received", providerId: null });

  // Guides answer tickets from their own phones.
  if (deps.desk.isGuide(phone) && /^\s*(R|REPLY)\s/i.test(text)) {
    return deps.desk.handleGuideSms(phone, text);
  }

  const [first = "", ...restWords] = text.split(/\s+/);
  const word = first.toUpperCase().replace(/[^A-Z]/g, "");
  const rest = restWords.join(" ").trim();
  const student = await deps.store.upsertStudent(phone);

  // A bare A/B/C (or 1/2/3) answers the open quiz.
  if (student.quizPending != null && /^[ABC123]$/i.test(text)) {
    const lesson = lessonAt(student.quizPending);
    const pick = /^[123]$/.test(text) ? Number(text) - 1 : LETTERS.indexOf(text.toUpperCase() as "A");
    const correct = pick === lesson.quiz.answer;
    const updated = await deps.store.upsertStudent(phone, {
      quizPending: null,
      points: correct ? student.points + 10 : student.points,
    });
    return correct
      ? `Correct! +10 points (total ${updated.points}). ${lesson.quiz.why} Reply LESSON for the next one.`
      : `Not quite - the answer is ${LETTERS[lesson.quiz.answer]}) ${lesson.quiz.options[lesson.quiz.answer]}. ${lesson.quiz.why} Reply LESSON to keep going.`;
  }

  switch (word) {
    case "JOIN":
    case "START":
    case "ANZA": {
      const name = rest.slice(0, 40) || student.name;
      const updated = await deps.store.upsertStudent(phone, { optedIn: true, name: name || null });
      const lesson = lessonAt(updated.lessonIndex);
      await deps.store.upsertStudent(phone, { lessonIndex: updated.lessonIndex + 1 });
      return `Karibu${name ? " " + name : ""}! You'll get one short ocean lesson a day. ${lesson.sms.replace(/^Harmony lesson - /, "First lesson - ")} Reply HELP for commands.`;
    }

    case "STOP":
    case "ACHA":
    case "UNSUBSCRIBE": {
      await deps.store.upsertStudent(phone, { optedIn: false, quizPending: null });
      return "You won't get daily Harmony lessons any more. Text JOIN to come back any time.";
    }

    case "LESSON":
    case "L":
    case "SOMO": {
      const lesson = lessonAt(student.lessonIndex);
      await deps.store.upsertStudent(phone, { lessonIndex: student.lessonIndex + 1 });
      return `${lesson.sms} Reply QUIZ to test yourself.`;
    }

    case "QUIZ":
    case "SWALI": {
      const index = Math.max(student.lessonIndex - 1, 0);
      await deps.store.upsertStudent(phone, { quizPending: index });
      return quizText(lessonAt(index), "sms");
    }

    case "POINTS":
    case "STATUS":
    case "ALAMA": {
      const payments = await deps.store.paymentsForPhone(phone, 50);
      const given = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
      return `Harmony progress: ${Math.min(student.lessonIndex, LESSONS.length)}/${LESSONS.length} lessons, ${student.points} quiz points, ${kes(given)} support given. Daily lessons are ${student.optedIn ? "on" : "off"}.`;
    }

    case "AGENT":
    case "HUMAN":
    case "PERSON":
    case "MTU":
    case "MSAADA": {
      deps.background(() => deps.desk.requestHuman(phone, "sms", rest || "Asked to talk to a person", { call: !rest }));
      return null; // the desk confirms with the ticket number
    }

    case "PAY":
    case "CHANGIA":
    case "SUPPORT": {
      const amount = Number(rest.replace(/[^\d]/g, ""));
      if (!amount) return `Send PAY and an amount, e.g. PAY 100. Min ${kes(deps.env.MOBILE_MIN_KES)}.`;
      try {
        const { payment } = await deps.payments.start({ phone, amount, channel: "sms" });
        return `Harmony: check your phone and enter your ${payment.provider === "mpesa" ? "M-Pesa" : "Airtel Money"} PIN to give ${kes(payment.amount)}.`;
      } catch (err) {
        return `Harmony: ${(err as Error).message}`;
      }
    }

    case "HELP":
    case "INFO":
      return helpText(deps);

    case "ASK":
    case "ULIZA":
      if (!rest) return "Send ASK and your question, e.g. ASK why do corals bleach?";
      return answer(deps, phone, rest);

    default:
      if (!text) return helpText(deps);
      return answer(deps, phone, text);
  }
}

async function answer(deps: Deps, phone: string, question: string): Promise<string> {
  const reply = await deps.agent.answer(question, SMS_MAX - 12);
  await deps.desk.logAnswered(phone, "sms", question, reply.text);
  return `Harmony: ${reply.text}`;
}
