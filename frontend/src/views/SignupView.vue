<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import AuthLayout from '../components/AuthLayout.vue';
import { authApi } from '../api/auth';

const router = useRouter();
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const showPassword = ref(false);
const showConfirmation = ref(false);
const error = ref('');
const loading = ref(false);
const emailSent = ref(false);

const passwordRules = computed(() => [
  { label: 'At least 8 characters', valid: password.value.length >= 8 },
  { label: 'One uppercase letter', valid: /[A-Z]/.test(password.value) },
  { label: 'One lowercase letter', valid: /[a-z]/.test(password.value) },
  { label: 'One number', valid: /[0-9]/.test(password.value) },
]);

const passwordIsValid = computed(() => passwordRules.value.every((rule) => rule.valid));
const passwordsMatch = computed(
  () => passwordConfirmation.value.length > 0 && password.value === passwordConfirmation.value,
);
const canSubmit = computed(
  () => email.value.length > 0 && passwordIsValid.value && passwordsMatch.value && !loading.value,
);

async function submit(): Promise<void> {
  if (!canSubmit.value) return;

  loading.value = true;
  error.value = '';
  try {
    await authApi.signup(email.value, password.value);
    emailSent.value = true;
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
    <template #subtitle>Set up your personal information dashboard.</template>

    <div v-if="emailSent" class="alert alert-success" role="status">
      <strong>Account created.</strong>
      <p class="mb-0">Check your email and click the confirmation link before signing in.</p>
    </div>

    <form v-else @submit.prevent="submit" novalidate>
      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

      <label class="form-label" for="signup-email">Email address</label>
      <input
        id="signup-email"
        v-model="email"
        class="form-control mb-3"
        type="email"
        required
        autocomplete="email"
        placeholder="you@example.com"
      />

      <label class="form-label" for="signup-password">Password</label>
      <div class="password-input mb-2">
        <input
          id="signup-password"
          v-model="password"
          class="form-control"
          :type="showPassword ? 'text' : 'password'"
          required
          autocomplete="new-password"
          aria-describedby="password-rules"
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

      <ul id="password-rules" class="password-rules list-unstyled mb-3" aria-live="polite">
        <li v-for="rule in passwordRules" :key="rule.label" :class="{ valid: rule.valid }">
          <span class="rule-icon" aria-hidden="true">{{ rule.valid ? '✓' : '○' }}</span>
          {{ rule.label }}
        </li>
      </ul>

      <label class="form-label" for="signup-password-confirmation">Confirm password</label>
      <div class="password-input mb-1">
        <input
          id="signup-password-confirmation"
          v-model="passwordConfirmation"
          class="form-control"
          :class="{ 'is-invalid': passwordConfirmation.length > 0 && !passwordsMatch }"
          :type="showConfirmation ? 'text' : 'password'"
          required
          autocomplete="new-password"
          aria-describedby="password-match"
        />
        <button
          class="password-toggle"
          type="button"
          :aria-label="showConfirmation ? 'Hide password confirmation' : 'Show password confirmation'"
          @click="showConfirmation = !showConfirmation"
        >
          {{ showConfirmation ? 'Hide' : 'Show' }}
        </button>
      </div>
      <div id="password-match" class="form-text mb-4" :class="{ 'text-success': passwordsMatch }">
        {{ passwordsMatch ? 'Passwords match.' : 'Repeat your password exactly.' }}
      </div>

      <button class="btn btn-primary w-100" type="submit" :disabled="!canSubmit">
        {{ loading ? 'Creating account…' : 'Create account' }}
      </button>
    </form>

    <p class="text-center text-secondary mt-4 mb-0">
      Already registered?
      <RouterLink to="/login">Sign in</RouterLink>
    </p>
  </AuthLayout>
</template>
