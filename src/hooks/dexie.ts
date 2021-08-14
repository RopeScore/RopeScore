import { watch, ref } from 'vue'
import { emitters, db } from '../store/idbStore'

import type { Ref } from 'vue'
import type { Table, TableTypes } from '../store/idbStore'

interface UseDexieOptions<T, TRef = T> {
  read: (result: Ref<TRef | undefined>) => Promise<void>
  table: Table
}

export function useDexieArray<T extends TableTypes> ({ read, table }: UseDexieOptions<T, T[]>) {
  const result = ref<T[]>([]) as Ref<T[]>
  const firstFetch = ref(false)
  read(result).then(() => {
    firstFetch.value = true
  })

  const primaryKey = db[table].schema.primKey.keyPath as keyof TableTypes

  watch(emitters[table], () => { read(result) })
  watch(() => [...result.value], async (after, before) => {
    if (!firstFetch.value) return
    const idsBefore = new Map(before.map(ent => [ent[primaryKey], ent]))
    const idsAfter = new Map(after.map(ent => [ent[primaryKey], ent]))

    for (const [idAfter, ent] of idsAfter) {
      if (!idsBefore.has(idAfter)) {
        console.log('new', table)
        await db[table].put(JSON.parse(JSON.stringify(ent)), idAfter as unknown as string) // TODO better type guard
        continue
      }

      if (JSON.stringify(ent) !== JSON.stringify(idsBefore.get(idAfter))) {
        console.log('updated', table, idAfter)
        await db[table].update(idAfter as unknown as string, JSON.parse(JSON.stringify(ent)))
        continue
      }
    }

    for (const [idBefore] of idsBefore) {
      if (!idsAfter.has(idBefore) && idBefore != null) {
        console.log('deleted', table, idBefore)
        await db[table].delete(idBefore as unknown as string)
        continue
      }
    }
  }, { deep: true })

  return { read () { read(result) }, result }
}

export function useDexie<T extends TableTypes> ({ read, table }: UseDexieOptions<T>) {
  const result = ref<T>()
  read(result)

  const primaryKey = db[table].schema.primKey.keyPath as keyof TableTypes

  watch(emitters[table], async ([_, id]) => {
    if (!id || id !== result.value?.[primaryKey]) return

    result.value = await db[table].get(id) as T
  })
  watch(() => result.value ? JSON.parse(JSON.stringify(result.value)) : null, async (after, before) => {
    if (!before) return

    if (!after) {
      console.log('deleted', table, before[primaryKey])
      await db[table].delete(before[primaryKey])
    } else if (JSON.stringify(before) !== JSON.stringify(after)) {
      console.log('updated', table, before[primaryKey])
      await db[table].update(after[primaryKey], JSON.parse(JSON.stringify(after)))
    }
  }, { deep: true })

  return { read () { read(result) }, result }
}
