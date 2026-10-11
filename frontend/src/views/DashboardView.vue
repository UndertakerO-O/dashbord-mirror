<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authApi, type GitHubActivity, type GitHubCommit, type GitHubPullRequest, type WeatherCity, type WeatherData } from '../api/auth';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const githubConnected = ref(false);
const githubLoading = ref(false);
const githubMessage = ref('');
const editMode = ref(false);
const addPanelOpen = ref(false);
const addError = ref('');
const newService = ref<'github' | 'weather'>('weather');
const newKind = ref<WidgetKind>('current_weather');
let refreshTimer: ReturnType<typeof setInterval> | undefined;

type WidgetKind = 'recent_commits' | 'open_pull_requests' | 'contribution_activity' | 'current_weather';
type DashboardWidget = { id: string; service: 'github' | 'weather'; kind: WidgetKind; refreshRate: number; lastRefreshAt: number; city: string; cityQuery: string; cityResults: WeatherCity[]; citySearchLoading: boolean; repository: string; username: string; latitude: string; longitude: string; unit: 'metric' | 'imperial'; number: number; data: GitHubCommit[] | GitHubPullRequest[] | GitHubActivity[] | WeatherData[]; loading: boolean; error: string };
const visibleWidgets = computed(() => widgets.value.filter((widget) => widget.service === 'weather' || githubConnected.value));
const widgets = ref<DashboardWidget[]>([]);

function saveWidgets(): void {
  localStorage.setItem('dashboard_widgets', JSON.stringify(widgets.value.map(({ loading, error, cityResults, citySearchLoading, lastRefreshAt, ...widget }) => ({ ...widget, data: widget.data }))));
  }


function configureRefresh(): void {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(refreshWidgets, 1000);
}

async function refreshWidgets(): Promise<void> {
  const now = Date.now();
  const widgetsToRefresh = widgets.value.filter((widget) => (widget.service === 'weather' || githubConnected.value) && widget.refreshRate > 0 && now - widget.lastRefreshAt >= widget.refreshRate * 1000);
  await Promise.all(widgetsToRefresh.map((widget) => loadWidget(widget)));
}

async function searchCities(widget: DashboardWidget): Promise<void> {
  if (widget.cityQuery.trim().length < 2) { widget.cityResults = []; return; }
  widget.citySearchLoading = true;
  try { widget.cityResults = await authApi.weatherCities(widget.cityQuery.trim()); }
  catch (cause) { widget.error = cause instanceof Error ? cause.message : 'Unable to search cities.'; }
  finally { widget.citySearchLoading = false; }
}

function selectCity(widget: DashboardWidget, city: WeatherCity): void {
  widget.city = city.name;
  widget.cityQuery = city.name;
  widget.latitude = String(city.latitude);
  widget.longitude = String(city.longitude);
  widget.cityResults = [];
}

function toggleEditMode(): void { editMode.value = !editMode.value; }

function createWidget(kind: WidgetKind): DashboardWidget {
  const service = kind === 'current_weather' ? 'weather' : 'github';
  return { id: `${service}-${Date.now()}-${Math.random()}`, service, kind, refreshRate: 60, lastRefreshAt: 0, city: 'Paris', cityQuery: '', cityResults: [], citySearchLoading: false, repository: '', username: '', latitude: '48.8566', longitude: '2.3522', unit: 'metric', number: 5, data: [], loading: false, error: '' };
}

function openAddWidget(): void {
  addPanelOpen.value = true;
  addError.value = '';
  editMode.value = true;
  newService.value = githubConnected.value ? 'github' : 'weather';
  newKind.value = newService.value === 'github' ? 'recent_commits' : 'current_weather';
  addDraft.value = createWidget(newKind.value);
}


function closeAddWidget(): void { addPanelOpen.value = false; }

function changeNewService(): void { newKind.value = newService.value === 'github' ? 'recent_commits' : 'current_weather'; addDraft.value = createWidget(newKind.value); }

