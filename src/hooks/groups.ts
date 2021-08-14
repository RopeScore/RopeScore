import { unref, isRef, watch } from 'vue'
import { db } from '../store/idbStore'
import { useDexieArray, useDexie } from './dexie'

import type { MaybeRef } from '@vueuse/shared'
import type { Group } from '../store/schema'

export function useGroups () {
  return useDexieArray<Group>({
    table: 'groups',
    async read (groups) {
      groups.value = await db.groups.orderBy('name').toArray()
      groups.value.sort((a, b) => {
        if (!a.completedAt && b.completedAt) return -1
        if (a.completedAt && !b.completedAt) return 1
        return a.name.localeCompare(b.name)
      })
    }
  }).result
}

export function useGroup (id: MaybeRef<Group['id'] | undefined>) {
  const { read, result } = useDexie<Group>({
    table: 'groups',
    async read (group) {
      const key = unref(id)
      if (!key) return
      group.value = await db.groups.get(key)
    }
  })

  if (isRef(id)) watch(id, () => read())

  return result
}
