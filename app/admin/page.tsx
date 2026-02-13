import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p>Unauthorized.</p>
      </main>
    );
  }

  const [creators, buyers, products, orders, wallets] = await Promise.all([
    prisma.user.count({ where: { role: "CREATOR" } }),
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.product.count(),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.wallet.findMany(),
  ]);

  const walletTotals = wallets.reduce(
    (
      acc: { available: number; pending: number; paid: number; currency: string },
      w: (typeof wallets)[number]
    ) => {
      acc.available += w.availableBalanceCents;
      acc.pending += w.pendingBalanceCents;
      acc.paid += w.totalPaidOutCents;
      acc.currency = w.currency;
      return acc;
    },
    { available: 0, pending: 0, paid: 0, currency: "INR" }
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="mt-1 text-sm text-neutral-600">Visibility & controls (v1)</p>
        </div>

        <SignOutButton className="rounded-md border px-3 py-2 text-sm" />
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-neutral-600">Creators</p>
          <p className="mt-1 text-xl font-semibold">{creators}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-neutral-600">Buyers</p>
          <p className="mt-1 text-xl font-semibold">{buyers}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-neutral-600">Products</p>
          <p className="mt-1 text-xl font-semibold">{products}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-neutral-600">Orders</p>
          <p className="mt-1 text-xl font-semibold">{orders.length}</p>
        </div>
      </div>

      <section className="mt-8 rounded-xl border p-5">
        <h2 className="font-medium">Wallet totals</h2>
        <div className="mt-3 grid gap-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Available</span>
            <span className="font-medium">
              {formatMoney(walletTotals.available, walletTotals.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Pending</span>
            <span className="font-medium">
              {formatMoney(walletTotals.pending, walletTotals.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Total paid out</span>
            <span className="font-medium">{formatMoney(walletTotals.paid, walletTotals.currency)}</span>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-xl border p-5">
        <h2 className="font-medium">Recent orders</h2>
        <div className="mt-3 grid gap-2 text-sm">
          {orders.length ? (
            orders.map((o: (typeof orders)[number]) => (
              <div key={o.id} className="flex items-center justify-between">
                <span className="text-neutral-700">{o.id.slice(-6)}</span>
                <span className="text-neutral-600">{o.status}</span>
              </div>
            ))
          ) : (
            <p className="text-neutral-600">No orders yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