async function confirmAddWidget(): Promise<void> {
  addError.value = '';
  if (newKind.value === 'current_weather' && !addDraft.value.city) { addError.value = 'Select a city before adding the widget.'; return; }
  if (newKind.value === 'contribution_activity' && !addDraft.value.username.trim()) { addError.value = 'Enter a GitHub username before adding the widget.'; return; }
  if (newKind.value !== 'current_weather' && newKind.value !== 'contribution_activity' && addDraft.value.repository.trim().split('/').length !== 2) { addError.value = 'Use the organisation/repository format.'; return; }
  const widget = createWidget(newKind.value);
  Object.assign(widget, addDraft.value);
  widgets.value.push(widget);
  addPanelOpen.value = false;
  saveWidgets();
  await loadWidget(widget);
}

const addDraft = ref<DashboardWidget>(createWidget('current_weather'));


function removeWidget(index: number): void { widgets.value.splice(index, 1); saveWidgets(); }

function moveWidget(index: number, direction: -1 | 1): void {
  const target = index + direction;
  if (target < 0 || target >= widgets.value.length) return;
  [widgets.value[index], widgets.value[target]] = [widgets.value[target], widgets.value[index]];
  saveWidgets();
}

async function loadWidget(widget: DashboardWidget): Promise<void> {
  widget.loading = true; widget.error = '';
  try {
    const configuration = { number: String(Math.min(Math.max(widget.number, 1), 20)) };
    if (widget.kind === 'current_weather') {
      const weather = await authApi.weatherWidget({ latitude: widget.latitude, longitude: widget.longitude, unit: widget.unit });
      widget.data = [weather];
    } else if (widget.kind === 'contribution_activity') {
      if (!widget.username.trim()) { widget.error = 'Enter a GitHub username.'; return; }
      widget.data = await authApi.githubWidget<GitHubActivity[]>('contribution_activity', { ...configuration, username: widget.username.trim() });
    } else {
      if (widget.repository.trim().split('/').length !== 2) { widget.error = 'Use the organisation/repository format.'; return; }
      widget.data = widget.kind === 'open_pull_requests'
        ? await authApi.githubWidget<GitHubPullRequest[]>(widget.kind, { ...configuration, repository: widget.repository.trim() })
        : await authApi.githubWidget<GitHubCommit[]>(widget.kind, { ...configuration, repository: widget.repository.trim() });
    }
    widget.lastRefreshAt = Date.now();
    saveWidgets();
  } catch (cause) { widget.error = cause instanceof Error ? cause.message : 'Unable to load GitHub data.'; }
  finally { widget.loading = false; }
}

authApi.me().finally(async () => {
  try {
    githubConnected.value = (await authApi.githubStatus()).connected;
  } finally {
    loading.value = false;
  }
});

onMounted(() => {
  const saved = localStorage.getItem('dashboard_widgets');
  if (saved) {
    try {
      widgets.value = (JSON.parse(saved) as Array<Partial<DashboardWidget>>).map((widget, index) => ({ id: widget.id ?? `github-${index}`, service: widget.service ?? (widget.kind === 'current_weather' ? 'weather' : 'github'), kind: widget.kind ?? 'recent_commits', refreshRate: typeof widget.refreshRate === 'number' ? widget.refreshRate : 60, lastRefreshAt: Date.now(), city: widget.city ?? 'Paris', cityQuery: '', cityResults: [], citySearchLoading: false, repository: widget.repository ?? '', username: widget.username ?? '', latitude: widget.latitude ?? '48.8566', longitude: widget.longitude ?? '2.3522', unit: widget.unit ?? 'metric', number: Number(widget.number) || 5, data: (widget.data as DashboardWidget['data']) ?? [], loading: false, error: '' }));
    } catch { localStorage.removeItem('dashboard_widgets'); }
  }
  if (route.query.github === 'connected') githubMessage.value = 'GitHub connected successfully.';
  if (route.query.github === 'cancelled') githubMessage.value = 'GitHub connection was cancelled.';
  configureRefresh();
});

onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer); });

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
</script>

