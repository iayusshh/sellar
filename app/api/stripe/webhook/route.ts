import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { creditCreatorForPaidOrder } from "@/lib/wallet";
import { fulfillPaidOrder } from "@/lib/fulfillment";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 400 }
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const orderId = session.metadata?.orderId ?? session.client_reference_id ?? null;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (existing && existing.status !== "PAID") {
      const items = await prisma.orderItem.findMany({ where: { orderId } });

      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
          },
        }),
        ...items.map((it: (typeof items)[number]) =>
          prisma.product.update({
            where: { id: it.productId },
            data: { supplySold: { increment: it.quantity } },
          })
        ),
      ]);

      await creditCreatorForPaidOrder(orderId);
      await fulfillPaidOrder(orderId);
    }
  }

  return NextResponse.json({ received: true });
}
