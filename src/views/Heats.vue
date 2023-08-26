<template>
  <section class="container mx-auto">
    <h1 class="mb-2">
      Judges & Devices
    </h1>

    <div>
      <table class="w-full">
        <thead>
          <tr>
            <th>Judge ID</th>
            <th>Judge Name</th>
            <th>Device ID</th>
            <th>Device Name</th>
            <th>Battery</th>
            <th class="relative">
              Last Battery Status
              <span v-if="judgeStatusesQuery.loading.value" class="absolute right-1 top-1">
                <icon-loading class="animate-spin" />
              </span>
            </th>
            <th colspan="2" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="judge of judges"
            :key="judge.id"
          >
            <td class="text-xs">
              {{ judge.id }}
            </td>
            <td>{{ judge.name }}</td>

            <template v-if="judge.device">
              <td>{{ judge.device?.id }}</td>
              <td>{{ judge.device?.name }}</td>

              <td
                v-if="judge.device.battery"
                class="min-w-[10ch] text-right"
                :class="{
                  'bg-green-300': judge.device.battery.batteryLevel > 30,
                  'bg-orange-200': judge.device.battery.batteryLevel <= 30 && judge.device.battery.batteryLevel > 15,
                  'bg-red-200': judge.device.battery.batteryLevel <= 15,
                }"
              >
                {{ judge.device.battery.batteryLevel }} %
              </td>
              <td v-else class="bg-gray-200" />

              <td v-if="judge.device.battery" :class="{ 'bg-orange-200': tooLongAgo(judge.device.battery.updatedAt) }">
                <relative-time :datetime="toISO(judge.device.battery.updatedAt)">
                  {{ toISO(judge.device.battery.updatedAt) }}
                </relative-time>
                <span v-if="!judge.device.battery.automatic"> (manual)</span>
              </td>
              <td v-else class="bg-gray-200">
                never
              </td>
            </template>
            <td v-else colspan="4" />

            <td class="max-w-[10ch]">
              <form :id="`new-device-id-${judge.id}`" class="hidden" @submit.prevent="setJudgeDevice.mutate({ judgeId: judge.id, deviceId: newDevices[judge.id] })" />
              <text-field v-model="newDevices[judge.id]" :form="`new-device-id-${judge.id}`" dense label="Device ID" required />
            </td>
            <td>
              <text-button
                :form="`new-device-id-${judge.id}`"
                dense
                :loading="setJudgeDevice.loading.value"
                :disabled="!newDevices[judge.id]"
                type="submit"
              >
                Set
              </text-button>
              <text-button
                color="red"
                dense
                :disabled="!judge.device"
                :loading="unsetJudgeDevice.loading.value"
                @click="unsetJudgeDevice.mutate({ judgeId: judge.id })"
              >
                Unset
              </text-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section>
    <h1 class="container mx-auto mb-2">
      Assignments
    </h1>

    <p class="container mx-auto mb-2">
      You'll most likely want multiple entries per heat for speed events, and one
      entry per heat for freestyle events, unless you are running multiple
      freestyle panels side by side.
    </p>

    <p class="container mx-auto mb-2">
      If you try to create an entry that already exists it will be moved to the
      heat you specified.
    </p>

    <p class="container mx-auto mb-2">
      New data is fetched every 60 seconds.
      <!-- TODO: subscription for entry and scoresheet status? -->
    </p>
  </section>

  <section class="grid grid-rows-[min-content,minmax(0,1fr)] sticky top-[3.5rem] bg-white w-full z-1000">
    <div class="flex flex-row container mx-auto justify-center">
      <template
        v-for="judge of judges"
        :key="`${judge.id}-${fetchTime}`"
      >
        <div
          v-if="judge.device"
          class="w-14 flex items-center justify-center"
          :class="{
            'bg-green-300': typeof judge.device.battery?.batteryLevel === 'number' && judge.device.battery?.batteryLevel > 30,
            'bg-orange-200': typeof judge.device.battery?.batteryLevel === 'number' && judge.device.battery?.batteryLevel <= 30 && judge.device.battery?.batteryLevel > 15,
            'bg-red-200': typeof judge.device.battery?.batteryLevel === 'number' && judge.device.battery?.batteryLevel <= 15,
            'bg-gray-200': !judge.device.battery
          }"
        >
          {{ judge.device.battery?.batteryLevel ?? '-' }}
        </div>
      </template>
    </div>
    <div class="container mx-auto flex flex-row justify-between my-1">
      <p>
        <text-button :loading="heatsQuery.loading.value" @click="heatsQuery.refetch()">
          Refresh
        </text-button>
      </p>

      <div class="flex">
        <div class="grid grid-cols-3">
          <text-button
            :disabled="setCurrentHeat.loading.value || (currentHeat ?? 1) <= (heats.at(0) ?? 1)"
            @click="prevHeat()"
          >
            Prev
          </text-button>
          <text-field
            :model-value="`${currentHeat}`"
            form="new-heat"
            type="number"
            dense
            label="Heat"
            required
            class="max-w-16"
            @update:model-value="newCurrentHeat = $event"
          />
          <text-button
            :disabled="setCurrentHeat.loading.value || (currentHeat ?? 1) >= (heats.at(-2) ?? 1)"
            @click="nextHeat()"
          >
            Next
          </text-button>
        </div>

        <text-button
          form="new-heat"
          :disabled="typeof newCurrentHeat !== 'number' || newCurrentHeat === currentHeat"
          :loading="setCurrentHeat.loading.value"
          type="submit"
        >
          Set Heat
        </text-button>
        <form id="new-heat" @submit.prevent="setCurrentHeat.mutate({ groupId: route.params.groupId as string, heat: newCurrentHeat! })" />
        <text-button @click="scrollToCurrentHeat()">
          Scroll
        </text-button>
      </div>
    </div>
  </section>

  <section>
    <div class="min-w-full overflow-x-auto grid grid-cols-[3rem,auto] gap-2">
      <template v-for="(ents, heat) of entries" :key="heat">
        <div :id="`heat-${heat}`" class="sticky right-2 flex items-center justify-end">
          {{ heat }}
        </div>
        <div class="flex gap-2 overflow-x-auto">
          <entry-card
            v-for="entry of ents"
            :key="entry.id"
            :group-id="route.params.groupId as string"
            :category="findCategory(entry.category.id)!"
            :entry="entry"
            :participant="entry.participant"
            :judge-assignments="findCategory(entry.category.id)?.judgeAssignments ?? []"
            :scoresheets="(entry.scoresheets as Array<ScoresheetBaseFragment & MarkScoresheetStatusFragment>)"
          />
        </div>
      </template>
    </div>

    <div class="mt-30 lg:mt-10" />

    <div class="fixed bottom-0 right-0 left-0 h-36 lg:h-18 bg-white px-2 flex justify-center items-center border-t z-1500">
      <form class="grid grid-cols-4 lg:grid-cols-7 gap-4" @submit.prevent="findCreateEntry()">
        <div class="flex items-end justify-end py-1.5">
          <label>
            <input v-model="autoIncrement" type="checkbox" class="mb-1">
            Auto Increment Heat
          </label>
        </div>
        <text-field
          v-model="newEntry.heat.value"
          type="number"
          label="Heat"
          :data-list="heats"
          required
        />
        <text-field
          v-model="newEntry.pool.value"
          type="number"
          label="Pool"
        />
        <select-field
          v-model="newEntry.categoryId.value"
          label="Category"
          :data-list="categories"
          required
        />
        <div class="lg:hidden" />
        <select-field
          v-model="newEntry.competitionEventId.value"
          label="Competition Event"
          :data-list="categoryCompetitionEvents"
          :disabled="!newEntry.categoryId.value || categoryGridQuery.loading.value"
          required
        />
        <select-field
          v-model="newEntry.participantId.value"
          label="Participant"
          :data-list="categoryParticipants"
          :disabled="!newEntry.categoryId.value || categoryGridQuery.loading.value"
          required
        />
        <text-button
          color="blue"
          :disabled="!formFilled"
          :loading="heatingEntry"
          class="mt-2"
          type="submit"
        >
          Create Entry
        </text-button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { type CompetitionEvent, formatDate, isMarkScoresheet } from '../helpers'

