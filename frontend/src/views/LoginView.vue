<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AuthLayout from '../components/AuthLayout.vue';
import { authApi } from '../api/auth';

const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function submit(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    await authApi.login(email.value, password.value);
    await router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard');
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to sign in';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <template #title>Welcome back</template>
    <template #subtitle>Sign in to access your personal dashboard.</template>

    <form @submit.prevent="submit" novalidate>
      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
      <label class="form-label" for="login-email">Email address</label>
      <input id="login-email" v-model="email" class="form-control mb-3" type="email" required autocomplete="email" />
      <label class="form-label" for="login-password">Password</label>
      <input id="login-password" v-model="password" class="form-control mb-4" type="password" required autocomplete="current-password" />
      <button class="btn btn-primary w-100" type="submit" :disabled="loading">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <p class="text-center text-secondary mt-4 mb-0">
      New here?
      <RouterLink to="/signup">Create an account</RouterLink>
    </p>
  </AuthLayout>
</template>
