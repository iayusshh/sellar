import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ creatorSlug: string }>;
}) {
  const { creatorSlug } = await params;

  const profile = await prisma.creatorProfile.findUnique({
    where: { slug: creatorSlug },
    include: {
      user: true,
    },
  });

  if (!profile || !profile.isStorefrontLive) notFound();

  const products = await prisma.product.findMany({
    where: {
      creatorId: profile.userId,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{profile.displayName}</h1>
        {profile.bio ? (
          <p className="mt-2 text-neutral-700">{profile.bio}</p>
        ) : (
          <p className="mt-2 text-neutral-600">Creator storefront</p>
        )}
      </header>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Products</h2>
        <div className="mt-4 grid gap-3">
          {products.length ? (
            products.map((p: (typeof products)[number]) => (
              <Link
                key={p.id}
                href={`/${profile.slug}/${p.slug}`}
                className="rounded-xl border p-5 hover:bg-neutral-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">
                    {formatMoney(p.priceCents, p.currency)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="mt-3 text-sm text-neutral-600">No products yet.</p>
          )}
        </div>
      </section>

      <footer className="mt-14 text-xs text-neutral-500">
        Powered by Sellar (prototype)
      </footer>
    </main>
  );
}
