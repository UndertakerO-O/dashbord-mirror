<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authApi, type GitHubActivity, type GitHubCommit, type GitHubPullRequest, type WeatherData } from '../api/auth';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const githubConnected = ref(false);
const githubLoading = ref(false);
const githubMessage = ref('');

type WidgetKind = 'recent_commits' | 'open_pull_requests' | 'contribution_activity' | 'current_weather';
type DashboardWidget = { id: string; service: 'github' | 'weather'; kind: WidgetKind; repository: string; username: string; latitude: string; longitude: string; unit: 'metric' | 'imperial'; number: number; data: GitHubCommit[] | GitHubPullRequest[] | GitHubActivity[] | WeatherData[]; loading: boolean; error: string };
const visibleWidgets = computed(() => widgets.value.filter((widget) => widget.service === 'weather' || githubConnected.value));
const widgets = ref<DashboardWidget[]>([]);

function saveWidgets(): void {
  localStorage.setItem('dashboard_widgets', JSON.stringify(widgets.value.map(({ data, loading, error, ...widget }) => widget)));
}

function addWidget(kind: WidgetKind = 'recent_commits'): void {
  const service = kind === 'current_weather' ? 'weather' : 'github';
  widgets.value.push({ id: `${service}-${Date.now()}`, service, kind, repository: '', username: '', latitude: '48.8566', longitude: '2.3522', unit: 'metric', number: 5, data: [], loading: false, error: '' });
  saveWidgets();
}

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
      widgets.value = (JSON.parse(saved) as Array<Partial<DashboardWidget>>).map((widget, index) => ({ id: widget.id ?? `github-${index}`, service: widget.service ?? (widget.kind === 'current_weather' ? 'weather' : 'github'), kind: widget.kind ?? 'recent_commits', repository: widget.repository ?? '', username: widget.username ?? '', latitude: widget.latitude ?? '48.8566', longitude: widget.longitude ?? '2.3522', unit: widget.unit ?? 'metric', number: Number(widget.number) || 5, data: [], loading: false, error: '' }));
    } catch { localStorage.removeItem('dashboard_widgets'); }
  }
  if (route.query.github === 'connected') githubMessage.value = 'GitHub connected successfully.';
  if (route.query.github === 'cancelled') githubMessage.value = 'GitHub connection was cancelled.';
});

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
        <p class="text-secondary mb-0">Your widgets will appear here as you build your dashboard.</p>
      </div>

      <div v-if="githubMessage" class="alert alert-info" role="status">{{ githubMessage }}</div>

      <div class="dashboard-layout">
        <section class="flex-grow-1">
          <div v-if="loading" class="placeholder-glow" aria-live="polite">
            <span class="placeholder col-12 dashboard-placeholder"></span>
          </div>
          <div v-if="visibleWidgets.length" class="widget-grid">
            <template v-for="(widget, index) in widgets" :key="widget.id"><article v-if="widget.service === 'weather' || githubConnected" class="github-widget card border-0 shadow-sm p-4">
              <div class="widget-header"><div><p class="eyebrow mb-2">{{ widget.service.toUpperCase() }}</p><h2 class="h5 mb-0">{{ widget.kind === 'recent_commits' ? 'Recent commits' : widget.kind === 'open_pull_requests' ? 'Open pull requests' : widget.kind === 'contribution_activity' ? 'Contribution activity' : 'Current weather' }}</h2></div><div class="widget-actions">
                <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="index === 0" @click="moveWidget(index, -1)">↑</button>
                <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="index === widgets.length - 1" @click="moveWidget(index, 1)">↓</button>
                <button class="btn btn-sm btn-outline-danger" type="button" @click="removeWidget(index)">Remove</button>
              </div></div>
              <form class="row g-2 mt-3" @submit.prevent="loadWidget(widget)">
                <div v-if="widget.kind === 'contribution_activity'" class="col-md-7"><label class="form-label" :for="`username-${widget.id}`">GitHub username</label><input :id="`username-${widget.id}`" v-model="widget.username" class="form-control" placeholder="github-username" /></div><div v-else-if="widget.kind === 'current_weather'" class="col-md-4"><label class="form-label" :for="`latitude-${widget.id}`">Latitude</label><input :id="`latitude-${widget.id}`" v-model="widget.latitude" class="form-control" type="number" step="any" /></div><div v-else class="col-md-7"><label class="form-label" :for="`repository-${widget.id}`">Repository</label><input :id="`repository-${widget.id}`" v-model="widget.repository" class="form-control" placeholder="organisation/repository" /></div>
                <div v-if="widget.kind === 'current_weather'" class="col-md-4"><label class="form-label" :for="`longitude-${widget.id}`">Longitude</label><input :id="`longitude-${widget.id}`" v-model="widget.longitude" class="form-control" type="number" step="any" /></div><div v-else class="col-md-2"><label class="form-label" :for="`number-${widget.id}`">Number</label><input :id="`number-${widget.id}`" v-model.number="widget.number" class="form-control" type="number" min="1" max="20" /></div>
                <div v-if="widget.kind === 'current_weather'" class="col-md-2"><label class="form-label" :for="`unit-${widget.id}`">Unit</label><select :id="`unit-${widget.id}`" v-model="widget.unit" class="form-select"><option value="metric">Metric</option><option value="imperial">Imperial</option></select></div><div class="col-md-3 d-flex align-items-end"><button class="btn btn-primary w-100" type="submit" :disabled="widget.loading">{{ widget.loading ? 'Loading…' : 'Load data' }}</button></div>
              </form>
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
            <button class="btn btn-outline-primary w-100 mt-3" type="button" @click="addWidget('current_weather')">Add weather widget</button>
            <div class="service-item mt-4">
              <div>
                <strong>GitHub</strong>
                <p class="small text-secondary mb-0">Authorize GitHub widgets</p>
              </div>
              <span v-if="githubConnected" class="badge text-bg-success">Connected</span>
            </div>
            <button v-if="!githubConnected" class="btn btn-dark w-100 mt-4" type="button" @click="connectGithub">
              Connect GitHub
            </button>
            <template v-else>
              <button class="btn btn-primary w-100 mt-4" type="button" @click="addWidget()">Add commits widget</button><button class="btn btn-outline-primary w-100 mt-2" type="button" @click="addWidget('open_pull_requests')">Add PR widget</button><button class="btn btn-outline-primary w-100 mt-2" type="button" @click="addWidget('contribution_activity')">Add contribution widget</button>
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
