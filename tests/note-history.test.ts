import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '../app/types/note';
import { cloneNote } from '../app/utils/note';
import { useNoteHistory, TEXT_GROUP_DELAY } from '../app/composables/useNoteHistory';

function makeNote(): Note {
  return {
    id: '1',
    title: 'Список дел',
    todos: [
      { id: '1', text: 'Купить кофе', completed: false },
      { id: '2', text: 'Купить молоко', completed: false },
    ],
  };
}

let note: Note;
let history: ReturnType<typeof useNoteHistory>;

beforeEach(() => {
  vi.useFakeTimers();
  note = makeNote();
  history = useNoteHistory(() => note);
});

afterEach(() => {
  history.clear();
  vi.useRealTimers();
});

describe('История изменений заметки', () => {
  it('Отменяет и повторяет ввод отдельно для каждого поля', () => {
    const original = cloneNote(note);

    history.updateTitle('П');
    history.updateTitle('Планы');
    history.updateTodoText('1', 'Н');
    history.updateTodoText('1', 'Новая первая задача');
    history.updateTodoText('2', 'В');
    history.updateTodoText('2', 'Вторая задача');

    const changed = cloneNote(note);

    history.undo();
    expect(note.todos[1]!.text).toBe(original.todos[1]!.text);
    expect(note.todos[0]!.text).toBe('Новая первая задача');
    history.undo();
    expect(note.todos[0]!.text).toBe(original.todos[0]!.text);
    expect(note.title).toBe('Планы');
    history.undo();
    expect(note).toEqual(original);
    expect(history.canUndo.value).toBe(false);

    history.redo();
    history.redo();
    history.redo();

    expect(note).toEqual(changed);
    expect(history.canRedo.value).toBe(false);
  });

  it('Начинает новый шаг после завершения ввода или паузы', () => {
    history.updateTitle('Первое название');
    history.finishTextEdit();
    history.updateTitle('Второе название');
    vi.advanceTimersByTime(TEXT_GROUP_DELAY);
    history.updateTitle('Третье название');

    history.undo();
    expect(note.title).toBe('Второе название');
    history.undo();
    expect(note.title).toBe('Первое название');
    history.undo();
    expect(note.title).toBe('Список дел');
  });

  it('Записывает добавление, чекбокс и удаление задачи отдельными шагами', () => {
    const original = cloneNote(note);

    history.updateTitle('Новое название');
    history.addTodo({ id: '3', text: 'Новая задача', completed: false });
    history.updateTodoCompleted('1', true);
    history.removeTodo('1');

    const changed = cloneNote(note);

    history.undo();
    expect(note.todos[0]).toEqual({ ...original.todos[0], completed: true });
    history.undo();
    expect(note.todos[0]!.completed).toBe(false);
    history.undo();
    expect(note.todos).toEqual(original.todos);
    expect(note.title).toBe('Новое название');
    history.undo();
    expect(note).toEqual(original);

    history.redo();
    history.redo();
    history.redo();
    history.redo();

    expect(note).toEqual(changed);
  });

  it('Новая правка после отмены очищает повтор', () => {
    history.updateTitle('Первое название');
    history.finishTextEdit();
    history.updateTitle('Второе название');
    history.undo();

    expect(history.canRedo.value).toBe(true);

    history.updateTitle('Другое название');

    expect(history.canRedo.value).toBe(false);

    history.redo();

    expect(note.title).toBe('Другое название');
  });

  it('Хранит только последние 50 шагов', () => {
    for (let index = 1; index <= 55; index += 1) {
      history.updateTitle(`Название ${index}`);
      history.finishTextEdit();
    }

    for (let index = 0; index < 50; index += 1) {
      history.undo();
    }

    expect(note.title).toBe('Название 5');
    expect(history.canUndo.value).toBe(false);

    history.undo();

    expect(note.title).toBe('Название 5');

    for (let index = 0; index < 50; index += 1) {
      history.redo();
    }

    expect(note.title).toBe('Название 55');
    expect(history.canRedo.value).toBe(false);
  });

  it('Сброс очищает отмену, повтор и таймер ввода', () => {
    history.updateTitle('Первое название');
    history.finishTextEdit();
    history.updateTitle('Второе название');
    history.undo();

    expect(history.canUndo.value).toBe(true);
    expect(history.canRedo.value).toBe(true);

    history.clear();

    expect(history.canUndo.value).toBe(false);
    expect(history.canRedo.value).toBe(false);
    expect(note.title).toBe('Первое название');

    history.updateTitle('Третье название');
    history.clear();

    expect(vi.getTimerCount()).toBe(0);

    history.updateTitle('Четвёртое название');
    history.undo();

    expect(note.title).toBe('Третье название');
    expect(history.canUndo.value).toBe(false);
  });

  it('Не создаёт шаг для прежнего значения или ввода без итоговых изменений', () => {
    history.updateTitle(note.title);
    history.updateTodoText('1', note.todos[0]!.text);
    history.updateTodoCompleted('1', false);
    history.removeTodo('unknown');

    expect(history.canUndo.value).toBe(false);

    history.updateTitle('Временное название');
    history.updateTitle('Список дел');
    history.updateTodoText('1', 'Временный текст');
    history.updateTodoText('1', 'Купить кофе');

    expect(history.canUndo.value).toBe(false);
    expect(history.canRedo.value).toBe(false);
  });

  it('Сохраняет отдельную копию задачи для повторного добавления', () => {
    const todo = { id: '3', text: 'Новая задача', completed: false };

    history.addTodo(todo);
    todo.text = 'Изменение снаружи';
    note.todos[2]!.text = 'Изменение в черновике';

    history.undo();
    history.redo();

    expect(note.todos[2]).toEqual({ id: '3', text: 'Новая задача', completed: false });
  });
});
