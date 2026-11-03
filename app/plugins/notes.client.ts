import { useNotesStore } from '~/stores/notes';
import { NOTES_STORAGE_KEY } from '~/utils/notes-storage';

export default defineNuxtPlugin((nuxtApp) => {
  const notesStore = useNotesStore(nuxtApp.$pinia);
  notesStore.load();

  function syncNotes(event: StorageEvent) {
    if (event.key !== NOTES_STORAGE_KEY && event.key !== null) {
      return;
    }

    if (event.storageArea === localStorage) {
      notesStore.refresh();
    }
  }

  window.addEventListener('storage', syncNotes);
  nuxtApp.vueApp.onUnmount(() => {
    window.removeEventListener('storage', syncNotes);
  });
});
