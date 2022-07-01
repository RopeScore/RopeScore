import { unref, isRef, watch } from 'vue'
import { db } from '../store/idbStore'
import { useDexieArray, useDexie } from './dexie'

import type { MaybeRef } from '@vueuse/core'
import type { JudgeAssignment, Category, Judge, CompetitionEvent } from '../store/schema'

export function useJudgeAssignments (categoryId: MaybeRef<Category['id'] | undefined>, competitionEventRef?: MaybeRef<CompetitionEvent | undefined>) {
  const { read, result } = useDexieArray<JudgeAssignment>({
    tableName: 'judgeAssignments',
    async read (assignments) {
      const competitionId = unref(categoryId)
      if (!competitionId) return
      const competitionEvent = unref(competitionEventRef)
      assignments.value = await db.judgeAssignments.where({
        categoryId,
        ...(competitionEvent ? { competitionEvent } : {})
      }).sortBy('id')
    }
  })

  if (isRef(categoryId)) watch(categoryId, () => read())

  return result
}

export function useJudgeAssignment (
  judgeIdRef: MaybeRef<Judge['id'] | undefined>,
  categoryIdRef: MaybeRef<Category['id'] | undefined>,
  competitionEventRef: MaybeRef<CompetitionEvent | undefined>
) {
  const { read, result } = useDexie<JudgeAssignment>({
    tableName: 'judgeAssignments',
    async read (assignment) {
      const judgeId = unref(judgeIdRef)
      const categoryId = unref(categoryIdRef)
      const competitionEvent = unref(competitionEventRef)
      if (typeof judgeId !== 'number' || !categoryId || !competitionEvent) return
      assignment.value = await db.judgeAssignments.get({ judgeId, categoryId, competitionEvent })
    }
  })

  if (isRef(judgeIdRef)) watch(judgeIdRef, () => read())
  if (isRef(categoryIdRef)) watch(categoryIdRef, () => read())
  if (isRef(competitionEventRef)) watch(competitionEventRef, () => read())

  return result
}
