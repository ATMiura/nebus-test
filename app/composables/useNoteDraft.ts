import { ref } from 'vue';
import type { Note } from '../types/note';

const DRAFT_SCHEMA_VERSION = 1;
const DRAFT_SAVE_DELAY = 500;
const DRAFT_KEY_PREFIX = 'nebus-note-draft:';

function isDraft(value: unknown, id: string): value is Note {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const note = value as Record<string, unknown>;

  if (note.id !== id || typeof note.title !== 'string' || !Array.isArray(note.todos)) {
    return false;
  }

  const validTodos = note.todos.every((todo: unknown) => {
    if (typeof todo !== 'object' || todo === null) {
      return false;
    }

    const item = todo as Record<string, unknown>;

    return (
      typeof item.id === 'string' &&
      item.id.length > 0 &&
      typeof item.text === 'string' &&
      typeof item.completed === 'boolean'
    );
  });

  return validTodos && new Set(note.todos.map((todo) => todo.id)).size === note.todos.length;
}

export function useNoteDraft(getNote: () => Note | null, isDirty: () => boolean) {
  const error = ref('');

  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  function stop() {
    clearTimeout(saveTimer);
    saveTimer = undefined;
  }

  function read(id: string): Note | null {
    try {
      const raw = localStorage.getItem(DRAFT_KEY_PREFIX + id);

      if (raw === null) {
        error.value = '';

        return null;
      }

      const data = JSON.parse(raw);

      if (data?.version !== DRAFT_SCHEMA_VERSION || !isDraft(data.note, id)) {
        error.value = 'Не удалось восстановить черновик: неверный формат данных.';

        return null;
      }

      error.value = '';

      return data.note;
    } catch {
      error.value = 'Не удалось прочитать черновик: данные повреждены или хранилище недоступно.';

      return null;
    }
  }

  function remove(id: string) {
    stop();

    try {
      localStorage.removeItem(DRAFT_KEY_PREFIX + id);
      error.value = '';
    } catch {
      error.value = 'Не удалось удалить черновик из хранилища браузера.';
    }
  }

  function save() {
    stop();

    const note = getNote();

    if (!note) {
      return;
    }

    if (!isDirty()) {
      remove(note.id);

      return;
    }

    try {
      localStorage.setItem(
        DRAFT_KEY_PREFIX + note.id,
        JSON.stringify({ version: DRAFT_SCHEMA_VERSION, note }),
      );
      error.value = '';
    } catch {
      error.value =
        'Не удалось сохранить черновик. При перезагрузке последние правки могут потеряться.';
    }
  }

  function scheduleSave() {
    stop();
    saveTimer = setTimeout(save, DRAFT_SAVE_DELAY);
  }

  function flush() {
    if (saveTimer !== undefined) {
      save();
    }
  }

  return { error, read, remove, scheduleSave, flush, stop };
}
