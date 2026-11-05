import { computed, ref } from 'vue';
import type { Note, TodoItem } from '../types/note';

export const TEXT_GROUP_DELAY = 1000;

const HISTORY_LIMIT = 50;

type TextChange =
  | { type: 'title'; before: string; after: string }
  | { type: 'todo-text'; id: string; before: string; after: string };

type HistoryChange =
  | TextChange
  | { type: 'todo-completed'; id: string; before: boolean; after: boolean }
  | { type: 'add-todo' | 'remove-todo'; todo: TodoItem; index: number };

export function useNoteHistory(getNote: () => Note | null) {
  const undoStack = ref<HistoryChange[]>([]);
  const redoStack = ref<HistoryChange[]>([]);
  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  let currentTextChange: TextChange | null = null;
  let textTimer: ReturnType<typeof setTimeout> | undefined;

  function finishTextEdit() {
    clearTimeout(textTimer);
    textTimer = undefined;
    currentTextChange = null;
  }

  function recordChange(change: HistoryChange) {
    undoStack.value.push(change);
    redoStack.value = [];

    if (undoStack.value.length > HISTORY_LIMIT) {
      undoStack.value.shift();
    }
  }

  function recordTextChange(change: TextChange) {
    const previous = currentTextChange;
    const sameTitle = previous?.type === 'title' && change.type === 'title';

    const sameTodo =
      previous?.type === 'todo-text' && change.type === 'todo-text' && previous.id === change.id;

    if (previous && (sameTitle || sameTodo)) {
      previous.after = change.after;
      redoStack.value = [];

      if (previous.before === previous.after) {
        undoStack.value.pop();
        finishTextEdit();

        return;
      }
    } else {
      recordChange(change);
      currentTextChange = change;
    }

    clearTimeout(textTimer);
    textTimer = setTimeout(finishTextEdit, TEXT_GROUP_DELAY);
  }

  function updateTitle(value: string) {
    const note = getNote();

    if (!note || note.title === value) {
      return;
    }

    const before = note.title;

    note.title = value;
    recordTextChange({ type: 'title', before, after: value });
  }

  function updateTodoText(id: string, value: string) {
    const todo = getNote()?.todos.find((item) => item.id === id);

    if (!todo || todo.text === value) {
      return;
    }

    const before = todo.text;

    todo.text = value;
    recordTextChange({ type: 'todo-text', id, before, after: value });
  }

  function updateTodoCompleted(id: string, value: boolean) {
    const todo = getNote()?.todos.find((item) => item.id === id);

    if (!todo || todo.completed === value) {
      return;
    }

    finishTextEdit();

    const before = todo.completed;

    todo.completed = value;
    recordChange({ type: 'todo-completed', id, before, after: value });
  }

  function addTodo(todo: TodoItem) {
    const note = getNote();

    if (!note) {
      return;
    }

    finishTextEdit();

    const index = note.todos.length;

    note.todos.push({ ...todo });
    recordChange({ type: 'add-todo', todo: { ...todo }, index });
  }

  function removeTodo(id: string) {
    const note = getNote();

    if (!note) {
      return;
    }

    const index = note.todos.findIndex((todo) => todo.id === id);
    const todo = note.todos[index];

    if (!todo) {
      return;
    }

    finishTextEdit();
    note.todos.splice(index, 1);
    recordChange({ type: 'remove-todo', todo: { ...todo }, index });
  }

  function applyChange(change: HistoryChange, direction: 'undo' | 'redo') {
    const note = getNote();

    if (!note) {
      return;
    }

    if (change.type === 'title') {
      note.title = direction === 'undo' ? change.before : change.after;
    } else if (change.type === 'todo-text') {
      const todo = note.todos.find((item) => item.id === change.id);

      if (todo) {
        todo.text = direction === 'undo' ? change.before : change.after;
      }
    } else if (change.type === 'todo-completed') {
      const todo = note.todos.find((item) => item.id === change.id);

      if (todo) {
        todo.completed = direction === 'undo' ? change.before : change.after;
      }
    } else if (
      (change.type === 'add-todo' && direction === 'redo') ||
      (change.type === 'remove-todo' && direction === 'undo')
    ) {
      note.todos.splice(change.index, 0, { ...change.todo });
    } else {
      const index = note.todos.findIndex((todo) => todo.id === change.todo.id);

      if (index !== -1) {
        note.todos.splice(index, 1);
      }
    }
  }

  function undo() {
    finishTextEdit();

    if (!getNote()) {
      return;
    }

    const change = undoStack.value.pop();

    if (change) {
      applyChange(change, 'undo');
      redoStack.value.push(change);
    }
  }

  function redo() {
    finishTextEdit();

    if (!getNote()) {
      return;
    }

    const change = redoStack.value.pop();

    if (change) {
      applyChange(change, 'redo');
      undoStack.value.push(change);
    }
  }

  function clear() {
    finishTextEdit();
    undoStack.value = [];
    redoStack.value = [];
  }

  return {
    canUndo,
    canRedo,
    updateTitle,
    updateTodoText,
    updateTodoCompleted,
    addTodo,
    removeTodo,
    finishTextEdit,
    undo,
    redo,
    clear,
  };
}
