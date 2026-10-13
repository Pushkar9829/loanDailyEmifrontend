# Daily Installment Property Plan — Best-Case Feature & Flow List

_Product name used in code: **KistiPay** (from "kisht" = installment). Rename anytime._

This is the "best case" design: the client's idea kept intact (5 daily slots, Admin → SF → Agent → Customer prepaid balance, commissions, lucky draw) with the legal risks from `01_Concept_And_India_Context.md` handled by **settings and guards**, so the business can switch things on once their CA/lawyer confirms.

---

## A. Assumptions taken for the best case

| # | Decision | Why |
|---|---|---|
| A1 | **Customer credit = money actually paid.** ₹100 paid → ₹100 credited to the plan. | Property side is always fully paid; nothing is "lost" in the chain. |
| A2 | **Balance moves 1:1** (Admin → SF → Agent). SF pays ₹1L, gets ₹1L balance. | Balance is a closed-loop prepaid instrument, always backed by real money. |
| A3 | **Commission = "notional" ledger** earned on every real collection: SF **10%**, Agent **20%** (total 30%), all configurable. Funded from Admin's margin (builder/dealer marketing fee). Settled by Admin as a payout, or converted to balance. | Matches "30% notional commission, SF keeps 10%, passes 20% to agent" without creating a money gap (Reading C). |
| A4 | Commission only on **collections**, never on recruiting agents/SFs. | Keeps it outside money-circulation / pyramid rules. |
| A5 | Each plan is tied to **one specific property** with an agreement number. | Advance against a specific property, not an open-ended deposit (BUDS Act). |
| A6 | Monthly target = **EMI** from value, down payment, tenure, interest rate (rate can be 0). | "At month-end the small payments equal the EMI." |
| A7 | Payment modes: **Cash** (to agent) and **UPI** (customer pays company UPI, agent records UPI ref). No gateway. | UPI has zero MDR; cash limits enforced by software. |
| A8 | **Lucky draw is built but OFF by default** (Admin switch with a legal warning). **Milestone rewards** (25/50/75/100%) are always on. | Prize Chits Act risk. |

---

## B. Roles

| Role | Created by | Can do |
|---|---|---|
| **Admin** | Seed script | Everything: settings, tiers, properties, SFs, issue balance, approve KYC, reverse, settle commission, draws, complaints, reports, audit log |
| **Super Franchisee (SF)** | Admin | Create agents, transfer balance to agents, verify KYC of own network, see network collections, own ledgers |
| **Agent** | SF | Onboard customers, open plans, collect installments per slot, own ledgers, receipts |
| **Customer** | Agent | See plans, progress vs EMI, today's slots, receipts, coupons, rewards, raise complaint direct to Admin |

---

## C. Features

### C1. Auth & users
- Phone + password login, JWT; role-based routes.
- Hierarchy links: Agent → SF, Customer → Agent (+ SF).
- Activate / suspend any user (suspended users cannot log in or transact).
- KYC fields (Aadhaar last 4, PAN, address); status `pending → verified / rejected`. Admin or the parent SF verifies.
- Reset password by parent / Admin.

### C2. Plan tiers (client's table)
- Property value → allowed installment denominations. Seeded with the client's 8 rows (₹1L … ₹3Cr), editable, add ₹5Cr row.
- A plan picks the tier whose value is the nearest at or above the property value.

### C3. Properties
- Type: plot, flat, house, shop, two-wheeler, four-wheeler, other. Value, seller, location, `immovable` flag (auto from type).
- Status: available / booked / closed.

### C4. Customer plans
- Agent opens a plan: customer + property + down payment + tenure months + interest rate + agreement number.
- Auto: financed amount, EMI (monthly target), allowed denominations, end date.
- Requires verified KYC (setting).
- Status: `active → completed` (auto when fully paid) / `cancelled` (Admin).
- Progress: total paid, % complete, this-month paid vs EMI, shortfall, milestones reached.

### C5. Slot engine (5 times a day)
- Slots (IST): **9:30, 12:30, 15:30, 18:30, 21:30**; each slot window open for N minutes (default 180; last slot to 23:59). Editable.
- One installment **per plan per slot per day** (DB unique index).
- Amount must be one of the plan's denominations.
- "Strict slots" switch: off = agent may record any open/past slot of today (demo mode); on = only the currently open slot.
- Today's slot grid: paid / open / missed / upcoming.

