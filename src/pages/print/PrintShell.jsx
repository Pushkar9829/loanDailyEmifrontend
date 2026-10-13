import { useEffect } from 'react';

// Plain white page for printing / saving as PDF from the browser.
export default function PrintShell({ title, children, ready }) {
  useEffect(() => {
    const before = document.title;
    document.title = title;
    return () => {
      document.title = before;
    };
  }, [title]);
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 print:hidden">
        <button onClick={() => window.history.length > 1 ? window.history.back() : window.close()} className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
          ← Back
        </button>
        <button disabled={!ready} onClick={() => window.print()} className="cursor-pointer rounded-lg bg-brand-700 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">
          Print / Save PDF
        </button>
      </div>
      <div className="mx-auto my-4 max-w-3xl bg-white p-6 shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none sm:p-10">{children}</div>
    </div>
  );
}

export const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-medium">{value ?? '—'}</span>
  </div>
);
