<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  authApi,
  type GitHubActivity,
  type GitHubCommit,
  type GitHubPullRequest,
  type GitHubRepository,
  type WeatherCity,
  type WeatherData,
  type RainProbability,
} from '../api/auth';

type ServiceName = 'github' | 'weather';
type WidgetKind =
  | 'recent_commits'
  | 'open_pull_requests'
  | 'contribution_activity'
  | 'current_weather'
  | 'rain_probability';
type WidgetData = GitHubCommit[] | GitHubPullRequest[] | GitHubActivity[] | WeatherData[] | RainProbability[];

type DashboardWidget = {
  id: string;
  service: ServiceName;
  kind: WidgetKind;
  refreshRate: number;
  lastRefreshAt: number;
  repository: string;
  repositoryQuery: string;
  repositoryResults: GitHubRepository[];
  username: string;
  city: string;
  cityQuery: string;
  cityResults: WeatherCity[];
  latitude: string;
  longitude: string;
  unit: 'metric' | 'imperial';
  number: number;
  data: WidgetData;
  loading: boolean;
  error: string;
};

const REFRESH_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 30, label: 'Every 30 seconds' },
  { value: 60, label: 'Every minute' },
  { value: 300, label: 'Every 5 minutes' },
  { value: 3600, label: 'Every hour' },
  { value: 86400, label: 'Every 24 hours' },
];

const route = useRoute();
const router = useRouter();
const widgets = ref<DashboardWidget[]>([]);
const loading = ref(true);
const githubConnected = ref(false);
const githubLoading = ref(false);
const githubMessage = ref('');
const editMode = ref(false);
const addPanelOpen = ref(false);
const addError = ref('');
const selectedService = ref<ServiceName>('weather');
const selectedKind = ref<WidgetKind>('current_weather');
const draftWidget = ref<DashboardWidget>(createWidget('current_weather'));
let refreshTimer: ReturnType<typeof setInterval> | undefined;
const citySearchTimers = new WeakMap<DashboardWidget, ReturnType<typeof setTimeout>>();
const citySearchVersions = new WeakMap<DashboardWidget, number>();
const citySearchControllers = new WeakMap<DashboardWidget, AbortController>();
const citySearchCache = new Map<string, WeatherCity[]>();
const repositorySearchTimers = new WeakMap<DashboardWidget, ReturnType<typeof setTimeout>>();
const repositorySearchControllers = new WeakMap<DashboardWidget, AbortController>();
const repositorySearchVersions = new WeakMap<DashboardWidget, number>();
const repositorySearchCache = new Map<string, GitHubRepository[]>();

const visibleWidgets = computed(() =>
  widgets.value.filter((widget) => widget.service === 'weather' || githubConnected.value),
);

function formatWeatherDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`));
}

function widgetTitle(kind: WidgetKind): string {
  const titles: Record<WidgetKind, string> = {
    recent_commits: 'Recent commits',
    open_pull_requests: 'Open pull requests',
    contribution_activity: 'Contribution activity',
    current_weather: 'Current weather',
    rain_probability: 'Rain probability',
  };
  return titles[kind];
}

function resultKey(item: WidgetData[number]): string | number {
  if ('sha' in item) return item.sha;
  if ('number' in item) return item.number;
  if ('id' in item) return item.id;
  if ('date' in item) return item.date;
  if ('latitude' in item) return item.latitude;
  return 'result';
}

function createWidget(kind: WidgetKind): DashboardWidget {
  const service: ServiceName = ['current_weather', 'rain_probability'].includes(kind) ? 'weather' : 'github';

  return {
    id: `${service}-${Date.now()}-${Math.random()}`,
    service,
    kind,
    refreshRate: 60,
    lastRefreshAt: 0,
    repository: '',
    repositoryQuery: '',
    repositoryResults: [],
    username: '',
    city: 'Paris',
    cityQuery: '',
    cityResults: [],
    latitude: '48.8566',
    longitude: '2.3522',
    unit: 'metric',
    number: 5,
    data: [],
    loading: false,
    error: '',
  };
}

function saveWidgets(): void {
  const savedWidgets = widgets.value.map(({ loading, error, cityResults, repositoryResults, ...widget }) => widget);
  localStorage.setItem('dashboard_widgets', JSON.stringify(savedWidgets));
}

function restoreWidgets(): void {
  const saved = localStorage.getItem('dashboard_widgets');
  if (!saved) return;

  try {
    const stored = JSON.parse(saved) as Array<Partial<DashboardWidget>>;
    widgets.value = stored.filter((widget) => (widget.kind as string) !== 'daily_forecast').map((widget, index) => ({
      ...createWidget(widget.kind ?? 'recent_commits'),
      ...widget,
      id: widget.id ?? `widget-${index}`,
      service: widget.service ?? 'github',
      kind: widget.kind ?? 'recent_commits',
      refreshRate: typeof widget.refreshRate === 'number' ? widget.refreshRate : 60,
      lastRefreshAt: Date.now(),
      cityResults: [],
      repositoryResults: [],
      repositoryQuery: widget.repository ?? '',
      loading: false,
      error: '',
    })) as DashboardWidget[];
  } catch {
    localStorage.removeItem('dashboard_widgets');
  }
}

function configureRefresh(): void {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(refreshWidgets, 1000);
}

async function refreshWidgets(): Promise<void> {
  const now = Date.now();
  const widgetsToRefresh = visibleWidgets.value.filter(
    (widget) => widget.refreshRate > 0 && now - widget.lastRefreshAt >= widget.refreshRate * 1000,
  );

  await Promise.all(widgetsToRefresh.map((widget) => loadWidget(widget)));
}

function openAddWidget(): void {
  editMode.value = true;
  addPanelOpen.value = true;
  addError.value = '';
  selectedService.value = githubConnected.value ? 'github' : 'weather';
  selectedKind.value = selectedService.value === 'github' ? 'recent_commits' : 'current_weather';
  draftWidget.value = createWidget(selectedKind.value);
}

function closeAddWidget(): void {
  addPanelOpen.value = false;
  addError.value = '';
}

function changeSelectedService(): void {
  selectedKind.value = selectedService.value === 'github' ? 'recent_commits' : 'current_weather';
  draftWidget.value = createWidget(selectedKind.value);
}

function changeSelectedKind(): void {
  draftWidget.value = createWidget(selectedKind.value);
}

async function confirmAddWidget(): Promise<void> {
  addError.value = '';

  if (selectedKind.value === 'contribution_activity' && !draftWidget.value.username.trim()) {
    addError.value = 'Enter a GitHub username.';
    return;
  }

  if (selectedService.value === 'github' && selectedKind.value !== 'contribution_activity') {
    const typedRepository = draftWidget.value.repositoryQuery.trim();
    if (!draftWidget.value.repository && /^[^/]+\/[^/]+$/.test(typedRepository)) {
      draftWidget.value.repository = typedRepository;
    }
    if (draftWidget.value.repository.trim().split('/').length !== 2) {
      addError.value = 'Use the organisation/repository format.';
      return;
    }
  }

  const widget = { ...draftWidget.value, data: [] } as DashboardWidget;
  widgets.value.push(widget);
  closeAddWidget();
  saveWidgets();
  await loadWidget(widget);
}

async function loadWidget(widget: DashboardWidget): Promise<void> {
  widget.loading = true;
  widget.error = '';

  try {
    const number = String(Math.min(Math.max(widget.number, 1), 20));

    if (widget.service === 'weather') {
      const weatherKind = widget.kind as 'current_weather' | 'rain_probability';
      const weather = await authApi.weatherWidget(weatherKind, {
        latitude: widget.latitude,
        longitude: widget.longitude,
        unit: widget.unit,
      });
      widget.data = (Array.isArray(weather) ? weather : [weather]) as WidgetData;
    } else if (widget.kind === 'contribution_activity') {
      widget.data = await authApi.githubWidget<GitHubActivity[]>('contribution_activity', {
        username: widget.username.trim(),
        number,
      });
    } else {
      widget.data = await authApi.githubWidget<GitHubCommit[] | GitHubPullRequest[]>(widget.kind, {
        repository: widget.repository.trim(),
        number,
      });
    }

    widget.lastRefreshAt = Date.now();
    saveWidgets();
  } catch (cause) {
    widget.error = cause instanceof Error ? cause.message : 'Unable to load widget data.';
  } finally {
    widget.loading = false;
  }
}

function queueCitySearch(widget: DashboardWidget): void {
  const previousTimer = citySearchTimers.get(widget);
  if (previousTimer) clearTimeout(previousTimer);
  citySearchControllers.get(widget)?.abort();

  citySearchVersions.set(widget, (citySearchVersions.get(widget) ?? 0) + 1);
  widget.cityResults = [];
  widget.error = '';
  addError.value = '';

  if (widget.cityQuery.trim().length < 2) return;

  const timer = setTimeout(() => {
    void searchCities(widget);
  }, 350);
  citySearchTimers.set(widget, timer);
}

async function searchCities(widget: DashboardWidget): Promise<void> {
  const requestVersion = (citySearchVersions.get(widget) ?? 0) + 1;
  citySearchVersions.set(widget, requestVersion);
  addError.value = '';
  widget.error = '';

  if (widget.cityQuery.trim().length < 2) {
    widget.cityResults = [];
    addError.value = 'Enter at least two characters to search for a city.';
    return;
  }

  const query = widget.cityQuery.trim();
  const cachedResults = citySearchCache.get(query.toLowerCase());
  if (cachedResults) {
    widget.cityResults = cachedResults;
    return;
  }

  const controller = new AbortController();
  citySearchControllers.set(widget, controller);

  try {
    const results = await authApi.weatherCities(query, controller.signal);
    if (citySearchVersions.get(widget) !== requestVersion) return;
    citySearchCache.set(query.toLowerCase(), results);
    widget.cityResults = results;
    if (!results.length && widget === draftWidget.value) addError.value = 'No city found.';
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return;
    if (citySearchVersions.get(widget) !== requestVersion) return;
    const message = cause instanceof Error ? cause.message : 'Unable to search cities.';
    widget.error = message;
    if (widget === draftWidget.value) addError.value = message;
  } finally {
    if (citySearchControllers.get(widget) === controller) citySearchControllers.delete(widget);
  }
}

function selectCity(widget: DashboardWidget, city: WeatherCity): void {
  const previousTimer = citySearchTimers.get(widget);
  if (previousTimer) clearTimeout(previousTimer);
  citySearchControllers.get(widget)?.abort();
  citySearchVersions.set(widget, (citySearchVersions.get(widget) ?? 0) + 1);
  widget.city = city.name;
  widget.cityQuery = city.name;
  widget.latitude = String(city.latitude);
  widget.longitude = String(city.longitude);
  widget.cityResults = [];
}

function queueRepositorySearch(widget: DashboardWidget): void {
  const previousTimer = repositorySearchTimers.get(widget);
  if (previousTimer) clearTimeout(previousTimer);
  repositorySearchControllers.get(widget)?.abort();

  repositorySearchVersions.set(widget, (repositorySearchVersions.get(widget) ?? 0) + 1);
  widget.repositoryResults = [];
  widget.error = '';
  addError.value = '';

  if (widget.repositoryQuery.trim().length < 2) return;

  const timer = setTimeout(() => {
    void searchRepositories(widget);
  }, 350);
  repositorySearchTimers.set(widget, timer);
}

async function searchRepositories(widget: DashboardWidget): Promise<void> {
  const requestVersion = (repositorySearchVersions.get(widget) ?? 0) + 1;
  repositorySearchVersions.set(widget, requestVersion);
  const query = widget.repositoryQuery.trim();
  if (query.length < 2) return;

  const cachedResults = repositorySearchCache.get(query.toLowerCase());
  if (cachedResults) {
    widget.repositoryResults = cachedResults;
    return;
  }

  const controller = new AbortController();
  repositorySearchControllers.set(widget, controller);

  try {
    const results = await authApi.githubRepositories(query, controller.signal);
    if (repositorySearchVersions.get(widget) !== requestVersion) return;
    repositorySearchCache.set(query.toLowerCase(), results);
    widget.repositoryResults = results;
    if (!results.length && widget === draftWidget.value) addError.value = 'No repository found.';
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return;
    if (repositorySearchVersions.get(widget) !== requestVersion) return;
    const message = cause instanceof Error ? cause.message : 'Unable to search repositories.';
    widget.error = message;
    if (widget === draftWidget.value) addError.value = message;
  } finally {
    if (repositorySearchControllers.get(widget) === controller) repositorySearchControllers.delete(widget);
  }
}

function selectRepository(widget: DashboardWidget, repository: GitHubRepository): void {
  const previousTimer = repositorySearchTimers.get(widget);
  if (previousTimer) clearTimeout(previousTimer);
  repositorySearchControllers.get(widget)?.abort();
  repositorySearchVersions.set(widget, (repositorySearchVersions.get(widget) ?? 0) + 1);
  widget.repository = repository.full_name;
  widget.repositoryQuery = repository.full_name;
  widget.repositoryResults = [];
  addError.value = '';
}

function removeWidget(index: number): void {
  widgets.value.splice(index, 1);
  saveWidgets();
}

function moveWidget(index: number, direction: -1 | 1): void {
  const target = index + direction;
  if (target < 0 || target >= widgets.value.length) return;

  [widgets.value[index], widgets.value[target]] = [widgets.value[target], widgets.value[index]];
  saveWidgets();
}

function toggleEditMode(): void {
  editMode.value = !editMode.value;
}

function connectGithub(): void {
  authApi.startGithubConnection();
}

async function disconnectGithub(): Promise<void> {
  githubLoading.value = true;
  try {
    await authApi.disconnectGithub();
    githubConnected.value = false;
    githubMessage.value = 'GitHub disconnected.';
  } finally {
    githubLoading.value = false;
  }
}

async function logout(): Promise<void> {
  await authApi.logout();
  await router.push('/login');
}

authApi.me().finally(async () => {
  try {
    githubConnected.value = (await authApi.githubStatus()).connected;
  } finally {
    loading.value = false;
  }
});

onMounted(() => {
  restoreWidgets();
  configureRefresh();

  if (route.query.github === 'connected') githubMessage.value = 'GitHub connected successfully.';
  if (route.query.github === 'cancelled') githubMessage.value = 'GitHub connection was cancelled.';
  if (route.query.github === 'already-linked') githubMessage.value = 'This GitHub account is already linked to another account.';
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<template>
  <div class="dashboard-shell">
    <nav class="navbar border-bottom" aria-label="Main navigation">
      <div class="container py-2">
        <RouterLink class="navbar-brand fw-semibold" to="/dashboard">Dashboard</RouterLink>
<button class="btn btn-dark btn-sm" type="button" aria-label="Log out" @click="logout">Log out</button>
      </div>
    </nav>

    <main class="container py-5">
      <header class="dashboard-heading mb-4">
        <div>
          <p class="eyebrow mb-2">YOUR SPACE</p>
          <h1 class="display-6 fw-semibold mb-2">Dashboard</h1>
          <p class="text-secondary mb-0">View your widgets and manage them when needed.</p>
        </div>
        <button class="btn btn-outline-primary" type="button" @click="toggleEditMode">
          {{ editMode ? 'View results' : 'Edit dashboard' }}
        </button>
      </header>

      <div v-if="githubMessage" class="alert alert-info" role="status">{{ githubMessage }}</div>

      <section v-if="addPanelOpen" class="widget-editor card p-4 mb-4" aria-labelledby="add-widget-title">
        <div class="widget-header mb-3">
          <div>
            <p class="eyebrow mb-2">NEW WIDGET</p>
            <h2 id="add-widget-title" class="h5 mb-0">Add a widget</h2>
          </div>
          <button class="btn btn-sm btn-outline-secondary" type="button" @click="closeAddWidget">Cancel</button>
        </div>

        <form class="row g-3" @submit.prevent="confirmAddWidget">
          <div class="col-md-4">
            <label class="form-label" for="new-widget-service">Service</label>
            <select id="new-widget-service" v-model="selectedService" class="form-select" @change="changeSelectedService">
              <option value="weather">Weather</option>
              <option value="github" :disabled="!githubConnected">GitHub{{ githubConnected ? '' : ' (connect first)' }}</option>
            </select>
          </div>

          <div class="col-md-4">
            <label class="form-label" for="new-widget-type">Widget type</label>
            <select id="new-widget-type" v-model="selectedKind" class="form-select" @change="changeSelectedKind">
              <option v-if="selectedService === 'weather'" value="current_weather">Current weather</option>
              <option v-if="selectedService === 'weather'" value="rain_probability">Rain probability</option>
              <option v-if="selectedService === 'github'" value="recent_commits">Recent commits</option>
              <option v-if="selectedService === 'github'" value="open_pull_requests">Open pull requests</option>
              <option v-if="selectedService === 'github'" value="contribution_activity">Contribution activity</option>
            </select>
          </div>

          <div class="col-md-4">
            <label class="form-label" for="new-widget-refresh">Refresh timer</label>
            <select id="new-widget-refresh" v-model.number="draftWidget.refreshRate" class="form-select">
              <option v-for="option in REFRESH_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>

          <div v-if="selectedService === 'weather'" class="col-12">
            <label class="form-label" for="new-widget-city">City</label>
            <div class="input-group">
              <input id="new-widget-city" v-model="draftWidget.cityQuery" class="form-control" placeholder="Search a city" @input="queueCitySearch(draftWidget)" @keyup.enter.prevent="searchCities(draftWidget)" />
              <button class="btn btn-outline-primary" type="button" @click="searchCities(draftWidget)">Search</button>
            </div>
            <div v-if="draftWidget.cityResults.length" class="list-group city-results mt-2">
              <button v-for="city in draftWidget.cityResults" :key="`${city.name}-${city.latitude}`" class="list-group-item list-group-item-action" type="button" @click="selectCity(draftWidget, city)">
                {{ city.name }}
                <small class="d-block text-secondary">{{ [city.admin1, city.country].filter(Boolean).join(', ') }}</small>
              </button>
            </div>
            <small class="d-block text-secondary mt-1">Selected: {{ draftWidget.city }}</small>
          </div>

          <div v-else-if="selectedKind === 'contribution_activity'" class="col-12">
            <label class="form-label" for="new-widget-username">GitHub username</label>
            <input id="new-widget-username" v-model="draftWidget.username" class="form-control" placeholder="github-username" />
          </div>

          <div v-else class="col-12">
            <label class="form-label" for="new-widget-repository">Repository</label>
            <input id="new-widget-repository" v-model="draftWidget.repositoryQuery" class="form-control" placeholder="Search a repository" @input="queueRepositorySearch(draftWidget)" @keyup.enter.prevent="searchRepositories(draftWidget)" />
            <div v-if="draftWidget.repositoryResults.length" class="list-group city-results mt-2">
              <button v-for="repository in draftWidget.repositoryResults" :key="repository.id" class="list-group-item list-group-item-action" type="button" @click="selectRepository(draftWidget, repository)">
                <strong>{{ repository.full_name }}</strong>
                <small class="d-block text-secondary">{{ repository.description || 'No description' }}</small>
              </button>
            </div>
            <small class="d-block text-secondary mt-1">Selected: {{ draftWidget.repository || 'None' }}</small>
          </div>

          <div v-if="selectedService === 'github'" class="col-md-3">
            <label class="form-label" for="new-widget-number">Number of items</label>
            <input id="new-widget-number" v-model.number="draftWidget.number" class="form-control" type="number" min="1" max="20" />
          </div>

          <div v-if="addError" class="col-12">
            <div class="alert alert-danger mb-0" role="alert">{{ addError }}</div>
          </div>

          <div class="col-12 d-flex justify-content-end gap-2">
            <button class="btn btn-outline-secondary" type="button" @click="closeAddWidget">Cancel</button>
            <button class="btn btn-primary" type="submit">Add to dashboard</button>
          </div>
        </form>
      </section>

      <div class="dashboard-layout">
        <section class="flex-grow-1">
          <div v-if="loading" class="placeholder-glow" aria-live="polite">
            <span class="placeholder col-12 dashboard-placeholder"></span>
          </div>

          <div v-else-if="visibleWidgets.length" class="widget-grid">
            <template v-for="(widget, index) in widgets" :key="widget.id">
              <article v-if="widget.service === 'weather' || githubConnected" class="github-widget card p-4">
                <div class="widget-header">
                  <div>
                    <p class="eyebrow mb-2">{{ widget.service.toUpperCase() }}</p>
                    <h2 class="h5 mb-0">{{ widgetTitle(widget.kind) }}</h2>
                    <small v-if="widget.service === 'weather'" class="text-secondary">{{ widget.city }}</small>
                  </div>
                  <div v-if="editMode" class="widget-actions">
                    <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="index === 0" @click="moveWidget(index, -1)">↑</button>
                    <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="index === widgets.length - 1" @click="moveWidget(index, 1)">↓</button>
                    <button class="btn btn-sm btn-outline-danger" type="button" @click="removeWidget(index)">Remove</button>
                  </div>
                </div>

                <form v-if="editMode" class="row g-2 mt-3" @submit.prevent="loadWidget(widget)">
                  <div v-if="widget.kind === 'contribution_activity'" class="col-md-7">
                    <label class="form-label" :for="`username-${widget.id}`">GitHub username</label>
                    <input :id="`username-${widget.id}`" v-model="widget.username" class="form-control" placeholder="github-username" />
                  </div>
                  <div v-else-if="widget.service === 'weather'" class="col-md-7">
                    <label class="form-label" :for="`city-${widget.id}`">City</label>
                    <input :id="`city-${widget.id}`" v-model="widget.cityQuery" class="form-control" placeholder="Search a city" @input="queueCitySearch(widget)" @keyup.enter.prevent="searchCities(widget)" />
                    <div v-if="widget.cityResults.length" class="list-group city-results mt-2">
                      <button v-for="city in widget.cityResults" :key="`${city.name}-${city.latitude}`" class="list-group-item list-group-item-action" type="button" @click="selectCity(widget, city)">
                        {{ city.name }}
                        <small class="d-block text-secondary">{{ [city.admin1, city.country].filter(Boolean).join(', ') }}</small>
                      </button>
                    </div>
                  </div>
                  <div v-else class="col-md-7">
                    <label class="form-label" :for="`repository-${widget.id}`">Repository</label>
                    <input :id="`repository-${widget.id}`" v-model="widget.repositoryQuery" class="form-control" placeholder="Search a repository" @input="queueRepositorySearch(widget)" @keyup.enter.prevent="searchRepositories(widget)" />
                    <div v-if="widget.repositoryResults.length" class="list-group city-results mt-2">
                      <button v-for="repository in widget.repositoryResults" :key="repository.id" class="list-group-item list-group-item-action" type="button" @click="selectRepository(widget, repository)">{{ repository.full_name }}</button>
                    </div>
                  </div>

                  <div v-if="widget.service === 'weather'" class="col-md-2">
                    <label class="form-label" :for="`unit-${widget.id}`">Unit</label>
                    <select :id="`unit-${widget.id}`" v-model="widget.unit" class="form-select"><option value="metric">Metric</option><option value="imperial">Imperial</option></select>
                  </div>
                  <div v-else class="col-md-2">
                    <label class="form-label" :for="`number-${widget.id}`">Number</label>
                    <input :id="`number-${widget.id}`" v-model.number="widget.number" class="form-control" type="number" min="1" max="20" />
                  </div>

                  <div class="col-md-3 d-flex align-items-end">
                    <button class="btn btn-primary w-100" type="submit" :disabled="widget.loading">{{ widget.loading ? 'Loading…' : 'Load data' }}</button>
                  </div>
                </form>

                <div v-if="editMode" class="widget-refresh mt-3">
                  <label class="form-label mb-1" :for="`refresh-${widget.id}`">Refresh this widget</label>
                  <select :id="`refresh-${widget.id}`" v-model.number="widget.refreshRate" class="form-select form-select-sm" @change="saveWidgets"><option v-for="option in REFRESH_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option></select>
                </div>

                <div v-if="widget.error" class="alert alert-danger mt-3 mb-0" role="alert">{{ widget.error }}</div>
                <div v-else-if="widget.data.length" class="widget-results mt-3">
                  <ul class="list-group list-group-flush">
                    <li v-for="item in widget.data" :key="resultKey(item)" class="list-group-item px-0">
                      <template v-if="widget.kind === 'recent_commits'"><a :href="(item as GitHubCommit).html_url" target="_blank" rel="noreferrer">{{ (item as GitHubCommit).commit.message.split('\n')[0] }}</a><small class="d-block text-secondary">{{ (item as GitHubCommit).commit.author?.name ?? 'Unknown author' }}</small></template>
                      <template v-else-if="widget.kind === 'open_pull_requests'"><a :href="(item as GitHubPullRequest).html_url" target="_blank" rel="noreferrer">#{{ (item as GitHubPullRequest).number }} - {{ (item as GitHubPullRequest).title }}</a><small class="d-block text-secondary">{{ (item as GitHubPullRequest).user?.login ?? 'Unknown author' }}</small></template>
                      <template v-else-if="widget.kind === 'contribution_activity'"><strong>{{ (item as GitHubActivity).type }}</strong><small class="d-block text-secondary">{{ (item as GitHubActivity).repo?.name ?? 'GitHub activity' }}</small></template>
                      <template v-else-if="widget.kind === 'rain_probability'"><strong>{{ formatWeatherDate((item as RainProbability).date) }}</strong><small class="d-block text-secondary">Rain probability: {{ (item as RainProbability).probability ?? '—' }}%</small></template>
                      <template v-else><strong>{{ (item as WeatherData).current.temperature_2m }}°</strong><small class="d-block text-secondary">Humidity: {{ (item as WeatherData).current.relative_humidity_2m }}% · Wind: {{ (item as WeatherData).current.wind_speed_10m }}</small></template>
                    </li>
                  </ul>
                </div>
                <p v-else class="text-secondary mt-3 mb-0">No data loaded yet.</p>
              </article>
            </template>
          </div>

          <section v-else class="empty-dashboard card p-5 text-center" aria-labelledby="empty-title">
            <div class="empty-icon mb-3" aria-hidden="true">+</div>
            <h2 id="empty-title" class="h4">Your dashboard is empty</h2>
            <p class="text-secondary mb-0">Click on <strong>Add widget</strong> to create your first widget.</p>
          </section>
        </section>

        <aside class="services-sidebar card" aria-labelledby="services-title">
          <div class="card-body">
            <p class="eyebrow mb-2">SERVICES</p>
            <h2 id="services-title" class="h5">Available services</h2>
            <div class="service-item mt-4"><div><strong>Weather</strong><p class="small text-secondary mb-0">Current weather by city</p></div><span class="badge text-bg-success">Available</span></div>
            <div class="service-item mt-4"><div><strong>GitHub</strong><p class="small text-secondary mb-0">Repository and activity widgets</p></div><span v-if="githubConnected" class="badge text-bg-success">Connected</span></div>
            <button class="btn btn-primary w-100 mt-4" type="button" @click="openAddWidget">Add widget</button>
            <button v-if="!githubConnected" class="btn btn-dark w-100 mt-2" type="button" @click="connectGithub">Connect GitHub</button>
            <button v-else class="btn btn-outline-secondary w-100 mt-2" type="button" :disabled="githubLoading" @click="disconnectGithub">{{ githubLoading ? 'Disconnecting…' : 'Disconnect GitHub' }}</button>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>