import { TextButton, TextField, SelectField } from '@ropescore/components'
import EntryCard from '../components/EntryCard.vue'
import IconLoading from 'virtual:icons/mdi/loading'
import { useHeatsQuery, useCreateEntryMutation, useReorderEntryMutation, useCategoryGridQuery, TallyScoresheet, type MarkScoresheet, useJudgeStatusesQuery, useSetJudgeDeviceMutation, useUnsetJudgeDeviceMutation, useSetCurrentHeatMutation, type ScoresheetBaseFragment, type MarkScoresheetStatusFragment } from '../graphql/generated'

const route = useRoute()
const fetchTime = ref(0)
const entryFetchTime = ref(0)
const newDevices = reactive<Record<string, string>>({})
const newCurrentHeat = ref<number>()

const setCurrentHeat = useSetCurrentHeatMutation({})

const setJudgeDevice = useSetJudgeDeviceMutation({
  refetchQueries: ['JudgeStatuses'],
  awaitRefetchQueries: true
})
const unsetJudgeDevice = useUnsetJudgeDeviceMutation({
  refetchQueries: ['JudgeStatuses'],
  awaitRefetchQueries: true
})

setJudgeDevice.onDone(res => {
  if (!res.data?.setJudgeDevice.id) return
  newDevices[res.data.setJudgeDevice.id] = ''
})

