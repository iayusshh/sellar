import Link from "next/link";
import { notFound } from "next/navigation";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ creatorSlug: string; productSlug: string }>;
}) {
  const { creatorSlug, productSlug } = await params;

  const profile = await prisma.creatorProfile.findUnique({
    where: { slug: creatorSlug },
  });

  if (!profile || !profile.isStorefrontLive) notFound();

  const product = await prisma.product.findUnique({
    where: {
      creatorId_slug: {
        creatorId: profile.userId,
        slug: productSlug,
      },
    },
  });

  if (!product || product.status !== "ACTIVE") notFound();

  const session = await getSession();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link className="text-sm underline" href={`/${profile.slug}`}>
        ← Back
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mt-2 text-neutral-700 whitespace-pre-wrap">{product.description}</p>
        <p className="mt-4 text-xl font-semibold">
          {formatMoney(product.priceCents, product.currency)}
        </p>
      </header>

      <section className="mt-8 rounded-xl border p-5">
        <h2 className="font-medium">Checkout</h2>
        <p className="mt-2 text-sm text-neutral-600">
          You’ll be asked to sign in as a buyer before payment.
        </p>

        {session?.user?.role === "BUYER" ? (
          <form action="/api/checkout" method="POST" className="mt-4">
            <input type="hidden" name="productId" value={product.id} />
            <button className="rounded-md bg-black px-4 py-2 text-white">
              Buy now
            </button>
          </form>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/auth/sign-in?callbackUrl=${encodeURIComponent(`/${profile.slug}/${product.slug}`)}`}
              className="rounded-md bg-black px-4 py-2 text-white"
            >
              Sign in to buy
            </Link>
            <Link href="/auth/sign-up" className="rounded-md border px-4 py-2">
              Create buyer account
            </Link>
          </div>
        )}
      </section>

      <footer className="mt-10 text-xs text-neutral-500">
        Prototype checkout. Delivery is trust-based in v1.
      </footer>
    </main>
  );
}
