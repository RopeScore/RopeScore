import { watch, ref } from 'vue'
import { pausableWatch } from '@vueuse/core'
import { emitters, db } from '../store/idbStore'

import type { Ref } from 'vue'
import type { Table, TableTypes } from '../store/idbStore'

interface UseDexieOptions<T, TRef = T> {
  read: (result: Ref<TRef | undefined>) => Promise<void>
  tableName: Table
}

export function useDexieArray<T extends TableTypes> ({ read, tableName }: UseDexieOptions<T, T[]>) {
  const result = ref<T[]>([]) as Ref<T[]>

  const table = db[tableName]
  const primaryKey = table.schema.primKey.keyPath as keyof TableTypes

  watch(emitters[tableName], () => { read(result) })
  const { pause, resume } = pausableWatch(() => [...result.value], async (after, before) => {
    const idsBefore = new Map(before.map(ent => [ent[primaryKey], ent]))
    const idsAfter = new Map(after.map(ent => [ent[primaryKey], ent]))

    for (const [idAfter, ent] of idsAfter) {
      if (!idsBefore.has(idAfter)) {
        console.log('new', tableName)
        await table.put(JSON.parse(JSON.stringify(ent)), idAfter) // TODO better type guard
        continue
      }

      if (JSON.stringify(ent) !== JSON.stringify(idsBefore.get(idAfter))) {
        console.log('updated', tableName, idAfter)
        await table.update(idAfter, JSON.parse(JSON.stringify(ent)))
        continue
      }
    }

    for (const [idBefore] of idsBefore) {
      if (!idsAfter.has(idBefore) && idBefore != null) {
        console.log('deleted', tableName, idBefore)
        await table.delete(idBefore)
        continue
      }
    }
  }, { deep: true })

  async function wrappedRead (res: Ref<T[]>) {
    pause()
    await read(res)
    resume()
  }

  wrappedRead(result)

  return { read () { wrappedRead(result) }, result }
}

export function useDexie<T extends TableTypes> ({ read, tableName }: UseDexieOptions<T>) {
  const result = ref<T>()

  const table = db[tableName]
  const primaryKey = table.schema.primKey.keyPath as keyof TableTypes

  watch(emitters[tableName], async ([_, id]) => {
    if (!id || id !== result.value?.[primaryKey]) return

    result.value = await table.get(id) as T
  })
  const { pause, resume } = pausableWatch(() => result.value ? JSON.parse(JSON.stringify(result.value)) : null, async (after, before) => {
    if (!before) return

    if (!after) {
      console.log('deleted', tableName, before[primaryKey])
      await table.delete(before[primaryKey])
    } else if (JSON.stringify(before) !== JSON.stringify(after)) {
      console.log('updated', tableName, before[primaryKey])
      await table.update(after[primaryKey], JSON.parse(JSON.stringify(after)))
    }
  }, { deep: true })

  async function wrappedRead (res: Ref<T | undefined>) {
    pause()
    await read(res)
    resume()
  }

  wrappedRead(result)

  return { read () { wrappedRead(result) }, result }
}
