<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AuthLayout from '../components/AuthLayout.vue';
import { authApi } from '../api/auth';

const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);

// Affiche le résultat d'une tentative de connexion GitHub non liée.
onMounted(() => {
  if (route.query.github === 'not-linked') {
    error.value = 'This GitHub account is not linked to a local account yet.';
  }
});

function loginWithGithub(): void {
  authApi.startGithubLogin();
}

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
    <template #subtitle>Sign in to continue to your dashboard.</template>

    <form @submit.prevent="submit" novalidate>
      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

      <label class="form-label" for="login-email">Email address</label>
      <input
        id="login-email"
        v-model="email"
        class="form-control mb-3"
        type="email"
        required
        autocomplete="email"
        placeholder="you@example.com"
      />

      <label class="form-label" for="login-password">Password</label>
      <div class="password-input mb-4">
        <input
          id="login-password"
          v-model="password"
          class="form-control"
          :type="showPassword ? 'text' : 'password'"
          required
          autocomplete="current-password"
        />
        <button
          class="password-toggle"
          type="button"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? 'Hide' : 'Show' }}
        </button>
      </div>

      <button class="btn btn-primary w-100" type="submit" :disabled="loading || !email || !password">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>

      <div class="oauth-divider" aria-hidden="true"><span>or</span></div>

      <button class="btn btn-outline-dark w-100" type="button" @click="loginWithGithub">
        Continue with GitHub
      </button>
    </form>

    <p class="text-center text-secondary mt-4 mb-0">
      New here?
      <RouterLink to="/signup">Create an account</RouterLink>
    </p>
  </AuthLayout>
</template>
