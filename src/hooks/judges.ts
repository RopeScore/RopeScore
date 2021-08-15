import { unref, isRef, watch } from 'vue'
import { db } from '../store/idbStore'
import { useDexieArray, useDexie } from './dexie'

import type { MaybeRef } from '@vueuse/shared'
import type { Group, Judge } from '../store/schema'

export function useJudges (groupId: MaybeRef<Group['id'] | undefined>) {
  const { read, result } = useDexieArray<Judge>({
    tableName: 'judges',
    async read (judges) {
      const key = unref(groupId)
      if (!key) return
      judges.value = await db.judges.where('groupId').equals(key).sortBy('id')
    }
  })

  if (isRef(groupId)) watch(groupId, () => read())

  return result
}

export function useJudge (judgeId: MaybeRef<Judge['id'] | undefined>) {
  const { read, result } = useDexie<Judge>({
    tableName: 'judges',
    async read (judge) {
      const key = unref(judgeId)
      if (typeof key !== 'number') return
      judge.value = await db.judges.get(key)
    }
  })

  if (isRef(judgeId)) watch(judgeId, () => read())

  return result
}
