'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { get, post, saveToken, clearToken, getToken } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: check if token exists, verify it
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    get('/api/auth/me')
      .then(data => { setUser(data.user); setLoading(false); })
      .catch(() => { clearToken(); setLoading(false); });
  }, []);

  const login = useCallback(async (values) => {
    const data = await post('/api/auth/login', values);
    saveToken(data.token);
    setUser(data.user);
    // Route based on role
    const home = data.user.role === 'admin' ? '/dashboard' : data.user.role === 'researcher' ? '/dashboard' : '/dashboard';
    router.push(home);
    return data.user;
  }, [router]);

  const signup = useCallback(async (values) => {
    const data = await post('/api/auth/signup', values);
    saveToken(data.token);
    setUser(data.user);
    router.push('/dashboard');
    return data.user;
  }, [router]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(() => ({ user, loading, login, signup, logout }), [user, loading, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