const heatsQuery = useHeatsQuery(
  () => ({ groupId: route.params.groupId as string }),
  { pollInterval: 60_000, fetchPolicy: 'cache-and-network' }
)
const judgeStatusesQuery = useJudgeStatusesQuery(
  () => ({ groupId: route.params.groupId as string }),
  { pollInterval: 60_000, fetchPolicy: 'cache-and-network' }
)

const currentHeat = computed(() => heatsQuery.result.value?.group?.currentHeat)
const judges = computed(() => judgeStatusesQuery.result.value?.group?.judges ?? [])
heatsQuery.onResult(() => {
  fetchTime.value = Date.now()
})

function findCategory (categoryId: string) {
  return heatsQuery.result.value?.group?.categories.find(c => c.id === categoryId)
}

const entries = computed(() => {
  const ents = [...(heatsQuery.result.value?.group?.entries ?? [])].filter(e => typeof e.heat === 'number')
  ents.sort((a, b) => a.heat! - b.heat!)
  const heats: Record<number, typeof ents> = {}
  for (const ent of ents) {
    heats[ent.heat!] ??= []
    heats[ent.heat!].push(ent)
  }
  for (const heat in heats) {
    heats[heat].sort((a, b) => {
      if (typeof a.pool === 'number' && typeof b.pool === 'number') return a.pool - b.pool
      else if (typeof a.pool === 'number') return -1
      else if (typeof b.pool === 'number') return 1
      else return a.id.localeCompare(b.id)
    })
  }

  return heats
})
const heats = computed(() => {
  const existing = [...new Set([...(heatsQuery.result.value?.group?.entries ?? [])].filter(e => typeof e.heat === 'number').map(e => e.heat)) as Set<number>]
  const next = Math.max(...existing, 0) + 1
  existing.push(next)
  existing.sort((a, b) => a - b)
  return existing
})

async function nextHeat () {
  const nextHeat = currentHeat.value == null
    ? heats.value[0]
    : heats.value[heats.value.indexOf(currentHeat.value) + 1]
  if (nextHeat != null && nextHeat < (heats.value.at(-1) ?? 1)) return setCurrentHeat.mutate({ groupId: route.params.groupId as string, heat: nextHeat })
}

