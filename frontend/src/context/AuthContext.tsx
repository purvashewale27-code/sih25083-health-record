import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import { apiLogin, apiGetCurrentUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('kmh_auth_token') : null;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    const res = await apiGetCurrentUser();
    if (res.success && res.data) {
      setUser(res.data);
    } else {
      // Invalid token
      localStorage.removeItem('kmh_auth_token');
      setToken(null);
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    if (res.success && res.data) {
      localStorage.setItem('kmh_auth_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setShowLoginModal(false);
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid email or password' };
  };

  const logout = () => {
    localStorage.removeItem('kmh_auth_token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        showLoginModal,
        setShowLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
