import { LESSONS, lessonAt, quizText } from "../agent/lessons.js";
import type { Deps } from "../deps.js";
import { normalizeKePhone } from "../lib/phone.js";
import { SMS_MAX, USSD_MAX, kes, toGsm7 } from "../lib/text.js";
import { PROVIDER_LABEL, providerForPhone } from "../payments/service.js";
import type { Student } from "../store/types.js";

/**
 * USSD menu (Africa's Talking format: reply "CON ..." to continue, "END ..." to close).
 * The gateway sends the whole input history as `text`, e.g. "5*2*1". The menu is a pure walk of
 * that history, so any step can be replayed; side effects only run on END screens.
 * "0" goes back one level, "00" goes home.
 */

export interface UssdRequest {
  sessionId: string;
  phoneNumber: string;
  text: string;
}

const AMOUNTS = [50, 100, 250];

const ROOT =
  "Harmony: learn the ocean\n1. Today's lesson\n2. Quiz\n3. Ask a question\n4. Talk to a guide\n5. Support the coast\n6. My progress\n7. Daily SMS lessons";

function con(body: string): string {
  return "CON " + clip(body);
}

function end(body: string): string {
  return "END " + clip(body);
}

function clip(body: string): string {
  const text = toGsm7(body);
  return text.length <= USSD_MAX - 4 ? text : text.slice(0, USSD_MAX - 4);
}

/** Applies back ("0") and home ("00") to the raw input history. */
export function navPath(text: string): string[] {
  const path: string[] = [];
  for (const raw of (text || "").split("*")) {
    const input = raw.trim();
    if (input === "") continue;
    if (input === "00") path.length = 0;
    else if (input === "0") path.pop();
    else path.push(input);
  }
  return path;
}

// Where each session's lesson counter started, so replayed steps show the same lesson.
const sessionBase = new Map<string, { base: number; at: number }>();

function lessonBase(sessionId: string, student: Student): number {
  const now = Date.now();
  for (const [key, v] of sessionBase) if (now - v.at > 10 * 60_000) sessionBase.delete(key);
  const hit = sessionBase.get(sessionId);
  if (hit) return hit.base;
  sessionBase.set(sessionId, { base: student.lessonIndex, at: now });
  return student.lessonIndex;
}

