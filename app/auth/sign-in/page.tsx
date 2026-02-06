import { Suspense } from "react";

import SignInClient from "@/app/auth/sign-in/sign-in-client";

export default function SignInPage() {
  return (
    <Suspense
      fallback={<main className="mx-auto max-w-md px-6 py-12">Loading…</main>}
    >
      <SignInClient />
    </Suspense>
  );
}
