import Link from "next/link";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function BuyerDashboard() {
  const session = await getSession();

  if (!session?.user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p>
          Please <Link className="underline" href="/auth/sign-in">sign in</Link>.
        </p>
      </main>
    );
  }

  const buyer = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!buyer || buyer.role !== "BUYER") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p>Buyer account not found.</p>
      </main>
    );
  }

  const orders = await prisma.order.findMany({
    where: { buyerId: buyer.id },
    include: {
      items: true,
      creator: { include: { creatorProfile: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Buyer dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">Your purchases</p>
        </div>

        <SignOutButton className="rounded-md border px-3 py-2 text-sm" />
      </header>

      <div className="mt-8 grid gap-3">
        {orders.length ? (
          orders.map((o: (typeof orders)[number]) => (
            <div key={o.id} className="rounded-xl border p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">Order {o.id.slice(-6)}</p>
                <p className="text-sm text-neutral-600">{o.status}</p>
              </div>
              <p className="mt-1 text-sm text-neutral-700">
                Creator:{" "}
                <Link
                  className="underline"
                  href={`/${o.creator.creatorProfile?.slug ?? ""}`}
                >
                  {o.creator.creatorProfile?.displayName ?? "Creator"}
                </Link>
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                Total: {formatMoney(o.amountTotalCents, o.currency)}
              </p>

              <div className="mt-4 grid gap-2 text-sm">
                {o.items.map((it: (typeof o.items)[number]) => (
                  <div key={it.id} className="flex items-center justify-between">
                    <span className="text-neutral-700">{it.productNameSnapshot}</span>
                    <span className="text-neutral-600">
                      {formatMoney(it.totalCents, o.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-neutral-600">No purchases yet.</p>
        )}
      </div>
    </main>
  );
}
