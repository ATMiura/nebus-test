<template>
  <main class="editor-page">
    <Container>
      <PageHeader :title="pageTitle" back-to="/" back-label="Все заметки" />

      <NoteEditor
        v-if="draft"
        :note="draft"
        :is-new="isNewNote"
        :is-dirty="isDirty"
        @update-title="updateTitle"
        @add-todo="addTodo"
        @update-todo-text="updateTodoText"
        @update-todo-completed="updateTodoCompleted"
        @remove-todo="removeTodo"
      />

      <EmptyState
        v-else
        title="Заметка не найдена"
        description="Возможно, заметка была удалена или адрес указан неверно."
      >
        <Button class="editor-page__create" variant="primary" to="/notes/new">
          Создать заметку
        </Button>
      </EmptyState>
    </Container>
  </main>
</template>

<script setup lang="ts">
import { demoNotes } from '~/data/demo-notes'
import type { Note } from '~/types/note'

const route = useRoute()
const isNewNote = computed(() => route.params.id === 'new')
const draft = ref<Note | null>(null)
const initialSnapshot = ref('')
const isDirty = computed(
  () => draft.value !== null && JSON.stringify(draft.value) !== initialSnapshot.value,
)
const pageTitle = computed(() => {
  if (isNewNote.value) {
    return 'Новая заметка'
  }
  return draft.value ? 'Редактирование заметки' : 'Заметка не найдена'
})

watch(
  () => route.params.id,
  (id) => {
    const source = demoNotes.find((note) => note.id === id)
    draft.value =
      id === 'new'
        ? { id: 'new', title: '', todos: [] }
        : source
          ? { ...source, todos: source.todos.map((todo) => ({ ...todo })) }
          : null
    initialSnapshot.value = JSON.stringify(draft.value)
  },
  { immediate: true },
)

function updateTitle(value: string) {
  if (draft.value) {
    draft.value.title = value
  }
}

function addTodo() {
  draft.value?.todos.push({ id: crypto.randomUUID(), text: '', completed: false })
}

function updateTodoText(id: string, value: string) {
  const todo = draft.value?.todos.find((item) => item.id === id)
  if (todo) {
    todo.text = value
  }
}

function updateTodoCompleted(id: string, value: boolean) {
  const todo = draft.value?.todos.find((item) => item.id === id)
  if (todo) {
    todo.completed = value
  }
}

function removeTodo(id: string) {
  if (draft.value) {
    draft.value.todos = draft.value.todos.filter((todo) => todo.id !== id)
  }
}
</script>

<style scoped lang="scss">
.editor-page {
  padding-block: 48px;

  &__create {
    margin-top: 24px;
  }
}

@media (max-width: 600px) {
  .editor-page {
    padding-block: 24px;
  }
}
</style>
