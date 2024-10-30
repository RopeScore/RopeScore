<template>
  <div class="sticky top-[3.5rem] -mt-4 py-2 w-full border-b flex items-center justify-between bg-white z-1000">
    <div>
      <div>{{ category?.name }}</div>
      <div>
        <span class="font-bold">{{ competitionEvent?.name }}</span> entry for
        <span class="font-bold">{{ entry?.participant.name }}</span> from
        <span class="font-bold">{{ entry?.participant.club }}</span>
        <span class="text-xs">&nbsp;({{ entry?.participant.id }})</span>
      </div>
    </div>

    <div class="flex items-stretch">
      <text-button :loading="entryWithScoresheetQuery.loading.value" @click="entryWithScoresheetQuery.refetch()">
        Refresh
      </text-button>
      <text-button @click="goBack">
        Back
      </text-button>
      <!-- <text-button>Previous</text-button> -->
      <!-- <text-button>Next</text-button> -->
      <text-button
        :disabled="!!entry?.lockedAt && !entry.didNotSkipAt"
        :loading="toggleLock.loading.value"
        :color="!!entry?.didNotSkipAt ? undefined : 'red'"
        @click="toggleLock.mutate({ entryId, lock: !entry?.lockedAt, didNotSkip: true })"
      >
        {{ entry?.didNotSkipAt ? 'Did Skip' : 'Did Not Skip' }}
      </text-button>
      <text-button
        :disabled="!!entry?.didNotSkipAt"
        :loading="toggleLock.loading.value"
        @click="toggleLock.mutate({ entryId, lock: !entry?.lockedAt, didNotSkip: false })"
      >
        {{ entry?.lockedAt ? 'Unlock' : 'Lock' }}
      </text-button>
    </div>
  </div>

  <div v-if="entry && !entry?.didNotSkipAt">
    <section v-for="judgeType of judges" :key="judgeType.id" class="mt-4">
      <h2>{{ judgeType.name }} ({{ judgeType.id }})</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
        <scoresheets
          v-for="assignment of filterAssignments(judgeAssignments, judgeType.id, entry)"
          :key="assignment.id"
          :entry-id="entry.id"
          :scoresheets="filterScoresheets(scoresheets, assignment.judge.id, assignment.judgeType)"
          :judge="assignment.judge"
          :competition-event="entry.competitionEventId"
          :judge-type="assignment.judgeType"
          :rules-id="category?.rulesId!"
          :disabled="!!entry.lockedAt"
        />
      </div>
    </section>
  </div>

  <div class="mt-10" />

  <div v-if="!entry?.didNotSkipAt" class="fixed bottom-0 right-0 left-0 h-18 bg-white  flex justify-center items-center border-t">
    <div class="grid grid-rows-2 grid-cols-[repeat(auto-fill,1fr)] container">
      <template v-for="col of previewTable?.headers ?? []" :key="col.key">
        <span class="row-start-1 font-bold px-2 border-b">{{ col.text }}</span>
        <span v-if="result" class="row-start-2 px-2">{{ col.formatter?.(result.result[col.key]) ?? result.result[col.key] }}</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type UnwrapRef } from 'vue'
import { useRouter } from 'vue-router'
import { useCompetitionEvent } from '../hooks/rulesets'
import { useRouteParams } from '@vueuse/router'

import { TextButton } from '@ropescore/components'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Scoresheets from '../components/Scoresheets.vue'

import { type EntryBaseFragment, type Judge, type JudgeAssignment, type ScoresheetBaseFragment, useEntryWithScoresheetsQuery, useToggleEntryLockMutation } from '../graphql/generated'
import { filterLatestScoresheets } from '../helpers'
import { isMarkScoresheet, isTallyScoresheet, type JudgeResult, type ScoreTally } from '@ropescore/rulesets'

const categoryId = useRouteParams<string>('categoryId', '')
const groupId = useRouteParams<string>('groupId', '')
const entryId = useRouteParams<string>('entryId', '')

const router = useRouter()

const entryWithScoresheetQuery = useEntryWithScoresheetsQuery(() => ({
  groupId: groupId.value,
  categoryId: categoryId.value,
  entryId: entryId.value
}), { fetchPolicy: 'cache-and-network' })

const category = computed(() => entryWithScoresheetQuery.result.value?.group?.category)
const entry = computed(() => entryWithScoresheetQuery.result.value?.group?.entry)
const scoresheets = computed(() => entryWithScoresheetQuery.result.value?.group?.entry?.scoresheets ?? [])
const judgeAssignments = computed(() => entryWithScoresheetQuery.result.value?.group?.category?.judgeAssignments)
const competitionEventId = computed(() => entry.value?.competitionEventId)

const competitionEvent = useCompetitionEvent(competitionEventId)
// TODO: apply options
const judges = computed(() => competitionEvent.value?.judges.map(j => j({})) ?? [])

const result = computed(() => {
  if (entry.value == null) return
  const scoresheets = filterLatestScoresheets(entry.value.scoresheets)
  // TODO: apply config
  const judges = competitionEvent.value?.judges.map(j => j({})) ?? []
  const judgeResults = scoresheets
    .map(scsh => {
      if (entry.value == null) return undefined
      const judge = judges.find(j => j.id === scsh.judgeType)
      if (judge == null) return undefined

      const meta = {
          entryId: entry.value.id,
          participantId: entry.value.participant.id,
          competitionEvent: entry.value.competitionEventId,
          judgeTypeId: scsh.judgeType,
          judgeId: scsh.judge.id
        }

      const tallyScsh = isTallyScoresheet(scsh) ? { meta, tally: scsh.tally as ScoreTally } : judge.calculateTally({ meta, marks: isMarkScoresheet(scsh) ? scsh.marks : [] })

      return judge.calculateJudgeResult(tallyScsh)
    })
    .filter(r => r != null) as JudgeResult[]
  return competitionEvent.value?.calculateEntry(
    {
      entryId: entry.value.id,
      participantId: entry.value.participant.id,
      competitionEvent: entry.value.competitionEventId
    },
    judgeResults,
    // TODO: apply options
    {}
  )
})

const previewTable = computed(() => {
  // TODO: apply options
  return competitionEvent.value?.previewTable({})
})

function goBack () {
  router.go(-1)
}

const toggleLock = useToggleEntryLockMutation({})

toggleLock.onDone(res => {
  if (res.data?.toggleEntryLock.lockedAt) {
    router.go(-1)
  }
})

function filterAssignments (assignments: UnwrapRef<typeof judgeAssignments>, judgeType: string, entry: EntryBaseFragment | undefined) {
  return assignments?.filter(ja => ja.judgeType === judgeType && ja.competitionEventId === entry?.competitionEventId && (ja.pool != null ? ja.pool === entry?.pool : true)) ?? []
}

function filterScoresheets<T extends ScoresheetBaseFragment> (scoresheets: T[], judgeId: Judge['id'], judgeType: JudgeAssignment['judgeType']): T[] {
  return scoresheets.filter(scsh => scsh?.judge?.id === judgeId && scsh.judgeType === judgeType)
}
</script>
