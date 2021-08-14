<template>
  <div class="container mx-auto">
    <div class="flex justify-between">
      <h1>{{ category?.name }}</h1>
      <menu class="m-0 p-0">
        <button-link :to="`/groups/${route.params.groupId}/categories/${route.params.categoryId}/settings`">
          Settings
        </button-link>
      </menu>
    </div>
  </div>

  <div class="overflow-x-auto max-w-[calc(100vw-1rem)] relative mt-4">
    <table class="text-xs min-w-full">
      <thead>
        <tr>
          <template v-if="category?.type === 'team'">
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
            v-for="cEvtDefCode in category?.competitionEvents ?? []"
            :key="`header-${cEvtDefCode}`"
            colspan="2"
          >
            {{ abbr(cEvtDefCode) }}
          </th>

          <!-- <th>
            Checksum
          </th> -->
        </tr>

        <tr>
          <th
            v-if="category?.type === 'team'"
            colspan="4"
          />
          <th v-else colspan="3" />
          <th
            v-for="cEvtDefCode in category?.competitionEvents ?? []"
            :key="cEvtDefCode"
            colspan="2"
          >
            <button-link
              v-if="isSpeedEvent(cEvtDefCode)"
              :to="`/groups/${route.params.groupId}/category/${$route.params.categoryId}/competition-events/${cEvtDefCode}`"
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
            v-if="category?.type === 'team'"
            class="max-w-[20rem] truncate"
          >
            {{ memberNames(participant) }}
          </td>
          <td>{{ participant.club }}</td>
          <td class="text-right">
            {{ participant.id }}
          </td>

          <template
            v-for="cEvtDefCode in category?.competitionEvents ?? []"
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
              @click="openEntry(participant, cEvtDefCode)"
            >
              Edit
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
import { useCategory } from '../hooks/categories'
import { useParticipants } from '../hooks/participants'
import { useEntries } from '../hooks/entries'
import { memberNames } from '../helpers'
import { rulesets } from '../rules'
import { v4 as uuid } from 'uuid'

import ButtonLink from '../components/ButtonLink.vue'

import type { CompetitionEvent, Participant } from '../store/schema'

const route = useRoute()
const router = useRouter()
const category = useCategory(route.params.categoryId as string)
const participants = useParticipants(route.params.categoryId as string)
const entries = useEntries(route.params.categoryId as string)

function isSpeedEvent (cEvtDefCode: CompetitionEvent) {
  return cEvtDefCode.split('.')[2] === 'sp'
}

const ruleset = computed(() => {
  if (!category.value) return null
  return rulesets[category.value.ruleset]
})

const entryStatus = computed(() => {
  const res: Record<number, Record<string, undefined | 'created' | 'locked' | 'dns'>> = {}
  for (const entry of entries.value) {
    res[entry.participantId] ??= {}
    res[entry.participantId][entry.competitionEvent] ??= 'created'
    if (entry.lockedAt) res[entry.participantId][entry.competitionEvent] = 'locked'
    if (entry.didNotSkipAt) res[entry.participantId][entry.competitionEvent] = 'dns'
  }
  return res
})

function abbr (cEvtDef: CompetitionEvent) {
  return cEvtDef.split('.')[4]
}

function openEntry (participant: Participant, cEvtDef: CompetitionEvent) {
  let entry = entries.value.find(en => en.participantId === participant.id && en.competitionEvent === cEvtDef)
  if (!entry) {
    entry = {
      id: uuid(),
      categoryId: route.params.categoryId as string,
      participantId: participant.id,
      competitionEvent: cEvtDef
    }
    entries.value.push(entry)
  }
  router.push(`/groups/${route.params.groupId}/categories/${route.params.categoryId}/entries/${entry.id}`)
}
</script>
