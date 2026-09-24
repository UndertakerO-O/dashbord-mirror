<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import AuthLayout from '../components/AuthLayout.vue';
import { authApi } from '../api/auth';

const route = useRoute();
const message = ref('Confirming your account…');
const success = ref(false);

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : '';
  if (!token) {
    message.value = 'No confirmation token was provided.';
    return;
  }

  try {
    await authApi.confirm(token);
    success.value = true;
    message.value = 'Your account is confirmed. You can now sign in.';
  } catch (cause) {
    message.value = cause instanceof Error ? cause.message : 'Unable to confirm this account.';
  }
});
</script>

<template>
  <AuthLayout>
    <template #title>Account confirmation</template>
    <template #subtitle>One last step before accessing your dashboard.</template>
    <div class="alert" :class="success ? 'alert-success' : 'alert-info'" role="status">{{ message }}</div>
    <RouterLink v-if="success" class="btn btn-primary w-100" to="/login">Go to sign in</RouterLink>
  </AuthLayout>
</template>
