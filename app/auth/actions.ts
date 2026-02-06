"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function signUpBuyer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !phone || password.length < 8) {
    throw new Error("Missing fields or weak password.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "BUYER",
      emailVerified: new Date(),
    },
  });

  redirect("/auth/sign-in");
}

export async function signUpCreator(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!displayName || !email || !phone || password.length < 8) {
    throw new Error("Missing fields or weak password.");
  }

  const baseSlug = slugify(displayName);
  const passwordHash = await bcrypt.hash(password, 12);

  // Ensure slug uniqueness with a simple numeric suffix.
  let slug = baseSlug;
  for (let i = 0; i < 20; i += 1) {
    const existing = await prisma.creatorProfile.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${i + 2}`;
  }

  await prisma.user.create({
    data: {
      email,
      phone,
      passwordHash,
      role: "CREATOR",
      emailVerified: new Date(),
      creatorProfile: {
        create: {
          slug,
          displayName,
          isStorefrontLive: true,
        },
      },
      wallet: {
        create: {
          currency: "INR",
        },
      },
    },
  });

  redirect("/auth/sign-in");
}
