import type { UserRole } from '../constants/navigation';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  permissions: string[];
  isAuthenticated: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  isInitializing: boolean;
  connectionError: boolean;
  authError: string | null;
  login: (userData: {
    id: string;
    name: string;
    role: UserRole;
    permissions?: string[];
  }) => void;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  triggerAuthError: (message: string) => void;
}
