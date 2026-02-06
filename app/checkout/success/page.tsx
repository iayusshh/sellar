import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; orderId?: string }>;
}) {
  const { session_id, orderId } = await searchParams;

  const where = session_id
    ? { stripeCheckoutSessionId: session_id }
    : orderId
      ? { id: orderId }
      : null;

  if (!where) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Payment received</h1>
        <p className="mt-2 text-neutral-700">Missing order reference.</p>
        <Link className="mt-6 inline-block underline" href="/">
          Back home
        </Link>
      </main>
    );
  }

  const order = await prisma.order.findFirst({
    where,
    include: {
      items: true,
      creator: { include: { creatorProfile: true } },
    },
  });

  if (!order) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Payment received</h1>
        <p className="mt-2 text-neutral-700">We couldn’t find your order.</p>
        <Link className="mt-6 inline-block underline" href="/">
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Payment received</h1>
      <p className="mt-2 text-neutral-700">
        Order <span className="font-medium">{order.id}</span> ·{" "}
        <span className="font-medium">{order.status}</span>
      </p>

      <div className="mt-6 rounded-xl border p-5">
        <p className="text-sm text-neutral-600">Creator</p>
        <p className="font-medium">
          {order.creator.creatorProfile?.displayName ?? "Creator"}
        </p>

        <p className="mt-4 text-sm text-neutral-600">Items</p>
        <div className="mt-2 grid gap-2 text-sm">
          {order.items.map((it: (typeof order.items)[number]) => (
            <div key={it.id} className="flex items-center justify-between">
              <span>{it.productNameSnapshot}</span>
              <span className="text-neutral-600">
                {formatMoney(it.totalCents, order.currency)}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-neutral-600">
          Delivery: sent via email (trust-based v1)
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/buyer" className="rounded-md bg-black px-4 py-2 text-white">
          Go to buyer dashboard
        </Link>
        <Link href="/" className="rounded-md border px-4 py-2">
          Back home
        </Link>
      </div>
    </main>
  );
}
