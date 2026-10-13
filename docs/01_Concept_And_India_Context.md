# Daily Installment Property Plan — Concept & India Context

_Prepared 2026-10-13 from the client's 4 notes. Not legal advice; the legal points are flags to take to a CA/lawyer before launch._

---

## 1. What the idea is (in one paragraph)

In India, people buy plots, flats, two-wheelers and cars (₹1 lakh – ₹5 crore) on **EMI** — one lump-sum payment each month. Many buyers (daily-wage earners, shopkeepers, small traders) earn **daily**, not monthly, so finding the lump sum on EMI date is hard, and a missed EMI brings penalties, CIBIL damage and recovery calls.

The client's product breaks the monthly EMI into **small payments up to 5 times a day** (9:30am, 12:30pm, 3:30pm, 6:30pm, 9:30pm). By month-end the small payments add up to the EMI. Money does **not** go through a payment gateway; instead the customer pays a **local agent** they know, and the agent credits the customer in the app from a **prepaid balance** the agent bought from a **Super Franchisee (SF)**, who bought it from **Admin**. Every paid installment also gives the customer a **free lucky-draw coupon**.

In Indian terms it is a mix of four familiar things:

| Familiar Indian model | Which part of this idea it resembles |
|---|---|
| **Pigmy / daily deposit scheme** (co-op banks, agent collects daily at the doorstep) | Small daily collections by a trusted local agent |
| **Recharge / distributor wallet** (mobile recharge, DTH, Paytm-style retailer balance) | Admin → SF → Agent prepaid balance with margins at each level |
| **Business Correspondent (BC) model** | Agent as the cash-in point for people who don't use digital banking |
| **EMI / layaway on property & vehicles** | The thing the money is ultimately paying for |
| **Lucky-draw "bachat" schemes** (common in jewellery/electronics shops) | Coupon after every payment |

---

## 2. The installment table (from the client)

| Property Value | Allowed installment amounts | Slots per day |
|---|---|---|
| ₹1 lakh | ₹100, ₹500, ₹1K, ₹2K, ₹5K | 5 (9:30, 12:30, 3:30, 6:30, 9:30) |
| ₹2 lakh | ₹100, ₹500, ₹1K, ₹2K, ₹5K | 5 |
| ₹5 lakh | ₹100, ₹500, ₹1K, ₹2K, ₹5K | 5 |
| ₹10 lakh | ₹100 … ₹5K, ₹10K | 5 |
| ₹25 lakh | ₹100 … ₹10K, ₹25K | 5 |
| ₹50 lakh | ₹100 … ₹10K, ₹25K | 5 |
| ₹1 crore | ₹500 … ₹25K, ₹50K, ₹1 lakh | 5 |
| ₹3 crore | ₹1K … ₹50K, ₹1 lakh, ₹2 lakh | 5 |

**What these numbers mean per month (5 slots × 30 days = 150 payments max):**

| Installment | Max per day | Max per month |
|---|---|---|
| ₹100 | ₹500 | ₹15,000 |
| ₹500 | ₹2,500 | ₹75,000 |
| ₹1,000 | ₹5,000 | ₹1,50,000 |
| ₹5,000 | ₹25,000 | ₹7,50,000 |
| ₹25,000 | ₹1,25,000 | ₹37,50,000 |
| ₹2,00,000 | ₹10,00,000 | ₹3,00,00,000 |

Observations to confirm with the client:
- At the top amounts the property is paid off in days, not months (₹5K × 5 on a ₹1 lakh plot = done in 4 days). So the table is really a **menu of allowed denominations**, and the **actual EMI** (from tenure + interest) decides how much the customer must reach each month.
- The notes say properties go up to **₹5 crore** but the table stops at **₹3 crore**.
- The ₹3 crore row starts with a stray "₹" — probably a typo.
- Can a customer **mix** amounts across slots (₹100 in the morning, ₹2K at night)? Can they **skip** slots? Is there a **minimum per day/month**?

---

## 3. Commission flow (as written, and the open question)

Hierarchy: **Admin → Super Franchisee (SF) → Agent → Customer**

As written:
- Admin gives SF balance with **30% notional commission added**.
- SF passes **20%** to the Agent and **keeps 10%**.
- Agent earns **20%** on transactions with local customers.

**Reading A — "30% extra balance on top"** (like recharge distributors):

```
SF pays Admin ₹1,00,000        → SF wallet gets ₹1,30,000
SF sells ₹1,20,000 balance to Agent for ₹1,00,000  → SF keeps ₹10,000 worth (10%)
Agent collects ₹1,20,000 cash from customers, credits ₹1,20,000 of installments
                                → Agent earns ₹20,000 (20%)
Admin received ₹1,00,000 real money but customers got ₹1,20,000 credited
```

⚠️ Under this reading **₹20,000 of every ₹1,20,000 credited to customers was never paid to the property seller.** Someone (Admin / builder / lender) has to absorb that 16.7% gap, or the property side goes unpaid. This is the single biggest thing to clarify before building.

**Reading B — "commission is paid out of the customer's money"**:
Customer pays ₹100 → ₹70 goes to the property account, ₹20 to Agent, ₹10 to SF. Then the customer pays 30% more than the property value — that would have to be disclosed clearly and makes the product expensive versus a normal EMI.

**Reading C — "notional" means points, not money**: commissions are tracked as incentive points paid from Admin's own margin (e.g. builder pays a marketing fee). Workable, but the source of that money must be defined.

The software can support any of these (the % values become settings), but the business must pick one.

