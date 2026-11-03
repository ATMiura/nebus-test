import type { Note } from '~/types/note';

export const demoNotes: Note[] = [
  {
    id: '1',
    title: 'Планы на неделю',
    todos: [
      { id: '1', text: 'Обновить резюме', completed: true },
      { id: '2', text: 'Выполнить тестовое задание', completed: false },
      { id: '3', text: 'Подготовиться к собеседованию', completed: false },
      { id: '4', text: 'Разобрать рабочие заметки', completed: false },
    ],
  },
  {
    id: '2',
    title: 'Покупки',
    todos: [
      { id: '1', text: 'Кофе', completed: true },
      { id: '2', text: 'Молоко', completed: false },
    ],
  },
  {
    id: '3',
    title: 'Идеи',
    todos: [],
  },
];
