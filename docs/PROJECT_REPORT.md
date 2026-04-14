# SELLAR — Project Report

---

**Project Title:** Sellar — Creator Monetization Platform  
**Technology Domain:** Full-Stack Web Application  
**Date:** April 2026  
**Author:** Ayush Anand

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 [Objective of the Project](#11-objective-of-the-project)
   - 1.2 [Brief Description of the Project](#12-brief-description-of-the-project)
   - 1.3 [Technology Used](#13-technology-used)
     - 1.3.1 [Hardware Requirement](#131-hardware-requirement)
     - 1.3.2 [Software Requirement](#132-software-requirement)
2. [Design Description](#2-design-description)
   - 2.1 [Flow Chart](#21-flow-chart)
   - 2.2 [Data Flow Diagrams (DFDs)](#22-data-flow-diagrams-dfds)
   - 2.3 [Entity Relationship Diagram (E-R Diagram)](#23-entity-relationship-diagram-e-r-diagram)
3. [Project Description](#3-project-description)
   - 3.1 [Database](#31-database)
   - 3.2 [Table Description](#32-table-description)
   - 3.3 [File / Database Design](#33-file--database-design)
4. [Input / Output Form Design](#4-input--output-form-design)
5. [Testing & Tools Used](#5-testing--tools-used)
6. [Implementation & Maintenance](#6-implementation--maintenance)
7. [Conclusion and Future Work](#7-conclusion-and-future-work)
8. [Outcome](#8-outcome)
9. [Bibliography](#9-bibliography)

---

## 1. Introduction

### 1.1 Objective of the Project

The primary objective of Sellar is to provide an end-to-end, self-service monetization platform tailored specifically for independent content creators in India. The platform aims to:

- **Empower creators** to sell digital products (eBooks, templates, guides, courses) and live webinars directly to their audience without relying on third-party marketplaces.
- **Streamline payments** by integrating Cashfree, a leading Indian payment gateway, supporting UPI, net banking, wallets, and cards.
- **Automate revenue distribution** through a commission-based wallet system where creator earnings are credited instantly after successful purchases.
- **Offer administrative oversight** with a full-featured admin and owner portal for platform governance, creator management, and financial monitoring.
- **Reduce technical barriers** so that any individual with a social media audience can begin selling within minutes of creating an account.

### 1.2 Brief Description of the Project

Sellar is a creator-first digital commerce platform built as a single-page application (SPA) with a cloud-native backend. At its core, the platform operates as follows:

1. **Creators** sign up, set a unique handle (e.g., `sellar.in/johndoe`), and list digital products or webinars with prices, images, and descriptions.
2. **Buyers** discover creators via the Top Creators listing or direct links, browse their storefront, and purchase products using a seamless Cashfree Drop-in checkout.
3. **Revenue flows** automatically: on successful payment, the platform deducts a configurable commission (default 20%) and credits the creator's wallet with the net amount.
4. **Creators withdraw** their wallet balance through the withdrawal interface; the admin team processes payouts manually in the current implementation.
5. **Admins** monitor the platform through a multi-tab portal covering products, creators, purchases, withdrawals, traffic, and demographic analytics.
6. **Webinars** are a specialised product type where creators schedule live sessions with capacity limits, join windows, and token-based access control.

The platform currently supports four product kinds: `digital`, `webinar`, `session`, and `telegram`.

### 1.3 Technology Used

#### 1.3.1 Hardware Requirement

| Component | Minimum Specification | Recommended Specification |
|---|---|---|
| Processor | Dual-core 1.8 GHz | Quad-core 2.5 GHz or above |
| RAM | 4 GB | 8 GB or above |
| Storage | 10 GB free disk space | 20 GB SSD |
| Network | Broadband (10 Mbps) | 50 Mbps and above |
| Display | 1280 × 720 resolution | 1920 × 1080 or above |
| Operating System | Windows 10 / macOS 11 / Ubuntu 20.04 | Windows 11 / macOS 14 / Ubuntu 22.04 |

> **Note:** These are developer workstation requirements. End users (creators and buyers) only require a modern web browser and internet connectivity. The application is deployed as a cloud-hosted SPA with zero server-side infrastructure to manage.

#### 1.3.2 Software Requirement

**Runtime & Build Tools**

| Software | Version | Purpose |
|---|---|---|
| Node.js | 18.x or above | JavaScript runtime for development |
| npm | 9.x or above | Package management |
| Vite | 5.4.19 | Build tool and development server |
| TypeScript | 5.8.3 | Statically typed JavaScript superset |
| @vitejs/plugin-react-swc | 3.x | SWC-based React Fast Refresh |

**Frontend Framework & Libraries**

| Library | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI component framework |
| React Router DOM | 6.30.1 | Client-side routing |
| TanStack Query (React Query) | 5.83.0 | Server state management and caching |
| React Hook Form | 7.61.1 | Form state and validation |
| Zod | 3.25.76 | Runtime schema validation |
| Framer Motion | 12.29.2 | Animation library |
| Recharts | 2.15.4 | Chart and data visualisation |
| Lucide React | 0.462.0 | SVG icon set |
| Sonner | 1.7.4 | Toast notification system |
| date-fns | 3.6.0 | Date formatting utilities |
| next-themes | 0.3.0 | Dark/light theme management |

**UI Component System**

| Library | Version | Purpose |
|---|---|---|
| Tailwind CSS | 3.4.17 | Utility-first CSS framework |
| Radix UI (Accordion, Dialog, Dropdown, Select, Tabs, etc.) | 1.x | Accessible headless component primitives |
| class-variance-authority | 0.7.1 | Variant-based component styling |
| clsx / tailwind-merge | – | Dynamic class name utilities |

**Backend & Database**

| Service / Tool | Version / Plan | Purpose |
|---|---|---|
| Supabase | 2.93.3 (JS client) | Backend-as-a-Service platform |
| PostgreSQL | 15 (via Supabase) | Relational database |
| Supabase Auth | Managed | User authentication and session management |
| Supabase Storage | Managed | File storage for product images |
| Supabase Edge Functions | Deno runtime | Serverless functions for payment processing |

**Payment Integration**

| Library / Service | Version | Purpose |
|---|---|---|
| Cashfree Payments JS | 1.0.5 | Drop-in checkout SDK (client-side) |
| Cashfree Orders API | REST | Server-side order creation (via Edge Function) |
| Cashfree Webhooks | – | Asynchronous payment status updates |

**Development & Quality Tools**

| Tool | Version | Purpose |
|---|---|---|
| ESLint | 9.32.0 | Static code linting |
| Vitest | 3.2.4 | Unit test runner |
| @testing-library/react | – | Component testing utilities |
| PostCSS | 8.5.6 | CSS transformation pipeline |
| Autoprefixer | 10.4.21 | CSS vendor-prefixing |

**Deployment**

| Service | Purpose |
|---|---|
| Vercel | Static SPA hosting with automatic previews |
| Supabase Cloud | Managed PostgreSQL + Auth + Storage + Edge Functions |

**Development Environment**

| Tool | Purpose |
|---|---|
| VS Code / Cursor | Code editor with TypeScript IntelliSense |
| Git | Version control |
| GitHub | Remote repository and collaboration |

---

## 2. Design Description

### 2.1 Flow Chart

#### 2.1.1 Overall System Flow

```
                            ┌──────────────────────┐
                            │       VISITOR         │
                            └──────────┬───────────┘
                                       │
                         ┌─────────────▼─────────────┐
                         │       Landing Page         │
                         │  (/, /top-creators)        │
                         └──────────┬────────────────┘
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                      │
     ┌────────▼───────┐   ┌─────────▼────────┐  ┌─────────▼────────┐
     │   Sign Up       │   │  Browse Creator  │  │   Already have   │
     │ (Buyer/Creator) │   │   Storefront     │  │    an account    │
     └────────┬────────┘   └─────────┬────────┘  └─────────┬────────┘
              │                      │                      │
              │             ┌────────▼────────┐    ┌────────▼────────┐
              │             │  View Products  │    │    Sign In      │
              │             └────────┬────────┘    └────────┬────────┘
              │                      │                      │
              │             ┌────────▼────────┐             │
              │             │ Initiate Purchase│◄────────────┘
              │             └────────┬────────┘
              │                      │
              │             ┌────────▼────────┐
              │             │  Cashfree Drop- │
              │             │  In Checkout    │
              │             └────────┬────────┘
              │                      │
              │          ┌───────────┴─────────────┐
              │    ┌─────▼──────┐           ┌──────▼──────┐
              │    │  Payment   │           │   Payment   │
              │    │ Successful │           │   Failed    │
              │    └─────┬──────┘           └──────┬──────┘
              │          │                         │
              │   ┌──────▼──────┐           ┌──────▼──────┐
              │   │  Settle     │           │  Mark as    │
              │   │  Purchase   │           │  Failed     │
              │   │  + Credit   │           └─────────────┘
              │   │  Wallet     │
              │   └──────┬──────┘
              │          │
              └──────────▼──────────────────────────────────┐
                         │                                   │
              ┌──────────▼──────────┐          ┌────────────▼───────────┐
              │    BUYER PORTAL     │          │    CREATOR DASHBOARD   │
              │  /library           │          │  Dashboard, Products,  │
              │  View purchased     │          │  Wallet, Settings      │
              │  content            │          └────────────────────────┘
              └─────────────────────┘
```

#### 2.1.2 Creator Onboarding Flow

```
START
  │
  ▼
User visits /auth/signup
  │
  ▼
Enter email, password, display name, handle
  │
  ▼
Call supabase.auth.signUp()
  │
  ├── [Is Creator?] ──YES──► Set is_creator = true on user row
  │                          Create wallet record
  │                          Redirect to /creator/dashboard
  │
  └── [Is Buyer?]  ──YES──► Create user row (is_creator = false)
                             Create wallet record
                             Redirect to Landing Page
                             
  Later:
  Buyer visits /become-a-creator
  │
  ▼
Enters desired handle
  │
  ▼
Call upgradeToCreator(handle) RPC
  │
  ▼
Set is_creator = true, assign handle
  │
  ▼
Redirect to /creator/dashboard
```

#### 2.1.3 Admin Operations Flow

```
Owner / Admin logs in (/auth/owner or /auth/signin)
  │
  ▼
/admin/portal or /owner/portal
  │
  ├──► Overview Tab       ── Platform KPIs
  ├──► Creators Tab       ── List, commission update, remove creator
  ├──► Products Tab       ── All products with creator info
  ├──► Users & Purchases  ── Transaction history
  ├──► Withdrawals Tab    ── Process pending payouts
  ├──► Traffic Tab        ── Storefront visit analytics
  └──► Demographics Tab   ── Buyer location and gender data
```

### 2.2 Data Flow Diagrams (DFDs)

#### Level 0 — Context Diagram

```
                ┌─────────────────────────────────────────────────────┐
                │                                                     │
 BUYER ─────────►                                       ◄──────────── CREATOR
  (purchase,    │                 SELLAR                │ (products,
   payment)     │              PLATFORM                 │  earnings)
 BUYER ◄────────►                                       ►──────────── CREATOR
  (content      │                                       │  (wallet,
   access)      │                                       │  analytics)
                │                                       │
 ADMIN ─────────►                                       │
  (manage       │                                       │
   platform)    │                                       │
                └─────────────────────────────────────────────────────┘
                                     │
                                     │ Payment events
                                     │
                             CASHFREE GATEWAY
```

#### Level 1 — Major Processes

```
BUYER                      SELLAR                        CREATOR
  │                          │                              │
  │── Browse Storefront ─────►│                              │
  │                          │─── Fetch Public Products ────►│ (D1: products)
  │◄── Display Products ─────│                              │
  │                          │                              │
  │── Initiate Purchase ─────►│                              │
  │                          │─── Create Order (CF API) ────►│ CASHFREE
  │◄── Session ID ───────────│◄── Order ID ─────────────────│
  │                          │                              │
  │── Complete Payment ──────►│ CASHFREE                     │
  │                          │                              │
  │         ┌────────────────►│── Verify Payment ───────────►│ CASHFREE
  │         │ Webhook         │◄── Payment Status ───────────│
  │         │                 │                              │
  │         │                 │── Settle Purchase            │
  │         │                 │   (split commission)         │
  │         │                 │── Credit Wallet ─────────────►│ (D2: wallets)
  │         │                 │── Update Purchase Status      │
  │         │                 │                              │
  │◄── Redirect to /library  │                              │
  │                          │                              │
                ADMIN                                        │
                  │                                          │
                  │── Manage Creators / Withdrawals ────────►│
                  │── View Analytics ◄──────────────────────│
                  │                                          │
```

**Data Stores:**
- D1: `products` table
- D2: `wallets` table
- D3: `purchases` table
- D4: `transactions` table
- D5: `users` table
- D6: `visits` table

#### Level 2 — Payment Processing Sub-Process

```
  BUYER                  EDGE FUNCTION              DATABASE           CASHFREE
    │                        │                         │                  │
    │── buy(product_id) ────►│                         │                  │
    │                        │─ begin_purchase() ─────►│                  │
    │                        │◄─ purchase_row ─────────│                  │
    │                        │                         │                  │
    │                        │────── Create Order ─────────────────────►  │
    │                        │◄───── {order_id,                           │
    │                        │        session_id}                         │
    │                        │                         │                  │
    │                        │─ attach_cashfree_order()►│                  │
    │                        │                         │                  │
    │◄── payment_session_id ─│                         │                  │
    │                        │                         │                  │
    │── (Drop-In Checkout) ──────────────────────────────────────────►    │
    │                        │                         │                  │
    │◄── Redirect /payment/return                      │                  │
    │                        │                         │                  │
    │── verify_order ────────►│                         │                  │
    │                        │────── Get Order Status ──────────────────► │
    │                        │◄───── {status: SUCCESS}                    │
    │                        │                         │                  │
    │                        │── settle_purchase() ────►│                  │
    │                        │   (idempotent)           │─ credit wallet   │
    │                        │                         │─ log transaction  │
    │◄── redirect /library ──│                         │                  │
```

### 2.3 Entity Relationship Diagram (E-R Diagram)

```
┌───────────────────┐         ┌───────────────────┐
│      USERS        │         │      WALLETS       │
│───────────────────│         │───────────────────│
│ id (PK)           │◄────────│ id (PK)           │
│ email             │  1   1  │ user_id (FK)      │
│ handle            │         │ balance           │
│ display_name      │         │ currency          │
│ bio               │         │ created_at        │
│ avatar_url        │         │ updated_at        │
│ is_admin          │         └────────┬──────────┘
│ is_owner          │                  │ 1
│ is_creator        │                  │
│ is_featured       │                  │ N
│ featured_order    │         ┌────────▼──────────┐
│ commission_rate   │         │   TRANSACTIONS    │
│ created_at        │         │───────────────────│
│ updated_at        │         │ id (PK)           │
└────────┬──────────┘         │ wallet_id (FK)    │
         │ 1                  │ type              │
         │                    │ amount            │
         │ N                  │ currency          │
┌────────▼──────────┐         │ source            │
│     PRODUCTS      │         │ status            │
│───────────────────│         │ created_at        │
│ id (PK)           │         └───────────────────┘
│ creator_id (FK)   │
│ title             │
│ description       │
│ price             │
│ currency          │         ┌───────────────────┐
│ image_url         │         │      CLIENTS      │
│ content_url       │         │───────────────────│
│ is_active         │◄────────│ id (PK)           │
│ product_kind      │  N   1  │ creator_id (FK)   │
│ webinar_scheduled │         │ name              │
│ webinar_duration  │         │ email             │
│ webinar_capacity  │         │ gender            │
│ webinar_timezone  │         │ location          │
│ created_at        │         │ created_at        │
│ updated_at        │         └───────────────────┘
└────────┬──────────┘
         │ 1
         │
         │ N
┌────────▼──────────┐         ┌───────────────────┐
│     PURCHASES     │         │      VISITS       │
│───────────────────│         │───────────────────│
│ id (PK)           │         │ id (PK)           │
│ creator_id (FK)   │◄────────│ creator_id (FK)   │
│ client_id (FK)    │  N   1  │ path              │
│ product_id (FK)   │         │ referrer          │
│ buyer_id          │         │ country           │
│ amount            │         │ city              │
│ currency          │         │ device            │
│ status            │         │ created_at        │
│ cashfree_order_id │         └───────────────────┘
│ cashfree_session  │
│ payment_provider  │         ┌─────────────────────────┐
│ platform_fee      │         │  WEBINAR_ENTITLEMENTS   │
│ created_at        │◄────────│─────────────────────────│
│ updated_at        │  1   1  │ id (PK)                 │
└───────────────────┘         │ purchase_id (FK, UNIQUE)│
                              │ product_id (FK)         │
                              │ creator_id (FK)         │
                              │ buyer_id                │
                              │ scheduled_at            │
                              │ duration_minutes        │
                              │ created_at              │
                              └──────────┬──────────────┘
                                         │ 1
                                         │ N
                              ┌──────────▼──────────────┐
                              │  WEBINAR_JOIN_SESSIONS  │
                              │─────────────────────────│
                              │ id (PK)                 │
                              │ entitlement_id (FK)     │
                              │ purchase_id (FK)        │
                              │ buyer_id                │
                              │ client_session_id       │
                              │ issued_at               │
                              │ expires_at              │
                              │ joined_at               │
                              │ left_at                 │
                              │ revoked_at              │
                              │ created_at              │
                              └─────────────────────────┘
```

**Key Relationships:**
- One `users` record has exactly one `wallets` record (1:1)
- One `users` (creator) has many `products` (1:N)
- One `products` record has many `purchases` (1:N)
- One `users` (creator) has many `clients` — one per unique buyer (1:N)
- One `wallets` record has many `transactions` (1:N)
- One `purchases` record has at most one `webinar_entitlements` record (1:1)
- One `webinar_entitlements` record has many `webinar_join_sessions` (1:N)
- One `users` (creator) has many `visits` for storefront analytics (1:N)

---

## 3. Project Description

### 3.1 Database

Sellar uses **PostgreSQL 15** hosted on **Supabase Cloud** as its sole data store. The database is responsible for:

- **User management and authentication**: Supabase Auth stores credentials in a separate `auth.users` table; a database trigger `handle_new_auth_user()` automatically creates a corresponding row in the public `users` table and provisions a wallet whenever a new user signs up.

- **Product catalogue**: Stores all creator-listed products including metadata, pricing, scheduling information for webinars, and active/inactive status.

- **Purchase lifecycle**: Tracks the state machine for each purchase from `pending` → `completed` or `failed`, including Cashfree order identifiers for reconciliation.

- **Wallet system**: Maintains a running balance per creator. All credit and debit events are captured as immutable `transactions` records.

- **Access control via Row-Level Security (RLS)**: PostgreSQL RLS policies enforce data isolation at the database layer. Creators can only read and modify their own records; buyers can only read purchases where they are the buyer; admins have elevated read access across all tables.

- **Stored procedures**: Business logic critical to payment atomicity is implemented as `SECURITY DEFINER` PostgreSQL functions (`begin_purchase`, `settle_purchase`, `fail_purchase`, `attach_cashfree_order`) to ensure transactional integrity without exposing service keys to the client.

The schema is managed via versioned SQL migration files stored in `supabase/sql/migrations/`. The initial schema (`supabase/sql/init/supabase-schema.sql`) contains 503 lines covering all tables, indexes, RLS policies, and trigger definitions.

### 3.2 Table Description

#### Table: `users`

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | References `auth.users(id)` |
| `email` | TEXT | UNIQUE, NOT NULL | User's login email |
| `handle` | TEXT | UNIQUE | URL-safe username for storefront |
| `display_name` | TEXT | | Public name shown to buyers |
| `bio` | TEXT | | Creator's profile description |
| `avatar_url` | TEXT | | Reference to Supabase Storage object |
| `phone` | TEXT | | Optional contact number |
| `social_links` | JSONB | | Map of platform → URL |
| `is_admin` | BOOLEAN | DEFAULT false | Admin access flag |
| `is_owner` | BOOLEAN | DEFAULT false | Owner-level access flag |
| `is_creator` | BOOLEAN | DEFAULT false | Creator role flag |
| `is_featured` | BOOLEAN | DEFAULT false | Appears in Top Creators |
| `featured_order` | INTEGER | | Display order in Top Creators list |
| `commission_rate` | NUMERIC(4,2) | DEFAULT 0.20 | Platform cut (0.00 to 1.00) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Row creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last updated timestamp |

#### Table: `wallets`

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | |
| `user_id` | UUID | FK → users, UNIQUE | Owner of the wallet |
| `balance` | NUMERIC(12,2) | DEFAULT 0 | Current available balance |
| `currency` | TEXT | DEFAULT 'INR' | ISO currency code |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

#### Table: `transactions`

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | |
| `wallet_id` | UUID | FK → wallets | Owning wallet |
| `type` | TEXT | CHECK ('income','withdrawal') | Direction of money |
| `amount` | NUMERIC(12,2) | NOT NULL | Transaction value |
| `currency` | TEXT | DEFAULT 'INR' | |
| `source` | TEXT | | Human-readable description |
| `status` | TEXT | CHECK ('pending','completed','failed') | Processing state |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

#### Table: `products`

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | |
| `creator_id` | UUID | FK → users | Owner creator |
| `title` | TEXT | NOT NULL | Product name |
| `description` | TEXT | | Detailed description |
| `price` | NUMERIC(12,2) | NOT NULL | Listed price |
| `currency` | TEXT | DEFAULT 'INR' | |
| `image_url` | TEXT | | Thumbnail image |
| `content_url` | TEXT | | Delivery link for digital products |
| `is_active` | BOOLEAN | DEFAULT true | Published / unpublished |
| `product_kind` | TEXT | CHECK ('digital','webinar','session','telegram') | Product type |
| `webinar_scheduled_at` | TIMESTAMPTZ | | Scheduled webinar datetime |
| `webinar_duration_minutes` | INTEGER | | Session length |
| `webinar_capacity` | INTEGER | | Max attendees |
| `webinar_timezone` | TEXT | | Creator's timezone |
| `webinar_join_early_minutes` | INTEGER | DEFAULT 10 | Minutes early joins allowed |
| `webinar_join_late_minutes` | INTEGER | DEFAULT 30 | Minutes late joins allowed |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

#### Table: `purchases`

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | |
| `creator_id` | UUID | FK → users | Selling creator |
| `client_id` | UUID | FK → clients | CRM reference |
| `product_id` | UUID | FK → products | Purchased product |
| `buyer_id` | UUID | | Auth user reference for buyer |
| `amount` | NUMERIC(12,2) | | Amount paid |
| `currency` | TEXT | DEFAULT 'INR' | |
| `status` | TEXT | CHECK ('pending','completed','failed') DEFAULT 'pending' | Purchase state |
| `cashfree_order_id` | TEXT | UNIQUE | Cashfree order identifier |
| `cashfree_session_id` | TEXT | | Cashfree payment session |
| `payment_provider` | TEXT | DEFAULT 'cashfree' | Payment gateway used |
| `platform_fee` | NUMERIC(12,2) | | Commission deducted by platform |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

*A partial unique index on `(product_id, buyer_id) WHERE status='pending'` prevents duplicate concurrent checkout attempts.*

#### Table: `clients`

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | |
| `creator_id` | UUID | FK → users | CRM owner |
| `name` | TEXT | | Buyer's full name |
| `email` | TEXT | | Buyer's email |
| `gender` | TEXT | | For demographic analytics |
| `location` | TEXT | | For geographic analytics |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

#### Table: `visits`

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | |
| `creator_id` | UUID | FK → users | Visited storefront |
| `path` | TEXT | | Page path visited |
| `referrer` | TEXT | | HTTP referrer |
| `country` | TEXT | | Visitor's country |
| `city` | TEXT | | Visitor's city |
| `device` | TEXT | | Device type |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

#### Table: `webinar_entitlements`

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | |
| `purchase_id` | UUID | FK → purchases, UNIQUE | One entitlement per purchase |
| `product_id` | UUID | FK → products | |
| `creator_id` | UUID | FK → users | |
| `buyer_id` | UUID | | |
| `scheduled_at` | TIMESTAMPTZ | | Webinar start time |
| `duration_minutes` | INTEGER | | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

#### Table: `webinar_join_sessions`

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | |
| `entitlement_id` | UUID | FK → webinar_entitlements | |
| `purchase_id` | UUID | FK → purchases | |
| `buyer_id` | UUID | | |
| `client_session_id` | TEXT | | Token for this join session |
| `issued_at` | TIMESTAMPTZ | | Token issue time |
| `expires_at` | TIMESTAMPTZ | | Token expiry |
| `joined_at` | TIMESTAMPTZ | | When user entered the session |
| `left_at` | TIMESTAMPTZ | | When user exited |
| `revoked_at` | TIMESTAMPTZ | | Revocation time (one-device enforcement) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

*A unique index enforces only one active (non-revoked, non-expired) join session per purchase at any time.*

### 3.3 File / Database Design

#### Application File Structure

```
Sellar/
│
├── src/                          # Frontend SPA (React + Vite)
│   ├── App.tsx                   # Root router with route definitions
│   ├── main.tsx                  # Vite application entry point
│   ├── index.css                 # Global styles and CSS variables
│   │
│   ├── components/               # Reusable React components
│   │   ├── ui/                   # Base design system (Button, Card, Input, Dialog, etc.)
│   │   ├── layout/               # Structural layout (Navbar, Footer, CreatorLayout)
│   │   ├── landing/              # Landing page section components
│   │   └── *Route.tsx            # Role-based route guard components
│   │
│   ├── pages/                    # Page-level components (one per route)
│   │   ├── auth/                 # Authentication pages
│   │   ├── creator/              # Creator dashboard pages
│   │   ├── admin/                # Admin/owner portal pages
│   │   ├── payment/              # Payment callback page
│   │   ├── Index.tsx             # Landing page
│   │   ├── Library.tsx           # Buyer library
│   │   └── TopCreators.tsx       # Featured creators listing
│   │
│   ├── contexts/                 # React context providers
│   │   └── AuthContext.tsx       # Global auth state
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── useAuth.ts, use-finance.ts, use-toast.ts, …
│   │
│   ├── integrations/supabase/    # Supabase integration layer
│   │   ├── client.ts             # Supabase JS client + TypeScript types
│   │   ├── queries.ts            # Pure query functions (no React)
│   │   └── hooks.ts              # TanStack Query hooks wrapping queries
│   │
│   └── lib/                      # Pure utility functions
│       ├── cashfree.ts           # Cashfree Drop-in wrapper
│       ├── currency.ts, date.ts  # Formatting utilities
│       ├── finance.ts            # Earnings math
│       ├── validation.ts         # Zod schemas
│       └── utils.ts              # General helpers
│
├── supabase/                     # Backend infrastructure
│   ├── functions/                # Supabase Edge Functions (Deno runtime)
│   │   ├── create-cashfree-order/index.ts    # Order creation
│   │   ├── verify-cashfree-order/index.ts    # Payment reconciliation
│   │   ├── cashfree-webhook/index.ts         # Webhook listener
│   │   ├── generate-webinar-join-token/index.ts
│   │   └── _shared/              # Shared utilities across functions
│   │
│   └── sql/                      # Database schema and migrations
│       ├── init/                 # Initial setup scripts
│       │   ├── supabase-schema.sql        # Core tables, RLS, triggers
│       │   ├── supabase-init.sql          # Setup and configuration
│       │   └── seed-data.sql              # Sample data for development
│       └── migrations/           # Incremental schema changes
│           ├── supabase-cashfree-migration.sql
│           ├── add-webinar-products.sql
│           ├── add-featured-creators.sql
│           ├── fix-admin-rls-policies.sql
│           └── …
│
├── docs/                         # Project documentation
├── vercel.json                   # Vercel deployment configuration
├── package.json                  # Project dependencies and scripts
├── vite.config.ts                # Vite build configuration
├── tailwind.config.ts            # Tailwind CSS theme
└── tsconfig.json                 # TypeScript compiler options
```

#### Database Design Decisions

| Decision | Rationale |
|---|---|
| UUID primary keys | Prevents enumeration attacks; compatible with distributed ID generation |
| NUMERIC(12,2) for money | Avoids floating-point rounding errors in financial calculations |
| SECURITY DEFINER functions for payments | Ensures commission math and wallet crediting run atomically with elevated privileges, preventing race conditions |
| Partial unique index on pending purchases | Prevents a buyer from creating two simultaneous checkout sessions for the same product |
| RLS policies on every table | Enforces access control at database level independently of application code |
| JSONB for `social_links` | Flexible schema for varying social media platforms without schema changes |
| Soft deletes via `is_active` flag | Preserves purchase history integrity when products are removed |

---

## 4. Input / Output Form Design

### 4.1 Authentication Forms

#### Sign Up Form (`/auth/signup`)

| Field | Type | Validation | Description |
|---|---|---|---|
| Display Name | Text | Required, 2–50 characters | Public name |
| Handle | Text | Required, alphanumeric + hyphens, unique | Storefront URL slug |
| Email | Email | Required, valid email format | Login email |
| Password | Password | Required, min 8 characters | Login password |
| Account Type | Radio | Required | Buyer or Creator |

**Output:** User record created → redirect to dashboard or landing page.

#### Sign In Form (`/auth/signin`)

| Field | Type | Validation |
|---|---|---|
| Email | Email | Required |
| Password | Password | Required |

**Output:** JWT session established → redirect to previous page or home.

### 4.2 Creator Forms

#### Create / Edit Product Form (`/creator/products`)

| Field | Type | Validation | Description |
|---|---|---|---|
| Title | Text | Required, 3–100 characters | Product name |
| Description | Textarea | Required | Product details (Markdown supported) |
| Price | Number | Required, min 0, decimal | Price in INR |
| Product Image | File | Optional, image/* | Thumbnail (uploaded to Supabase Storage) |
| Content URL | URL | Optional | Delivery link for digital content |
| Product Kind | Select | Required | digital / webinar / session / telegram |
| Status | Toggle | | Published / Unpublished |

**Additional fields for Webinar kind:**

| Field | Type | Validation | Description |
|---|---|---|---|
| Scheduled Date/Time | DateTime | Required | Session start time |
| Duration | Number | Required, min 1 | Length in minutes |
| Capacity | Number | Required, min 1 | Max attendees |
| Timezone | Select | Required | IANA timezone |
| Join Early (min) | Number | Default 10 | How early buyers can join |
| Join Late (min) | Number | Default 30 | Grace period after start |

**Output:** Product record saved → product card appears in creator's product list.

#### Creator Settings Form (`/creator/settings`)

| Field | Type | Validation |
|---|---|---|
| Display Name | Text | Required |
| Bio | Textarea | Optional, max 500 characters |
| Avatar | File | Optional, image/* |
| Twitter / Instagram / YouTube | URL | Optional |

**Output:** User profile updated → storefront reflects changes immediately.

#### Withdrawal Request Form (`/creator/wallet`)

| Field | Type | Validation | Description |
|---|---|---|---|
| Amount | Number | Required, ≤ wallet balance | Amount to withdraw |
| Bank Details | Text | Required | Account number/UPI ID |

**Output:** Withdrawal transaction record created with status `pending`; admin processes manually.

### 4.3 Checkout Flow (Buyer)

The checkout is not a traditional form — it uses the **Cashfree Drop-In UI** embedded as an overlay modal. The buyer interacts with Cashfree's pre-built, PCI-compliant payment interface.

**Input:** Payment method selection (UPI / Card / Net Banking / Wallet), credentials.  
**Output:** Redirect to `/payment/return?cf_order=<order_id>` with payment status in query parameters.

### 4.4 Key Output Views

#### Creator Dashboard Output

| Section | Data Displayed |
|---|---|
| KPI Cards | Total earnings, wallet balance, pending withdrawals, total products |
| Earnings Chart | Line/bar chart of revenue over time (Recharts) |
| Recent Purchases | Latest buyer transactions with product name and amount |

#### Admin Portal Output

| Tab | Data Displayed |
|---|---|
| Overview | Platform totals: users, creators, products, total GMV |
| Creators | Table of creators with email, commission rate, wallet balance, action buttons |
| Products | Full product catalogue with creator name, price, status, purchase count |
| Users & Purchases | Searchable purchase log with buyer, product, amount, status |
| Withdrawals | Pending and completed withdrawal requests |
| Traffic | Visit count per creator, referrer breakdown |
| Demographics | Pie/bar charts for buyer gender and geographic distribution |

#### Buyer Library Output

| Column | Description |
|---|---|
| Product Image | Thumbnail |
| Product Title | Name of purchased item |
| Creator | Creator's display name |
| Purchase Date | When the purchase was completed |
| Access Button | Link to `content_url` or webinar join link |

---

## 5. Testing & Tools Used

### 5.1 Testing Strategy

Sellar employs a **layered testing approach** using the following levels:

#### Unit Testing (Vitest)
- **Framework**: Vitest 3.2.4 with @testing-library/react
- **Target**: Pure utility functions in `src/lib/` (currency formatting, date utilities, finance calculations, slug generation)
- **Configuration**: `src/test/setup.ts` initialises the testing environment with jsdom

```typescript
// Example: src/lib/currency.test.ts
import { formatCurrency } from './currency'
test('formats INR correctly', () => {
  expect(formatCurrency(1000, 'INR')).toBe('₹1,000.00')
})
```

#### Integration Testing
- **Approach**: Database functions (`settle_purchase`, `begin_purchase`) are tested using seed data scripts in `supabase/sql/init/seed-data.sql`
- **Edge Functions**: Tested against Cashfree sandbox environment using test credentials
- **RLS Policies**: Verified by logging in as different user roles and asserting data visibility

#### Manual / Exploratory Testing
- **Payment flow**: End-to-end testing via Cashfree sandbox (test card numbers, UPI simulators)
- **Role isolation**: Manual verification that creator routes are inaccessible to buyers and vice versa
- **Responsive layout**: Browser DevTools device simulation for mobile/tablet/desktop

### 5.2 Tools Used for Testing

| Tool | Purpose |
|---|---|
| Vitest | Unit and component test runner |
| @testing-library/react | React component interaction testing |
| Cashfree Sandbox | Payment flow simulation without real money |
| Supabase Studio | Visual database inspection and query testing |
| Postman / curl | Edge Function API testing |
| Browser DevTools | Network inspection, responsive layout, console debugging |

### 5.3 Quality Assurance Tools

| Tool | Purpose |
|---|---|
| ESLint 9.32.0 | Static analysis and code style enforcement |
| TypeScript 5.8.3 | Compile-time type safety across the entire codebase |
| Zod 3.25.76 | Runtime schema validation for all form inputs and API responses |
| React Hook Form | Built-in validation integration with Zod schemas |

---

## 6. Implementation & Maintenance

### 6.1 Implementation Approach

Sellar was implemented using an **iterative, feature-driven development** methodology. The project evolved through distinct phases:

**Phase 1 — Core Platform**
- User authentication (Supabase Auth) with buyer/creator roles
- Creator storefront at `/:handle`
- Basic product listing and CRUD interface
- Supabase schema with RLS policies

**Phase 2 — Payment Integration**
- Cashfree Drop-In checkout implementation
- Edge Functions for order creation and verification
- Wallet system with commission split logic
- Payment state machine (pending → completed/failed)

**Phase 3 — Creator Experience**
- Analytics dashboard with Recharts earnings visualisation
- Wallet management and withdrawal flow
- Profile settings with avatar upload
- Product image upload to Supabase Storage

**Phase 4 — Admin Operations**
- Multi-tab admin portal
- Commission management per creator
- Featured creators (Top Creators) functionality
- Withdrawal processing interface

**Phase 5 — Webinar Products**
- New `product_kind` field on products table
- Webinar scheduling and capacity management
- Webinar entitlements system
- Join session tracking with one-device enforcement
- Edge Function for join token generation

### 6.2 Deployment Architecture

```
                 ┌─────────────────────────────────┐
                 │            VERCEL CDN             │
                 │   (Static SPA hosting)            │
                 │   dist/ → global edge network     │
                 └─────────────────┬───────────────┘
                                   │ HTTPS
                 ┌─────────────────▼───────────────┐
                 │          SUPABASE CLOUD           │
                 │   ┌─────────────────────────┐    │
                 │   │  PostgreSQL 15 Database  │    │
                 │   │  (with RLS + Functions)  │    │
                 │   └─────────────────────────┘    │
                 │   ┌─────────────────────────┐    │
                 │   │   Auth (JWT sessions)    │    │
                 │   └─────────────────────────┘    │
                 │   ┌─────────────────────────┐    │
                 │   │   Storage (images)       │    │
                 │   └─────────────────────────┘    │
                 │   ┌─────────────────────────┐    │
                 │   │   Edge Functions (Deno)  │    │
                 │   └─────────────────────────┘    │
                 └─────────────────────────────────┘
                                   │
                 ┌─────────────────▼───────────────┐
                 │       CASHFREE PAYMENT API        │
                 │   (Order creation, Webhooks,      │
                 │    Payment verification)          │
                 └─────────────────────────────────┘
```

### 6.3 Environment Configuration

The application uses environment variables injected at build time (Vite) and at runtime (Supabase Edge Functions):

**Client-Side (`.env` → `VITE_*` prefix):**
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Public anonymous key
- `VITE_CASHFREE_MODE` — `sandbox` or `production`
- `VITE_SITE_URL` — Deployed application URL

**Edge Function Secrets (Supabase Dashboard):**
- `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CASHFREE_ENV`, `SITE_URL`

### 6.4 Maintenance Plan

| Activity | Frequency | Description |
|---|---|---|
| Dependency updates | Monthly | Review and apply `npm update`; test for breaking changes |
| Security patches | Immediate | Apply CVE patches as soon as available |
| Database migrations | As needed | SQL migration files versioned in `supabase/sql/migrations/` |
| Cashfree API upgrades | Quarterly | Review Cashfree changelog for API deprecations |
| Error monitoring | Ongoing | Browser console errors + Supabase dashboard alerts |
| Backup verification | Monthly | Verify Supabase automated backups are restorable |
| Commission review | Quarterly | Adjust platform commission rates through admin portal |
| Featured creator rotation | Weekly | Update featured creators via admin portal |

---

## 7. Conclusion and Future Work

### 7.1 Conclusion

Sellar successfully delivers a fully functional creator monetization platform tailored to the Indian market. The platform addresses the core challenge that independent creators face: monetizing their content without requiring technical expertise, negotiating platform fees on third-party marketplaces, or building custom payment infrastructure from scratch.

The key technical achievements of the project are:

1. **Payment integrity**: The `settle_purchase` stored procedure ensures atomically correct commission splits and wallet credits, making the payment flow resilient to partial failures, duplicate webhook deliveries, and race conditions.

2. **Security by design**: PostgreSQL Row-Level Security policies enforce data isolation at the database layer, meaning even a compromised frontend cannot expose other creators' financial data.

3. **Scalable architecture**: The serverless combination of Vercel (static hosting) and Supabase (managed backend) means the platform scales to thousands of concurrent users without infrastructure management.

4. **Creator-first UX**: The clean storefront interface, one-click checkout, and real-time earnings dashboard lower the barrier to entry for non-technical creators.

### 7.2 Future Work

| Feature | Priority | Description |
|---|---|---|
| Automated payouts | High | Integrate with Cashfree Payouts API or RazorpayX to automate withdrawal disbursements rather than manual processing |
| Subscription products | High | Recurring billing support using Cashfree Subscriptions API for monthly/annual memberships |
| Email notifications | High | Transactional emails (purchase receipts, withdrawal confirmations) via Resend or SendGrid |
| Coupon / discount codes | Medium | Discount management system for promotional campaigns |
| Affiliate programme | Medium | Referral tracking with commission sharing for affiliate promoters |
| Content versioning | Medium | Allow creators to update product files; buyers receive notifications of updates |
| Mobile app | Medium | React Native companion app for creators to manage their store on mobile |
| Fraud detection | Medium | Anomaly detection for suspicious purchase patterns using Supabase scheduled functions |
| Refund management | Medium | First-class refund and dispute resolution workflow |
| Multi-currency support | Low | Accept payments in USD/EUR for international buyers |
| Advanced analytics | Low | Cohort analysis, funnel tracking, and buyer LTV calculations |
| Webinar platform integration | Low | Deep integration with Zoom/Google Meet for automated webinar room creation |

---

## 8. Outcome

### Deployment Status
The Sellar platform is **deployed and operational** on Vercel with a live Supabase Cloud backend. The deployment configuration is version-controlled in `vercel.json`, and continuous deployment is enabled on every push to the `main` branch.

### Current Progress
The platform has successfully completed five major development phases covering core authentication, product management, Cashfree payment integration, creator analytics, and webinar product support. The codebase comprises approximately 5,000+ lines of TypeScript/React (frontend) and 2,800+ lines of PostgreSQL SQL (backend schema and migrations), with four Supabase Edge Functions handling payment processing.

### Planned Outcomes
The immediate next milestone is production launch with real-money Cashfree transactions. Following a beta launch with a cohort of early creator partners, the platform aims to onboard 100 active creators within the first quarter. The medium-term outcome includes automated payout infrastructure and a subscription product type to capture recurring revenue streams for creators. Future research publication is planned around the commission-split settlement pattern using PostgreSQL SECURITY DEFINER functions as a reusable pattern for marketplace payment integrity.

---

## 9. Bibliography

1. **Supabase Documentation** — Authentication, Database, Storage, and Edge Functions.  
   Available at: https://supabase.com/docs

2. **Cashfree Payments Developer Documentation** — Orders API, Drop-In Checkout SDK, Webhooks.  
   Available at: https://docs.cashfree.com

3. **React Documentation** — React 18 Hooks, Context, and Concurrent Features.  
   Available at: https://react.dev

4. **Vite Documentation** — Build tool configuration, plugin system, and environment variables.  
   Available at: https://vitejs.dev/guide

5. **TanStack Query (React Query) Documentation** — Server state management patterns.  
   Available at: https://tanstack.com/query/latest

6. **Tailwind CSS Documentation** — Utility-first CSS framework reference.  
   Available at: https://tailwindcss.com/docs

7. **Radix UI Primitives Documentation** — Accessible headless component API references.  
   Available at: https://www.radix-ui.com/primitives/docs

8. **PostgreSQL 15 Documentation** — Row-Level Security, Functions, Triggers.  
   Available at: https://www.postgresql.org/docs/15/

9. **TypeScript Handbook** — TypeScript language specification and type system.  
   Available at: https://www.typescriptlang.org/docs/handbook

10. **React Hook Form Documentation** — Form management with schema validation.  
    Available at: https://react-hook-form.com/docs

11. **Zod Documentation** — TypeScript-first schema validation library.  
    Available at: https://zod.dev

12. **Framer Motion Documentation** — Animation library for React.  
    Available at: https://www.framer.com/motion

13. **Recharts Documentation** — Composable charting library built on D3.  
    Available at: https://recharts.org/en-US/guide

14. **Vercel Documentation** — Static site deployment, environment variables, build configuration.  
    Available at: https://vercel.com/docs

15. **OWASP Top 10** — Web application security risks reference.  
    Available at: https://owasp.org/www-project-top-ten/

---

*End of Report*
