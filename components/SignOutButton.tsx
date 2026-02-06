"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      className={className}
      onClick={() => signOut({ callbackUrl: "/" })}
      type="button"
    >
      {children ?? "Sign out"}
    </button>
  );
}