---

## 4. Legal / regulatory flags in India (important)

These do not mean the idea can't work — they mean the design must be shaped around them. Get a CA / fintech lawyer to confirm.

1. **Lucky-draw coupon on every payment — highest risk.**
   The **Prize Chits and Money Circulation Schemes (Banning) Act, 1978** bans schemes that collect money and distribute prizes by lot. Lotteries are also state-controlled (**Lotteries (Regulation) Act, 1998**), and the **Consumer Protection Act, 2019** treats prize schemes tied to purchases as possible unfair trade practice. A "free" draw that you only get by paying is usually not considered free. Many jewellery/chit-style "bachat" schemes have been shut down on exactly this ground.
   → Suggest: keep it out of v1, or replace with **non-chance rewards** (cashback points, milestone gifts at 25/50/75% paid) after legal review.

2. **Cash for property — Income Tax Act sections 269SS / 269ST.**
   269SS bars accepting **₹20,000 or more in cash** (aggregate, from one person) as an advance for **immovable property** (plots, flats). 269ST bars receiving **₹2 lakh or more in cash** from one person in a day / for one transaction. Agent-collected cash toward a land/flat plan will cross ₹20,000 quickly.
   → Suggest: for plots/flats, agents accept **UPI to the company account** (agent just helps the customer pay), not cash. Cash may be workable only for small vehicle plans, with limits enforced in software.

3. **"No payment gateway due to MDR" — the premise is mostly outdated.**
   In India **UPI and RuPay debit payments to merchants have zero MDR** (government-mandated since 2020). A UPI QR on the company's current account costs nothing. Card/net-banking/wallets do have MDR (~1–2%).
   → Suggest: UPI collection (static/dynamic QR or UPI AutoPay) with zero MDR, plus agents for customers who need hand-holding. This also gives an audit trail, which is what "Bhrosa" really needs.

4. **Who is giving the "EMI"?**
   EMI implies a **loan**. Lending needs an **RBI-registered NBFC/bank** or a tie-up with one (and RBI's Digital Lending Directions, 2025, KYC, Key Fact Statement etc.). If instead the customer **saves first and gets the property later**, it is closer to a deposit/advance scheme, which brings in the **Banning of Unregulated Deposit Schemes Act, 2019 (BUDS)** — advances against a **specific** property under a written agreement are generally excluded, open-ended "save toward something" schemes are risky.
   → The app should tie every plan to a **specific property + seller + written agreement** (and a lending partner if it's a real loan).

5. **RERA (flats/plots in registered projects).** A promoter can't take more than **10% of the price** before a registered agreement for sale.

6. **Prepaid balance (Admin → SF → Agent).** If the balance can only be used to pay this company's own plans it is a **closed-system** instrument (no RBI PPI licence needed). If it ever becomes transferable, cash-withdrawable or usable elsewhere, it becomes a semi-closed PPI and needs RBI authorisation. Keep it closed.

7. **Multi-level commissions.** Fine as long as commission is earned on **real collections**, never on recruiting other agents/SFs — recruitment-based payouts fall under the money-circulation ban and the **Consumer Protection (Direct Selling) Rules, 2021**.

8. **KYC / AML / GST.** Customer KYC (Aadhaar/PAN), agent & SF KYC + agreements, GST on commissions (agents/SFs above threshold), TDS on commission (section 194H).

---

## 5. Proposed software (once the open questions are answered)

**Apps**
- **Admin web panel** — properties/plans, SF onboarding & KYC, balance issuance, commission settings, reports, reconciliation, draws/rewards.
- **SF panel** (web/mobile) — buy balance, onboard agents, transfer balance to agents, commission ledger.
- **Agent mobile app** — onboard customers, record installment per slot (credits from agent balance), receipts via SMS/WhatsApp, daily collection report.
- **Customer mobile app** — plan status, progress to monthly EMI, payment history with receipts, reward/coupon wallet, complaint to Admin (direct, bypassing agent — this is where trust comes from).

**Core modules**
1. Users & roles (Admin, SF, Agent, Customer) + KYC
2. Property catalogue (type, value, seller, agreement)
3. Plans: property value → allowed denominations → tenure → monthly target
4. Slot engine: 5 daily windows, per-slot limits, mixed denominations, missed-slot handling
5. Double-entry **wallet ledger** (Admin issue → SF → Agent → customer installment); every rupee traceable, nothing editable, only reversals
6. Commission engine (configurable % per level, per reading A/B/C)
7. Receipts (instant SMS/WhatsApp to the customer for every credit — this stops agent fraud)
8. Rewards / coupons (behind a feature flag until legal sign-off)
9. Monthly reconciliation: cumulative vs. EMI target, shortfall alerts
10. Compliance guards: cash limits (269SS/269ST), KYC gating, audit log

---

## 6. Questions for the client before building

1. Which commission reading (A / B / C in §3) is correct, and who funds the 30%?
2. Is this a **loan** (who is the lender?) or **save-then-buy**? Does the customer get possession before full payment?
3. Is it tied to a specific property and seller with a written agreement?
4. What happens if the monthly total falls short of the EMI? Penalty, carry-forward, grace?
5. How does the customer pay the agent — cash, UPI to agent, UPI to company?
6. What is the lucky draw — prize, frequency, who funds it? (Legal review first.)
7. Max property value: ₹3 Cr or ₹5 Cr?
8. Can agents/SFs withdraw their commission as money, or only use it as balance?
9. Platforms: Android only, or Android + iOS + web? Hindi / regional language needed?
