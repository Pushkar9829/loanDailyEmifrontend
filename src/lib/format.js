export const inr = (n) => {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  return `${v < 0 ? '−' : ''}₹${Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

// ₹1,00,000 -> ₹1 L, ₹1,00,00,000 -> ₹1 Cr
export const inrShort = (n) => {
  const v = Number(n);
  if (v >= 1e7) return `₹${+(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${+(v / 1e5).toFixed(2)} L`;
  if (v >= 1e3) return `₹${+(v / 1e3).toFixed(1)}K`;
  return inr(v);
};

export const dateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
export const date = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export const monthLabel = (key) => {
  if (!key) return '';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

export const ROLE_LABEL = { admin: 'Admin', sf: 'Super Franchisee', agent: 'Agent', customer: 'Customer' };
export const PROPERTY_TYPES = {
  plot: 'Land plot',
  flat: 'Flat',
  house: 'House',
  shop: 'Shop',
  two_wheeler: 'Two-wheeler',
  four_wheeler: 'Four-wheeler',
  other: 'Other',
};
export const LEDGER_LABEL = {
  ADMIN_ISSUE: 'Issued by Admin',
  TRANSFER: 'Transfer',
  INSTALLMENT: 'Installment',
  REVERSAL: 'Reversal',
  COMMISSION: 'Commission',
  COMMISSION_REVERSAL: 'Commission reversed',
  COMMISSION_PAYOUT: 'Commission paid out',
  COMMISSION_TO_BALANCE: 'Commission → balance',
};

export const PAY_MODES = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank transfer (NEFT/IMPS/RTGS)', cheque: 'Cheque' };
export const KYC_DOCS = { aadhaar: 'Aadhaar (masked)', pan: 'PAN card', photo: 'Photo', address_proof: 'Address proof', other: 'Other' };
export const NOTIFY_TYPES = {
  receipt: 'Payment receipts',
  reversal: 'Reversals',
  plan: 'Plan opened / cancelled',
  down_payment: 'Down payment received',
  refund: 'Refunds',
  reminder: 'Daily reminders (behind target)',
  agent_summary: 'Agent daily summary',
  draw: 'Lucky draw results',
  kyc: 'KYC status',
  balance: 'Balance received (SF / agent)',
  commission: 'Commission paid',
  complaint: 'Complaint replies',
  milestone: 'Milestones',
};

// upi://pay link understood by every Indian UPI app (NPCI deep-link spec)
export const upiLink = ({ pa, pn, am, tn }) =>
  `upi://pay?${new URLSearchParams({ pa, pn, ...(am ? { am: Number(am).toFixed(2) } : {}), cu: 'INR', ...(tn ? { tn: tn.slice(0, 50) } : {}) })}`;

// Today's date in IST as YYYY-MM-DD
export const istToday = (offsetDays = 0) => {
  const d = new Date(Date.now() + 330 * 60000 + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
};
