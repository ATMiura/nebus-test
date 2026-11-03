<template>
  <form
    ref="element"
    class="form"
    :class="{ 'form--panel': variant === 'panel' }"
    @submit.prevent="emit('submit', $event)"
  >
    <div v-if="title || $slots['header-actions']" class="form__header">
      <div v-if="title" class="form__title">{{ title }}</div>
      <div v-if="$slots['header-actions']" class="form__header-actions">
        <slot name="header-actions" />
      </div>
    </div>

    <div class="form__body">
      <slot />
    </div>

    <div v-if="$slots.status || $slots.actions || $slots.footer" class="form__footer">
      <div v-if="$slots.status" class="form__status" role="status">
        <slot name="status" />
      </div>
      <div v-if="$slots.actions" class="form__actions">
        <slot name="actions" />
      </div>
      <slot name="footer" />
    </div>
  </form>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'panel';
    title?: string;
  }>(),
  { variant: 'default' },
);

const emit = defineEmits<{
  submit: [event: SubmitEvent];
}>();

const element = useTemplateRef<HTMLFormElement>('element');

defineExpose({
  element,
  checkValidity: () => element.value?.checkValidity() ?? false,
  reportValidity: () => element.value?.reportValidity() ?? false,
});
</script>

<style scoped lang="scss">
.form {
  display: grid;
  gap: 24px;
  min-width: 0;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  &__header-actions,
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__body {
    display: grid;
    gap: 24px;
    min-width: 0;
  }

  &__footer {
    display: grid;
    gap: 16px;
  }

  &__status {
    color: var(--color-muted);
    font-size: 14px;
  }

  &--panel {
    gap: 32px;
    padding: 32px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
  }

  &--panel &__body {
    gap: 32px;
  }

  &--panel &__footer {
    padding-top: 24px;
    border-top: 1px solid var(--color-border);
  }
}

@media (max-width: 600px) {
  .form {
    &__header {
      align-items: flex-start;
      flex-direction: column;
    }

    &__header-actions {
      width: 100%;

      :deep(> *) {
        flex: 1;
      }
    }

    &__actions {
      flex-direction: column;
    }

    &--panel {
      gap: 24px;
      padding: 16px;
    }

    &--panel &__body {
      gap: 24px;
    }
  }
}
</style>
