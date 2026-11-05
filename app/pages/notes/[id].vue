<template>
  <main class="editor-page" @keydown="handleKeydown">
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

      <Notice v-if="draftStorage.error.value">{{ draftStorage.error.value }}</Notice>

      <NoteEditor
        v-if="draft"
        :note="draft"
        :is-new="isNewNote"
        :is-dirty="isDirty"
        :can-undo="history.canUndo.value"
        :can-redo="history.canRedo.value"
        :unavailable="isDeleted"
        :show-errors="showErrors"
        @update-title="updateTitle"
        @add-todo="addTodo"
        @update-todo-text="updateTodoText"
        @update-todo-completed="updateTodoCompleted"
        @remove-todo="removeTodo"
        @blur="history.finishTextEdit"
        @undo="undo"
        @redo="redo"
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
      :title="confirmationContent.title"
      :message="confirmationContent.message"
      :confirm-text="confirmationContent.confirmText"
      :cancel-text="confirmationContent.cancelText"
      :confirm-variant="confirmationKind === 'restore' ? 'primary' : 'danger'"
      @confirm="finishConfirmation(true)"
      @cancel="finishConfirmation(false)"
    />
  </main>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { useNoteDraft } from '~/composables/useNoteDraft';
import { useNoteHistory } from '~/composables/useNoteHistory';
import { useNotesStore } from '~/stores/notes';
import type { Note } from '~/types/note';
import { cloneNote, getNoteValidationError } from '~/utils/note';

const route = useRoute();
const notesStore = useNotesStore();
const isNewNote = computed(() => route.params.id === 'new');
const draft = ref<Note | null>(null);
const history = useNoteHistory(() => draft.value);
const initialSnapshot = ref('');
const showErrors = ref(false);
const message = ref('');
const messageVariant = ref<'error' | 'success'>('success');
const confirmationOpen = ref(false);
const confirmationKind = ref<'discard' | 'delete' | 'restore'>('discard');

let loadingDraft = false;
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

const draftStorage = useNoteDraft(
  () => draft.value,
  () => isDirty.value,
);

const confirmationContent = computed(() => {
  if (confirmationKind.value === 'delete') {
    return {
      title: 'Удалить заметку?',
      message: 'Заметка и все её задачи будут удалены без возможности восстановления.',
      confirmText: 'Да, удалить заметку',
      cancelText: 'Оставить заметку',
    };
  }

  if (confirmationKind.value === 'restore') {
    return {
      title: 'Восстановить черновик?',
      message: 'Найдены несохранённые изменения этой заметки. Восстановить их?',
      confirmText: 'Восстановить',
      cancelText: 'Не восстанавливать',
    };
  }

  return {
    title: 'Отменить изменения',
    message: 'Несохранённые изменения будут потеряны.',
    confirmText: 'Да, отменить изменения',
    cancelText: 'Продолжить редактирование',
  };
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

async function loadDraft() {
  loadingDraft = true;
  draftStorage.stop();
  history.clear();

  const id = String(route.params.id);

  if (id === 'new') {
    draft.value = { id: 'new', title: '', todos: [] };
  } else {
    draft.value = notesStore.getNote(id);
  }

  initialSnapshot.value = JSON.stringify(draft.value);
  showErrors.value = false;
  message.value = '';

  if (!draft.value) {
    loadingDraft = false;

    return;
  }

  const savedDraft = draftStorage.read(id);

  if (savedDraft && JSON.stringify(savedDraft) !== initialSnapshot.value) {
    const confirmed = await requestConfirmation('restore');

    if (confirmed) {
      draft.value = cloneNote(savedDraft);
    } else {
      draftStorage.remove(id);
    }
  } else if (savedDraft) {
    draftStorage.remove(id);
  }

  loadingDraft = false;
}

watch(
  draft,
  () => {
    if (!loadingDraft) {
      draftStorage.scheduleSave();
    }
  },
  { deep: true, flush: 'sync' },
);

watch(() => route.params.id, loadDraft, { immediate: true });

function retryLoading() {
  notesStore.load();

  if (!draft.value && !notesStore.error) {
    loadDraft();
  }
}

function requestConfirmation(kind: 'discard' | 'delete' | 'restore' = 'discard'): Promise<boolean> {
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
  history.finishTextEdit();

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

  draftStorage.remove(draft.value.id);
  history.clear();
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
    draftStorage.remove(draft.value.id);
    history.clear();
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
    if (draft.value) {
      draftStorage.remove(draft.value.id);
    }

    history.clear();
    draft.value = JSON.parse(initialSnapshot.value) as Note | null;
    showErrors.value = false;
    message.value = '';
  }
}

async function confirmLeaving() {
  if (confirmationOpen.value) {
    return false;
  }

  if (!isDirty.value) {
    return true;
  }

  const confirmed = await requestConfirmation();

  if (confirmed && draft.value) {
    draftStorage.remove(draft.value.id);
  }

  return confirmed;
}

onBeforeRouteLeave(confirmLeaving);

onBeforeRouteUpdate((to, from) => {
  if (to.params.id !== from.params.id) {
    return confirmLeaving();
  }

  return true;
});

onMounted(() => {
  window.addEventListener('pagehide', draftStorage.flush);
});

onBeforeUnmount(() => {
  window.removeEventListener('pagehide', draftStorage.flush);
  draftStorage.flush();
  draftStorage.stop();
  history.clear();
  finishConfirmation(false);
});

function handleKeydown(event: KeyboardEvent) {
  if (
    !draft.value ||
    confirmationOpen.value ||
    event.defaultPrevented ||
    event.isComposing ||
    event.altKey ||
    (!event.ctrlKey && !event.metaKey) ||
    (event.code !== 'KeyZ' && event.key.toLowerCase() !== 'z')
  ) {
    return;
  }

  event.preventDefault();

  if (event.shiftKey) {
    redo();
  } else {
    undo();
  }
}

function undo() {
  message.value = '';
  history.undo();
}

function redo() {
  message.value = '';
  history.redo();
}

function updateTitle(value: string) {
  message.value = '';
  history.updateTitle(value);
}

function addTodo() {
  message.value = '';
  history.addTodo({ id: crypto.randomUUID(), text: '', completed: false });
}

function updateTodoText(id: string, value: string) {
  message.value = '';
  history.updateTodoText(id, value);
}

function updateTodoCompleted(id: string, value: boolean) {
  message.value = '';
  history.updateTodoCompleted(id, value);
}

function removeTodo(id: string) {
  message.value = '';
  history.removeTodo(id);
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
