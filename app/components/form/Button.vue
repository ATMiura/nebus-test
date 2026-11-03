<template>
  <component
    :is="isLink ? NuxtLink : 'button'"
    ref="element"
    class="button"
    :class="[
      `button--${variant}`,
      { 'button--icon': size !== 'default', 'button--icon-small': size === 'icon-small' },
    ]"
    :to="isLink ? to : undefined"
    :type="isLink ? undefined : type"
    :disabled="isLink ? undefined : disabled"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { NuxtLink } from '#components';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger';
    type?: 'button' | 'submit' | 'reset';
    size?: 'default' | 'icon' | 'icon-small';
    disabled?: boolean;
    to?: RouteLocationRaw;
  }>(),
  { variant: 'secondary', type: 'button', size: 'default', disabled: false },
);

const isLink = computed(() => props.to !== undefined && !props.disabled);
const element = useTemplateRef<HTMLButtonElement | ComponentPublicInstance>('element');

function focus() {
  const control = element.value instanceof HTMLElement ? element.value : element.value?.$el;

  if (control instanceof HTMLElement) {
    control.focus();
  }
}

defineExpose({ focus });
</script>

<style scoped lang="scss">
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &--primary {
    background: var(--color-primary);
    color: #fff;

    &:hover:not(:disabled) {
      @media (hover: hover) {
        background: var(--color-primary-hover);
      }
    }
  }

  &--secondary {
    border-color: var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);

    &:hover:not(:disabled) {
      @media (hover: hover) {
        background: var(--color-background);
      }
    }
  }

  &--danger {
    background: #fff0f0;
    color: var(--color-danger);

    &:hover:not(:disabled) {
      @media (hover: hover) {
        background: #ffe0e0;
      }
    }
  }

  &--icon {
    flex-shrink: 0;
    width: 44px;
    padding: 10px;
  }

  &--icon-small {
    width: 32px;
    min-height: 32px;
    padding: 6px;
    border-radius: 6px;
  }
}
</style>
