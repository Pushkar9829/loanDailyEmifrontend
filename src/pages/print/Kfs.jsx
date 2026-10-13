import { useParams } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { date, inr } from '../../lib/format';
import { ErrorBox, Loading } from '../../components/ui';
import PrintShell, { Row } from './PrintShell';

export default function Kfs() {
  const { id } = useParams();
  const { data: k, error, loading } = useApi(`/plans/${id}/kfs`);
  return (
    <PrintShell title={k ? `KFS ${k.planNo}` : 'Key Fact Statement'} ready={!!k}>
      {loading && !k ? <Loading /> : <ErrorBox error={error} />}
      {k && (
        <div className="text-sm">
          <h1 className="border-b-2 border-slate-800 pb-2 text-xl font-bold">{k.title}</h1>
          <div className="mt-1 text-xs text-slate-500">
            Plan {k.planNo} · Agreement {k.agreementNo}
            {k.loanAccountNo ? ` · Loan a/c ${k.loanAccountNo}` : ''} · {date(k.date)}
          </div>

          <h2 className="mt-5 font-semibold">Part 1 – Parties</h2>
          <Row label="Borrower / buyer" value={`${k.borrower.name} (${k.borrower.code}) · ${k.borrower.phone}`} />
          {k.borrower.address && <Row label="Address" value={k.borrower.address} />}
          <Row label="Lender" value={`${k.lender.name}${k.lender.type ? ` (${String(k.lender.type).toUpperCase()})` : ''}`} />
          {k.lender.rbiRegNo && <Row label="RBI registration" value={k.lender.rbiRegNo} />}
          <Row label="Collection / recovery agent" value={`${k.collectionAgent.name} (${k.collectionAgent.code}) · ${k.collectionAgent.phone}`} />
          <Row label="Asset" value={`${k.asset.title} · ${inr(k.asset.value)}${k.asset.reraNo ? ` · RERA ${k.asset.reraNo}` : ''}`} />

          <h2 className="mt-5 font-semibold">Part 2 – Amounts</h2>
          <Row label="Asset value" value={inr(k.amounts.assetValue)} />
          <Row label="Down payment" value={inr(k.amounts.downPayment)} />
          <Row label="Loan / financed amount" value={inr(k.amounts.principal)} />
          <Row label="Processing fee" value={inr(k.amounts.processingFee)} />
          <Row label="Net amount disbursed" value={inr(k.amounts.netDisbursed)} />
          <Row label="Interest rate" value={`${k.amounts.interestRate}% p.a. (${k.amounts.interestType})`} />
          <Row label="Total interest" value={inr(k.amounts.totalInterest)} />
          <Row label="Total amount payable (incl. fees)" value={inr(k.amounts.totalPayable)} />
          <Row label="Annual Percentage Rate (APR)" value={<b>{k.amounts.apr}%</b>} />

          <h2 className="mt-5 font-semibold">Part 3 – Repayment</h2>
          <Row label="Tenure / number of EMIs" value={`${k.repayment.tenureMonths} months / ${k.repayment.installments}`} />
          <Row label="EMI" value={inr(k.repayment.emi)} />
          <Row label="How to pay" value={k.repayment.frequency} />
          <Row label="Late payment charges" value={k.charges.latePayment} />
          <Row label="Foreclosure / prepayment" value={k.charges.foreclosure} />
          <Row label="Cancellation" value={k.charges.cancellation} />
          <Row label="Cooling-off / look-up period" value={k.coolingOff} />

          <h2 className="mt-5 font-semibold">Part 4 – Grievance redressal</h2>
          <p className="mt-1">{k.grievance}</p>

          <h2 className="mt-5 font-semibold">Repayment schedule</h2>
          <table className="mt-2 w-full text-right text-xs">
            <thead>
              <tr className="border-b-2 border-slate-800">
                <th className="py-1 text-left">Month</th>
                <th>EMI</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {k.schedule.map((r) => (
                <tr key={r.no} className="border-b border-slate-100">
                  <td className="py-0.5 text-left">{r.no}</td>
                  <td>{inr(r.emi)}</td>
                  <td>{inr(r.principal)}</td>
                  <td>{inr(r.interest)}</td>
                  <td>{inr(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-10 grid grid-cols-2 gap-10 text-xs">
            <div className="border-t border-slate-400 pt-1">Borrower signature</div>
            <div className="border-t border-slate-400 pt-1">For {k.lender.name}</div>
          </div>
        </div>
      )}
    </PrintShell>
  );
}
