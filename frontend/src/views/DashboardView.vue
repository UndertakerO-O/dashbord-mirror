<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '../api/auth';

const router = useRouter();
const userId = ref<number>();
const loading = ref(true);

authApi.me().then((user) => {
  userId.value = user.userId;
}).finally(() => {
  loading.value = false;
});

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
    </main>
  </div>
</template>
