import { apiRequest } from './api';

export interface LoginResponse {
  message: string;
  user: { id: string; name: string; role: string; email: string };
}

export const authService = {
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  logout: () =>
    apiRequest('/auth/logout', { method: 'POST' }),

  getMe: () =>
    apiRequest<{ id: string; name: string; role: string; email: string }>('/auth/me'),
};
