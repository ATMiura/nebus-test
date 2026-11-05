import type { Note, TodoItem } from '../types/note';

export const NOTES_STORAGE_KEY = 'nebus-notes';
export const NOTES_SCHEMA_VERSION = 1;

export interface SavedNotes {
  version: number;
  nextId: number;
  notes: Note[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTodo(value: unknown): value is TodoItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.text === 'string' &&
    value.text.trim().length > 0 &&
    typeof value.completed === 'boolean'
  );
}

function isNote(value: unknown): value is Note {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.id !== 'string' ||
    !/^[1-9]\d*$/.test(value.id) ||
    !Number.isSafeInteger(Number(value.id)) ||
    typeof value.title !== 'string' ||
    !value.title.trim() ||
    !Array.isArray(value.todos) ||
    !value.todos.every(isTodo)
  ) {
    return false;
  }

  return new Set(value.todos.map((todo) => todo.id)).size === value.todos.length;
}

export function readSavedNotes(): { data: SavedNotes | null; error: string } {
  let data: unknown;

  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);

    if (raw === null) {
      return { data: null, error: '' };
    }

    data = JSON.parse(raw);
  } catch {
    return {
      data: null,
      error:
        'Не удалось прочитать заметки: данные повреждены или хранилище недоступно. Исходные данные не изменены.',
    };
  }

  if (!isRecord(data)) {
    return { data: null, error: 'Неверный формат сохранённых заметок. Данные не изменены.' };
  }

  if (data.version !== NOTES_SCHEMA_VERSION) {
    return {
      data: null,
      error: 'Версия сохранённых заметок не поддерживается. Данные не изменены.',
    };
  }

  if (
    !Array.isArray(data.notes) ||
    !data.notes.every(isNote) ||
    typeof data.nextId !== 'number' ||
    !Number.isSafeInteger(data.nextId) ||
    data.nextId < 1
  ) {
    return { data: null, error: 'Неверный формат сохранённых заметок. Данные не изменены.' };
  }

  const nextId = data.nextId;
  const ids = data.notes.map((note) => note.id);

  if (new Set(ids).size !== ids.length || data.notes.some((note) => Number(note.id) >= nextId)) {
    return {
      data: null,
      error: 'Неверные идентификаторы сохранённых заметок. Данные не изменены.',
    };
  }

  return {
    data: { version: data.version, nextId: data.nextId, notes: data.notes },
    error: '',
  };
}

export function writeSavedNotes(data: SavedNotes): string {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(data));

    return '';
  } catch {
    return 'Не удалось сохранить заметки. Хранилище браузера недоступно или заполнено.';
  }
}
