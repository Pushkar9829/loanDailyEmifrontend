# KistiPay — Daily Installment Property Plan

Customers pay their monthly EMI for a plot / flat / vehicle in **small amounts, up to 5 times a day**, through a trusted local **Agent**. Balance flows **Admin → Super Franchisee → Agent**, every collection earns notional commission (SF 10%, Agent 20%, configurable), and every rupee is in an immutable ledger.

| Folder | What | Stack | Deploy |
|---|---|---|---|
| `backend/` | REST API | Node 20+, Express 5, Mongoose 8, JWT, Zod | **Render** (Web Service) + MongoDB Atlas |
| `frontend/` | Web app for all 4 roles (mobile friendly) | React 18, Vite 6, Tailwind CSS 4, React Router 7 | **Vercel** |

Docs: [`01`](01_Concept_And_India_Context.md) idea + legal flags · [`02`](02_Features_And_Flows.md) feature & flow list · [`03`](03_Test_Report.md) test report · [`04`](04_Phase_Plan.md) phase 2 plan.

---

## Run locally

### Backend

```bash
cd backend
npm install
npm run dev:mem        # in-memory MongoDB (replica set) + demo data, port 5000
# or, against your own MongoDB replica set / Atlas:
cp .env.example .env   # fill MONGO_URI, JWT_SECRET
npm run seed -- --demo
npm run dev
npm test               # 29 end-to-end API tests on an in-memory DB
```

`dev:mem` accepts `--port=5062`. Data is lost when it stops.

### Frontend

```bash
cd frontend
npm install
echo VITE_API_URL=http://localhost:5000 > .env.local
npm run dev            # http://localhost:5173
```

### Demo logins (`dev:mem` or `seed -- --demo`)

| Role | Mobile | Password |
|---|---|---|
| Admin | 9000000000 | Admin@12345 (`SEED_ADMIN_*` in `.env` for `npm run seed`) |
| Super Franchisee | 9100000001 | Demo@12345 |
| Agents | 9200000001, 9200000002 | Demo@12345 |
| Customers | 9300000001 / 2 / 3 | Demo@12345 |

**Change these before any real use.** Never run `seed -- --demo` on production.

---

## Deploy

The two apps are independent — push them as two repos, or one repo and point each service at its folder.

### 1. MongoDB Atlas
Create a cluster (transactions need a replica set; every Atlas cluster is one), a database user, and allow Render's outbound IPs (or `0.0.0.0/0`). Copy the connection string, e.g. `mongodb+srv://user:pass@cluster.x.mongodb.net/kistipay`.

### 2. Backend on Render
- **New → Web Service** → connect the repo.
  - Root directory: `backend` (leave empty if the backend is its own repo — then `render.yaml` can be used as a Blueprint)
  - Build: `npm ci --omit=dev` · Start: `npm start` · Health check path: `/api/health`
- Environment:
  | Key | Value |
  |---|---|
  | `NODE_ENV` | `production` |
  | `MONGO_URI` | Atlas connection string |
  | `JWT_SECRET` | 32+ random characters |
  | `CORS_ORIGINS` | your Vercel URL(s), comma separated, e.g. `https://kistipay.vercel.app` |
- After the first deploy, open the Render **Shell** once:
  ```bash
  SEED_ADMIN_PHONE=9xxxxxxxxx SEED_ADMIN_PASSWORD='a-strong-password' npm run seed
  ```
  This creates settings, the client's plan tiers and the Admin login.

### 3. Frontend on Vercel
- **Add New → Project** → import the repo, Root directory `frontend`, framework **Vite** (detected; `vercel.json` handles SPA routes).
- Environment variable: `VITE_API_URL = https://<your-service>.onrender.com`
- Deploy, then add the Vercel URL to `CORS_ORIGINS` on Render.

---

