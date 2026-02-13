import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { clampCommissionRate } from "@/lib/money";
import { getStripe } from "@/lib/stripe";
import { creditCreatorForPaidOrder } from "@/lib/wallet";
import { fulfillPaidOrder } from "@/lib/fulfillment";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "BUYER") {
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  const formData = await req.formData();
  const productId = String(formData.get("productId") ?? "");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const buyer = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!buyer?.email || !buyer.name || !buyer.phone) {
    return NextResponse.json(
      { error: "Buyer profile incomplete. Add name/phone/email." },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "ACTIVE") {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const gross = product.priceCents;
  const rate = clampCommissionRate(process.env.PLATFORM_COMMISSION_RATE);
  const platformFee = Math.round(gross * rate);
  const creatorNet = gross - platformFee;

  const order = await prisma.order.create({
    data: {
      status: "PENDING",
      buyerId: buyer.id,
      creatorId: product.creatorId,
      buyerName: buyer.name ?? "",
      buyerEmail: buyer.email ?? "",
      buyerPhone: buyer.phone ?? "",
      currency: product.currency,
      amountSubtotalCents: gross,
      amountTotalCents: gross,
      platformFeeCents: platformFee,
      creatorNetCents: creatorNet,
      items: {
        create: {
          productId: product.id,
          quantity: 1,
          unitPriceCents: gross,
          totalCents: gross,
          productNameSnapshot: product.name,
        },
      },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const stripe = getStripe();
  if (!stripe) {
    // Dev fallback: mark paid immediately.
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    await creditCreatorForPaidOrder(order.id);
    await fulfillPaidOrder(order.id);

    return NextResponse.redirect(new URL(`/checkout/success?orderId=${order.id}`, appUrl));
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: order.id,
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: {
      orderId: order.id,
      productId: product.id,
      creatorId: product.creatorId,
      buyerId: buyer.id,
    },
    customer_email: buyer.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: product.currency.toLowerCase(),
          product_data: {
            name: product.name,
          },
          unit_amount: gross,
        },
      },
    ],
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeCheckoutSessionId: checkoutSession.id },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Stripe session URL missing" }, { status: 500 });
  }

  return NextResponse.redirect(checkoutSession.url);
}
