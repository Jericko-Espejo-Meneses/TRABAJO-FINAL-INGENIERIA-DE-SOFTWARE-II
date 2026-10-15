import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useServices } from './ServicesContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { auth, tokenStorage } = useServices();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!tokenStorage.get()) { setLoading(false); return undefined; }
    auth.getCurrentUser()
      .then((u) => active && setUser(u))
      .catch(() => tokenStorage.clear())
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [auth, tokenStorage]);

  useEffect(() => {
    const onUnauthorized = () => { tokenStorage.clear(); setUser(null); };
    window.addEventListener('he:unauthorized', onUnauthorized);
    return () => window.removeEventListener('he:unauthorized', onUnauthorized);
  }, [tokenStorage]);

  const value = useMemo(() => {
    const startSession = ({ token, user: u }) => { tokenStorage.set(token); setUser(u); return u; };
    return {
      user,
      loading,
      login: async (credentials) => startSession(await auth.login(credentials)),
      register: async (data) => startSession(await auth.register(data)),
      loginWithProvider: async (provider) => startSession(await auth.loginWithProvider(provider)),
      logout: () => { tokenStorage.clear(); setUser(null); },
    };
  }, [user, loading, auth, tokenStorage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
