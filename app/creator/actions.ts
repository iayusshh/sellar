"use server";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugs";
import { DeliveryMethod, ProductType } from "@prisma/client";

function requireCreator(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user || session.user.role !== "CREATOR") {
    redirect("/dashboard");
  }

  return session.user;
}

export async function createProduct(formData: FormData) {
  const session = await getSession();
  const user = requireCreator(session);

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceCents = Number(formData.get("priceCents") ?? 0);
  const rawType = String(formData.get("type") ?? "DIGITAL");
  const rawDeliveryMethod = String(formData.get("deliveryMethod") ?? "NONE");
  const deliveryAssetUrl = String(formData.get("deliveryAssetUrl") ?? "").trim();

  if (!name || !description || !Number.isInteger(priceCents) || priceCents <= 0) {
    throw new Error("Invalid product fields.");
  }

  const type = Object.values(ProductType).includes(rawType as ProductType)
    ? (rawType as ProductType)
    : ProductType.DIGITAL;

  const deliveryMethod = Object.values(DeliveryMethod).includes(
    rawDeliveryMethod as DeliveryMethod
  )
    ? (rawDeliveryMethod as DeliveryMethod)
    : DeliveryMethod.NONE;

  const baseSlug = slugify(name);
  let slug = baseSlug;
  for (let i = 0; i < 50; i += 1) {
    const existing = await prisma.product.findUnique({
      where: {
        creatorId_slug: {
          creatorId: user.id,
          slug,
        },
      },
    });
    if (!existing) break;
    slug = `${baseSlug}-${i + 2}`;
  }

  await prisma.product.create({
    data: {
      creatorId: user.id,
      slug,
      name,
      description,
      priceCents,
      currency: "INR",
      type,
      status: "ACTIVE",
      deliveryMethod,
      deliveryAssetUrl: deliveryAssetUrl || null,
    },
  });

  redirect("/creator");
}

export async function toggleProduct(productId: string) {
  const session = await getSession();
  const user = requireCreator(session);

  const product = await prisma.product.findFirst({
    where: { id: productId, creatorId: user.id },
  });

  if (!product) throw new Error("Product not found.");

  const nextStatus = product.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

  await prisma.product.update({
    where: { id: productId },
    data: { status: nextStatus },
  });

  redirect("/creator");
}

export async function requestPayout(formData: FormData) {
  const session = await getSession();
  const user = requireCreator(session);

  const amountCents = Number(formData.get("amountCents") ?? 0);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Invalid payout amount.");
  }

  const [wallet, profile] = await Promise.all([
    prisma.wallet.findUnique({ where: { creatorId: user.id } }),
    prisma.creatorProfile.findUnique({ where: { userId: user.id } }),
  ]);

  if (!profile?.payoutBankAccountLast4 || !profile.payoutBankName) {
    throw new Error("Link a bank account before requesting payouts.");
  }

  if (!wallet) throw new Error("Wallet not found.");
  if (wallet.availableBalanceCents < amountCents) {
    throw new Error("Insufficient available balance.");
  }

  await prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.create({
      data: {
        creatorId: user.id,
        walletId: wallet.id,
        amountCents,
        currency: wallet.currency,
        status: "REQUESTED",
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        payoutRequestId: payout.id,
        type: "DEBIT_PAYOUT",
        status: "AVAILABLE",
        amountCents: -amountCents,
        description: "Payout requested",
      },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalanceCents: { decrement: amountCents },
      },
    });
  });

  redirect("/creator");
}

export async function updateBankDetails(formData: FormData) {
  const session = await getSession();
  const user = requireCreator(session);

  const bankName = String(formData.get("bankName") ?? "").trim();
  const last4 = String(formData.get("last4") ?? "").trim();
  const ifsc = String(formData.get("ifsc") ?? "").trim();

  if (!bankName) throw new Error("Bank name is required.");
  if (!/^\d{4}$/.test(last4)) throw new Error("Account last4 must be 4 digits.");

  await prisma.creatorProfile.update({
    where: { userId: user.id },
    data: {
      payoutBankName: bankName,
      payoutBankAccountLast4: last4,
      payoutBankIfsc: ifsc || null,
    },
  });

  redirect("/creator");
}
