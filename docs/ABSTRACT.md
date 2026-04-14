# ABSTRACT

**Project Title:** Sellar — Creator Monetization Platform  
**Author:** Ayush Anand  
**Technology Domain:** Full-Stack Web Application  
**Date:** April 2026  

---

The rapid growth of the creator economy has generated a pressing need for accessible, low-friction tools that allow independent content creators to monetize their work directly without dependence on large third-party platforms. Existing solutions either charge prohibitive commissions, lack localised payment infrastructure, or demand technical expertise beyond the reach of the average creator. Sellar addresses this gap by providing an end-to-end, self-service digital commerce platform purpose-built for the Indian creator market.

Sellar enables creators to set up a personalised storefront at a unique URL handle, list digital products such as eBooks, templates, and guides, and schedule live webinar sessions — all within minutes of signing up. Buyers discover creators through a featured Top Creators listing or via direct links, and complete purchases through an embedded Cashfree Drop-In checkout supporting UPI, net banking, debit/credit cards, and digital wallets. Upon successful payment, a commission-split settlement mechanism — implemented as an atomic PostgreSQL stored procedure — automatically deducts the platform fee and credits the creator's wallet in a single, race-condition-safe transaction.

The platform is built on a modern, cloud-native technology stack. The frontend is a TypeScript React 18 single-page application bundled with Vite and styled using Tailwind CSS with Radix UI component primitives. The backend is powered entirely by Supabase, which provides a managed PostgreSQL 15 database, JWT-based authentication, file storage for product images, and a Deno-based Edge Functions runtime for serverless payment processing. Data access is secured at the database layer using PostgreSQL Row-Level Security policies, ensuring creators can only access their own financial records regardless of client-side state. Payment processing is handled through four Supabase Edge Functions covering order creation, payment verification, webhook reconciliation, and webinar join-token generation.

The system supports four product types — digital downloads, live webinars, one-on-one sessions, and Telegram community access — with a role-based access model separating buyers, creators, platform administrators, and the platform owner. An admin portal provides full operational visibility including creator management, commission configuration, withdrawal processing, storefront traffic analytics, and buyer demographic breakdowns.

The platform is deployed on Vercel with continuous deployment from the main branch, and the Supabase backend is hosted on Supabase Cloud with automated daily backups. The codebase comprises over 5,000 lines of frontend TypeScript and approximately 2,800 lines of PostgreSQL schema and migration scripts. Testing is conducted through Vitest unit tests, Cashfree sandbox integration testing, and manual role-based access verification.

Future development is planned to include automated payout disbursement via banking APIs, subscription-based recurring products, transactional email notifications, affiliate referral tracking, and advanced buyer analytics. Sellar demonstrates that a secure, scalable, and creator-friendly commerce platform can be delivered without custom backend infrastructure, leveraging the composability of modern Backend-as-a-Service tooling and serverless payment APIs.

---

**Keywords:** Creator Economy, Digital Commerce, Payment Gateway Integration, Supabase, PostgreSQL, Row-Level Security, Cashfree, React, Serverless Architecture, Wallet Management, Commission Split
