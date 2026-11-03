import type { Note } from '../types/note'

export function cloneNote(note: Note): Note {
  return { ...note, todos: note.todos.map((todo) => ({ ...todo })) }
}
export function getNoteValidationError(note: Note): string {
  if (!note.title.trim()) {
    return 'Введите название заметки.'
  }
  const emptyTodoIndex = note.todos.findIndex((todo) => !todo.text.trim())
  if (emptyTodoIndex !== -1) {
    return `Введите текст задачи ${emptyTodoIndex + 1} или удалите её.`
  }
  return ''
}
