<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { authApi } from '../api/auth';

const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);

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
  <main class="login-page">
    <section class="login-card" aria-labelledby="login-title">
      <div class="text-center mb-4">
        <div class="login-brand-name mb-3" aria-label="MY_DASHBORD">MY_DASHBORD</div>
        <h1 id="login-title" class="h3 mb-2">Sign in</h1>
        <p class="text-secondary mb-0">Access your dashboard.</p>
      </div>

      <form class="login-form" @submit.prevent="submit" novalidate>
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

        <div>
          <label class="form-label" for="login-email">Email address</label>
          <input id="login-email" v-model="email" class="form-control" type="email" required autocomplete="email" />
        </div>

        <div>
          <label class="form-label" for="login-password">Password</label>
          <div class="password-input">
            <input id="login-password" v-model="password" class="form-control" :type="showPassword ? 'text' : 'password'" required autocomplete="current-password" />
            <button class="password-toggle" type="button" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
          </div>
        </div>

        <button class="btn btn-primary w-100" type="submit" :disabled="loading || !email || !password">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <div class="oauth-divider" aria-hidden="true"><span>or</span></div>
      <button class="btn btn-outline-dark w-100" type="button" @click="loginWithGithub">Continue with GitHub</button>

      <p class="text-center text-secondary mt-4 mb-0">New here? <RouterLink to="/signup">Create an account</RouterLink></p>
    </section>
  </main>
</template>
