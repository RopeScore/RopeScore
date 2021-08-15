import { unref, isRef, watch } from 'vue'
import { db } from '../store/idbStore'
import { useDexieArray, useDexie } from './dexie'

import type { MaybeRef } from '@vueuse/shared'
import type { JudgeAssignment, Category, Judge } from '../store/schema'

export function useJudgeAssignments (categoryId: MaybeRef<Category['id'] | undefined>) {
  const { read, result } = useDexieArray<JudgeAssignment>({
    tableName: 'judgeAssignments',
    async read (assignments) {
      const key = unref(categoryId)
      if (!key) return
      assignments.value = await db.judgeAssignments.where('categoryId').equals(key).sortBy('id')
    }
  })

  if (isRef(categoryId)) watch(categoryId, () => read())

  return result
}

export function useJudgeAssignment (judgeId: MaybeRef<Judge['id'] | undefined>) {
  const { read, result } = useDexie<JudgeAssignment>({
    tableName: 'judgeAssignments',
    async read (assignment) {
      const key = unref(judgeId)
      if (typeof key !== 'number') return
      assignment.value = await db.judgeAssignments.get(key)
    }
  })

  if (isRef(judgeId)) watch(judgeId, () => read())

  return result
}
