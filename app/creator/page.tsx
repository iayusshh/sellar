import Link from "next/link";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import {
  createProduct,
  requestPayout,
  toggleProduct,
  updateBankDetails,
} from "@/app/creator/actions";
import { SignOutButton } from "@/components/SignOutButton";

export default async function CreatorDashboard() {
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

  const creator = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      creatorProfile: true,
      wallet: {
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          payoutRequests: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
    },
  });

  if (!creator || creator.role !== "CREATOR" || !creator.creatorProfile || !creator.wallet) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p>Creator profile not found.</p>
      </main>
    );
  }

  const profile = creator.creatorProfile;
  const wallet = creator.wallet;

  const products = await prisma.product.findMany({
    where: { creatorId: creator.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Creator dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Storefront:{" "}
            <Link className="underline" href={`/${profile.slug}`}>
              /{profile.slug}
            </Link>
          </p>
        </div>

        <SignOutButton className="rounded-md border px-3 py-2 text-sm" />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border p-5 lg:col-span-1">
          <h2 className="font-medium">Wallet</h2>
          <div className="mt-3 grid gap-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Available</span>
              <span className="font-medium">
                {formatMoney(wallet.availableBalanceCents, wallet.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Pending</span>
              <span className="font-medium">
                {formatMoney(wallet.pendingBalanceCents, wallet.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Total paid out</span>
              <span className="font-medium">
                {formatMoney(wallet.totalPaidOutCents, wallet.currency)}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-lg border p-3">
            <p className="text-sm font-medium">Bank account</p>
            {profile.payoutBankName && profile.payoutBankAccountLast4 ? (
              <p className="mt-1 text-sm text-neutral-700">
                {profile.payoutBankName} · ****{profile.payoutBankAccountLast4}
                {profile.payoutBankIfsc ? ` · ${profile.payoutBankIfsc}` : ""}
              </p>
            ) : (
              <p className="mt-1 text-sm text-neutral-600">
                Link a bank account to request payouts.
              </p>
            )}

            <form action={updateBankDetails} className="mt-3 grid gap-2">
              <input
                name="bankName"
                placeholder="Bank name"
                defaultValue={profile.payoutBankName ?? ""}
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  name="last4"
                  placeholder="Account last4"
                  defaultValue={profile.payoutBankAccountLast4 ?? ""}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  required
                />
                <input
                  name="ifsc"
                  placeholder="IFSC (optional)"
                  defaultValue={profile.payoutBankIfsc ?? ""}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <button className="rounded-md border px-3 py-2 text-sm">
                Save bank details
              </button>
            </form>
          </div>

          <form action={requestPayout} className="mt-6 grid gap-2">
            <label className="text-sm font-medium">Request payout (manual v1)</label>
            <input
              name="amountCents"
              type="number"
              min={1}
              step={1}
              placeholder="Amount in paise (e.g. 19900)"
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            />
            <button className="rounded-md bg-black px-3 py-2 text-sm text-white">
              Request payout
            </button>
          </form>

          <h3 className="mt-8 text-sm font-medium">Recent transactions</h3>
          <div className="mt-2 grid gap-2 text-sm">
            {wallet.transactions.length ? (
              wallet.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <span className="text-neutral-600">{t.type}</span>
                  <span className="font-medium">
                    {formatMoney(t.amountCents, wallet.currency)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-neutral-600">No transactions yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border p-5 lg:col-span-2">
          <h2 className="font-medium">Create product</h2>
          <form action={createProduct} className="mt-4 grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="name"
                placeholder="Product name"
                className="w-full rounded-md border px-3 py-2"
                required
              />
              <input
                name="priceCents"
                type="number"
                min={1}
                step={1}
                placeholder="Price in paise (e.g. 19900)"
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>
            <textarea
              name="description"
              placeholder="Description"
              className="w-full rounded-md border px-3 py-2"
              rows={4}
              required
            />
            <div className="grid gap-3 md:grid-cols-3">
              <select name="type" className="w-full rounded-md border px-3 py-2">
                <option value="DIGITAL">Digital product</option>
                <option value="SESSION">Paid 1:1 session</option>
                <option value="TELEGRAM">Telegram entitlement</option>
              </select>
              <select
                name="deliveryMethod"
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="NONE">No delivery asset</option>
                <option value="LINK">External link</option>
                <option value="FILE">File URL (dev)</option>
              </select>
              <input
                name="deliveryAssetUrl"
                placeholder="Delivery URL (optional)"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
            <button className="rounded-md bg-black px-4 py-2 text-white">
              Publish
            </button>
          </form>

          <h2 className="mt-10 font-medium">Products</h2>
          <div className="mt-4 grid gap-3">
            {products.length ? (
              products.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-neutral-600">
                      {p.status} · {formatMoney(p.priceCents, p.currency)} ·{" "}
                      <Link className="underline" href={`/${profile.slug}/${p.slug}`}>
                        View
                      </Link>
                    </p>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await toggleProduct(p.id);
                    }}
                  >
                    <button className="rounded-md border px-3 py-2 text-sm">
                      {p.status === "ACTIVE" ? "Disable" : "Enable"}
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-600">No products yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
