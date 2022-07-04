<template>
  <div class="container mx-auto">
    <div class="flex justify-between">
      <h1>{{ category?.name }}</h1>
      <menu class="m-0 p-0">
        <text-button :loading="categoryGridQuery.loading.value" @click="categoryGridQuery.refetch()">
          Refresh
        </text-button>
        <button-link :to="`/groups/${route.params.groupId}/categories/${route.params.categoryId}/settings`">
          Settings
        </button-link>
      </menu>
    </div>
  </div>

  <div class="table-wrapper">
    <table class="text-xs min-w-full">
      <thead>
        <tr>
          <template v-if="category?.type === CategoryType.Team">
            <th>
              Team Name
            </th>
            <th>
              Team Members
            </th>
          </template>
          <th v-else>
            Name
          </th>
          <th>
            Club
          </th>
          <th class="min-w-8">
            ID
          </th>

          <th
            v-for="cEvtDefCode in category?.competitionEventIds ?? []"
            :key="`header-${cEvtDefCode}`"
            colspan="2"
          >
            {{ getAbbr(cEvtDefCode) }}
          </th>

          <!-- <th>
            Checksum
          </th> -->
        </tr>

        <tr>
          <th
            v-if="category?.type === CategoryType.Team"
            colspan="4"
          />
          <th v-else colspan="3" />
          <th
            v-for="cEvtDefCode in category?.competitionEventIds ?? []"
            :key="cEvtDefCode"
            colspan="2"
          >
            <button-link
              v-if="isSpeedEvent(cEvtDefCode)"
              :to="`/groups/${route.params.groupId}/categories/${$route.params.categoryId}/competition-events/${cEvtDefCode}`"
              dense
            >
              All
            </button-link>
          </th>

          <!-- <th>&nbsp;</th> -->
        </tr>
      </thead>

      <tbody>
        <tr v-for="participant of participants" :key="participant.id">
          <td>{{ participant.name }}</td>
          <td
            v-if="category?.type === CategoryType.Team"
            class="max-w-[20rem] truncate"
          >
            {{ memberNames(participant) }}
          </td>
          <td>{{ participant.club }}</td>
          <td class="text-right">
            {{ participant.id }}
          </td>

          <template
            v-for="cEvtDefCode in category?.competitionEventIds ?? []"
            :key="cEvtDefCode"
          >
            <td
              colspan="2"
              class="text-center font-semibold uppercase cursor-pointer"
              :class="{
                'bg-red-100': !entryStatus[participant.id]?.[cEvtDefCode],
                'hover:bg-red-300': !entryStatus[participant.id]?.[cEvtDefCode],

                'bg-blue-100': entryStatus[participant.id]?.[cEvtDefCode] === 'created',
                'hover:bg-blue-300': entryStatus[participant.id]?.[cEvtDefCode] === 'created',

                'bg-green-100': entryStatus[participant.id]?.[cEvtDefCode] === 'locked',
                'hover:bg-green-300': entryStatus[participant.id]?.[cEvtDefCode] === 'locked',

                'bg-gray-100': entryStatus[participant.id]?.[cEvtDefCode] === 'dns',
                'hover:bg-gray-300': entryStatus[participant.id]?.[cEvtDefCode] === 'dns',
              }"
              @click="openEntry(participant.id, cEvtDefCode)"
            >
              <icon-loading v-if="createEntryMutation.loading.value" class="animate-spin" />
              <span v-else>Edit</span>
            </td>
            <!-- TODO: hash -->
            <!-- <td class="font-mono" /> -->
          </template>

          <!-- <td /> -->
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { memberNames, getAbbr, CompetitionEvent } from '../helpers'

import { ButtonLink, TextButton } from '@ropescore/components'

import IconLoading from 'virtual:icons/mdi/loading'

import { CategoryType, Participant, useCategoryGridQuery, useCreateEntryMutation } from '../graphql/generated'

const route = useRoute()
const router = useRouter()

const categoryGridQuery = useCategoryGridQuery({
  groupId: route.params.groupId as string,
  categoryId: route.params.categoryId as string
}, { fetchPolicy: 'cache-and-network' })

const category = computed(() => categoryGridQuery.result.value?.group?.category)
const participants = computed(() => categoryGridQuery.result.value?.group?.category?.participants ?? [])
const entries = computed(() => categoryGridQuery.result.value?.group?.category?.entries ?? [])

function isSpeedEvent (cEvtDefCode: CompetitionEvent) {
  return cEvtDefCode.split('.')[2] === 'sp'
}

const entryStatus = computed(() => {
  const res: Record<string, Record<string, undefined | 'created' | 'locked' | 'dns'>> = {}
  for (const entry of entries.value) {
    res[entry.participant.id] ??= {}
    res[entry.participant.id][entry.competitionEventId] ??= 'created'
    if (entry.lockedAt) res[entry.participant.id][entry.competitionEventId] = 'locked'
    if (entry.didNotSkipAt) res[entry.participant.id][entry.competitionEventId] = 'dns'
  }
  return res
})

const createEntryMutation = useCreateEntryMutation({})

async function openEntry (participantId: Participant['id'], cEvtDef: CompetitionEvent) {
  let entry = entries.value.find(en => en.participant.id === participantId && en.competitionEventId === cEvtDef)
  if (!entry) {
    const result = await createEntryMutation.mutate({
      categoryId: route.params.categoryId as string,
      participantId,
      data: {
        competitionEventId: cEvtDef
      }
    })
    entry = result?.data?.createEntry
    if (!entry) return
  }
  router.push(`/groups/${route.params.groupId}/categories/${route.params.categoryId}/entries/${entry.id}`)
}
</script>
