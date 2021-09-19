<template>
  <section class="container mx-auto">
    <h1 class="mb-2">
      Devices
    </h1>

    <div>
      <table class="w-full">
        <thead>
          <tr>
            <th>Device ID</th>
            <th>Device Name</th>
            <th>Battery</th>
            <th class="relative">
              Last Battery Status
              <span v-if="groupDevices.loading.value" class="absolute right-1 top-1">
                <icon-loading class="animate-spin" />
              </span>
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="device of devices"
            :key="`${device.id}-${fetchTime}`"
          >
            <td>{{ device.id }}</td>
            <td>{{ device.name }}</td>

            <td
              v-if="device.battery"
              class="min-w-[10ch] text-right"
              :class="{
                'bg-green-300': device.battery.batteryLevel > 30,
                'bg-orange-200': device.battery.batteryLevel <= 30 && device.battery.batteryLevel > 15,
                'bg-red-200': device.battery.batteryLevel <= 15,
              }"
            >
              {{ device.battery.batteryLevel }} %
            </td>
            <td v-else class="bg-gray-200" />

            <td v-if="device.battery" :class="{ 'bg-orange-200': tooLongAgo(device.battery.updatedAt) }">
              <relative-time :datetime="toISO(device.battery.updatedAt)">
                {{ toISO(device.battery.updatedAt) }}
              </relative-time>
              <span v-if="!device.battery.automatic"> (manual)</span>
            </td>
            <td v-else class="bg-gray-200">
              never
            </td>

            <td>
              <text-button
                color="red"
                dense
                :disabled="removingDevice"
                :loading="removingDevice"
                @click="removeDevice({ groupId: String(route.params.groupId), deviceId: device.id })"
              >
                Remove
              </text-button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td class="max-w-[10ch]">
              <text-field v-model="newDevice" dense :disabled="addingDevice" label="Device ID" />
            </td>
            <td colspan="4">
              <text-button
                color="blue"
                dense
                :disabled="addingDevice"
                :loading="addingDevice"
                @click="addDevice({ groupId: String(route.params.groupId), deviceId: newDevice })"
              >
                Add
              </text-button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>

  <section>
    <h1 class="container mx-auto mb-2">
      Assignments
    </h1>

    <p class="container mx-auto mb-2">
      You'll most likely want mutiple entries per heat for speed events, and one
      entry per heat for freestyle events, unless you are running multiple
      freestyle panels side by side.
    </p>

    <p class="container mx-auto mb-2">
      If you try to create an entry that already exists it will be moved to the
      heat you specified.
    </p>

    <p class="container mx-auto mb-2">
      <span class="font-semibold">
        Scoresheets will only be gathered from devices while this view is open.
      </span>
      New data is fetched every 60 seconds.
    </p>

    <p v-if="entryFetchTime" class="container mx-auto mb-2">
      The latest change happened {{ formatDate(entryFetchTime) }}.

      <text-button :loading="groupEntries.loading.value" @click="groupEntries.refetch()">
        Refresh
      </text-button>
    </p>

    <div class="min-w-full overflow-x-auto grid grid-cols-[3rem,auto] gap-2">
      <template v-for="(ents, heat) of entries" :key="heat">
        <div class="sticky right-2 flex items-center justify-end">
          {{ heat }}
        </div>
        <div class="flex gap-2 overflow-x-auto">
          <entry-card
            v-for="entry of ents"
            :key="entry.id"
            :group-id="String(route.params.groupId)"
            :entry="entry"
            :scoresheets="entry.scoresheets"
            :devices="devices"
          />
        </div>
      </template>
    </div>

    <div class="mt-10" />

    <div class="fixed bottom-0 right-0 left-0 h-18 bg-white px-2 flex justify-center items-center border-t">
      <div class="grid grid-cols-6 gap-4">
        <div class="flex items-end justify-end py-1.5">
          <label>
            <input v-model="autoIncrement" type="checkbox" class="mb-1">
            Auto Increment
          </label>
        </div>
        <text-field
          v-model="newEntry.heat.value"
          type="number"
          label="Heat"
          :data-list="heats"
        />
        <select-field
          v-model="newEntry.categoryId.value"
          label="Category"
          :data-list="localCategories"
        />
        <select-field
          v-model="newEntry.competitionEvent.value"
          label="Competition Event"
          :data-list="localCompetitionEvents"
          :disabled="!newEntry.categoryId.value"
        />
        <select-field
          v-model="newEntry.participantId.value"
          label="Participant"
          :data-list="localParticipants"
          :disabled="!newEntry.categoryId.value"
        />
        <text-button
          color="blue"
          :disabled="!formFilled || mutating"
          :loading="mutating"
          @click="findCreateEntry()"
          class="mt-2"
        >
          Create Entry
        </text-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMutationLoading, useResult } from '@vue/apollo-composable'
