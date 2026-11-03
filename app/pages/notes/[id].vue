<template>
  <main class="editor-page">
    <Container>
      <PageHeader :title="pageTitle" back-to="/" back-label="Все заметки" />

      <Notice v-if="notesStore.error">
        {{ notesStore.error }}
        <Button @click="retryLoading">Повторить загрузку</Button>
      </Notice>
      <Notice v-else-if="isDeleted">
        Эта заметка удалена в другой вкладке. Изменения не будут сохранены.
      </Notice>
      <Notice v-if="message" :variant="messageVariant">{{ message }}</Notice>

      <NoteEditor
        v-if="draft"
        :note="draft"
        :is-new="isNewNote"
        :is-dirty="isDirty"
        :unavailable="isDeleted"
        :show-errors="showErrors"
        @update-title="updateTitle"
        @add-todo="addTodo"
        @update-todo-text="updateTodoText"
        @update-todo-completed="updateTodoCompleted"
        @remove-todo="removeTodo"
        @save="saveNote"
        @cancel="cancelEditing"
        @delete="deleteNote"
      />

      <EmptyState
        v-else-if="!notesStore.error"
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
      :title="confirmationKind === 'delete' ? 'Удалить заметку?' : 'Отменить изменения'"
      :message="confirmationMessage"
      :confirm-text="
        confirmationKind === 'delete' ? 'Да, удалить заметку' : 'Да, отменить изменения'
      "
      :cancel-text="
        confirmationKind === 'delete' ? 'Оставить заметку' : 'Продолжить редактирование'
      "
      confirm-variant="danger"
      @confirm="finishConfirmation(true)"
      @cancel="finishConfirmation(false)"
    />
  </main>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { useNotesStore } from '~/stores/notes';
import type { Note } from '~/types/note';
import { cloneNote, getNoteValidationError } from '~/utils/note';

const route = useRoute();
const notesStore = useNotesStore();
const isNewNote = computed(() => route.params.id === 'new');
const draft = ref<Note | null>(null);
const initialSnapshot = ref('');
const showErrors = ref(false);
const message = ref('');
const messageVariant = ref<'error' | 'success'>('success');
const confirmationOpen = ref(false);
const confirmationKind = ref<'discard' | 'delete'>('discard');
let pendingConfirmation: Promise<boolean> | null = null;
let resolveConfirmation: ((confirmed: boolean) => void) | null = null;
const isDirty = computed(
  () => draft.value !== null && JSON.stringify(draft.value) !== initialSnapshot.value,
);
const isDeleted = computed(
  () =>
    !isNewNote.value &&
    draft.value !== null &&
    !notesStore.notes.some((note) => note.id === draft.value?.id),
);
const confirmationMessage = computed(() => {
  if (confirmationKind.value === 'delete') {
    return 'Заметка и все её задачи будут удалены без возможности восстановления.';
  }

  return 'Несохранённые изменения будут потеряны.';
});
const pageTitle = computed(() => {
  if (isNewNote.value) {
    return 'Новая заметка';
  }

  return draft.value ? 'Редактирование заметки' : 'Заметка не найдена';
});

useHead({
  title: pageTitle,
});

function loadDraft() {
  const id = String(route.params.id);

  if (id === 'new') {
    draft.value = { id: 'new', title: '', todos: [] };
  } else {
    draft.value = notesStore.getNote(id);
  }

  initialSnapshot.value = JSON.stringify(draft.value);
  showErrors.value = false;
  message.value = '';
}

watch(() => route.params.id, loadDraft, { immediate: true });

function retryLoading() {
  notesStore.load();

  if (!draft.value && !notesStore.error) {
    loadDraft();
  }
}

function requestConfirmation(kind: 'discard' | 'delete' = 'discard'): Promise<boolean> {
  if (pendingConfirmation) {
    if (confirmationKind.value !== kind) {
      return Promise.resolve(false);
    }

    return pendingConfirmation;
  }

  confirmationKind.value = kind;
  confirmationOpen.value = true;
  pendingConfirmation = new Promise<boolean>((resolve) => {
    resolveConfirmation = resolve;
  });

  return pendingConfirmation;
}

function finishConfirmation(confirmed: boolean) {
  confirmationOpen.value = false;
  const resolve = resolveConfirmation;
  resolveConfirmation = null;
  pendingConfirmation = null;
  resolve?.(confirmed);
}

async function saveNote() {
  if (!draft.value || !isDirty.value || isDeleted.value) {
    return;
  }

  showErrors.value = true;
  message.value = getNoteValidationError(draft.value);
  messageVariant.value = 'error';

  if (message.value) {
    return;
  }

  let savedNote: Note | null;

  if (isNewNote.value) {
    savedNote = notesStore.createNote(draft.value);
  } else {
    savedNote = notesStore.updateNote(draft.value);
  }

  if (!savedNote) {
    return;
  }

  draft.value = cloneNote(savedNote);
  initialSnapshot.value = JSON.stringify(draft.value);
  showErrors.value = false;

  if (isNewNote.value) {
    await navigateTo(`/notes/${savedNote.id}`, { replace: true });
  }

  messageVariant.value = 'success';
  message.value = 'Заметка сохранена.';
}

async function deleteNote() {
  if (!draft.value || isNewNote.value || isDeleted.value) {
    return;
  }

  const confirmed = await requestConfirmation('delete');

  if (confirmed && draft.value && notesStore.deleteNote(draft.value.id)) {
    draft.value = null;
    initialSnapshot.value = JSON.stringify(null);
    await navigateTo('/');
  }
}

async function cancelEditing() {
  if (!isDirty.value) {
    return;
  }

  const confirmed = await requestConfirmation();

  if (confirmed) {
    draft.value = JSON.parse(initialSnapshot.value) as Note | null;
    showErrors.value = false;
    message.value = '';
  }
}

onBeforeRouteLeave(() => {
  if (isDirty.value) {
    return requestConfirmation();
  }

  return true;
});

onBeforeRouteUpdate((to, from) => {
  if (to.params.id !== from.params.id && isDirty.value) {
    return requestConfirmation();
  }

  return true;
});

onBeforeUnmount(() => {
  finishConfirmation(false);
});

function updateTitle(value: string) {
  message.value = '';

  if (draft.value) {
    draft.value.title = value;
  }
}

function addTodo() {
  message.value = '';
  draft.value?.todos.push({ id: crypto.randomUUID(), text: '', completed: false });
}

function updateTodoText(id: string, value: string) {
  message.value = '';
  const todo = draft.value?.todos.find((item) => item.id === id);

  if (todo) {
    todo.text = value;
  }
}

function updateTodoCompleted(id: string, value: boolean) {
  message.value = '';
  const todo = draft.value?.todos.find((item) => item.id === id);

  if (todo) {
    todo.completed = value;
  }
}

function removeTodo(id: string) {
  message.value = '';

  if (draft.value) {
    draft.value.todos = draft.value.todos.filter((todo) => todo.id !== id);
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
