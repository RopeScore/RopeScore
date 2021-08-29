<template>
  <section class="container mx-auto">
    <h1 class="mb-2">Devices</h1>

    <div>
      <table class="w-full">
        <thead>
          <tr>
            <th>Device ID</th>
            <th>Device Name</th>
            <th>Battery</th>
            <th class="relative">
              Last Battery Status
              <icon-loading v-if="loading" class="animate-spin absolute right-1 top-1" />
            </th>
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
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td class="max-w-[10ch]">
              <text-field v-model="newDevice" dense :disabled="mutating" label="Device ID" />
            </td>
            <td colspan="3">
              <text-button
                color="blue"
                dense
                :disabled="mutating"
                :loading="mutating"
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
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useResult } from '@vue/apollo-composable'
import { useGroupDevicesQuery, useAddGroupDeviceMutation } from '../graphql/generated'

import TextField from '../components/TextField.vue'
import TextButton from '../components/TextButton.vue'
import IconLoading from 'virtual:vite-icons/mdi/loading'

const route = useRoute()
const newDevice = ref<string>('')
const fetchTime = ref(0)

const { result: gdRes, loading, onResult, refetch } = useGroupDevicesQuery(
  () => ({ groupId: route.params.groupId as string }),
  { pollInterval: 30_000 }
)
const devices = useResult(gdRes, [], res => res?.group?.devices)
onResult(() => {
  fetchTime.value = Date.now()
})

const { mutate: addDevice, loading: mutating, onDone } = useAddGroupDeviceMutation({})
onDone(() => {
  newDevice.value = ''
})

function toISO (ts: number | Date) {
  return new Date(ts).toISOString()
}

function tooLongAgo (ts: number) {
  return ts < Date.now() - (1000 * 60 * 30) // 30 min
}
</script>
