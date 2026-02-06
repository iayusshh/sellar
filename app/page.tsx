import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-2xl border bg-white p-8">
        <h1 className="text-3xl font-semibold tracking-tight">Sellar</h1>
        <p className="mt-3 text-neutral-700">
          Creator-first monetization platform — sell digital products, paid 1:1
          sessions, and Telegram entitlements. Not a marketplace.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/auth/sign-up"
            className="rounded-md bg-black px-4 py-2 text-white"
          >
            Create account
          </Link>
          <Link href="/auth/sign-in" className="rounded-md border px-4 py-2">
            Sign in
          </Link>
          <Link href="/dashboard" className="rounded-md border px-4 py-2">
            Dashboard
          </Link>
        </div>

        <p className="mt-10 text-xs text-neutral-500">
          Payments use Stripe for prototype/demo only. Creator earnings are tracked
          via an internal wallet ledger.
        </p>
      </div>
    </main>
  );
}