### C6. Wallets & ledger (double-entry style)
- Every user has a **balance wallet** (SF, Agent) and a **commission wallet** (SF, Agent).
- Every movement writes immutable ledger entries with balance-after: `ADMIN_ISSUE`, `TRANSFER`, `INSTALLMENT`, `REVERSAL`, `COMMISSION`, `COMMISSION_REVERSAL`, `COMMISSION_PAYOUT`, `COMMISSION_TO_BALANCE`.
- No edits/deletes — corrections only via reversals.
- Runs in MongoDB transactions; balance never goes negative.

### C7. Balance flow
1. **Admin → SF issue**: amount + payment reference (SF's bank transfer UTR).
2. **SF → Agent transfer**.
3. **Agent → Customer installment** debits agent balance, credits customer plan.
4. **Reversal** (Admin, same day by default): restores agent balance, reverses commission, voids coupon.

### C8. Commission engine
- On every installment: SF commission = amount × SF%, Agent commission = amount × Agent%.
- Rates in settings (default 10% / 20%). Rate snapshot stored on each installment.
- Admin **settles** (payout with reference) or SF/Agent **converts commission to balance**.

### C9. Receipts & notifications
- Receipt number for every installment, shown to customer instantly.
- Notification inbox per user (installment received, milestone, KYC status, balance received). SMS/WhatsApp provider hook (logs in dev).

### C10. Compliance guards (settings)
- **Immovable property cash cap** (269SS): total cash per plan ≤ ₹19,999; beyond → UPI only.
- **Daily cash cap per customer** (269ST): < ₹2,00,000.
- **Require KYC before plan**.
- **Lucky draw switch** (off by default).
- Commission never on recruitment (no such endpoint exists).

### C11. Rewards
- **Milestones** at 25 / 50 / 75 / 100% → notification + badge.
- **Lucky draw coupons** (only when enabled): one coupon per installment; Admin creates a draw, system picks random winner(s) from eligible coupons; winners notified.

### C12. Complaints
- Customer (or anyone) raises complaint straight to Admin (optionally about their agent); Admin replies and resolves. This is the "Bhrosa" safety valve.

### C13. Reports & dashboard
- Admin: balance issued, balance with SFs/agents, collections today/month, commission owed, active plans, shortfall list (this month < EMI pro-rata), top agents.
- SF: own balance, commission, network collections, agents' balances.
- Agent: balance, commission, today's collections, current slot.
- Monthly reconciliation per plan.

### C14. Audit log
- Every write action: who, what, when, details. Admin can browse/filter.

---

## D. Flows

**F1 — Onboarding chain**
Admin creates SF → Admin issues ₹ balance to SF (UTR) → SF creates Agent → SF transfers balance → Agent creates Customer (KYC details) → SF/Admin verifies KYC.

**F2 — Open a plan**
Agent picks customer + property → enters down payment, tenure, rate, agreement no. → system computes EMI and denominations → plan active, property booked, customer notified.

**F3 — Collect an installment (the core loop, up to 5× a day)**
Customer gives agent ₹ (cash) or pays company UPI → Agent opens Collect → picks plan → system shows today's slot grid and allowed denominations → agent taps amount + mode (+UPI ref) → checks: slot open, not already paid, amount allowed, agent balance enough, cash caps, plan active →
transaction: agent balance −, plan paid +, installment + receipt, SF & Agent commission +, coupon (if on), milestone check, plan completion check → customer gets receipt notification.

**F4 — Month-end**
Dashboard shows each plan's month total vs EMI; shortfall list for agents to follow up.

**F5 — Reversal**
Admin reverses wrong entry with reason → agent balance back, plan paid back, commission reversed, coupon voided, audit logged.

**F6 — Commission settlement**
Admin views commission wallets → settles with payout reference (bank transfer) **or** user converts commission to balance.

**F7 — Lucky draw (if enabled)**
Admin creates draw (title, prize, winners count, coupon date range) → runs draw → random winners → notifications.

**F8 — Complaint**
Customer raises → Admin sees in queue → replies → resolved → customer notified.

---

## E. Tech & deployment

| Part | Stack | Deploy |
|---|---|---|
| `backend/` | Node 20+, Express, Mongoose, JWT, Zod validation, Helmet, rate-limit | **Render** Web Service (`render.yaml`), MongoDB Atlas |
| `frontend/` | React 18 + Vite + Tailwind CSS + React Router | **Vercel** (`vercel.json` SPA rewrite), `VITE_API_URL` env |

The two folders are fully independent (own `package.json`, own env); CORS controlled by `CORS_ORIGINS` on the backend.
