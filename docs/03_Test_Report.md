# KistiPay — Full Click-Test Report (2026-10-13)

Run on a fresh in-memory database with demo data, at 21:50–22:10 IST (9:30 PM slot open). Every tab, popup and button was exercised for all 4 roles, plus a 375px phone check and direct-API permission checks. **No code was changed during this run.**

## Result: ~110 checks, 0 blocking failures, 9 issues to fix

### What was tested and passed
| Area | Checks |
|---|---|
| Login | wrong password, short phone, each role logs in, old password rejected after admin reset |
| Admin – dashboard | all figures, links to SFs / KYC-pending / complaints |
| Admin – Super Franchisees | create, duplicate phone, search by area, issue balance (invalid + valid), payout > commission blocked, reset password, suspend / activate, ledger link |
| Admin – Agents | create (SF required), lands under the right SF, drawer shows payout but no issue/transfer |
| Admin – Customers | create with KYC, bad Aadhaar / PAN rejected, KYC filter, reject → edit (back to pending) → verify, View plans / Open plan links |
| Admin – Properties | create (shop flagged immovable), min value, edit, status filter, booked property hidden from new plans, cancelled plan frees property |
| Admin – Plan tiers | client table correct (₹1L…₹5Cr), add, dedupe amounts, delete, duplicate value blocked, inactive / active |
| Admin – Settings | commission > 50% blocked, lucky draw needs legal tick, slot window < 15 blocked, add / remove slot, strict slots saved |
| Admin – Plans | EMI preview (₹10L @10%, 36m = ₹32,268 ✓), down payment ≥ value blocked, correct tier picked, cancel plan with reason |
| Admin – Installments | reverse (reason required), balance / commission restored, status / receipt filters |
| Admin – Reports | grouping by day / agent / SF / mode with real data |
| Admin – Ledger, Audit, Draws, Complaints | type filter, action filter, create + run draw (winner chosen), reply + status change |
| SF | own agents only, transfer (over-balance blocked) from popup and wallet page, agent ledger, add agent (no SF picker), add customer (own agents only), convert commission with ₹0 blocked, complaint to admin, admin pages redirect away |
| Agent | pending-in-slot list, collect modal shows tier amounts, receipt + lucky coupon, plan leaves pending list, header balance updates, strict mode hides closed slots, own customers only, no verify / suspend, KYC-unverified customer can't get a plan, wallet convert, own commission column, change password (mismatch caught) |
| Customer | plan card + month vs EMI, plan detail hides agent-only data, payments without commission, rewards + coupon, complaint about agent, all staff pages redirect away |
| Phone (375px) | 10 admin pages + agent pages: no sideways scroll, hamburger drawer works, slot grid stacks |
| API permissions | 15 cross-role attempts (other SF's customer, other agent's plan, customer reading others, agent issuing balance, suspended token, malformed JSON …) all refused |

### Issues found (not fixed — waiting for approval)
| # | Severity | Where | Problem |
|---|---|---|---|
| 1 | **Medium** | Rewards / reversal | A coupon that already **won** a draw stays "won" after Admin reverses the payment that created it — the prize is kept even though the money was returned. |
| 2 | **Medium** | User popup (Verify KYC, Suspend/Activate) | Errors from these one-click buttons are **not shown** (e.g. "Add Aadhaar or PAN before verifying") — the button just does nothing. |
| 3 | Medium | Settings → Milestones | The box removes a comma as soon as you type it, so a new milestone can't be typed in. |
| 4 | Low | Commission display | When a reversal hits commission that was already converted / paid, it shows "₹-500" (should read "−₹500" and be explained as "to recover"). Dashboard "Balance with SFs/Agents" can then exceed "Balance issued". |
| 5 | Low | Customer → KYC | After KYC is rejected and then edited, the old rejection note stays visible. |
| 6 | Low | Bell icon | After "Mark all read" the red count stays until you change page. |
| 7 | Low | Routing | SF / Agent can open `/users/sf` or `/users/agent` and see an empty list instead of being redirected. |
| 8 | Low | Error text | Some messages show internal field names, e.g. "kyc.aadhaarLast4: …", "slotWindowMinutes: …". |
| 9 | Low | Reports | From-date after To-date shows ₹0 with no message. Plan tiers show "closed" for inactive (should say "inactive"). Slots before a plan was opened show "missed". "1 installments". |

