import { apiRequest } from './api';

export interface DashboardStats {
  superAdminCount?: number;
  adminCount?: number;
  articleCount: number;
  publishedArticleCount: number;
  activeSessions: number;
}

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'GUEST';
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'GUEST' | 'SUPER_ADMIN';
  permissions: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: string;
}

export interface InfiniteUserData {
  users: UserData[];
  hasNextPage: boolean;
  nextPage: number | null;
}

export const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    return apiRequest<DashboardStats>('/users/stats');
  },

  createUser: async (userData: CreateUserData): Promise<UserData> => {
    return apiRequest<UserData>('/users', {
      method: 'POST',
      body: userData,
    });
  },

  getUsers: async (
    search?: string,
    status?: string,
    sort?: 'asc' | 'desc',
    page: number = 1,
    limit: number = 10
  ): Promise<InfiniteUserData> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (sort) params.append('sort', sort);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const url = `/users?${params.toString()}`;
    return apiRequest<InfiniteUserData>(url);
  },

  updateUserStatus: async (
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  ): Promise<UserData> => {
    return apiRequest<UserData>(`/users/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  deleteUser: async (id: string): Promise<void> => {
    return apiRequest<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  updateUserPermissions: async (
    id: string,
    permissions: string[]
  ): Promise<UserData> => {
    return apiRequest<UserData>(`/users/${id}/permissions`, {
      method: 'PATCH',
      body: { permissions },
    });
  },
};
