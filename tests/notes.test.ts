import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNotesStore } from '../app/stores/notes';
import { demoNotes } from '../app/data/demo-notes';
import type { Note } from '../app/types/note';
import { NOTES_SCHEMA_VERSION, NOTES_STORAGE_KEY } from '../app/utils/notes-storage';

function createStorage() {
  const items = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => items.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      items.set(key, value);
    }),
  };
}

function makeDraft(): Note {
  return {
    id: 'new',
    title: 'Моя заметка',
    todos: [{ id: 'todo-1', text: 'Моя задача', completed: false }],
  };
}

let storage: ReturnType<typeof createStorage>;

beforeEach(() => {
  storage = createStorage();
  vi.stubGlobal('localStorage', storage);
  setActivePinia(createPinia());
});

describe('Стор заметок', () => {
  it('Загружает начальные заметки один раз', () => {
    const store = useNotesStore();

    store.load();

    expect(store.notes.map((note) => note.id)).toEqual(demoNotes.map((note) => note.id));
    expect(JSON.parse(storage.getItem(NOTES_STORAGE_KEY)!)).toMatchObject({
      version: NOTES_SCHEMA_VERSION,
      nextId: 21,
    });

    store.load();

    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('Правки черновика не меняют сохранённую заметку', () => {
    const store = useNotesStore();

    store.load();

    const original = store.getNote('1')!;
    const draft = store.getNote('1')!;
    const savedData = storage.getItem(NOTES_STORAGE_KEY);

    draft.title = 'Новое название';
    draft.todos[0]!.text = 'Новый текст задачи';
    draft.todos[0]!.completed = false;
    draft.todos.pop();

    expect(store.getNote('1')).toEqual(original);
    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(savedData);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('Создаёт заметку с новым числовым ID', () => {
    const store = useNotesStore();

    store.load();

    const draft = makeDraft();

    const saved = store.createNote(draft);

    expect(saved).toEqual({ ...draft, id: '21' });
    expect(draft.id).toBe('new');

    setActivePinia(createPinia());

    const reloaded = useNotesStore();

    reloaded.load();

    expect(reloaded.getNote('21')).toEqual(saved);
  });

  it('Сохраняет изменения заметки и её задач после повторной загрузки', () => {
    const store = useNotesStore();

    store.load();

    const draft = store.getNote('1')!;

    draft.title = 'Новое название';
    draft.todos.splice(0, 1);
    draft.todos[0]!.text = 'Изменённая задача';
    draft.todos[0]!.completed = true;
    draft.todos.push({ id: 'new-todo', text: 'Новая задача', completed: false });

    expect(store.updateNote(draft)).not.toBeNull();

    setActivePinia(createPinia());

    const reloaded = useNotesStore();

    reloaded.load();

    expect(reloaded.getNote('1')).toEqual(draft);
  });

  it('Удалённые заметки не появляются после повторной загрузки', () => {
    const store = useNotesStore();

    store.load();

    for (const note of [...store.notes]) {
      expect(store.deleteNote(note.id)).toBe(true);
    }

    setActivePinia(createPinia());

    const reloaded = useNotesStore();

    reloaded.load();

    expect(reloaded.notes).toEqual([]);
    expect(reloaded.getNote('1')).toBeNull();
  });

  it('Не сохраняет заметку с пустым названием', () => {
    const store = useNotesStore();

    store.load();

    const draft = store.getNote('1')!;

    draft.title = '   ';

    expect(store.createNote({ ...makeDraft(), title: '' })).toBeNull();
    expect(store.updateNote(draft)).toBeNull();
    expect(store.error).not.toBe('');
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('Не сохраняет задачу с пустым текстом', () => {
    const store = useNotesStore();

    store.load();

    const original = store.getNote('1')!;
    const draft = store.getNote('1')!;

    draft.todos[0]!.text = '   ';

    expect(store.updateNote(draft)).toBeNull();
    expect(store.getNote('1')).toEqual(original);
    expect(store.error).not.toBe('');
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });
});

describe('Хранение заметок', () => {
  it('Не перезаписывает повреждённые данные', () => {
    const raw = '{неверный JSON';

    storage.setItem(NOTES_STORAGE_KEY, raw);
    storage.setItem.mockClear();

    const store = useNotesStore();

    store.load();

    expect(store.error).not.toBe('');
    expect(store.notes).toEqual([]);
    expect(store.createNote(makeDraft())).toBeNull();
    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('Сообщает о неподдерживаемой версии данных', () => {
    const raw = JSON.stringify({ version: 99, nextId: 1, notes: [] });

    storage.setItem(NOTES_STORAGE_KEY, raw);
    storage.setItem.mockClear();

    const store = useNotesStore();

    store.load();

    expect(store.error).not.toBe('');
    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('Ошибка записи не меняет сохранённые заметки', () => {
    const store = useNotesStore();

    store.load();

    const original = store.getNote('1')!;
    const savedData = storage.getItem(NOTES_STORAGE_KEY);
    const draft = store.getNote('1')!;

    draft.title = 'Новое название';
    storage.setItem.mockImplementation(() => {
      throw new Error('Хранилище заполнено');
    });

    expect(store.updateNote(draft)).toBeNull();
    expect(store.createNote(makeDraft())).toBeNull();
    expect(store.deleteNote('1')).toBe(false);
    expect(store.getNote('1')).toEqual(original);
    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(savedData);
    expect(store.error).not.toBe('');
  });
});

describe('Синхронизация вкладок', () => {
  it('Подхватывает изменения из другой вкладки', () => {
    const first = useNotesStore();

    first.load();
    setActivePinia(createPinia());

    const second = useNotesStore();

    second.load();

    const draft = second.getNote('1')!;

    draft.title = 'Название из другой вкладки';

    expect(second.updateNote(draft)).not.toBeNull();

    const writes = storage.setItem.mock.calls.length;

    first.refresh();

    expect(first.getNote('1')!.title).toBe(draft.title);
    expect(storage.setItem).toHaveBeenCalledTimes(writes);
  });

  it('Не восстанавливает заметку, удалённую в другой вкладке', () => {
    const first = useNotesStore();

    first.load();

    const draft = first.getNote('1')!;

    draft.title = 'Мои несохранённые изменения';
    setActivePinia(createPinia());

    const second = useNotesStore();

    second.load();

    expect(second.deleteNote('1')).toBe(true);
    expect(first.updateNote(draft)).toBeNull();
    expect(first.error).not.toBe('');

    second.load();

    expect(first.getNote('1')).toBeNull();
    expect(second.getNote('1')).toBeNull();
  });
});
