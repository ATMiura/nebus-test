import { defineStore } from 'pinia';
import { ref } from 'vue';
import { demoNotes } from '../data/demo-notes';
import type { Note } from '../types/note';
import { cloneNote, getNoteValidationError } from '../utils/note';
import {
  NOTES_SCHEMA_VERSION,
  readSavedNotes,
  writeSavedNotes,
  type SavedNotes,
} from '../utils/notes-storage';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([]);
  const error = ref('');

  let nextId = 1;

  function applyData(data: SavedNotes) {
    notes.value = data.notes.map(cloneNote);
    nextId = data.nextId;
    error.value = '';
  }

  function load() {
    const result = readSavedNotes();

    error.value = result.error;

    if (error.value) {
      return;
    }

    let data = result.data;

    if (data === null) {
      data = {
        version: NOTES_SCHEMA_VERSION,
        nextId: Math.max(0, ...demoNotes.map((note) => Number(note.id))) + 1,
        notes: demoNotes.map(cloneNote),
      };
      error.value = writeSavedNotes(data);

      if (error.value) {
        return;
      }
    }

    applyData(data);
  }

  function readLatest(): SavedNotes | null {
    const result = readSavedNotes();

    error.value = result.error;

    if (error.value) {
      return null;
    }

    if (result.data) {
      return result.data;
    }

    return { version: NOTES_SCHEMA_VERSION, nextId, notes: [] };
  }

  function refresh() {
    const data = readLatest();

    if (data) {
      applyData(data);
    }
  }

  function getNote(id: string): Note | null {
    const note = notes.value.find((item) => item.id === id);

    if (note) {
      return cloneNote(note);
    }

    return null;
  }

  function createNote(draft: Note): Note | null {
    error.value = getNoteValidationError(draft);

    if (error.value) {
      return null;
    }

    const data = readLatest();

    if (!data) {
      return null;
    }

    if (!Number.isSafeInteger(data.nextId + 1)) {
      error.value = 'Не удалось создать заметку: закончились доступные идентификаторы.';

      return null;
    }

    const note = cloneNote(draft);

    note.id = String(data.nextId);
    data.nextId += 1;
    data.notes.push(note);
    error.value = writeSavedNotes(data);

    if (error.value) {
      return null;
    }

    applyData(data);

    return cloneNote(note);
  }

  function updateNote(draft: Note): Note | null {
    const data = readLatest();

    if (!data) {
      return null;
    }

    const index = data.notes.findIndex((note) => note.id === draft.id);

    if (index === -1) {
      applyData(data);
      error.value = 'Эта заметка уже удалена. Сохранить изменения в неё нельзя.';

      return null;
    }

    error.value = getNoteValidationError(draft);

    if (error.value) {
      return null;
    }

    const note = cloneNote(draft);

    data.notes[index] = note;
    error.value = writeSavedNotes(data);

    if (error.value) {
      return null;
    }

    applyData(data);

    return cloneNote(note);
  }

  function deleteNote(id: string): boolean {
    const data = readLatest();

    if (!data) {
      return false;
    }

    const remainingNotes = data.notes.filter((note) => note.id !== id);

    if (remainingNotes.length !== data.notes.length) {
      data.notes = remainingNotes;
      error.value = writeSavedNotes(data);

      if (error.value) {
        return false;
      }
    }

    applyData(data);

    return true;
  }

  return { notes, error, load, refresh, getNote, createNote, updateNote, deleteNote };
});
