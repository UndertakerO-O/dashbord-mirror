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

export interface GitHubPullRequest { number: number; title: string; html_url: string; user?: { login?: string } }

export interface GitHubActivity { id: string; type: string; repo?: { name?: string }; actor?: { login?: string }; created_at?: string }

export interface WeatherCity { name: string; latitude: number; longitude: number; country?: string; admin1?: string }

export interface WeatherData { latitude: number; longitude: number; current: { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number } }

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

  githubWidget<T = GitHubCommit[]>(widget: string, configuration: Record<string, string>) {
    return widgetRequest<T>('github', widget, configuration);
  },

  weatherWidget(configuration: Record<string, string>) {
    return widgetRequest<WeatherData>('weather', 'current_weather', configuration);
  },

  weatherCities(name: string) {
    return widgetRequest<{ results?: WeatherCity[] }>('weather', 'search_cities', { name, count: '8' }).then((response) => response.results ?? []);
  },

  me() {
    return request<AuthUser>('/auth/me');
  },
};

function widgetRequest<T>(service: string, widget: string, configuration: Record<string, string>): Promise<T> {
  const params = new URLSearchParams(configuration);
  return request<T>(`/widgets/${service}/${widget}?${params.toString()}`);
}
