<template>
  <main class="auth-shell">
    <section class="auth-card card border-0 shadow-sm" aria-labelledby="auth-title">
      <div class="card-body p-4 p-md-5">
        <div class="brand-mark mb-4" aria-hidden="true">D</div>
        <p class="eyebrow mb-2">PERSONAL DASHBOARD</p>
        <h1 id="auth-title" class="h3 mb-2"><slot name="title" /></h1>
        <p class="text-secondary mb-4"><slot name="subtitle" /></p>
        <slot />
      </div>
    </section>
  </main>
</template>
