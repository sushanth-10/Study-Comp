import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, User, ApiError } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string, remember?: boolean) => Promise<void>;
  register: (email: string, username: string, password: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (identifier: string, password: string, remember = false) => {
    const res = await api.login(identifier, password, remember);
    setUser(res.user);
  };

  const register = async (email: string, username: string, password: string, otp: string) => {
    const res = await api.register({ email, username, password, otp_code: otp });
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
