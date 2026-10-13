# loanDailyEmifrontend

KistiPay web app (installable PWA) for **Admin, Super Franchisee, Agent and Customer** — pay your EMI in small amounts, up to 5 times a day.

API: [loanDailyEmiBAckend](https://github.com/Pushkar9829/loanDailyEmiBAckend)

**Stack:** React 18, Vite 6, Tailwind CSS 4, React Router 7, `qrcode` for UPI QR.

## Run locally

```bash
npm install
echo VITE_API_URL=http://localhost:5000 > .env.local
npm run dev            # http://localhost:5173
npm run build          # production build in dist/ (service worker stamped per build)
```

## Deploy on Vercel
- Import this repo, framework **Vite** (`vercel.json` handles SPA routes, service-worker and cache headers).
- Env: `VITE_API_URL=https://<your-render-service>.onrender.com`
- Add the Vercel URL to `CORS_ORIGINS` on the Render API.

## What's inside
- Role dashboards, users & KYC documents, properties, plan tiers, plans (down payment, cancellation & refund, partner loans), collect screen with UPI QR and WhatsApp receipt share, installments with CSV export, wallets & ledger, reports, bank reconciliation, lending partners & remittance, messages & jobs, lucky draws, complaints, notifications, settings, audit log.
- Printable receipt, plan statement and Key Fact Statement (`/receipts/:id`, `/plans/:id/statement`, `/plans/:id/kfs`).
- **PWA:** manifest, icons (`node scripts/make-icons.mjs` to regenerate), offline app shell, update and install banners. Publish to Google Play as a Trusted Web Activity with Bubblewrap (`npx @bubblewrap/cli init --manifest https://<domain>/manifest.webmanifest`).

## Project docs
`docs/` contains the concept & India legal notes, feature & flow list, test report and phase plan.