export async function handleUssd(deps: Deps, req: UssdRequest): Promise<string> {
  const phone = normalizeKePhone(req.phoneNumber);
  if (!phone) return end("Sorry, Harmony works with Kenyan mobile numbers.");
  const student = await deps.store.upsertStudent(phone);
  const path = navPath(req.text);
  const [menu, a, b, c] = path;

  if (!menu) return con(ROOT);

  switch (menu) {
    case "1": {
      // Each "1" after the lesson screen moves to the next lesson.
      const base = lessonBase(req.sessionId, student);
      const rest = path.slice(1);
      const smsIt = rest[rest.length - 1] === "2";
      const nexts = rest.filter((x) => x === "1").length;
      if (rest.some((x) => x !== "1" && x !== "2") || rest.slice(0, -1).includes("2")) return con("Invalid choice.\n" + ROOT);
      const index = base + nexts;
      const lesson = lessonAt(index);
      const seen = Math.max(student.lessonIndex, index + 1);
      if (seen !== student.lessonIndex) await deps.store.upsertStudent(phone, { lessonIndex: seen });
      if (smsIt) {
        deps.background(() => deps.messenger.sendSms(phone, lesson.sms));
        return end(`Sent! "${lesson.title}" is on its way by SMS.`);
      }
      return con(`${lesson.ussd}\n1. Next lesson\n2. SMS it to me\n0. Back`);
    }

    case "2": {
      const index = Math.max(student.lessonIndex - 1, 0);
      const lesson = lessonAt(index);
      if (!a) return con(quizText(lesson, "ussd"));
      const pick = Number(a) - 1;
      if (![0, 1, 2].includes(pick)) return con("Pick 1, 2 or 3.\n" + quizText(lesson, "ussd"));
      if (pick === lesson.quiz.answer) {
        const updated = await deps.store.upsertStudent(phone, { points: student.points + 10 });
        return end(`Correct! +10 points. You have ${updated.points} points.\n${lesson.quiz.why}`);
      }
      return end(`Not quite. Answer: ${lesson.quiz.options[lesson.quiz.answer]}.\n${lesson.quiz.why}`);
    }

    case "3": {
      if (!a) return con("Type your question.\nThe answer comes by SMS.");
      const question = path.slice(1).join(" ");
      deps.background(async () => {
        const answer = await deps.agent.answer(question, SMS_MAX - 12);
        await deps.messenger.sendSms(phone, `Harmony: ${answer.text}`);
        await deps.desk.logAnswered(phone, "ussd", question, answer.text);
      });
      return end("Thanks! Your answer is on its way by SMS.");
    }

    case "4": {
      if (!a) return con("Talk to a guide\n1. Call me back (free)\n2. Ask by SMS\n0. Back");
      if (a === "1") {
        deps.background(() => deps.desk.requestHuman(phone, "ussd", "Asked for a call back", { call: true }));
        return end("A guide will call you shortly. Your ticket number is coming by SMS.");
      }
      if (a === "2") {
        if (!b) return con("Type your question for the guide:");
        const question = path.slice(2).join(" ");
        deps.background(() => deps.desk.requestHuman(phone, "ussd", question, { call: false }));
        return end("Sent to a guide. They will reply by SMS.");
      }
      return con("Invalid choice.\nTalk to a guide\n1. Call me back (free)\n2. Ask by SMS\n0. Back");
    }

    case "5": {
      const provider = providerForPhone(phone);
      if (!provider) return end("Mobile money support works on Safaricom (M-Pesa) and Airtel lines.");
      const label = PROVIDER_LABEL[provider];
      const pickMenu = `Support coast restoration\n${AMOUNTS.map((v, i) => `${i + 1}. ${kes(v)}`).join("\n")}\n4. Other amount\n0. Back`;
      if (!a) return con(pickMenu);

      let amount: number;
      let confirmAt: string | undefined;
      if (a === "4") {
        if (!b) return con(`Enter amount in KES (${deps.env.MOBILE_MIN_KES} - ${deps.env.MOBILE_MAX_KES}):`);
        amount = Number(b);
        confirmAt = c;
        if (!Number.isInteger(amount) || amount < deps.env.MOBILE_MIN_KES || amount > deps.env.MOBILE_MAX_KES) {
          return end(`Amount must be between ${kes(deps.env.MOBILE_MIN_KES)} and ${kes(deps.env.MOBILE_MAX_KES)}. Please dial again.`);
        }
      } else {
        const idx = Number(a) - 1;
        if (!AMOUNTS[idx]) return con("Invalid choice.\n" + pickMenu);
        amount = AMOUNTS[idx];
        confirmAt = b;
      }

      if (!confirmAt) return con(`Pay ${kes(amount)} with ${label} from this line?\n1. Confirm\n0. Back`);
      if (confirmAt !== "1") return end("Cancelled. Nothing was charged.");
      if (!deps.payments.available(provider)) return end(`${label} is not available yet. Please try later.`);

      deps.background(async () => {
        try {
          await deps.payments.start({ phone, amount, provider, channel: "ussd" });
        } catch (err) {
          await deps.messenger.sendSms(phone, `Harmony: ${(err as Error).message}`);
        }
      });
      return end(`You'll get a ${label} PIN prompt in a few seconds for ${kes(amount)}. Asante!`);
    }

    case "6": {
      const payments = await deps.store.paymentsForPhone(phone, 50);
      const given = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
      return end(
        `Your Harmony progress\nLessons: ${Math.min(student.lessonIndex, LESSONS.length)} of ${LESSONS.length}\nQuiz points: ${student.points}\nSupport given: ${kes(given)}\nDaily SMS: ${student.optedIn ? "on" : "off"}`
      );
    }

    case "7": {
      if (student.optedIn) {
        return end(`You already get daily lessons. Text STOP to ${deps.env.SMS_SHORTCODE} to pause them.`);
      }
      await deps.store.upsertStudent(phone, { optedIn: true });
      deps.background(() =>
        deps.messenger.sendSms(phone, `Karibu Harmony! One short ocean lesson a day by SMS. Text LESSON any time, ASK <question>, or STOP to quit. Free to receive.`)
      );
      return end(`You're in! One short lesson a day by SMS. Text STOP to ${deps.env.SMS_SHORTCODE} to quit.`);
    }

    default:
      return con("Invalid choice.\n" + ROOT);
  }
}