### Gaps (not bugs — features not built yet)
- Cancelling a plan that has payments has no refund / settlement step.
- Down payment is only a number on the plan; it isn't recorded as received anywhere.

---

## Fix round (2026-10-13, same evening) — all 9 issues fixed and re-tested

| # | Fix | Verified |
|---|---|---|
| 1 | Reversing a payment now voids its coupon even if it already **won**; the draw shows the winner struck through with "Prize cancelled: Payment … reversed", and the customer gets a notification. | Browser + new API test |
| 2 | User popup shows errors for one-click buttons (e.g. "Add Aadhaar last 4 digits or PAN before verifying"). | Browser |
| 3 | Milestones box keeps what you type; parsed on save (sorted, de-duplicated); bad input shows "Milestones must be numbers from 1 to 100…". | Browser |
| 4 | Negative amounts show as "−₹400"; dashboard says "₹400 to recover" and "incl. ₹400 moved from commission"; agent wallet explains a negative commission. | Browser |
| 5 | Editing KYC clears the old rejection note. | Browser |
| 6 | Bell count clears immediately after "Mark all read". | Browser |
| 7 | SF / Agent opening a user list they may not see are redirected to their home page. | Browser |
| 8 | Validation messages use plain names ("Aadhaar last 4 digits", "Slot open time (minutes): …") instead of internal field paths. | Browser + API test |
| 9 | Reports reject From-after-To with a message; inactive tiers say "inactive"; slots that closed before a plan was opened show "before plan start" and can't be collected (API also refuses); "1 installment" / "0 installments". Voided coupons show "prize cancelled". | Browser + API test |

Also fixed while there: suspending a user now always logs them out everywhere (token version is incremented atomically).

Regression: backend 18/18 tests pass; 41 pages across all 4 roles load with no errors.

---

## Phase 2 (all remaining features) — built and tested 2026-10-13

**Automated:** backend 29/29 API tests (`flow.test.js` 18 + `phases.test.js` 11): outbox send / retry / back-off, reminders once per day, 269SS on cash down payment, cancellation charge + claw-back + refund, UTR reuse, bank CSV reconciliation (match / mismatch / not in bank / bank only / down payments), CSV export scope, APR maths, partner loan + KFS + remittance, KYC document type sniffing / size / scope.

**Browser (by hand-driven script):** settings cards + UPI ID validation; lending partner create; partner-loan plan with auto processing fee; down payment banner → UPI QR → recorded; UPI collect with QR, WhatsApp share link; printable receipt / statement / KFS (24-row schedule, APR 15.03% for ₹7.2 L @ 14% with ₹7,200 fee); KYC upload (fake image rejected, JPG/PNG accepted, view as blob), verify blocked until required docs; Messages page + run reminders; bank statement upload; remittance batch; cancel with 10% charge and claw-back → refund paid; CSV download; customer uploads own document; PWA production build (service worker active, manifest + icons valid, shell cached, API never cached); regression sweep 47 pages × 4 roles, no errors.

**Found and fixed during this phase**
| Issue | Fix |
|---|---|
| **Security:** a customer could open another customer's KYC file (customer scope `{_id}` overwrote the requested id) | All id + scope lookups now use `$and` |
| Queued SMS used the real clock, not the app clock | Outbox due time uses the app clock |
| Plan total (EMI × months) was a few rupees above the repayment schedule | Plan total = schedule total (last EMI absorbs the rounding) |
| Bank column detection could pick "Description" for "cr" | Priority order + exact match for short names |
| Down payments by UPI / cheque showed as "in bank, not recorded" | Reconciliation also matches down payment references |
| Stale error after uploading KYC docs; page title stuck after print pages | Cleared / restored |

**Business notes for the client**
- Uploading a new KYC document sends a verified customer back to "pending" (fresh check). Change in `routes/kyc.js` if they prefer otherwise.
- Cancelling a **partner-loan** plan computes the refund from what the customer paid; money already remitted to the lender must be settled with the lender (outside the app).
