import { unref, isRef, watch } from 'vue'
import { db } from '../store/idbStore'
import { useDexieArray, useDexie } from './dexie'

import type { MaybeRef } from '@vueuse/shared'
import type { Category, Participant } from '../store/schema'

export function useParticipants (categoryId: MaybeRef<Category['id'] | undefined>) {
  const { read, result } = useDexieArray<Participant>({
    table: 'participants',
    async read (participants) {
      const key = unref(categoryId)
      if (!key) return
      participants.value = await db.participants.where('categoryId').equals(key).sortBy('id')
    }
  })

  if (isRef(categoryId)) watch(categoryId, () => read())

  return result
}

export function useParticipant (participantId: MaybeRef<Participant['id'] | undefined>) {
  const { read, result } = useDexie<Participant>({
    table: 'participants',
    async read (participant) {
      const key = unref(participantId)
      if (typeof key !== 'number') return
      participant.value = await db.participants.get(key as unknown as string)
    }
  })

  if (isRef(participantId)) watch(participantId, () => read())

  return result
}
