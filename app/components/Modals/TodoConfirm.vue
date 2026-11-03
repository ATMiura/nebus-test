<template>
  <Modal :model-value="open" :title="title" @update:model-value="updateOpen">
    <div>{{ message }}</div>

    <template #actions>
      <Button autofocus @click="emit('cancel')">{{ cancelText }}</Button>
      <Button :variant="confirmVariant" @click="emit('confirm')">{{ confirmText }}</Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger';
  }>(),
  {
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    confirmVariant: 'primary',
  },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function updateOpen(value: boolean) {
  if (!value) {
    emit('cancel');
  }
}
</script>
