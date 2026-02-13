import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role === "CREATOR") redirect("/creator");

  redirect("/buyer");
}
