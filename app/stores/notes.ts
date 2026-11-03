import { defineStore } from 'pinia'
import { ref } from 'vue'
import { demoNotes } from '../data/demo-notes'
import type { Note } from '../types/note'
import { cloneNote, getNoteValidationError } from '../utils/note'
import {
  NOTES_SCHEMA_VERSION,
  readSavedNotes,
  writeSavedNotes,
  type SavedNotes,
} from '../utils/notes-storage'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const error = ref('')
  let nextId = 1
  function applyData(data: SavedNotes) {
    notes.value = data.notes.map(cloneNote)
    nextId = data.nextId
    error.value = ''
  }
  function setError(cause: unknown) {
    error.value =
      cause instanceof Error ? cause.message : 'Не удалось выполнить действие с заметками.'
  }
  function getStorage(): Storage {
    try {
      return localStorage
    } catch {
      throw new Error(
        'Хранилище браузера недоступно. Разрешите сохранение данных и повторите загрузку.',
      )
    }
  }
  function load() {
    try {
      const storage = getStorage()
      let data = readSavedNotes(storage)
      if (data === null) {
        data = {
          version: NOTES_SCHEMA_VERSION,
          nextId: Math.max(0, ...demoNotes.map((note) => Number(note.id))) + 1,
          notes: demoNotes.map(cloneNote),
        }
        writeSavedNotes(storage, data)
      }
      applyData(data)
    } catch (cause) {
      setError(cause)
    }
  }
  function readLatest(): SavedNotes {
    const data = readSavedNotes(getStorage())
    if (data) {
      return data
    }
    return { version: NOTES_SCHEMA_VERSION, nextId, notes: [] }
  }
  function refresh() {
    try {
      applyData(readLatest())
    } catch (cause) {
      setError(cause)
    }
  }
  function getNote(id: string): Note | null {
    const note = notes.value.find((item) => item.id === id)
    if (note) {
      return cloneNote(note)
    }
    return null
  }
  function createNote(draft: Note): Note | null {
    try {
      const validationError = getNoteValidationError(draft)
      if (validationError) {
        throw new Error(validationError)
      }
      const data = readLatest()
      if (!Number.isSafeInteger(data.nextId + 1)) {
        throw new Error('Не удалось создать заметку: закончились доступные идентификаторы.')
      }
      const note = cloneNote(draft)
      note.id = String(data.nextId)
      data.nextId += 1
      data.notes.push(note)
      writeSavedNotes(getStorage(), data)
      applyData(data)
      return cloneNote(note)
    } catch (cause) {
      setError(cause)
      return null
    }
  }
  function updateNote(draft: Note): Note | null {
    try {
      const data = readLatest()
      const index = data.notes.findIndex((note) => note.id === draft.id)
      if (index === -1) {
        applyData(data)
        throw new Error('Эта заметка уже удалена. Сохранить изменения в неё нельзя.')
      }
      const validationError = getNoteValidationError(draft)
      if (validationError) {
        throw new Error(validationError)
      }
      const note = cloneNote(draft)
      data.notes[index] = note
      writeSavedNotes(getStorage(), data)
      applyData(data)
      return cloneNote(note)
    } catch (cause) {
      setError(cause)
      return null
    }
  }
  function deleteNote(id: string): boolean {
    try {
      const data = readLatest()
      const remainingNotes = data.notes.filter((note) => note.id !== id)
      if (remainingNotes.length !== data.notes.length) {
        data.notes = remainingNotes
        writeSavedNotes(getStorage(), data)
      }
      applyData(data)
      return true
    } catch (cause) {
      setError(cause)
      return false
    }
  }
  return { notes, error, load, refresh, getNote, createNote, updateNote, deleteNote }
})