import {
  useGroupDevicesQuery,
  useGroupEntriesQuery,
  useAddGroupDeviceMutation,
  useRemoveGroupDeviceMutation,
  useCreateEntryMutation,
  useReorderEntryMutation,
  useSetEntryDidNotSkipMutation,
  EntryFragmentFragmentDoc
} from '../graphql/generated'
import { useCategories } from '../hooks/categories'
import { useParticipants } from '../hooks/participants'
import { useEntries } from '../hooks/entries'
import { db } from '../store/idbStore'
import { formatDate } from '../helpers'

import TextField from '../components/TextField.vue'
import SelectField from '../components/SelectField.vue'
import TextButton from '../components/TextButton.vue'
import EntryCard from '../components/EntryCard.vue'
import IconLoading from 'virtual:vite-icons/mdi/loading'

import type { CompetitionEvent, MarkScoresheet, Mark } from '../store/schema'

const route = useRoute()
const newDevice = ref<string>('')
const fetchTime = ref(0)
const entryFetchTime = ref(0)

const groupDevices = useGroupDevicesQuery(
  () => ({ groupId: route.params.groupId as string }),
  { pollInterval: 60_000 }
)
const devices = useResult(groupDevices.result, [], res => res?.group?.devices)
groupDevices.onResult(() => {
  fetchTime.value = Date.now()
})
const group = useResult(groupDevices.result, null, res => res?.group)

const { mutate: addDevice, loading: addingDevice, onDone } = useAddGroupDeviceMutation({})
onDone(() => {
  newDevice.value = ''
})

const { mutate: removeDevice, loading: removingDevice } = useRemoveGroupDeviceMutation({})

const { mutate: setDidNotSkip } = useSetEntryDidNotSkipMutation({})
const groupEntries = useGroupEntriesQuery(
  () => ({ groupId: route.params.groupId as string }),
  { pollInterval: 60_000 }
)
const entries = useResult(groupEntries.result, {}, res => {
  const ents = [...(res?.group?.entries ?? [])]
  ents.sort((a, b) => a.heat - b.heat)
  const heats: Record<number, typeof ents> = {}
  for (const ent of ents) {
    heats[ent.heat] ??= []
    heats[ent.heat].push(ent)
  }

  return heats
})
const heats = useResult(groupEntries.result, [], res => {
  const existing = [...new Set((res?.group?.entries ?? []).map(ent => ent.heat))]
  const next = Math.max(...existing, 0) + 1
  existing.push(next)
  existing.sort((a, b) => a - b)
  return existing
})

const maxLastUpdated = ref<number>(-Infinity)
groupEntries.onResult(async res => {
  if (!res.data.group?.entries) return
  entryFetchTime.value = Date.now()
  // This is where we take remote scoresheets and plop them into idb
  const scoresheets: MarkScoresheet[] = []
  let newLastUpdated = -Infinity

  const localCats = await db.categories.where({ groupId: route.params.groupId as string }).toArray()
  const localEntries = await db.entries.where('categoryId').anyOf(localCats.map(c => c.id)).toArray()

  for (const entry of res.data.group.entries) {
    const localEntry = localEntries.find(ent =>
      ent.categoryId === entry.categoryId &&
      ent.participantId === Number(entry.participantId) &&
      ent.competitionEvent === entry.competitionEventLookupCode
    )

    if (localEntry && !!entry.didNotSkipAt !== !!localEntry.didNotSkipAt) {
      // if we've changed did not skip locally we need to update the entry in
      // remotely
      setDidNotSkip({
        entryId: entry.id,
        didNotSkip: !!localEntry.didNotSkipAt
      })
    }

    if (localEntry && localEntry.id !== entry.id) {
      await db.transaction('rw', [db.entries, db.scoresheets], async () => {
        await db.entries.where({ id: localEntry.id }).modify({ id: entry.id })
        await db.scoresheets.where({ entryId: localEntry.id }).modify({ entryId: entry.id })
      })
    }

    if (!localEntry) {
      await db.entries.put({
        id: entry.id,
        categoryId: entry.categoryId,
        participantId: Number(entry.participantId),
        competitionEvent: entry.competitionEventLookupCode as CompetitionEvent
      })
    }

    // if the local instance of the entry has been locked we need to prevent
    // writes to it(s scoresheets) to avoid messing witht the results.
    // similarly an entry with didNotSkip set shouldn't get any scores
    if (localEntry?.lockedAt || localEntry?.didNotSkipAt) continue

    for (const scoresheet of entry.scoresheets) {
      // we still want to make sure we find the max updatedAt across all scoresheets
      // except for locked entries in case that measn we skup some
      if (scoresheet.updatedAt > newLastUpdated) newLastUpdated = scoresheet.updatedAt
      // this scoresheet hasn't changed since we last retrieved data
      if (scoresheet.updatedAt < maxLastUpdated.value) continue
      scoresheets.push({
        id: scoresheet.id,
        judgeId: parseInt(scoresheet.judgeId, 10),
        judgeType: scoresheet.judgeType,
        deviceId: scoresheet.device.id,

        entryId: entry.id,
        competitionEvent: entry.competitionEventLookupCode as CompetitionEvent,

        createdAt: scoresheet.createdAt,
        updatedAt: scoresheet.updatedAt,
        openedAt: scoresheet.openedAt ?? undefined,
        completedAt: scoresheet.completedAt ?? undefined,
        submittedAt: scoresheet.submittedAt ?? undefined,

        options: scoresheet.options ?? undefined,
        marks: scoresheet.marks as Mark[]
      })
    }
  }

  maxLastUpdated.value = newLastUpdated

  await db.scoresheets.bulkPut(scoresheets)
})

