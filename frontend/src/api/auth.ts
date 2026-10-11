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

export interface GitHubRepository { id: number; name: string; full_name: string; html_url: string; description?: string | null; private: boolean; owner?: { login?: string } }

export interface GitHubActivity { id: string; type: string; repo?: { name?: string }; actor?: { login?: string }; created_at?: string }

export interface WeatherCity { name: string; latitude: number; longitude: number; country?: string; admin1?: string }

export interface WeatherData { latitude: number; longitude: number; current: { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number } }


export interface RainProbability { date: string; probability: number | null }

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

  githubRepositories(query: string, signal?: AbortSignal) {
    return widgetRequest<{ items?: GitHubRepository[] }>('github', 'search_repositories', { query, number: '8' }, signal).then((response) => response.items ?? []);
  },

  weatherWidget(widget: 'current_weather' | 'rain_probability', configuration: Record<string, string>) {
    if (widget === 'rain_probability') return widgetRequest<RainProbability[]>('weather', widget, configuration);
    return widgetRequest<WeatherData>('weather', widget, configuration);
  },

  weatherCities(name: string, signal?: AbortSignal) {
    return widgetRequest<{ results?: WeatherCity[] }>('weather', 'search_cities', { name, count: '8' }, signal).then((response) => response.results ?? []);
  },

  me() {
    return request<AuthUser>('/auth/me');
  },
};

function widgetRequest<T>(service: string, widget: string, configuration: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const params = new URLSearchParams(configuration);
  return request<T>(`/widgets/${service}/${widget}?${params.toString()}`, { signal });
}
