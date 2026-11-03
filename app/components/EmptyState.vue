<template>
  <div class="empty-state">
    <div class="empty-state__title">{{ title }}</div>
    <div v-if="description" class="empty-state__description">{{ description }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<style scoped lang="scss">
.empty-state {
  padding: 64px 24px;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  text-align: center;

  &__title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
  }

  &__description {
    margin: 12px 0 0;
    color: var(--color-muted);
  }
}

@media (max-width: 600px) {
  .empty-state {
    padding: 40px 20px;
  }
}
</style>
