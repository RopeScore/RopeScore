import { unref, isRef, watch } from 'vue'
import { db } from '../store/idbStore'
import { useDexieArray, useDexie } from './dexie'

import type { MaybeRef } from '@vueuse/core'
import type { Category, Entry, Participant, CompetitionEvent } from '../store/schema'

export function useEntries (categoryId: MaybeRef<Category['id'] | undefined>) {
  const { read, result } = useDexieArray<Entry>({
    tableName: 'entries',
    async read (entries) {
      const key = unref(categoryId)
      if (!key) return
      entries.value = await db.entries.where('categoryId').equals(key).sortBy('id')
    }
  })

  if (isRef(categoryId)) watch(categoryId, () => read())

  return result
}

export function useEntry (entryId: MaybeRef<Entry['id'] | undefined>) {
  const { read, result } = useDexie<Entry>({
    tableName: 'entries',
    async read (entry) {
      const key = unref(entryId)
      if (!key) return
      entry.value = await db.entries.get(key)
    }
  })

  if (isRef(entryId)) watch(entryId, () => read())

  return result
}

export function useFindEntry (
  categoryIdRef: MaybeRef<Category['id'] | undefined>,
  participantIdRef: MaybeRef<Participant['id'] | undefined>,
  competitionEventRef: MaybeRef<CompetitionEvent | undefined>
) {
  const { read, result } = useDexie<Entry>({
    tableName: 'entries',
    async read (entry) {
      const categoryId = unref(categoryIdRef)
      const participantId = unref(participantIdRef)
      const competitionEvent = unref(competitionEventRef)
      if (!categoryId || !participantId || !competitionEvent) return
      entry.value = await db.entries.where({
        categoryId,
        participantId,
        competitionEvent
      }).first()
    }
  })

  if (isRef(categoryIdRef)) watch(categoryIdRef, () => read())
  if (isRef(participantIdRef)) watch(participantIdRef, () => read())
  if (isRef(competitionEventRef)) watch(competitionEventRef, () => read())

  return result
}
