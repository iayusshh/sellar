import Link from "next/link";

import { signUpBuyer, signUpCreator } from "@/app/auth/actions";

export default function SignUpPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Choose a buyer or creator account. (You can create both separately in v1.)
      </p>

      <div className="mt-10 grid gap-10">
        <section className="rounded-xl border p-6">
          <h2 className="text-lg font-medium">Buyer</h2>
          <form action={signUpBuyer} className="mt-4 grid gap-3">
            <input
              name="name"
              placeholder="Name"
              className="w-full rounded-md border px-3 py-2"
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full rounded-md border px-3 py-2"
              required
            />
            <input
              name="phone"
              placeholder="Phone"
              className="w-full rounded-md border px-3 py-2"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password (min 8 chars)"
              className="w-full rounded-md border px-3 py-2"
              minLength={8}
              required
            />
            <button className="mt-2 rounded-md bg-black px-4 py-2 text-white">
              Create buyer account
            </button>
          </form>
        </section>

        <section className="rounded-xl border p-6">
          <h2 className="text-lg font-medium">Creator</h2>
          <form action={signUpCreator} className="mt-4 grid gap-3">
            <input
              name="displayName"
              placeholder="Creator display name"
              className="w-full rounded-md border px-3 py-2"
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full rounded-md border px-3 py-2"
              required
            />
            <input
              name="phone"
              placeholder="Phone (verification stubbed in v1)"
              className="w-full rounded-md border px-3 py-2"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password (min 8 chars)"
              className="w-full rounded-md border px-3 py-2"
              minLength={8}
              required
            />
            <button className="mt-2 rounded-md bg-black px-4 py-2 text-white">
              Create creator account
            </button>
          </form>
        </section>
      </div>

      <p className="mt-8 text-sm text-neutral-700">
        Already have an account?{" "}
        <Link className="underline" href="/auth/sign-in">
          Sign in
        </Link>
      </p>
    </main>
  );
}
