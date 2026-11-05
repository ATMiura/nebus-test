<template>
  <main class="notes-page">
    <Container>
      <PageHeader title="Мои заметки" />

      <Notice v-if="notesStore.error">
        {{ notesStore.error }}
        <Button @click="notesStore.load">Повторить загрузку</Button>
      </Notice>

      <div v-if="notesStore.notes.length" class="notes-grid">
        <NoteCard
          v-for="note in visibleNotes"
          :key="note.id"
          :note="note"
          @remove="selectedNote = note"
        />
      </div>

      <EmptyState
        v-else-if="!notesStore.error"
        title="Здесь будут ваши заметки"
        description="Создайте первую заметку и добавьте в неё задачи."
      />
      <Pagination :current-page="currentPage" :page-count="pageCount" />
    </Container>

    <TodoConfirm
      :open="selectedNote !== null"
      title="Удалить заметку?"
      :message="`Заметка «${selectedNote?.title ?? ''}» будет удалена без возможности восстановления.`"
      confirm-text="Да, удалить заметку"
      confirm-variant="danger"
      @confirm="deleteNote"
      @cancel="selectedNote = null"
    />
  </main>
</template>

<script setup lang="ts">
import { useNotesStore } from '~/stores/notes';
import type { Note } from '~/types/note';

useHead({
  title: 'Мои заметки',
});

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();
const pageSize = 9;
const selectedNote = ref<Note | null>(null);

const pageCount = computed(() => Math.max(1, Math.ceil(notesStore.notes.length / pageSize)));

const currentPage = computed(() => {
  const value = route.query.page;

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return 1;
  }

  return Math.min(pageCount.value, Math.max(1, Number(value)));
});

const visibleNotes = computed(() => {
  const start = (currentPage.value - 1) * pageSize;

  return notesStore.notes.slice(start, start + pageSize);
});

watch(
  [() => route.query.page, pageCount],
  ([page]) => {
    if (page === undefined) {
      return;
    }

    const normalizedPage = currentPage.value === 1 ? undefined : String(currentPage.value);

    if (page !== normalizedPage) {
      router.replace({
        query: { ...route.query, page: normalizedPage },
        hash: route.hash,
      });
    }
  },
  { immediate: true },
);

function deleteNote() {
  if (selectedNote.value) {
    notesStore.deleteNote(selectedNote.value.id);
    selectedNote.value = null;
  }
}
</script>

<style scoped lang="scss">
.notes-page {
  padding-block: 48px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 20px;
}

@media (max-width: 600px) {
  .notes-page {
    padding-block: 24px;
  }
}
</style>
