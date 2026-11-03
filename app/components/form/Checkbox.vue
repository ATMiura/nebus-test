<template>
  <label
    class="checkbox"
    :class="[attrs.class, { 'checkbox--small': size === 'small', 'checkbox--disabled': disabled }]"
    :style="attrs.style as StyleValue"
    :for="inputId"
  >
    <input
      v-bind="getControlAttrs()"
      :id="inputId"
      ref="element"
      class="checkbox__control"
      type="checkbox"
      :checked="model"
      :disabled="disabled"
      @change="updateValue"
      @blur="emit('blur', $event)"
    />
    <span v-if="label || $slots.default" class="checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import type { StyleValue } from 'vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    id?: string;
    label?: string;
    disabled?: boolean;
    size?: 'default' | 'small';
  }>(),
  { disabled: false, size: 'default' },
);

const model = defineModel<boolean>({ required: true });
const emit = defineEmits<{
  blur: [event: FocusEvent];
}>();
const attrs = useAttrs();
const generatedId = useId();
const inputId = computed(() => props.id ?? generatedId);
const element = useTemplateRef<HTMLInputElement>('element');

function getControlAttrs() {
  const controlAttrs = { ...attrs };
  delete controlAttrs.class;
  delete controlAttrs.style;

  return controlAttrs;
}

function updateValue(event: Event) {
  if (event.target instanceof HTMLInputElement) {
    model.value = event.target.checked;
  }
}

defineExpose({
  element,
  focus: () => element.value?.focus(),
});
</script>

<style scoped lang="scss">
.checkbox {
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 100%;
  cursor: pointer;

  &__control {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    margin: 2px 0 0;
    accent-color: var(--color-primary);
    cursor: inherit;
  }

  &__label {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  &--small &__control {
    width: 18px;
    height: 18px;
    margin-top: 3px;
  }

  &--disabled {
    cursor: default;
  }
}
</style>
