<template>
  <div class="page-header">
    <NuxtLink v-if="backTo" class="page-header__back" :to="backTo">
      {{ backLabel }}
    </NuxtLink>

    <div class="page-header__title">{{ title }}</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    backTo?: string
    backLabel?: string
  }>(),
  {
    backLabel: '← Назад',
  },
)
</script>

<style scoped lang="scss">
.page-header {
  margin-bottom: 32px;

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    color: var(--color-primary);
    text-underline-offset: 4px;
  }

  &__title {
    margin: 0;
    font-size: clamp(28px, 4vw, 36px);
    line-height: 1.2;
    overflow-wrap: anywhere;
    font-weight: 700;
  }
}
</style>