<template>
  <div class="dashboard-shell">
    <nav class="navbar navbar-expand-lg border-bottom bg-white" aria-label="Main navigation">
      <div class="container py-2">
        <RouterLink class="navbar-brand fw-semibold" to="/dashboard">Dashboard</RouterLink>
        <button class="btn btn-outline-secondary btn-sm" type="button" @click="logout">Sign out</button>
      </div>
    </nav>

    <main class="container py-5">
      <div class="mb-5">
        <p class="eyebrow mb-2">YOUR SPACE</p>
        <h1 class="display-6 fw-semibold">Good morning</h1>
        <div class="dashboard-toolbar d-flex flex-wrap align-items-end justify-content-between gap-3"><div><p class="text-secondary mb-0">Your widgets will appear here as you build your dashboard.</p></div><button class="btn btn-outline-primary" type="button" @click="toggleEditMode">{{ editMode ? 'View results' : 'Edit dashboard' }}</button></div>
      </div>

      <div v-if="githubMessage" class="alert alert-info" role="status">{{ githubMessage }}</div>

      <section v-if="addPanelOpen" class="widget-editor card border-0 shadow-sm p-4 mb-4" aria-labelledby="add-widget-title">
        <div class="widget-header mb-3"><div><p class="eyebrow mb-2">NEW WIDGET</p><h2 id="add-widget-title" class="h5 mb-0">Add a widget</h2></div><button class="btn btn-sm btn-outline-secondary" type="button" @click="closeAddWidget">Cancel</button></div>
        <form class="row g-3" @submit.prevent="confirmAddWidget">
          <div class="col-md-4"><label class="form-label" for="new-widget-service">Service</label><select id="new-widget-service" v-model="newService" class="form-select" @change="changeNewService"><option value="weather">Weather</option><option value="github" :disabled="!githubConnected">GitHub{{ githubConnected ? '' : ' (connect first)' }}</option></select></div>
          <div class="col-md-4"><label class="form-label" for="new-widget-type">Widget type</label><select id="new-widget-type" v-model="newKind" class="form-select" @change="addDraft = createWidget(newKind)"><option v-if="newService === 'weather'" value="current_weather">Current weather</option><option v-if="newService === 'github'" value="recent_commits">Recent commits</option><option v-if="newService === 'github'" value="open_pull_requests">Open pull requests</option><option v-if="newService === 'github'" value="contribution_activity">Contribution activity</option></select></div>
          <div class="col-md-4"><label class="form-label" for="new-widget-refresh">Refresh timer</label><select id="new-widget-refresh" v-model.number="addDraft.refreshRate" class="form-select"><option :value="0">Off</option><option :value="30">Every 30 seconds</option><option :value="60">Every minute</option><option :value="300">Every 5 minutes</option></select></div>
          <div v-if="newKind === 'current_weather'" class="col-12"><label class="form-label" for="new-widget-city">City</label><div class="input-group"><input id="new-widget-city" v-model="addDraft.cityQuery" class="form-control" placeholder="Search a city" @keyup.enter.prevent="searchCities(addDraft)" /><button class="btn btn-outline-primary" type="button" :disabled="addDraft.citySearchLoading" @click="searchCities(addDraft)">{{ addDraft.citySearchLoading ? 'Searching…' : 'Search' }}</button></div><div v-if="addDraft.cityResults.length" class="list-group city-results mt-2"><button v-for="city in addDraft.cityResults" :key="`${city.name}-${city.latitude}-${city.longitude}`" class="list-group-item list-group-item-action" type="button" @click="selectCity(addDraft, city)">{{ city.name }}<small class="d-block text-secondary">{{ [city.admin1, city.country].filter(Boolean).join(', ') }}</small></button></div><small class="d-block text-secondary mt-1">Selected: {{ addDraft.city }}</small></div>
          <div v-else-if="newKind === 'contribution_activity'" class="col-12"><label class="form-label" for="new-widget-username">GitHub username</label><input id="new-widget-username" v-model="addDraft.username" class="form-control" placeholder="github-username" /></div>
          <div v-else class="col-12"><label class="form-label" for="new-widget-repository">Repository</label><input id="new-widget-repository" v-model="addDraft.repository" class="form-control" placeholder="organisation/repository" /></div>
          <div v-if="newKind !== 'current_weather'" class="col-md-3"><label class="form-label" for="new-widget-number">Number of items</label><input id="new-widget-number" v-model.number="addDraft.number" class="form-control" type="number" min="1" max="20" /></div>
          <div v-if="addError" class="col-12"><div class="alert alert-danger mb-0" role="alert">{{ addError }}</div></div><div class="col-12 d-flex justify-content-end gap-2"><button class="btn btn-outline-secondary" type="button" @click="closeAddWidget">Cancel</button><button class="btn btn-primary" type="submit">Add to dashboard</button></div>
        </form>
      </section>
      <div class="dashboard-layout">
        <section class="flex-grow-1">
          <div v-if="loading" class="placeholder-glow" aria-live="polite">
            <span class="placeholder col-12 dashboard-placeholder"></span>
          </div>
          <div v-if="visibleWidgets.length" class="widget-grid">
            <template v-for="(widget, index) in widgets" :key="widget.id"><article v-if="widget.service === 'weather' || githubConnected" class="github-widget card border-0 shadow-sm p-4">
              <div class="widget-header"><div><p class="eyebrow mb-2">{{ widget.service.toUpperCase() }}</p><h2 class="h5 mb-0">{{ widget.kind === 'recent_commits' ? 'Recent commits' : widget.kind === 'open_pull_requests' ? 'Open pull requests' : widget.kind === 'contribution_activity' ? 'Contribution activity' : 'Current weather' }}</h2></div><div v-if="editMode" class="widget-actions">
                <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="index === 0" @click="moveWidget(index, -1)">↑</button>
                <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="index === widgets.length - 1" @click="moveWidget(index, 1)">↓</button>
                <button class="btn btn-sm btn-outline-danger" type="button" @click="removeWidget(index)">Remove</button>
              </div></div>
              <form v-if="editMode" class="row g-2 mt-3" @submit.prevent="loadWidget(widget)">
                <div v-if="widget.kind === 'contribution_activity'" class="col-md-7"><label class="form-label" :for="`username-${widget.id}`">GitHub username</label><input :id="`username-${widget.id}`" v-model="widget.username" class="form-control" placeholder="github-username" /></div><div v-else-if="widget.kind === 'current_weather'" class="col-md-7"><label class="form-label" :for="`city-${widget.id}`">City</label><div class="input-group"><input :id="`city-${widget.id}`" v-model="widget.cityQuery" class="form-control" placeholder="Search a city" @keyup.enter.prevent="searchCities(widget)" /><button class="btn btn-outline-primary" type="button" :disabled="widget.citySearchLoading" @click="searchCities(widget)">{{ widget.citySearchLoading ? 'Searching…' : 'Search' }}</button></div><div v-if="widget.cityResults.length" class="list-group city-results mt-2"><button v-for="city in widget.cityResults" :key="`${city.name}-${city.latitude}-${city.longitude}`" class="list-group-item list-group-item-action" type="button" @click="selectCity(widget, city)">{{ city.name }}<small class="d-block text-secondary">{{ [city.admin1, city.country].filter(Boolean).join(', ') }}</small></button></div><small v-if="widget.city" class="d-block text-secondary mt-1">Selected: {{ widget.city }}</small></div><div v-else class="col-md-7"><label class="form-label" :for="`repository-${widget.id}`">Repository</label><input :id="`repository-${widget.id}`" v-model="widget.repository" class="form-control" placeholder="organisation/repository" /></div>
                <div v-if="widget.kind === 'current_weather'" class="col-md-2"><label class="form-label" :for="`unit-${widget.id}`">Unit</label><select :id="`unit-${widget.id}`" v-model="widget.unit" class="form-select"><option value="metric">Metric</option><option value="imperial">Imperial</option></select></div><div v-else class="col-md-2"><label class="form-label" :for="`number-${widget.id}`">Number</label><input :id="`number-${widget.id}`" v-model.number="widget.number" class="form-control" type="number" min="1" max="20" /></div>
                <div class="col-md-3 d-flex align-items-end"><button class="btn btn-primary w-100" type="submit" :disabled="widget.loading">{{ widget.loading ? 'Loading…' : 'Load data' }}</button></div>
              </form>
              <div v-if="editMode" class="widget-refresh mt-3"><label class="form-label mb-1" :for="`refresh-${widget.id}`">Refresh this widget</label><select :id="`refresh-${widget.id}`" v-model.number="widget.refreshRate" class="form-select form-select-sm" @change="saveWidgets"><option :value="0">Off</option><option :value="30">Every 30 seconds</option><option :value="60">Every minute</option><option :value="300">Every 5 minutes</option></select></div>
              <div v-if="widget.error" class="alert alert-danger mt-3 mb-0" role="alert">{{ widget.error }}</div>
              <ul v-else-if="widget.data.length" class="list-group list-group-flush mt-3"><li v-for="item in widget.data" :key="'current' in item ? item.latitude : 'id' in item ? item.id : 'sha' in item ? item.sha : item.number" class="list-group-item px-0"><template v-if="widget.kind === 'recent_commits'"><a :href="(item as GitHubCommit).html_url" target="_blank" rel="noreferrer">{{ (item as GitHubCommit).commit.message.split('\n')[0] }}</a><small class="d-block text-secondary">{{ (item as GitHubCommit).commit.author?.name ?? 'Unknown author' }}</small></template><template v-else-if="widget.kind === 'open_pull_requests'"><a :href="(item as GitHubPullRequest).html_url" target="_blank" rel="noreferrer">#{{ (item as GitHubPullRequest).number }} - {{ (item as GitHubPullRequest).title }}</a><small class="d-block text-secondary">{{ (item as GitHubPullRequest).user?.login ?? 'Unknown author' }}</small></template><template v-else-if="widget.kind === 'contribution_activity'"><strong>{{ (item as GitHubActivity).type }}</strong><small class="d-block text-secondary">{{ (item as GitHubActivity).repo?.name ?? 'GitHub activity' }}</small></template><template v-else><strong>{{ (item as WeatherData).current.temperature_2m }}°</strong><small class="d-block text-secondary">Humidity: {{ (item as WeatherData).current.relative_humidity_2m }}% · Wind: {{ (item as WeatherData).current.wind_speed_10m }}</small></template></li></ul>
              <p v-else class="text-secondary mt-3 mb-0">Configure this widget, then load the latest commits.</p>
            </article></template>
          </div>
          <section v-else class="empty-dashboard card border-0 shadow-sm p-5 text-center" aria-labelledby="empty-title">
            <div class="empty-icon mb-3" aria-hidden="true">+</div>
            <h2 id="empty-title" class="h4">Your dashboard is empty</h2>
            <p class="text-secondary mb-4">Choose a service and add your first configurable widget.</p>
          </section>
        </section>

        <aside class="services-sidebar card border-0 shadow-sm" aria-labelledby="services-title">
          <div class="card-body">
            <p class="eyebrow mb-2">SERVICES</p>
            <h2 id="services-title" class="h5">Connected services</h2><div class="service-item mt-4"><div><strong>Weather</strong><p class="small text-secondary mb-0">Current weather by location</p></div><span class="badge text-bg-success">Available</span></div>
            
            <div class="service-item mt-4">
              <div>
                <strong>GitHub</strong>
                <p class="small text-secondary mb-0">Authorize GitHub widgets</p>
              </div>
              <span v-if="githubConnected" class="badge text-bg-success">Connected</span>
            </div>
            <button class="btn btn-primary w-100 mt-4" type="button" @click="openAddWidget">Add widget</button>
            <button v-if="!githubConnected" class="btn btn-dark w-100 mt-2" type="button" @click="connectGithub">
              Connect GitHub
            </button>
            <template v-else>
              <button class="btn btn-outline-secondary w-100 mt-2" type="button" :disabled="githubLoading" @click="disconnectGithub">
              {{ githubLoading ? 'Disconnecting…' : 'Disconnect GitHub' }}
              </button>
            </template>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>
