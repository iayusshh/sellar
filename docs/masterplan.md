# masterplan.md

## 1. App Overview & Objectives

This product is a **creator-first monetization platform** that enables content creators and educators to sell digital products with minimal friction, while supporting higher-touch monetization like paid 1:1 sessions and gated communities (Telegram-first).

The platform is **not a marketplace**. Discovery is external and traffic is creator-driven.

Primary goals of v1:

- Enable creators to **start selling digital products immediately**
- Provide **real-time revenue visibility** via an internal wallet
- Keep buyer experience simple, fast, and trust-based
- Serve as a **serious startup foundation** and a **portfolio-grade system design showcase**

Stripe is used strictly for **prototype and demo purposes**.

---

## 2. Target Audience

### Creators

- Independent content creators
- Educators, coaches, mentors
- Telegram-first creators selling digital knowledge products

### Buyers

- End users purchasing digital products or sessions from individual creators

---

## 3. Core Product Philosophy

- Creator-first, infrastructure-style platform
- Fixed layout over customization
- Low friction over heavy enforcement
- Trust-based delivery in v1
- Opinionated scope to avoid feature sprawl

---

## 4. Core Features & Functionality

### 4.1 Creator Features (v1)

#### Authentication & Onboarding

- Email + password
- Phone verification (mandatory)
- OAuth login option
- No manual approval required to start selling

#### Creator Storefront

- Fixed layout for all creators
- Custom URLs per creator (e.g. `/rahul/excel`)
- Public, shareable, SEO-friendly pages
- Toggle visibility of products and services

#### Digital Product Creation

When listing a product, creators must provide:

- Product name
- Description
- Validity period
- Supply limit
- Price
- Discount (optional)
- Terms & Conditions (optional)
- Delivery method:
  - File upload, or
  - External link

Creators can reuse the same delivery asset for all buyers.

#### Product Management

- Enable / disable products
- Apply product-level or site-wide discounts
- Edit pricing, validity, and supply

#### Wallet & Earnings

- Platform deducts 15–20% commission per sale
- Creator earnings (post-fee) are credited to an **internal wallet**
- Wallet is **visible in real time**, showing:
  - Available balance
  - Pending earnings (if applicable)
  - Total paid out historically
- Wallet is the **single source of truth** for creator income

#### Payouts

- Creator must link a bank account before requesting payouts
- Payouts are requested from wallet balance
- Payout processing is manual/conceptual in v1
- Stripe is not used for real payouts in production context

#### Paid 1:1 Sessions

- Buyers pay upfront
- No fixed scheduling in v1
- Creator contacts buyer later
- Clear disclaimer about creator flexibility and no guaranteed time slot

#### Telegram Monetization (v1)

- Telegram access delivered via invite link after purchase
- No automated add/remove enforcement in v1
- Platform sells entitlement, not access enforcement

---

### 4.2 Buyer Features (v1)

#### Authentication

- Separate buyer accounts
- Email + password or OAuth
- Email verification required

#### Checkout Flow

Before payment, buyer must provide:

- Name
- Email (verified)
- Phone number

#### Post-Purchase Experience

- Purchased product delivered via email
- Purchase confirmation sent to both buyer and creator
- Buyer dashboard showing:
  - Past purchases
  - Creator name
  - Product details

---

### 4.3 Admin Features (v1)

- Full visibility across:
  - Creators
  - Buyers
  - Products
  - Orders
  - Wallet balances
- Platform-wide revenue analytics
- Creator-level performance insights
- Flags for:
  - Refund requests (manual)
  - Disputes
  - Abuse or suspicious behavior
- Ability to disable creators or products if required

---

## 5. Analytics & Insights

### Creator Analytics

- Product-wise sales count
- Revenue per product
- Total revenue
- Buyer list per product
- Time-based sales charts (daily / weekly)

### Event Tracking (Best-effort)

- Email delivery status
- Link click tracking (non-DRM, informational only)

### Admin Analytics

- Platform-wide revenue
- Creator performance summaries
- Wallet and payout monitoring

---

## 6. High-Level Technical Architecture (Conceptual)

### Frontend

- Web-only application
- Responsive for mobile
- Separate dashboards for creators and buyers
- Public storefront pages per creator

### Backend

- Central API for:
  - Users
  - Products
  - Orders
  - Wallets
  - Payout requests
  - Analytics events
- Role-based access control

### Data Storage

- Relational core (users, products, orders, wallets)
- File storage for digital assets
- Event store for analytics

### Payments

- Stripe used for prototype payments
- Platform collects 100% of funds
- Internal ledger tracks fees and creator earnings
- Wallet abstraction decouples payments from payouts

### Integrations

- Email service for delivery and notifications
- OAuth providers
- Telegram (manual v1, bot-based later)

---

## 7. Conceptual Data Model (High Level)

- User (creator or buyer)
- CreatorProfile
- Product
- Order
- Wallet
- WalletTransaction
- PayoutRequest
- AnalyticsEvent

---

## 8. Security & Trust Model

- Email and phone verification for creators
- Email verification for buyers
- OAuth reduces password friction
- No DRM enforcement in v1
- Trust managed via monitoring and admin oversight
- Clear disclaimers for 1:1 sessions

---

## 9. Development Phases

### Phase 1 – Core Monetization

- Auth
- Creator storefronts
- Product sales
- Email delivery
- Wallet crediting
- Basic analytics

### Phase 2 – Revenue Control

- Discounts
- Wallet dashboards
- Bank linking
- Payout requests
- Admin tooling

### Phase 3 – Expansion

- Telegram bot-based access control
- Scheduling for 1:1 sessions
- Refund workflows
- Account model unification (optional)
- Mobile apps

---

## 10. Risks & Mitigations

- **Trust issues in 1:1 sessions**
  - Mitigated via disclaimers and later scheduling enforcement
- **Telegram automation complexity**
  - Deferred intentionally
- **Creator misuse**
  - Admin visibility and controls
- **Payment rail mismatch**
  - Stripe clearly labeled as prototype-only

---

## 11. Future Expansion

- Subscriptions and recurring payments
- Automatic Telegram membership enforcement
- Native scheduling and calendar sync
- Multi-currency and regional payment providers
- Optional marketplace/discovery layer
