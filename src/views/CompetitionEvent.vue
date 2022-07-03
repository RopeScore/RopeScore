<template>
  <div class="sticky top-[3.5rem] -mt-4 py-2 w-full border-b flex items-center justify-between bg-white z-1000">
    <div>
      <div>{{ category?.name }}</div>
      <div>
        <span class="font-bold">{{ competitionEvent?.name }}</span>
      </div>
    </div>

    <div class="flex items-stretch">
      <text-button @click="entriesWithScoresheetQuery.refetch()" :loading="entriesWithScoresheetQuery.loading.value">Refresh</text-button>
      <text-button @click="goBack">
        Back
      </text-button>
    </div>
  </div>

  <div class="table-wrapper">
    <table class="min-w-full">
      <thead>
        <tr>
          <template v-if="category?.type === CategoryType.Team">
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
            {{ assignment.judge.id }} ({{ assignment.judge.name }})
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
            v-if="category?.type === CategoryType.Team"
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
            <text-button
              dense
              color="blue"
              :loading="createEntryMutation.loading.value"
              @click="createEntryMutation.mutate({ categoryId: route.params.categoryId as string, participantId: participant.id, data: { competitionEventId: route.params.competitionEventId as string } })"
            >
              Score
            </text-button>
          </td>
          <td v-else class="text-center border-r-4">
            <div class="grid grid-cols-2 min-w-max">
              <!-- TODO: unsetting DNS breaks -->
              <text-button
                :color="entries[participant.id].didNotSkipAt ? undefined : 'red'"
                dense
                :disabled="!!entries[participant.id].lockedAt && !entries[participant.id].didNotSkipAt"
                :loading="toggleLock.loading.value"
                @click="toggleLock.mutate({ entryId: entries[participant.id].id, lock: !entries[participant.id]?.lockedAt, didNotSkip: true })"
              >
                {{ entries[participant.id].didNotSkipAt ? 'DS' : 'DNS' }}
              </text-button>

              <text-button
                :color="entries[participant.id].lockedAt ? undefined : 'green'"
                dense
                :disabled="!!entries[participant.id].didNotSkipAt"
                :loading="toggleLock.loading.value"
                @click="toggleLock.mutate({ entryId: entries[participant.id].id, lock: !entries[participant.id]?.lockedAt, didNotSkip: false })"
              >
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
              :entry-id="entries[participant.id].id"
              :scoresheets="filterScoresheets(entries[participant.id].scoresheets, assignment.judge.id, assignment.judgeType)"
              :judge="assignment.judge"
              :competition-event="entries[participant.id].competitionEventId"
              :judge-type="assignment.judgeType"
              :rules-id="(category?.rulesId! as RulesetId)"
              :disabled="!!entries[participant.id]?.lockedAt"
              :did-not-skip="!!entries[participant.id]?.didNotSkipAt"
              :colspan="judgeCols(assignment.judgeType).length + 1"
            />
            <td v-else class="border-r-4" :colspan="judgeCols(assignment.judgeType).length + 1" />
          </template>

          <result-cols
            v-if="category && competitionEvent?.previewTable && entries[participant.id]"
            :rules-id="category.rulesId"
            :participant-id="participant.id"
            :entry="entries[participant.id]"
            :columns="competitionEvent?.previewTable"
          />
          <td
            v-else
            :colspan="competitionEvent?.previewTable.length ?? 1"
          />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, UnwrapRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRuleset } from '../hooks/rulesets'
import { CompetitionEvent, memberNames, } from '../helpers'

import { TextButton } from '@ropescore/components'
import ScoresheetCols from '../components/ScoresheetCols.vue'
import ResultCols from '../components/ResultCols.vue'
import { useCreateEntryMutation, useToggleEntryLockMutation, useEntriesWithScoresheetsQuery, CategoryType, Participant, Judge, JudgeAssignment, ScoresheetBaseFragment } from '../graphql/generated'
import { RulesetId } from '../rules'

const route = useRoute()
const router = useRouter()

const entriesWithScoresheetQuery = useEntriesWithScoresheetsQuery({
  groupId: route.params.groupId as string,
  categoryId: route.params.categoryId as string,
  competitionEventId: route.params.competitionEventId as string
}, { fetchPolicy: 'cache-and-network' })

const category = computed(() => entriesWithScoresheetQuery.result.value?.group?.category)
const judgeAssignments = computed(() => entriesWithScoresheetQuery.result.value?.group?.category?.judgeAssignments ?? [])
const ents = computed(() => entriesWithScoresheetQuery.result.value?.group?.category?.entries ?? [])
const participants = computed(() => entriesWithScoresheetQuery.result.value?.group?.category?.participants ?? [])

const ruleset = computed(() => useRuleset(category.value?.rulesId).value)
const competitionEvent = computed(() => {
  if (!route.params.competitionEventId) return
  return ruleset.value?.competitionEvents[route.params.competitionEventId as CompetitionEvent]
})

const assignments = computed(() => {
  return [...(judgeAssignments.value ?? [])]
    .filter(ja => ja.competitionEventId === route.params.competitionEventId)
    .sort((a, b) => {
      if (a.judgeType === b.judgeType) return a.judge.id.localeCompare(b.judge.id)
      return a.judgeType.localeCompare(b.judgeType)
    })
})

const entries = computed(() => {
  if (!ents.value) return {}
  const map: Record<Participant['id'], UnwrapRef<typeof ents>[number]> = {}
  for (const entry of ents.value) {
    if (entry.competitionEventId !== route.params.competitionEventId) continue
    map[entry.participant.id] = entry
  }
  return map
})

function goBack () {
  router.go(-1)
}

function judgeCols (judgeType: string) {
  return competitionEvent.value?.judges.find(j => j.id === judgeType)?.tallyFields ?? []
}

const createEntryMutation = useCreateEntryMutation({
  refetchQueries: ['EntriesWithScoresheets'],
  awaitRefetchQueries: true
})
const toggleLock = useToggleEntryLockMutation({})

function filterScoresheets<T extends ScoresheetBaseFragment> (scoresheets: T[], judgeId: Judge['id'], judgeType: JudgeAssignment['judgeType']): T[] {
  console.log(scoresheets, judgeId , judgeType)
  return scoresheets.filter(scsh => scsh?.judge?.id === judgeId && scsh.judgeType === judgeType)
}
</script>
