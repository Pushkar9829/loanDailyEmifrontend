# KistiPay — Remaining Phases (build plan) — ✅ all built 2026-10-13

Everything that was "not built yet" after the first version, split into phases. Each phase ships with API tests and a browser check.

| Phase | What | Key pieces |
|---|---|---|
| **A. Messaging & reminders** | Real SMS / WhatsApp delivery and automatic reminders | Notification outbox (retries, delivery log), providers: `log` (default), **Twilio** (SMS + WhatsApp), **MSG91** (SMS, DLT template); per-type channel settings; scheduler: outbox every 30 s, daily evening reminder to customers behind target + agent summary; admin "Messages" page (status, retry) |
| **B. Down payment & cancellation settlement** | Money outside the daily plan is recorded properly | Down payment status `pending → received` (mode, reference, receipt); collections blocked until received; cash rules (269SS) apply; cancel plan → settlement with cancellation charge %, refund amount, optional commission claw-back, refund `pending → paid` with reference |
| **C. KYC documents** | Upload & review | Aadhaar (masked), PAN, photo, address proof; stored in MongoDB GridFS (works on Render, no disk needed); 3 MB, JPG/PNG/PDF; view only by Admin / own SF / own agent / the customer; KYC verify requires required docs (setting) |
| **D. UPI collection & bank reconciliation** | Less cash, verifiable UPI | UPI deep-link + QR to the company UPI ID with plan / amount prefilled; UTR uniqueness; admin uploads bank statement CSV → auto-match by UTR + amount → matched / amount mismatch / not in bank / bank-only lines; CSV exports of installments & collections |
| **E. Lending partners (NBFC)** | When a plan is a real loan | Lending partner register (RBI reg. no.); plan finance type `self` or `partner loan` with loan account no.; Key Fact Statement (KFS) page; lender remittance report & "mark remitted" batches |
| **F. Agent app (PWA) & printables** | Install on Android, print / share receipts | Web app manifest + service worker (installable, offline shell, update prompt); printable receipt, plan statement and KFS pages; WhatsApp share of receipt |
| **G. Hardening & docs** | Ready to deploy | Updated tests, full click-test, README / deploy notes, production checklist |

Native Android (Play Store) app: the PWA can be wrapped as a Trusted Web Activity (Bubblewrap) without new code; a fully native app is a separate project.
