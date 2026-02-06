import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";
import { slugify } from "../lib/slugs";

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@sellar.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123456";

  const creatorEmail = process.env.SEED_CREATOR_EMAIL ?? "creator@sellar.local";
  const creatorPassword = process.env.SEED_CREATOR_PASSWORD ?? "creator123456";

  const buyerEmail = process.env.SEED_BUYER_EMAIL ?? "buyer@sellar.local";
  const buyerPassword = process.env.SEED_BUYER_PASSWORD ?? "buyer123456";

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const creatorHash = await bcrypt.hash(creatorPassword, 12);
  const buyerHash = await bcrypt.hash(buyerPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      emailVerified: new Date(),
      passwordHash: adminHash,
    },
  });

  const creatorDisplayName = "Rahul";
  const creatorSlug = slugify(creatorDisplayName);

  const creator = await prisma.user.upsert({
    where: { email: creatorEmail },
    update: { role: "CREATOR" },
    create: {
      email: creatorEmail,
      name: creatorDisplayName,
      phone: "+910000000000",
      role: "CREATOR",
      emailVerified: new Date(),
      phoneVerifiedAt: new Date(),
      passwordHash: creatorHash,
      creatorProfile: {
        create: {
          slug: creatorSlug,
          displayName: creatorDisplayName,
          bio: "Selling digital knowledge products.",
          isStorefrontLive: true,
        },
      },
      wallet: {
        create: {
          currency: "INR",
        },
      },
    },
    include: { creatorProfile: true },
  });

  await prisma.user.upsert({
    where: { email: buyerEmail },
    update: { role: "BUYER" },
    create: {
      email: buyerEmail,
      name: "Aditi",
      phone: "+910000000001",
      role: "BUYER",
      emailVerified: new Date(),
      passwordHash: buyerHash,
    },
  });

  const productSlug = "excel";

  await prisma.product.upsert({
    where: {
      creatorId_slug: {
        creatorId: creator.id,
        slug: productSlug,
      },
    },
    update: {
      status: "ACTIVE",
    },
    create: {
      creatorId: creator.id,
      type: "DIGITAL",
      status: "ACTIVE",
      slug: productSlug,
      name: "Excel Mastery Pack",
      description:
        "A practical Excel pack: templates + walkthroughs. Delivered via link.",
      currency: "INR",
      priceCents: 19900,
      deliveryMethod: "LINK",
      deliveryAssetUrl: "https://example.com/download",
    },
  });

  console.log("Seed complete.");
  console.log("Admin:", adminEmail, adminPassword);
  console.log("Creator:", creatorEmail, creatorPassword);
  console.log("Buyer:", buyerEmail, buyerPassword);
  console.log("Storefront:", `http://localhost:3000/${creatorSlug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
