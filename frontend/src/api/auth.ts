import { request } from './http';

export interface SignupResponse {
  id: number;
  email: string;
  message: string;
}

export interface AuthUser {
  userId: number;
}

export const authApi = {
  signup(email: string, password: string) {
    return request<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  confirm(token: string) {
    return request<{ message: string }>(`/auth/confirm?token=${encodeURIComponent(token)}`);
  },

  login(email: string, password: string) {
    return request<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout() {
    return request<{ message: string }>('/auth/logout', { method: 'POST' });
  },

  me() {
    return request<AuthUser>('/auth/me');
  },
};
