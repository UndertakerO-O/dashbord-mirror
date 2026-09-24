import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { authApi } from './api/auth';
import ConfirmView from './views/ConfirmView.vue';
import DashboardView from './views/DashboardView.vue';
import LoginView from './views/LoginView.vue';
import SignupView from './views/SignupView.vue';

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: LoginView, meta: { guestOnly: true } },
  { path: '/signup', component: SignupView, meta: { guestOnly: true } },
  { path: '/confirm', component: ConfirmView },
  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    try {
      await authApi.me();
    } catch {
      return { path: '/login', query: { redirect: to.fullPath } };
    }
  }

  if (to.meta.guestOnly) {
    try {
      await authApi.me();
      return '/dashboard';
    } catch {
      // L’utilisateur n’est pas connecté : la page invitée reste accessible.
    }
  }
});

export default router;
