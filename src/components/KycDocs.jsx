import { useRef, useState } from 'react';
import { useApi } from '../lib/hooks';
import { del, getBlob, upload } from '../lib/api';
import { date, KYC_DOCS } from '../lib/format';
import { Button, ErrorBox, Loading, Select, useToast } from './ui';

// List / upload / view KYC documents of one customer.
export default function KycDocs({ userId, canDelete = true, onChanged, required = [] }) {
  const toast = useToast();
  const { data, error, loading, reload } = useApi(`/users/${userId}/kyc-docs`);
  const [type, setType] = useState('aadhaar');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);

  const send = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return setErr(new Error('Choose a file first'));
    if (file.size > 3 * 1024 * 1024) return setErr(new Error('File is larger than 3 MB'));
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    setBusy(true);
    setErr(null);
    try {
      await upload(`/users/${userId}/kyc-docs`, form);
      toast(`${KYC_DOCS[type]} uploaded`);
      fileRef.current.value = '';
      reload();
      onChanged?.();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  const view = async (d) => {
    // Open the tab synchronously (popup blockers), then load the file into it.
    const w = window.open('', '_blank');
    try {
      const blob = await getBlob(`/kyc-docs/${d._id}/file`);
      const url = URL.createObjectURL(blob);
      if (w) w.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      w?.close();
      setErr(e);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Remove ${KYC_DOCS[d.type]}?`)) return;
    try {
      await del(`/kyc-docs/${d._id}`);
      toast('Document removed');
      reload();
      onChanged?.();
    } catch (e) {
      setErr(e);
    }
  };

  const items = data?.items || [];
  const missing = required.filter((t) => !items.some((d) => d.type === t));

  return (
    <div className="space-y-2">
      {loading && !data ? <Loading /> : <ErrorBox error={error} />}
      {items.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {items.map((d) => (
            <li key={d._id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span>
                <b>{KYC_DOCS[d.type]}</b>
                <span className="block text-xs text-slate-500">
                  {d.fileName} · {Math.round(d.size / 1024)} KB · {date(d.createdAt)}
                </span>
              </span>
              <span className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => view(d)}>
                  View
                </Button>
                {canDelete && (
                  <Button size="sm" variant="ghost" onClick={() => remove(d)}>
                    Remove
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {missing.length > 0 && <div className="text-xs text-amber-700">Still needed for verification: {missing.map((t) => KYC_DOCS[t]).join(', ')}</div>}
      <div className="flex flex-wrap items-center gap-2">
        <Select className="w-44" value={type} onChange={(e) => setType(e.target.value)} options={Object.entries(KYC_DOCS).map(([value, label]) => ({ value, label }))} />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" capture="environment" className="max-w-[220px] text-sm" aria-label="KYC file" />
        <Button size="sm" busy={busy} onClick={send}>
          Upload
        </Button>
      </div>
      <p className="text-[11px] text-slate-500">JPG, PNG or PDF up to 3 MB. Upload only a masked Aadhaar (first 8 digits hidden), as UIDAI requires.</p>
      <ErrorBox error={err} />
    </div>
  );
}
