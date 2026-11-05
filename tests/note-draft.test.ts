import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNoteDraft } from '../app/composables/useNoteDraft';
import type { Note } from '../app/types/note';

function createStorage() {
  const items = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => items.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      items.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      items.delete(key);
    }),
  };
}

function makeDraft(): Note {
  return {
    id: 'new',
    title: '',
    todos: [{ id: 'todo-1', text: '', completed: false }],
  };
}

let storage: ReturnType<typeof createStorage>;

beforeEach(() => {
  vi.useFakeTimers();
  storage = createStorage();
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('Черновик заметки', () => {
  it('Сохраняет ввод после паузы и читает его после перезагрузки', () => {
    const note = makeDraft();

    const draft = useNoteDraft(
      () => note,
      () => true,
    );

    note.title = 'Первый ввод';
    draft.scheduleSave();
    vi.advanceTimersByTime(250);
    note.title = 'Последний ввод';
    draft.scheduleSave();
    vi.advanceTimersByTime(499);

    expect(storage.setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    const reloaded = useNoteDraft(
      () => null,
      () => false,
    );

    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(reloaded.read('new')).toEqual(note);
    expect(reloaded.error.value).toBe('');
  });

  it('Сразу записывает последние правки перед перезагрузкой', () => {
    const note = makeDraft();

    const draft = useNoteDraft(
      () => note,
      () => true,
    );

    draft.scheduleSave();
    note.title = 'Последняя буква';
    draft.flush();
    vi.runAllTimers();
    draft.flush();

    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(draft.read('new')?.title).toBe('Последняя буква');
  });

  it('Удаляет черновик и отменяет отложенную запись', () => {
    const note = makeDraft();

    let dirty = true;

    const draft = useNoteDraft(
      () => note,
      () => dirty,
    );

    draft.scheduleSave();
    draft.flush();
    draft.scheduleSave();
    draft.remove('new');
    vi.runAllTimers();
    draft.flush();

    expect(draft.read('new')).toBeNull();
    expect(storage.setItem).toHaveBeenCalledTimes(1);

    draft.scheduleSave();
    draft.flush();
    dirty = false;
    draft.scheduleSave();
    draft.flush();

    expect(draft.read('new')).toBeNull();
  });

  it('Не восстанавливает повреждённые данные и неподдерживаемую версию', () => {
    const note = makeDraft();

    const draft = useNoteDraft(
      () => note,
      () => true,
    );

    const invalidData = [
      '{broken',
      'null',
      JSON.stringify({ version: 2, note }),
      JSON.stringify({ version: 1, note: { ...note, id: 'other' } }),
      JSON.stringify({ version: 1, note: { ...note, todos: [null] } }),
      JSON.stringify({ version: 1, note: { ...note, todos: [note.todos[0], note.todos[0]] } }),
    ];

    for (const raw of invalidData) {
      storage.setItem('nebus-note-draft:new', raw);

      expect(draft.read('new')).toBeNull();
      expect(draft.error.value).not.toBe('');
      expect(storage.getItem('nebus-note-draft:new')).toBe(raw);
    }
  });

  it('Сообщает об ошибке хранилища и оставляет правки в памяти', () => {
    const note = makeDraft();

    const draft = useNoteDraft(
      () => note,
      () => true,
    );

    const fail = () => {
      throw new Error('Storage unavailable');
    };

    storage.getItem.mockImplementation(fail);
    storage.setItem.mockImplementation(fail);
    storage.removeItem.mockImplementation(fail);
    note.title = 'Сохрани меня';

    expect(draft.read('new')).toBeNull();
    expect(draft.error.value).not.toBe('');

    draft.scheduleSave();

    expect(() => draft.flush()).not.toThrow();
    expect(draft.error.value).not.toBe('');
    expect(note.title).toBe('Сохрани меня');
    expect(() => draft.remove('new')).not.toThrow();
    expect(draft.error.value).not.toBe('');
  });
});