async function prevHeat () {
  const prevHeat = currentHeat.value == null
    ? heats.value[0]
    : heats.value[heats.value.indexOf(currentHeat.value) - 1]
  if (prevHeat != null) return setCurrentHeat.mutate({ groupId: route.params.groupId as string, heat: prevHeat })
}

const newEntry = {
  heat: ref<number>(),
  pool: ref<number>(),
  categoryId: ref<string>(),
  participantId: ref<string>(),
  competitionEventId: ref<CompetitionEvent>()
}
const autoIncrement = ref(true)
const formFilled = computed(() => {
  return newEntry.heat.value &&
    newEntry.categoryId.value &&
    newEntry.participantId.value &&
    newEntry.competitionEventId.value
})

const catGridVars = computed(() => ({
  groupId: route.params.groupId as string,
  categoryId: newEntry.categoryId.value as string
}))

const categoryGridQuery = useCategoryGridQuery(catGridVars, {
  enabled: computed(() => !!newEntry.categoryId.value) as unknown as boolean
})

const categories = computed(() => (heatsQuery.result.value?.group?.categories ?? []).map(c => ({ text: c.name, value: c.id })))
const categoryCompetitionEvents = computed(() => categoryGridQuery.result.value?.group?.category?.competitionEventIds ?? [])
const categoryParticipants = computed(() => (categoryGridQuery.result.value?.group?.category?.participants ?? []).map(p => ({ text: `${p.name} - ${p.club}`, value: p.id })))

watch(newEntry.heat, (next, prev) => {
  if (prev != null && newEntry.pool.value != null) {
    newEntry.pool.value = 1
  }
})

watch(newEntry.categoryId, () => {
  newEntry.participantId.value = undefined
  newEntry.competitionEventId.value = undefined
})

const createEntryMutation = useCreateEntryMutation({
  refetchQueries: ['Heats', 'CategoryGrid'],
  awaitRefetchQueries: true
})
const reorderEntryMutation = useReorderEntryMutation({})
const heatingEntry = computed(() => createEntryMutation.loading.value || reorderEntryMutation.loading.value)

function onEntryHeated () {
  if (autoIncrement.value && typeof newEntry.heat.value === 'number') {
    newEntry.heat.value++
  } else if (!autoIncrement.value && typeof newEntry.pool.value === 'number') {
    newEntry.pool.value++
  }

  newEntry.participantId.value = undefined
}

createEntryMutation.onDone(onEntryHeated)
reorderEntryMutation.onDone(onEntryHeated)

async function findCreateEntry () {
  if (
    !newEntry.heat.value ||
    !newEntry.categoryId.value ||
    !newEntry.participantId.value ||
    !newEntry.competitionEventId.value
  ) return

  const exists = (categoryGridQuery.result.value?.group?.category?.entries ?? []).find(ent =>
    ent.participant.id === newEntry.participantId.value &&
    ent.competitionEventId === newEntry.competitionEventId.value
  )

  if (exists) {
    await reorderEntryMutation.mutate({ entryId: exists.id, heat: newEntry.heat.value, pool: newEntry.pool.value })
  } else {
    await createEntryMutation.mutate({
      categoryId: newEntry.categoryId.value,
      participantId: newEntry.participantId.value,
      data: {
        competitionEventId: newEntry.competitionEventId.value,
        heat: newEntry.heat.value,
        pool: newEntry.pool.value
      }
    })
  }
}

function scrollToCurrentHeat () {
  const heat = currentHeat.value ?? Object.entries(entries.value)
    .find(([heat, entries]) => entries.some(entry => !entry.didNotSkipAt && entry.scoresheets.filter(scsh => isMarkScoresheet(scsh)).every(scsh => !(scsh as MarkScoresheet)?.submittedAt)))?.[0]
  const el = document.getElementById(`heat-${heat}`)

  if (!el) return

  el.scrollIntoView({ behavior: 'auto', block: 'center' })
}

function toISO (ts: number | Date) {
  return new Date(ts).toISOString()
}

function tooLongAgo (ts: number) {
  return ts < Date.now() - (1000 * 60 * 30) // 30 min
}
</script>
