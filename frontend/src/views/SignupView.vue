<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import AuthLayout from '../components/AuthLayout.vue';
import { authApi } from '../api/auth';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const confirmationToken = ref('');
const loading = ref(false);

async function submit(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    const result = await authApi.signup(email.value, password.value);
    confirmationToken.value = result.confirmationToken;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to create the account';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <template #title>Create your account</template>
    <template #subtitle>Start building your own information dashboard.</template>

    <div v-if="confirmationToken" class="alert alert-success" role="status">
      Account created. For local development, confirm it here:
      <RouterLink :to="{ path: '/confirm', query: { token: confirmationToken } }">
        confirm my account
      </RouterLink>
    </div>

    <form v-else @submit.prevent="submit" novalidate>
      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
      <label class="form-label" for="signup-email">Email address</label>
      <input id="signup-email" v-model="email" class="form-control mb-3" type="email" required autocomplete="email" />
      <label class="form-label" for="signup-password">Password</label>
      <input id="signup-password" v-model="password" class="form-control mb-3" type="password" required minlength="8" autocomplete="new-password" />
      <p class="form-text mb-4">At least 8 characters, with uppercase, lowercase and a number.</p>
      <button class="btn btn-primary w-100" type="submit" :disabled="loading">
        {{ loading ? 'Creating account…' : 'Create account' }}
      </button>
    </form>

    <p class="text-center text-secondary mt-4 mb-0">
      Already registered?
      <RouterLink to="/login">Sign in</RouterLink>
    </p>
  </AuthLayout>
</template>
