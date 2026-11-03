<template>
  <main class="notes-page">
    <Container>
      <PageHeader title="Мои заметки" />

      <div v-if="notes.length" class="notes-grid">
        <NoteCard v-for="note in notes" :key="note.id" :note="note" />
      </div>

      <EmptyState
        v-else
        title="Здесь будут ваши заметки"
        description="Создайте первую заметку и добавьте в неё задачи."
      />
    </Container>
  </main>
</template>

<script setup lang="ts">
import { demoNotes } from '~/data/demo-notes'

useHead({
  title: 'Мои заметки',
})

const notes = demoNotes
</script>

<style scoped lang="scss">
.notes-page {
  padding-block: 48px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 20px;
}

@media (max-width: 600px) {
  .notes-page {
    padding-block: 24px;
  }
}
</style>
