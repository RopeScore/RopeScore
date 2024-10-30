<template>
  <div class="sticky top-[3.5rem] -mt-4 py-2 w-full border-b flex items-center justify-between bg-white z-1000">
    <div>
      <div>{{ category?.name }}</div>
      <div>
        <span class="font-bold">{{ competitionEvent?.name }}</span>
      </div>
    </div>

    <div class="flex items-stretch">
      <text-button :loading="entriesWithScoresheetQuery.loading.value" @click="entriesWithScoresheetQuery.refetch()">
        Refresh
      </text-button>
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
          <th class="min-w-8" rowspan="2">
            Pool
          </th>

          <th class="border-r-4" rowspan="2" />

          <th
            v-for="assignment of assignments"
            :key="assignment.id"
            class="border-r-4"
            :colspan="judgeCols(assignment.judgeType).length + 1"
          >
            {{ assignment.judge.name }}
            <span v-if="assignment.pool" class="text-xs font-normal">(Pool {{ assignment.pool }})</span>
          </th>

          <th
            v-for="column in previewTable?.headers ?? []"
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
          <td class="text-right text-xs">
            {{ entries[participant.id]?.pool ?? '' }}
          </td>

          <td v-if="!entries[participant.id]" class="text-center border-r-4">
            <text-button
              dense
              color="blue"
              :loading="createEntryMutation.loading.value"
              @click="createEntryMutation.mutate({ categoryId, participantId: participant.id, data: { competitionEventId } })"
            >
              Score
            </text-button>
          </td>
          <td v-else class="text-center border-r-4">
            <div class="grid grid-cols-2 min-w-max">
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
            :key="assignment.judge.id"
          >
            <scoresheet-cols
              v-if="entries[participant.id] && (assignment.pool != null ? assignment.pool === entries[participant.id].pool : true)"
              :entry-id="entries[participant.id].id"
              :scoresheets="filterScoresheets(entries[participant.id].scoresheets, assignment.judge.id, assignment.judgeType)"
              :judge="assignment.judge"
              :competition-event="entries[participant.id].competitionEventId"
              :judge-type="assignment.judgeType"
              :rules-id="category?.rulesId!"
              :disabled="!!entries[participant.id]?.lockedAt"
              :did-not-skip="!!entries[participant.id]?.didNotSkipAt"
              :colspan="judgeCols(assignment.judgeType).length + 1"
            />
            <td v-else class="border-r-4" :colspan="judgeCols(assignment.judgeType).length + 1" />
          </template>

          <result-cols
            v-if="category && previewTable && entries[participant.id]"
            :rules-id="category.rulesId"
            :participant-id="participant.id"
            :entry="entries[participant.id]"
            :columns="previewTable.headers"
          />
          <td
            v-else
            :colspan="previewTable?.headers.length ?? 1"
          />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, type UnwrapRef } from 'vue'
import { useRouter } from 'vue-router'
import { useCompetitionEvent } from '../hooks/rulesets'
import { memberNames } from '../helpers'
import { useRouteParams } from '@vueuse/router'

import { TextButton } from '@ropescore/components'
import ScoresheetCols from '../components/ScoresheetCols.vue'
import ResultCols from '../components/ResultCols.vue'
import { useCreateEntryMutation, useToggleEntryLockMutation, useEntriesWithScoresheetsQuery, CategoryType, type Participant, type Judge, type JudgeAssignment, type ScoresheetBaseFragment } from '../graphql/generated'

const competitionEventId = useRouteParams<string>('competitionEventId', '')
const categoryId = useRouteParams<string>('categoryId', '')
const groupId = useRouteParams<string>('groupId', '')

const router = useRouter()

const entriesWithScoresheetQuery = useEntriesWithScoresheetsQuery(() => ({
  groupId: groupId.value,
  categoryId: categoryId.value,
  competitionEventId: competitionEventId.value
}), { fetchPolicy: 'cache-and-network' })

const category = computed(() => entriesWithScoresheetQuery.result.value?.group?.category)
const judgeAssignments = computed(() => entriesWithScoresheetQuery.result.value?.group?.category?.judgeAssignments ?? [])
const ents = computed(() => entriesWithScoresheetQuery.result.value?.group?.category?.entries ?? [])
const participants = computed(() => entriesWithScoresheetQuery.result.value?.group?.category?.participants ?? [])

const competitionEvent = useCompetitionEvent(competitionEventId)

const previewTable = computed(() => {
  // TODO: apply options
  return competitionEvent.value?.previewTable({})
})

// TODO: apply options
const judges = computed(() => competitionEvent.value?.judges.map(j => j({})) ?? [])

const assignments = computed(() => {
  return [...(judgeAssignments.value ?? [])]
    .filter(ja => ja.competitionEventId === competitionEventId.value)
    .sort((a, b) => {
      if (a.judgeType === b.judgeType) return a.judge.id.localeCompare(b.judge.id)
      return a.judgeType.localeCompare(b.judgeType)
    })
})

const entries = computed(() => {
  if (!ents.value) return {}
  const map: Record<Participant['id'], UnwrapRef<typeof ents>[number]> = {}
  for (const entry of ents.value) {
    if (entry.competitionEventId !== competitionEventId.value) continue
    map[entry.participant.id] = entry
  }
  return map
})

function goBack () {
  router.go(-1)
}

function judgeCols (judgeType: string) {
  return judges.value.find(j => j.id === judgeType)?.tallyDefinitions ?? []
}

const createEntryMutation = useCreateEntryMutation({
  refetchQueries: ['EntriesWithScoresheets'],
  awaitRefetchQueries: true
})
const toggleLock = useToggleEntryLockMutation({})

function filterScoresheets<T extends ScoresheetBaseFragment> (scoresheets: T[], judgeId: Judge['id'], judgeType: JudgeAssignment['judgeType']): T[] {
  console.log(scoresheets, judgeId, judgeType)
  return scoresheets.filter(scsh => scsh?.judge?.id === judgeId && scsh.judgeType === judgeType && scsh.excludedAt == null)
}
</script>
