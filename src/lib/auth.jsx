import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState({ balance: 0, commission: 0 });
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    try {
      const d = await api('/auth/me');
      setUser(d.user);
      setWallets(d.wallets);
    } catch {
      logout();
    } finally {
      setReady(true);
    }
  }, [logout]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    refresh();
  }, [refresh, logout]);

  const login = async (phone, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { phone, password } });
    setToken(d.token);
    setUser(d.user);
    await refresh();
    return d.user;
  };

  return <AuthCtx.Provider value={{ user, wallets, ready, login, logout, refresh }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
