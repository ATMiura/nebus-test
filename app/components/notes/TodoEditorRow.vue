<template>
  <div class="todo-editor-row" :class="{ 'todo-editor-row--completed': todo.completed }">
    <div class="todo-editor-row__controls">
      <Checkbox
        :model-value="todo.completed"
        :label="`Задача ${position}`"
        @update:model-value="emit('update:completed', $event)"
      />

      <Button
        variant="danger"
        size="icon-small"
        :title="`Удалить задачу ${position}`"
        @click="emit('remove')"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path
            d="m6 6 8 8M14 6l-8 8"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </Button>
    </div>

    <Textarea
      ref="textInput"
      class="todo-editor-row__field"
      :model-value="todo.text"
      :error="showErrors && !todo.text.trim() ? 'Введите текст задачи или удалите её.' : undefined"
      :rows="2"
      size="compact"
      placeholder="Что нужно сделать?"
      @update:model-value="emit('update:text', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type Textarea from '~/components/form/Textarea.vue';
import type { TodoItem } from '~/types/note';

const props = defineProps<{
  todo: TodoItem;
  position: number;
  showErrors: boolean;
}>();

const emit = defineEmits<{
  'update:text': [value: string];
  'update:completed': [value: boolean];
  remove: [];
}>();

const textInput = useTemplateRef<InstanceType<typeof Textarea>>('textInput');
const id = computed(() => props.todo.id);

defineExpose({
  id,
  focus: () => textInput.value?.focus(),
});
</script>

<style scoped lang="scss">
.todo-editor-row {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;

  &__controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  &--completed &__field {
    --input-text-color: var(--color-muted);
    --input-text-decoration: line-through;
  }
}

@media (max-width: 600px) {
  .todo-editor-row {
    gap: 10px;
    padding: 12px;
  }
}
</style>
