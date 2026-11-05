<template>
  <Input ref="control" v-model="model" multiline :rows="rows" @blur="emit('blur', $event)" />
</template>

<script setup lang="ts">
import type Input from '~/components/form/Input.vue';

withDefaults(defineProps<{ rows?: number }>(), { rows: 3 });

const model = defineModel<string>({ required: true });

const emit = defineEmits<{
  blur: [event: FocusEvent];
}>();

const control = useTemplateRef<InstanceType<typeof Input>>('control');
const element = computed(() => control.value?.element ?? null);

defineExpose({
  element,
  focus: () => control.value?.focus(),
});
</script>
