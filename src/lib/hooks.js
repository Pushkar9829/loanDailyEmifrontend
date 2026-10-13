import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

// Loads `path` (with `query`) and reloads whenever either changes.
export function useApi(path, query, { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const key = JSON.stringify([path, query]);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (skip || !path) return;
    const my = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const d = await api(path, { query });
      if (my === seq.current) setData(d);
    } catch (e) {
      if (my === seq.current) setError(e);
    } finally {
      if (my === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, skip]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

// Wraps an async action with busy/error state.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = useCallback(async (fn) => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, error, setError, run };
}
