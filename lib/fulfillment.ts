import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { formatMoney } from "@/lib/money";

export async function fulfillPaidOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      creator: {
        include: {
          creatorProfile: true,
        },
      },
      buyer: true,
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== "PAID") return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const lines: string[] = [];
  lines.push(`Thanks for your purchase!`);
  lines.push("");
  lines.push(`Order: ${order.id}`);
  lines.push(`Total: ${formatMoney(order.amountTotalCents, order.currency)}`);
  lines.push(`Creator: ${order.creator.creatorProfile?.displayName ?? "Creator"}`);
  lines.push("");

  for (const item of order.items) {
    const product = item.product;
    lines.push(`Product: ${item.productNameSnapshot}`);

    if (product.type === "DIGITAL") {
      lines.push(`Type: Digital product`);
      if (product.deliveryMethod === "LINK" || product.deliveryMethod === "FILE") {
        if (product.deliveryAssetUrl) {
          lines.push(`Delivery: ${product.deliveryAssetUrl}`);
        } else {
          lines.push("Delivery: (creator will share the asset)");
        }
      } else {
        lines.push("Delivery: (no delivery asset attached)");
      }
    }

    if (product.type === "SESSION") {
      lines.push("Type: Paid 1:1 session");
      lines.push("Scheduling: Creator will contact you after purchase.");
      lines.push("Disclaimer: No guaranteed time slot in v1.");
    }

    if (product.type === "TELEGRAM") {
      lines.push("Type: Telegram entitlement");
      lines.push("Access: Creator will send an invite link after purchase (manual v1).");
      if (product.deliveryAssetUrl) {
        lines.push(`Invite link: ${product.deliveryAssetUrl}`);
      }
    }

    lines.push("");
  }

  lines.push("If you have any issues, reply to this email and the creator will help.");

  const buyerEmail = order.buyerEmail;
  const creatorEmail = order.creator.email;

  await sendEmail({
    to: buyerEmail,
    subject: `Your purchase: ${order.items[0]?.productNameSnapshot ?? "Order"}`,
    text: lines.join("\n"),
  });

  if (creatorEmail) {
    await sendEmail({
      to: creatorEmail,
      subject: `New sale: ${order.items[0]?.productNameSnapshot ?? "Order"}`,
      text: [
        "You made a sale!",
        "",
        `Order: ${order.id}`,
        `Buyer: ${order.buyerName} (${order.buyerEmail}, ${order.buyerPhone})`,
        `Gross: ${formatMoney(order.amountTotalCents, order.currency)}`,
        `Net credited: ${formatMoney(order.creatorNetCents, order.currency)}`,
        "",
        `Open storefront: ${appUrl}/${order.creator.creatorProfile?.slug ?? ""}`,
      ].join("\n"),
    });
  }
}
