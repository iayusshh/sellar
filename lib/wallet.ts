import { prisma } from "@/lib/prisma";

export async function creditCreatorForPaidOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { creator: true },
    });

    if (!order) throw new Error("Order not found");
    if (order.status !== "PAID") throw new Error("Order is not paid");

    const wallet = await tx.wallet.upsert({
      where: { creatorId: order.creatorId },
      create: {
        creatorId: order.creatorId,
        currency: order.currency,
      },
      update: {},
    });

    const existingCredit = await tx.walletTransaction.findFirst({
      where: {
        walletId: wallet.id,
        orderId: order.id,
        type: "CREDIT_SALE",
      },
    });

    if (existingCredit) {
      return { order, wallet, alreadyCredited: true };
    }

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        orderId: order.id,
        type: "CREDIT_SALE",
        status: "AVAILABLE",
        amountCents: order.creatorNetCents,
        description: "Sale credited",
      },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalanceCents: { increment: order.creatorNetCents },
      },
    });

    return { order, wallet, alreadyCredited: false };
  });
}
