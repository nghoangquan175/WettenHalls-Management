import { useState, useEffect, type ReactNode } from 'react';
import type { UserRole } from '../constants/navigation';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';
import { AuthContext } from './AuthContextObject';
import type { AuthUser } from './AuthContextTypes';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await authService.getMe();
        setUser({
          id: userData.id,
          name: userData.name,
          role: userData.role as UserRole,
          permissions: userData.permissions || [],
          isAuthenticated: true,
        });
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 401) {
            setUser(null);
          } else if (err.code === 'ACCOUNT_INACTIVE' || err.status === 403) {
            setAuthError(err.message);
            setUser(null);
          } else {
            setConnectionError(true);
          }
        } else {
          setConnectionError(true);
        }
      } finally {
        setIsInitializing(false);
      }
    };
    checkSession();
  }, []);

  const login = (userData: {
    id: string;
    name: string;
    role: UserRole;
    permissions?: string[];
  }) => {
    setUser({
      ...userData,
      permissions: userData.permissions || [],
      isAuthenticated: true,
    });
    setConnectionError(false);
    setAuthError(null);
  };

  const clearAuthError = () => setAuthError(null);

  const triggerAuthError = (message: string) => {
    setAuthError(message);
    setUser(null);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
      setAuthError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isInitializing,
        connectionError,
        authError,
        login,
        logout,
        clearAuthError,
        triggerAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
