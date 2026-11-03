<template>
  <div class="note-card">
    <div class="note-card__title">{{ note.title }}</div>

    <ul v-if="previewTodos.length" class="note-card__todos">
      <li v-for="todo in previewTodos" :key="todo.id" class="note-card__todo">
        <Checkbox class="note-card__task" :model-value="todo.completed" size="small" disabled>
          <span :class="{ 'note-card__completed': todo.completed }">
            {{ todo.text }}
          </span>
        </Checkbox>
      </li>
    </ul>

    <div v-else class="note-card__hint">Задач пока нет</div>

    <div v-if="remainingCount > 0" class="note-card__hint">Ещё задач: {{ remainingCount }}</div>

    <div class="note-card__actions">
      <Button :to="`/notes/${note.id}`"> Изменить </Button>

      <Button variant="danger"> Удалить </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Note } from '~/types/note'

const props = defineProps<{
  note: Note
}>()

const previewTodos = computed(() => props.note.todos.slice(0, 3))
const remainingCount = computed(() => props.note.todos.length - previewTodos.value.length)
</script>

<style scoped lang="scss">
.note-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);

  &__title {
    margin: 0 0 20px;
    font-size: 20px;
    overflow-wrap: anywhere;
  }

  &__todos {
    display: grid;
    gap: 12px;
    margin: 0 0 20px;
    padding: 0;
    list-style: none;
  }

  &__task {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    overflow-wrap: anywhere;
  }

  &__completed {
    color: var(--color-muted);
    text-decoration: line-through;
  }

  &__hint {
    margin: 0 0 20px;
    color: var(--color-muted);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
    padding-top: 16px;
  }
}
</style>
