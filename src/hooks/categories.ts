import { unref, isRef, watch } from 'vue'
import { db } from '../store/idbStore'
import { useDexieArray, useDexie } from './dexie'

import type { MaybeRef } from '@vueuse/shared'
import type { Category, Group } from '../store/schema'

export function useCategories (groupId: MaybeRef<Group['id'] | undefined>) {
  const { read, result } = useDexieArray<Category>({
    tableName: 'categories',
    async read (categories) {
      const key = unref(groupId)
      if (!key) return
      categories.value = await db.categories.where('groupId').equals(key).sortBy('name')
    }
  })

  if (isRef(groupId)) watch(groupId, () => read())

  return result
}

export function useCategory (categoryId: MaybeRef<Category['id'] | undefined>) {
  const { read, result } = useDexie<Category>({
    tableName: 'categories',
    async read (category) {
      const key = unref(categoryId)
      if (!key) return
      category.value = await db.categories.get(key)
    }
  })

  if (isRef(categoryId)) watch(categoryId, () => read())

  return result
}
