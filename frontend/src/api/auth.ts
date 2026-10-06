import { API_URL, request } from './http';

export interface SignupResponse {
  id: number;
  email: string;
  message: string;
}

export interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: { message: string; author?: { name?: string } };
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

  startGithubLogin() {
    window.location.assign(`${API_URL}/auth/github/login`);
  },

  startGithubConnection() {
    window.location.assign(`${API_URL}/auth/github`);
  },

  githubStatus() {
    return request<{ connected: boolean }>('/auth/github/status');
  },

  disconnectGithub() {
    return request<{ message: string }>('/auth/github', { method: 'DELETE' });
  },

  githubWidget(widget: string, configuration: Record<string, string>) {
    const params = new URLSearchParams(configuration);
    return request<GitHubCommit[]>(`/widgets/github/${widget}?${params.toString()}`);
  },

  me() {
    return request<AuthUser>('/auth/me');
  },
};
