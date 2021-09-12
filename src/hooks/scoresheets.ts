import { unref, isRef, watch } from 'vue'
import { db } from '../store/idbStore'
import { useDexieArray, useDexie } from './dexie'

import type { MaybeRef } from '@vueuse/shared'
import type { Entry, Scoresheet, Judge } from '../store/schema'

export function useScoresheets (entryIdRef: MaybeRef<Entry['id']>, judgeIdRef: MaybeRef<Judge['id'] | undefined>) {
  const { read, result } = useDexieArray<Scoresheet>({
    tableName: 'scoresheets',
    async read (scoresheets) {
      const entryId = unref(entryIdRef)
      const judgeId = unref(judgeIdRef)
      if (!entryId) return
      scoresheets.value = await db.scoresheets
        .where(!judgeId ? { entryId } : { entryId, judgeId })
        .sortBy('createdAt')
    }
  })

  if (isRef(entryIdRef)) watch(entryIdRef, () => read())
  if (isRef(judgeIdRef)) watch(judgeIdRef, () => read())

  return result
}

export function useScoresheet (scoresheetId: MaybeRef<Scoresheet['id'] | undefined>) {
  const { read, result } = useDexie<Scoresheet>({
    tableName: 'scoresheets',
    async read (scoresheet) {
      const key = unref(scoresheetId)
      if (!key) return
      scoresheet.value = await db.scoresheets.get(key)
    }
  })

  if (isRef(scoresheetId)) watch(scoresheetId, () => read())

  return result
}
