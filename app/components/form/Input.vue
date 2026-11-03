<template>
  <div
    class="input"
    :class="[
      attrs.class,
      {
        'input--compact': size === 'compact',
        'input--multiline': multiline,
        'input--invalid': Boolean(error),
      },
    ]"
    :style="attrs.style as StyleValue"
  >
    <label v-if="label" class="input__label" :for="inputId">{{ label }}</label>
    <component
      :is="multiline ? 'textarea' : 'input'"
      v-bind="getControlAttrs()"
      :id="inputId"
      ref="element"
      class="input__control"
      :type="multiline ? undefined : type"
      :rows="multiline ? rows : undefined"
      :value="model"
      @input="updateValue"
      @blur="emit('blur', $event)"
    />
    <div v-if="error || hint" class="input__message">
      {{ error || hint }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InputTypeHTMLAttribute, StyleValue } from 'vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    id?: string;
    label?: string;
    type?: InputTypeHTMLAttribute;
    size?: 'default' | 'compact';
    multiline?: boolean;
    rows?: number;
    hint?: string;
    error?: string;
  }>(),
  { type: 'text', size: 'default', multiline: false, rows: 3 },
);

const model = defineModel<string>({ required: true });
const emit = defineEmits<{
  blur: [event: FocusEvent];
}>();
const attrs = useAttrs();
const generatedId = useId();
const inputId = computed(() => props.id ?? generatedId);
const element = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>('element');

function getControlAttrs() {
  const controlAttrs = { ...attrs };
  delete controlAttrs.class;
  delete controlAttrs.style;

  return controlAttrs;
}

function updateValue(event: Event) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    model.value = event.target.value;
  }
}

defineExpose({
  element,
  focus: () => element.value?.focus(),
});
</script>

<style scoped lang="scss">
.input {
  min-width: 0;

  &__label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
  }

  &__control {
    width: 100%;
    min-width: 0;
    min-height: 48px;
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--input-text-color, var(--color-text));
    text-decoration: var(--input-text-decoration, none);

    &::placeholder {
      color: var(--color-muted);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }

  &__message {
    margin: 8px 0 0;
    color: var(--color-muted);
    font-size: 13px;
  }

  &--compact &__label {
    margin-bottom: 6px;
    color: var(--color-muted);
    font-size: 13px;
    font-weight: 400;
  }

  &--compact &__control {
    min-height: 44px;
    padding: 8px 12px;
    border-radius: 6px;
  }

  &--multiline &__control {
    display: block;
    min-height: 72px;
    resize: vertical;
  }

  &--invalid &__control {
    border-color: var(--color-danger);
  }

  &--invalid &__message {
    color: var(--color-danger);
  }
}
</style>
