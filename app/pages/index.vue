<template>
  <main class="notes-page">
    <div class="container">
      <h1 class="notes-page__title">Мои заметки</h1>

      <div v-if="notes.length" class="notes-grid" aria-label="Заметки">
        <NoteCard v-for="note in notes" :key="note.id" :note="note" />
      </div>

      <section v-else class="empty-state" aria-labelledby="empty-title">
        <h2 id="empty-title" class="empty-state__title">Здесь будут ваши заметки</h2>
        <p class="empty-state__description">Создайте первую заметку и добавьте в неё задачи.</p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { Note } from '~/types/note'

const notes: Note[] = [
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
]
</script>
