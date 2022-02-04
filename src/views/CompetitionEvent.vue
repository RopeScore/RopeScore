<template>
  <div class="sticky top-[3.5rem] -mt-4 py-2 w-full border-b flex items-center justify-between bg-white z-1000">
    <div>
      <div>{{ category?.name }}</div>
      <div>
        <span class="font-bold">{{ competitionEvent?.name }}</span>
      </div>
    </div>

    <div class="flex items-stretch">
      <text-button @click="goBack">
        Back
      </text-button>
    </div>
  </div>

  <div class="table-wrapper">
    <table class="min-w-full">
      <thead>
        <tr>
          <template v-if="category?.type === 'team'">
            <th rowspan="2">
              Team Name
            </th>
            <th rowspan="2">
              Team Members
            </th>
          </template>
          <th v-else rowspan="2">
            Name
          </th>
          <th rowspan="2">
            Club
          </th>
          <th class="min-w-8" rowspan="2">
            ID
          </th>

          <th class="border-r-4" rowspan="2" />

          <th
            v-for="assignment of assignments"
            :key="assignment.id"
            class="border-r-4"
            :colspan="judgeCols(assignment.judgeType).length + 1"
          >
            {{ assignment.judgeId }} ({{ assignment.judgeType }})
          </th>

          <th
            v-for="column in competitionEvent?.previewTable"
            :key="column.key"
            rowspan="2"
          >
            {{ column.text }}
          </th>
        </tr>
        <tr>
          <template
            v-for="assignment of assignments"
            :key="assignment.id"
          >
            <th
              v-for="col of judgeCols(assignment.judgeType)"
              :key="col.schema"
            >
              {{ col.name }}
            </th>

            <th class="border-r-4" />
          </template>
        </tr>
      </thead>

      <tbody>
        <tr v-for="participant of participants" :key="participant.id">
          <td class="text-xs">
            {{ participant.name }}
          </td>
          <td
            v-if="category?.type === 'team'"
            class="max-w-[20rem] truncate text-xs"
          >
            {{ memberNames(participant) }}
          </td>
          <td class="text-xs">
            {{ participant.club }}
          </td>
          <td class="text-right text-xs">
            {{ participant.id }}
          </td>

          <td v-if="!entries[participant.id]" class="text-center border-r-4">
            <text-button dense color="blue" @click="createEntry(participant)">
              Score
            </text-button>
          </td>
          <td v-else class="text-center border-r-4">
            <div class="grid grid-cols-2 min-w-max">
              <!-- TODO: unsetting DNS breaks -->
              <text-button :color="entries[participant.id].didNotSkipAt ? undefined : 'red'" dense :disabled="!!entries[participant.id].lockedAt || !!entries[participant.id].didNotSkipAt" @click="toggleDNS(entries[participant.id])">
                {{ entries[participant.id].didNotSkipAt ? 'DS' : 'DNS' }}
              </text-button>

              <text-button :color="entries[participant.id].lockedAt ? undefined : 'green'" dense :disabled="!!entries[participant.id].didNotSkipAt" @click="toggleLock(entries[participant.id])">
                {{ entries[participant.id].lockedAt ? 'ULK' : 'LCK' }}
              </text-button>
            </div>
          </td>

          <template
            v-for="assignment of assignments"
            :key="assignment.judgeId"
          >
            <scoresheet-cols
              v-if="entries[participant.id]"
              :category-id="String(route.params.categoryId)"
              :entry-id="entries[participant.id]?.id"
              :judge-id="assignment.judgeId"
              :competition-event="entries[participant.id]?.competitionEvent"
              :disabled="!!entries[participant.id]?.lockedAt"
              :did-not-skip="!!entries[participant.id]?.didNotSkipAt"
              :colspan="judgeCols(assignment.judgeType).length + 1"
            />
            <td v-else class="border-r-4" :colspan="judgeCols(assignment.judgeType).length + 1" />
          </template>

          <result-cols
            v-if="competitionEvent?.previewTable && entries[participant.id]"
            :category-id="String(route.params.categoryId)"
            :entry-id="entries[participant.id].id"
            :columns="competitionEvent?.previewTable"
          />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategory } from '../hooks/categories'
import { useRuleset } from '../hooks/rulesets'
import { useJudgeAssignments } from '../hooks/judgeAssignments'
import { useParticipants } from '../hooks/participants'
import { useEntries } from '../hooks/entries'
import { memberNames } from '../helpers'
import { db } from '../store/idbStore'
import { v4 as uuid } from 'uuid'

import { TextButton } from '@ropescore/components'
import ScoresheetCols from '../components/ScoresheetCols.vue'
import ResultCols from '../components/ResultCols.vue'

import type { CompetitionEvent, Participant, Entry } from '../store/schema'

const route = useRoute()
const router = useRouter()
const category = useCategory(route.params.categoryId as string)
const ruleset = computed(() => useRuleset(category.value?.ruleset).value)
const competitionEvent = computed(() => {
  if (!route.params.competitionEvent) return
  return ruleset.value?.competitionEvents[route.params.competitionEvent as CompetitionEvent]
})
const jA = useJudgeAssignments(route.params.categoryId as string, route.params.competitionEvent as CompetitionEvent)
const assignments = computed(() => {
  return [...(jA.value ?? [])].sort((a, b) => {
    if (a.judgeType === b.judgeType) return a.judgeId - b.judgeId
    return a.judgeType.localeCompare(b.judgeType)
  })
})
const participants = useParticipants(route.params.categoryId as string)
const ents = useEntries(route.params.categoryId as string)

const entries = computed(() => {
  if (!ents.value) return {}
  const map: Record<Participant['id'], Entry> = {}
  for (const entry of ents.value) {
    if (entry.competitionEvent !== route.params.competitionEvent) continue
    map[entry.participantId] = entry
  }
  return map
})

function goBack () {
  router.go(-1)
}

function judgeCols (judgeType: string) {
  return competitionEvent.value?.judges.find(j => j.id === judgeType)?.tallyFields ?? []
}

function createEntry (participant: Participant) {
  ents.value.push({
    id: uuid(),
    categoryId: route.params.categoryId as string,
    participantId: participant.id,
    competitionEvent: route.params.competitionEvent as CompetitionEvent
  })
}

function toggleDNS (entry: Entry) {
  db.entries.update(entry.id, {
    didNotSkipAt: entry.didNotSkipAt ? null : Date.now()
  })
}

function toggleLock (entry: Entry) {
  db.entries.update(entry.id, {
    lockedAt: entry.lockedAt ? null : Date.now()
  })
}
</script>
