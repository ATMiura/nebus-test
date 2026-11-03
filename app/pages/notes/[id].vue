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
        @cancel="cancelEditing"
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

    <TodoConfirm
      :open="confirmationOpen"
      title="Отменить изменения"
      message="Несохранённые изменения будут потеряны."
      confirm-text="Да, отменить изменения"
      cancel-text="Продолжить редактирование"
      confirm-variant="danger"
      @confirm="finishConfirmation(true)"
      @cancel="finishConfirmation(false)"
    />
  </main>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { demoNotes } from '~/data/demo-notes'
import type { Note } from '~/types/note'

const route = useRoute()
const isNewNote = computed(() => route.params.id === 'new')
const draft = ref<Note | null>(null)
const initialSnapshot = ref('')
const confirmationOpen = ref(false)
let pendingConfirmation: Promise<boolean> | null = null
let resolveConfirmation: ((confirmed: boolean) => void) | null = null
const isDirty = computed(
  () => draft.value !== null && JSON.stringify(draft.value) !== initialSnapshot.value,
)
const pageTitle = computed(() => {
  if (isNewNote.value) {
    return 'Новая заметка'
  }
  return draft.value ? 'Редактирование заметки' : 'Заметка не найдена'
})

useHead({
  title: pageTitle,
})

watch(
  () => route.params.id,
  (id) => {
    const source = demoNotes.find((note) => note.id === id)
    if (id === 'new') {
      draft.value = { id: 'new', title: '', todos: [] }
    } else if (source) {
      draft.value = {
        ...source,
        todos: source.todos.map((todo) => ({ ...todo })),
      }
    } else {
      draft.value = null
    }
    initialSnapshot.value = JSON.stringify(draft.value)
  },
  { immediate: true },
)

function requestConfirmation() {
  if (pendingConfirmation) {
    return pendingConfirmation
  }

  confirmationOpen.value = true
  pendingConfirmation = new Promise<boolean>((resolve) => {
    resolveConfirmation = resolve
  })
  return pendingConfirmation
}

function finishConfirmation(confirmed: boolean) {
  confirmationOpen.value = false
  const resolve = resolveConfirmation
  resolveConfirmation = null
  pendingConfirmation = null
  resolve?.(confirmed)
}

async function cancelEditing() {
  const confirmed = await requestConfirmation()
  if (confirmed) {
    draft.value = JSON.parse(initialSnapshot.value) as Note | null
  }
}

onBeforeRouteLeave(() => {
  if (isDirty.value) {
    return requestConfirmation()
  }
  return true
})

onBeforeRouteUpdate((to, from) => {
  if (to.params.id !== from.params.id && isDirty.value) {
    return requestConfirmation()
  }
  return true
})

onBeforeUnmount(() => {
  finishConfirmation(false)
})

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
