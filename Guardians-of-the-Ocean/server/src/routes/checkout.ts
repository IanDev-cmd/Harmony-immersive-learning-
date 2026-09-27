import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import type Stripe from "stripe";
import type { Env } from "../env.js";
import { prisma } from "../db.js";
import { HttpError } from "../http.js";

const checkoutBody = z.object({
  email: z.string().email(),
  mode: z.enum(["payment", "subscription"]).default("payment"),
  amount: z.number().int().min(50).max(1_000_000).optional(),
  currency: z.string().min(3).max(3).optional(),
});

function originFrom(env: Env): string {
  return env.APP_BASE_URL.replace(/\/$/, "");
}

export function createCheckoutHandler(stripe: Stripe, env: Env) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = checkoutBody.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, "Valid email is required");
      }

      const { email, mode } = parsed.data;
      const amount = parsed.data.amount ?? env.CHECKOUT_AMOUNT_CENTS;
      const currency = (parsed.data.currency ?? env.CHECKOUT_CURRENCY).toLowerCase();
      const origin = originFrom(env);

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email },
      });

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId: user.id },
        });
        stripeCustomerId = customer.id;
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId },
        });
      }

      const pending = await prisma.order.create({
        data: {
          userId: user.id,
          stripeSessionId: `pending_${crypto.randomUUID()}`,
          amount,
          currency,
          status: "pending",
        },
      });

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode,
        customer: stripeCustomerId,
        client_reference_id: user.id,
        success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart.html`,
        metadata: {
          userId: user.id,
          orderId: pending.id,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amount,
              product_data: {
                name: "Guardians of the Ocean · restoration credit",
                description: "Direct restoration payout for coastal schools and field teams",
              },
            },
          },
        ],
      };

      if (mode === "subscription") {
        sessionParams.line_items = [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amount,
              recurring: { interval: "month" },
              product_data: {
                name: "Guardians of the Ocean · monthly restoration",
              },
            },
          },
        ];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      if (!session.url) {
        throw new HttpError(502, "Stripe did not return a checkout URL");
      }

      await prisma.order.update({
        where: { id: pending.id },
        data: { stripeSessionId: session.id },
      });

      if (mode === "subscription") {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            stripeSessionId: session.id,
            amount,
            currency,
            status: "pending",
          },
        });
      }

      res.json({ url: session.url, orderId: pending.id, sessionId: session.id });
    } catch (err) {
      next(err);
    }
  };
}
