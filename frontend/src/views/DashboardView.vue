<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authApi } from '../api/auth';

const route = useRoute();
const router = useRouter();
const userId = ref<number>();
const loading = ref(true);
const githubConnected = ref(false);
const githubLoading = ref(false);
const githubMessage = ref('');

authApi.me().then((user) => {
  userId.value = user.userId;
}).finally(async () => {
  try {
    githubConnected.value = (await authApi.githubStatus()).connected;
  } finally {
    loading.value = false;
  }
});

onMounted(() => {
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
          <section v-else class="empty-dashboard card border-0 shadow-sm p-5 text-center" aria-labelledby="empty-title">
            <div class="empty-icon mb-3" aria-hidden="true">+</div>
            <h2 id="empty-title" class="h4">Your dashboard is empty</h2>
            <p class="text-secondary mb-4">Choose a service and add your first configurable widget.</p>
            <button class="btn btn-primary" type="button" disabled>Add a widget</button>
            <small class="text-secondary mt-3">Signed in as user #{{ userId }}</small>
          </section>
        </section>

        <aside class="services-sidebar card border-0 shadow-sm" aria-labelledby="services-title">
          <div class="card-body">
            <p class="eyebrow mb-2">SERVICES</p>
            <h2 id="services-title" class="h5">Connected services</h2>
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
            <button v-else class="btn btn-outline-secondary w-100 mt-4" type="button" :disabled="githubLoading" @click="disconnectGithub">
              {{ githubLoading ? 'Disconnecting…' : 'Disconnect GitHub' }}
            </button>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>
