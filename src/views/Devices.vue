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
            :device-ids="deviceIds"
          />
        </div>
      </template>
    </div>

    <div>
      <text-button
        @click="createEntry({
          groupId: String(route.params.groupId),
          entry: {
            categoryId: '5c695f26-9afe-44c6-9f3d-53540930e677',
            categoryName: 'Test Category 1',

            participantId: '1',
            participantName: 'A',

            competitionEventLookupCode: 'e.ijru.sp.sr.srsr.4.4x30',

            heat: nextHeat
          }
        })"
      >
        {{ nextHeat }}
        Create Entry
      </text-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useResult } from '@vue/apollo-composable'
import {
  useGroupDevicesQuery,
  useGroupEntriesQuery,
  useAddGroupDeviceMutation,
  useRemoveGroupDeviceMutation,
  useCreateEntryMutation,

  GroupEntriesDocument
} from '../graphql/generated'
import { cache } from '../apollo'

import TextField from '../components/TextField.vue'
import TextButton from '../components/TextButton.vue'
import EntryCard from '../components/EntryCard.vue'
import IconLoading from 'virtual:vite-icons/mdi/loading'

import type {
  ScoresheetFragmentFragment,
  GroupEntriesQuery,
  GroupEntriesQueryVariables
} from '../graphql/generated'

const route = useRoute()
const newDevice = ref<string>('')
const fetchTime = ref(0)

const groupDevices = useGroupDevicesQuery(
  () => ({ groupId: route.params.groupId as string }),
  { pollInterval: 60_000 }
)
const devices = useResult(groupDevices.result, [], res => res?.group?.devices)
groupDevices.onResult(() => {
  fetchTime.value = Date.now()
})
const deviceIds = useResult(groupDevices.result, [], res => res?.group?.devices.map(d => d.id) ?? [])

const { mutate: addDevice, loading: addingDevice, onDone } = useAddGroupDeviceMutation({})
onDone(() => {
  newDevice.value = ''
})

const { mutate: removeDevice, loading: removingDevice } = useRemoveGroupDeviceMutation({})

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
const nextHeat = useResult(groupEntries.result, 1, res => {
  return Math.max(...(res?.group?.entries ?? []).map(ent => ent.heat + 1), 1)
})

const { mutate: createEntry, loading: creatingEntry } = useCreateEntryMutation({})

function toISO (ts: number | Date) {
  return new Date(ts).toISOString()
}

function tooLongAgo (ts: number) {
  return ts < Date.now() - (1000 * 60 * 30) // 30 min
}
</script>
