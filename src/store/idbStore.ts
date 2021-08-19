import Dexie from 'dexie'
import { useLocalStorage } from '@vueuse/core'

import type { Group, Category, Judge, JudgeAssignment, Device, Participant, Entry, Scoresheet } from './schema'
import type { Ref } from 'vue'

const tables = ['groups', 'categories', 'judges', 'judgeAssignments', 'devices', 'participants', 'entries', 'scoresheets'] as const
export type Table = (typeof tables)[number]
export type TableTypes = Group | Category | Judge | JudgeAssignment | Device | Participant | Entry | Scoresheet

export const emitters = Object.fromEntries(tables.map(t => [t, useLocalStorage<[number, string | undefined]>(`rs-update-${t}`, [0, undefined])] as const)) as Record<Table, Ref<[number, string | undefined]>>

export interface ObjectStores {
  groups: Dexie.Table<Group, string>
  categories: Dexie.Table<Category, string>
  judges: Dexie.Table<Judge, number>
  judgeAssignments: Dexie.Table<JudgeAssignment, number>
  devices: Dexie.Table<Device, string>
  participants: Dexie.Table<Participant, number>
  entries: Dexie.Table<Entry, string>
  scoresheets: Dexie.Table<Scoresheet, string>
}

class RopeScoreDatabase extends Dexie implements ObjectStores {
  groups: Dexie.Table<Group, string>
  categories: Dexie.Table<Category, string>
  judges: Dexie.Table<Judge, number>
  judgeAssignments: Dexie.Table<JudgeAssignment, number>
  devices: Dexie.Table<Device, string>
  participants: Dexie.Table<Participant, number>
  entries: Dexie.Table<Entry, string>
  scoresheets: Dexie.Table<Scoresheet, string>

  constructor () {
    super('RopeScore')
    this.version(1).stores({
      groups: 'id, remote, name, completedAt',
      categories: 'id, groupId',
      judges: '++id, groupId',
      judgeAssignments: '++id, categoryId, judgeId, [judgeId+categoryId]',
      devices: 'id, groupId',
      participants: '++id, categoryId',
      entries: 'id, participantId, categoryId, competitionEvent',
      scoresheets: 'id, judgeId, entryId, deviceId, judgeType, [entryId+judgeId]'
    })

    this.version(2).stores({
      groups: 'id, remote, name, completedAt',
      categories: 'id, groupId',
      judges: '++id, groupId',
      judgeAssignments: '++id, categoryId, judgeId, [judgeId+categoryId+competitionEvent]',
      devices: 'id, groupId',
      participants: '++id, categoryId',
      entries: 'id, participantId, categoryId, competitionEvent',
      scoresheets: 'id, judgeId, entryId, deviceId, judgeType, [entryId+judgeId]'
    })

    this.groups = this.table('groups')
    this.categories = this.table('categories')
    this.judges = this.table('judges')
    this.judgeAssignments = this.table('judgeAssignments')
    this.devices = this.table('devices')
    this.participants = this.table('participants')
    this.entries = this.table('entries')
    this.scoresheets = this.table('scoresheets')

    // simple cross-tab messaging
    for (const table of tables) {
      this[table].hook('creating', id => {
        emitters[table].value = [Date.now(), id]
      })
      this[table].hook('updating', (_, id) => {
        emitters[table].value = [Date.now(), id]
      })
      this[table].hook('deleting', id => {
        emitters[table].value = [Date.now(), id]
      })
    }
  }
}

export const db = new RopeScoreDatabase()
