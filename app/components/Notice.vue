<template>
  <div class="notice" :class="`notice--${variant}`">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'error' | 'success' }>(), { variant: 'error' })
</script>

<style scoped lang="scss">
.notice {
  display: grid;
  justify-items: start;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid currentColor;
  border-radius: 8px;
  line-height: 1.5;
  overflow-wrap: anywhere;

  &--error {
    color: var(--color-danger);
    background: #fff1f1;
  }

  &--success {
    color: #166534;
    background: #f0fdf4;
  }
}
</style>