const { mutate: createEntry } = useCreateEntryMutation({
  update (cache, { data }) {
    if (!data?.createEntry || !group.value) return

    cache.modify({
      id: cache.identify(group.value),
      fields: {
        entries (existingEntryRefs = [], { readField }) {
          const newEntryRef = cache.writeFragment({
            fragment: EntryFragmentFragmentDoc,
            data: data.createEntry
          })
          if (existingEntryRefs.some((ref: any) => readField('id', ref) === readField('id', newEntryRef))) {
            return existingEntryRefs
          }
          return [...existingEntryRefs, newEntryRef]
        }
      }
    })
  }
})

const { mutate: reorderEntry } = useReorderEntryMutation({})

const mutating = useMutationLoading()

const newEntry = {
  heat: ref<number>(),
  categoryId: ref<string>(),
  participantId: ref<string>(),
  competitionEvent: ref<CompetitionEvent>()
}
const autoIncrement = ref(true)
const formFilled = computed(() => {
  return newEntry.heat.value &&
    newEntry.categoryId.value &&
    newEntry.participantId.value &&
    newEntry.competitionEvent.value
})

const cats = useCategories(route.params.groupId as string)
const localCategories = computed(() => cats.value.map(c => ({ text: c.name, value: c.id })))
const localCompetitionEvents = computed(() =>
  cats.value.find(c => c.id === newEntry.categoryId.value)?.competitionEvents ?? []
)

watch(newEntry.categoryId, () => {
  newEntry.participantId.value = undefined
  newEntry.competitionEvent.value = undefined
})

const parts = useParticipants(newEntry.categoryId)
const localParticipants = computed(() => parts.value.map(c => ({
  text: `${c.name} - ${c.club} (${c.id})`,
  value: c.id
})))

const _ents = useEntries(newEntry.categoryId)

async function findCreateEntry () {
  if (
    !newEntry.heat.value ||
    !newEntry.categoryId.value ||
    !newEntry.participantId.value ||
    !newEntry.competitionEvent.value
  ) return

  const exists = _ents.value.find(ent =>
    ent.participantId === Number(newEntry.participantId.value) &&
    ent.competitionEvent === newEntry.competitionEvent.value
  )

  const result = await createEntry({
    groupId: route.params.groupId as string,
    entry: {
      categoryId: newEntry.categoryId.value,
      participantId: `${newEntry.participantId.value}`,
      competitionEventLookupCode: newEntry.competitionEvent.value,
      heat: newEntry.heat.value,

      categoryName: cats.value.find(c => c.id === newEntry.categoryId.value)?.name ?? '',
      participantName: parts.value.find(p => p.id === Number(newEntry.participantId.value))?.name ?? ''
    }
  })

  if (!result?.data) return

  if (exists && exists.id !== result.data?.createEntry.id) {
    await db.transaction('rw', [db.entries, db.scoresheets], async () => {
      await db.entries.where({ id: exists.id }).modify({ id: result.data?.createEntry.id })
      await db.scoresheets.where({ entryId: exists.id }).modify({ entryId: result.data?.createEntry.id })
    })
  } else if (!exists) {
    _ents.value.push({
      id: result.data?.createEntry.id,
      categoryId: newEntry.categoryId.value,
      participantId: Number(newEntry.participantId.value),
      competitionEvent: newEntry.competitionEvent.value,
      heat: newEntry.heat.value
    })
  }

  if (result.data?.createEntry.heat !== newEntry.heat.value) {
    await reorderEntry({
      entryId: result.data.createEntry.id,
      heat: newEntry.heat.value
    })
  }

  if (autoIncrement.value && typeof newEntry.heat.value === 'number') {
    newEntry.heat.value++
  }

  newEntry.participantId.value = undefined
}

function toISO (ts: number | Date) {
  return new Date(ts).toISOString()
}

function tooLongAgo (ts: number) {
  return ts < Date.now() - (1000 * 60 * 30) // 30 min
}
</script>