## API overview (`/api`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/change-password` |
| Users | `POST /users`, `GET /users`, `GET/PATCH /users/:id`, `POST /users/:id/{status,kyc,reset-password}` |
| Config | `GET/PUT /config/settings`, `/config/tiers` CRUD, `/config/properties` CRUD, `POST /config/quote` |
| Plans | `POST /plans`, `GET /plans`, `GET /plans/:id` (with today's slots), `POST /plans/:id/cancel` |
| Installments | `POST /installments` (agent), `GET /installments`, `GET /installments/:id`, `POST /installments/:id/reverse` (admin) |
| Wallets | `POST /wallets/issue` (admin→SF), `POST /wallets/transfer` (SF→agent), `POST /wallets/commission/{payout,convert}`, `GET /wallets/me`, `GET /wallets/ledger` |
| Rewards | `GET /rewards/coupons`, `GET/POST /rewards/draws`, `POST /rewards/draws/:id/run` |
| Reports | `GET /reports/dashboard`, `GET /reports/shortfall`, `GET /reports/collections` |
| Support | `/complaints`, `/notifications`, `/audit` |
| Plan money | `POST /plans/:id/down-payment`, `POST /plans/:id/cancel` (settlement), `POST /plans/:id/refund`, `GET /plans/:id/statement`, `GET /plans/:id/kfs` |
| KYC documents | `GET/POST /users/:id/kyc-docs` (multipart `type` + `file`), `GET /kyc-docs/:id/file`, `DELETE /kyc-docs/:id` |
| Finance | `/finance/lenders`, `/finance/remittance` (+ `/pending`), `POST /finance/recon` (bank CSV), `/finance/recon/issues`, `GET /finance/export/installments.csv` |
| Admin ops | `GET /admin/messages`, `POST /admin/messages/:id/retry`, `GET /admin/jobs`, `POST /admin/jobs/tick`, `POST /admin/jobs/reminders` |

All amounts are rupees. All business dates/slots are IST.

## Phase 2 features (all built)

| Feature | Where |
|---|---|
| **SMS / WhatsApp** via outbox with retries; providers `log` / Twilio / MSG91 (env); per-type channel switches | Admin → Settings, Messages & Jobs |
| **Daily reminders** to customers behind target + agent summary (once a day after set time) | Settings → Daily reminders; scheduler in `services/jobs.js` |
| **Down payment** recorded with mode / reference / receipt; collections wait for it; cash limits apply | Plan page, New plan |
| **Cancellation settlement**: charge %, optional commission claw-back, refund pending → paid | Plan page (Admin) |
| **KYC documents** (masked Aadhaar, PAN, photo, address proof) in MongoDB GridFS; type sniffing; verify needs required docs | User popup, customer Profile & KYC |
| **UPI QR** to the company UPI ID with amount; UTR can be used once | Collect, down payment |
| **Bank reconciliation** from a bank-statement CSV (UTR + amount; down payments too) | Admin → Bank Reconciliation |
| **CSV export** of installments (role-scoped, formula-safe) | Installments → Export CSV |
| **Lending partners (NBFC)**, partner-loan plans, **Key Fact Statement** with APR and schedule, **lender remittance** batches | Admin → Lending Partners / Lender Remittance; plan page |
| **Printable** receipt, plan statement, KFS; WhatsApp share of receipts | Links on plan / receipt |
| **Installable app (PWA)** for agents & customers: manifest, icons, offline shell, update banner, install banner | Any phone browser → "Install app" |

### Play Store app
The PWA can be published to Google Play without new code as a Trusted Web Activity:
`npx @bubblewrap/cli init --manifest https://<your-vercel-domain>/manifest.webmanifest`, then `bubblewrap build`, and host the generated `assetlinks.json` at `/.well-known/assetlinks.json` (put it in `frontend/public/.well-known/`).

### Production checklist
- [ ] Atlas cluster, Render + Vercel env vars set (see `backend/.env.example`), `npm run seed` with a strong admin password; **never** `--demo` in production.
- [ ] Settings: company name, company UPI ID, slots, commission, cash limits, required KYC docs.
- [ ] SMS: register sender ID + templates on DLT, then set `SMS_PROVIDER` and keys on Render.
- [ ] Legal sign-off before switching on the lucky draw; LSP agreement with each lending partner.
- [ ] One API instance runs the scheduler (`DISABLE_SCHEDULER=1` on extra instances).
- [ ] Regenerate icons with your brand: `node frontend/scripts/make-icons.mjs` (edit colours/shape first).

## Tests
- `backend`: `npm test` – 29 end-to-end API tests on an in-memory MongoDB replica set (`test/flow.test.js`, `test/phases.test.js`).
- Full click-through of every page for all four roles: see `03_Test_Report.md`.
