<template>
  <Form class="note-editor" variant="panel" title="Содержимое заметки">
    <template #header-actions>
      <Button disabled>Отменить шаг</Button>
      <Button disabled>Повторить</Button>
    </template>

    <Input
      :model-value="note.title"
      label="Название заметки"
      placeholder="Например, планы на неделю"
      @update:model-value="emit('update-title', $event)"
    />

    <section class="note-editor__tasks">
      <div class="note-editor__tasks-header">
        <div class="note-editor__subheading">Задачи</div>
        <div class="note-editor__progress">
          Выполнено {{ completedCount }} из {{ note.todos.length }}
        </div>
      </div>

      <ul v-if="note.todos.length" class="note-editor__list">
        <li v-for="(todo, index) in note.todos" :key="todo.id">
          <TodoEditorRow
            ref="todoRows"
            :todo="todo"
            :position="index + 1"
            @update:text="emit('update-todo-text', todo.id, $event)"
            @update:completed="emit('update-todo-completed', todo.id, $event)"
            @remove="removeTodo(todo.id)"
          />
        </li>
      </ul>

      <div v-else class="note-editor__empty">Задач пока нет. Добавьте первую задачу к заметке.</div>

      <Button ref="addButton" class="note-editor__add" @click="addTodo">Добавить задачу</Button>
    </section>

    <template #status>
      {{ isDirty ? 'Есть несохранённые изменения' : 'Нет изменений' }}
    </template>

    <template #actions>
      <Button variant="primary" type="submit" disabled>Сохранить</Button>
      <Button :disabled="!isDirty" @click="emit('cancel')">Отменить редактирование</Button>
      <Button v-if="!isNew" variant="danger" disabled>Удалить заметку</Button>
    </template>
  </Form>
</template>

<script setup lang="ts">
import type Button from '~/components/form/Button.vue'
import type TodoEditorRow from '~/components/notes/TodoEditorRow.vue'
import type { Note } from '~/types/note'

const props = defineProps<{
  note: Note
  isNew: boolean
  isDirty: boolean
}>()

const emit = defineEmits<{
  'update-title': [value: string]
  'add-todo': []
  'update-todo-text': [id: string, value: string]
  'update-todo-completed': [id: string, value: boolean]
  'remove-todo': [id: string]
  cancel: []
}>()

const todoRows = useTemplateRef<InstanceType<typeof TodoEditorRow>[]>('todoRows')
const addButton = useTemplateRef<InstanceType<typeof Button>>('addButton')
const completedCount = computed(() => props.note.todos.filter((todo) => todo.completed).length)

function focusTodo(id: string) {
  todoRows.value?.find((row) => row.id === id)?.focus()
}

async function addTodo() {
  emit('add-todo')
  await nextTick()
  const todo = props.note.todos.at(-1)
  if (todo) {
    focusTodo(todo.id)
  }
}

async function removeTodo(id: string) {
  const index = props.note.todos.findIndex((todo) => todo.id === id)
  emit('remove-todo', id)
  await nextTick()
  const nextTodo = props.note.todos[Math.max(0, Math.min(index, props.note.todos.length - 1))]
  if (nextTodo) {
    focusTodo(nextTodo.id)
  } else {
    addButton.value?.focus()
  }
}
</script>

<style scoped lang="scss">
.note-editor {
  &__tasks {
    min-width: 0;
  }

  &__tasks-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }

  &__subheading {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  &__progress {
    margin: 0;
    color: var(--color-muted);
    font-size: 14px;
  }

  &__list {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__empty {
    margin: 0;
    padding: 24px;
    border: 1px dashed var(--color-border);
    border-radius: 8px;
    color: var(--color-muted);
    text-align: center;
  }

  &__add {
    margin-top: 16px;
  }
}

@media (max-width: 600px) {
  .note-editor {
    &__tasks-header {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }

    &__add {
      width: 100%;
    }
  }
}
</style>
