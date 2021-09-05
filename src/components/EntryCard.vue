<template>
  <div
    :class="{
      'bg-blue-100': !entry.didNotSkipAt && !localEntry?.lockedAt,
      'bg-green-100': localEntry?.lockedAt,
      'bg-gray-100': entry.didNotSkipAt
    }"
    class="p-2 rounded"
  >
    <p>{{ entry.id }}</p>
    <p>{{ entry.categoryName }}</p>
    <p>{{ entry.competitionEventLookupCode }}</p>
    <p>{{ entry.participantId }} - {{ entry.participantName }}</p>

    <table class="w-full">
      <tbody>
        <tr v-for="assignment of judgeAssignments" :key="assignment.id">
          <td>{{ assignment.judgeId }} &ndash; {{ findJudge(assignment.judgeId)?.name }} ({{ assignment.judgeType }})</td>
          <td>
            <select-field
              :model-value="scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]?.device.id"
              class="min-w-24"
              dense
              :data-list="filterUnassignedAndSelf(scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]?.device.id)"
              label="Device"
              :disabled="loading"
              @update:model-value="assignScoresheet(assignment, $event)"
            />
          </td>
          <td
            class="text-center w-6"
            :class="{
              'bg-gray-500': scoresheetStatus(scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]) === 'missing',
              'bg-blue-500': scoresheetStatus(scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]) === 'created',
              'bg-orange-500': scoresheetStatus(scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]) === 'opened',
              'bg-green-500': scoresheetStatus(scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]) === 'submitted'
            }"
          >
            <span v-if="scoresheetStatus(scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]) === 'missing'" title="Missing">&ndash;</span>
            <span v-else-if="scoresheetStatus(scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]) === 'created'" title="Created">C</span>
            <span v-else-if="scoresheetStatus(scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]) === 'opened'" title="Opened">O</span>
            <span v-else-if="scoresheetStatus(scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]) === 'submitted'" title="Submitted">S</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMutationLoading } from '@vue/apollo-composable'
import { useJudgeAssignments } from '../hooks/judgeAssignments'
import { useJudges } from '../hooks/judges'
import { useEntry } from '../hooks/entries'
import { useCategory } from '../hooks/categories'
import { useCreateScoresheetMutation, useReassignScoresheetMutation, ScoresheetFragmentFragmentDoc } from '../graphql/generated'

import SelectField from './SelectField.vue'

import type { PropType } from 'vue'
import type { Entry, Scoresheet } from '../graphql/generated'
import type { JudgeAssignment } from '../store/schema'

const props = defineProps({
  entry: {
    type: Object as PropType<Readonly<Entry>>,
    required: true
  },
  scoresheets: {
    type: Array as PropType<Readonly<Scoresheet[]>>,
    default: () => []
  },
  groupId: {
    type: String,
    required: true
  },
  deviceIds: {
    type: Array as PropType<Readonly<string[]>>,
    default: () => []
  }
})

const localEntry = useEntry(props.entry.id)

const jAs = useJudgeAssignments(props.entry.categoryId)

const judgeAssignments = computed(() => {
  if (!jAs.value) return []
  return jAs.value.filter(jA => jA.competitionEvent === props.entry.competitionEventLookupCode)
})

const judges = useJudges(props.groupId)

function findJudge (judgeId: number) {
  return judges.value.find(j => j.id === judgeId)
}

const scoresheetsObj = computed(() => {
  const result: Record<string | number, Record<string, typeof props.scoresheets[number]>> = {}

  for (const scoresheet of props.scoresheets) {
    result[scoresheet.judgeId] ??= {}
    result[scoresheet.judgeId][scoresheet.judgeType] = scoresheet
  }

  return result
})

function filterUnassignedAndSelf (selfId?: string) {
  const assigned = props.scoresheets.map(scsh => scsh.device.id)

  const arr = props.deviceIds.filter(dId => !assigned.includes(dId))

  if (selfId) arr.unshift(selfId)

  return arr
}

function scoresheetStatus (scoresheet: typeof props.scoresheets[number] | undefined) {
  if (!scoresheet) return 'missing' as const
  else if (scoresheet.submittedAt) return 'submitted' as const
  else if (!scoresheet.openedAt?.length) return 'created' as const
  else return 'opened' as const
}

const category = useCategory(props.entry.categoryId)

const createScoresheet = useCreateScoresheetMutation({
  update (cache, { data }) {
    if (!data?.createScoresheets) return

    cache.modify({
      id: cache.identify(props.entry),
      fields: {
        scoresheets (existingScoresheetRefs = []) {
          const newScshRefs = data.createScoresheets.map(scsh => cache.writeFragment({
            fragment: ScoresheetFragmentFragmentDoc,
            data: scsh
          }))
          return [...existingScoresheetRefs, ...newScshRefs]
        }
      }
    })
  }
})
const reassignScoresheet = useReassignScoresheetMutation({})
const loading = useMutationLoading()

function assignScoresheet (assignment: JudgeAssignment, deviceId: string) {
  if (scoresheetsObj.value[assignment.judgeId]?.[assignment.judgeType]) {
    reassignScoresheet.mutate({
      scoresheetId: scoresheetsObj.value[assignment.judgeId]?.[assignment.judgeType].id,
      deviceId
    })
  } else if (category.value) {
    createScoresheet.mutate({
      entryId: props.entry.id,
      scoresheet: {
        deviceId,
        judgeId: `${assignment.judgeId}`,
        judgeType: assignment.judgeType,
        judgeName: findJudge(assignment.judgeId)?.name ?? '',
        rulesId: category.value?.ruleset
      }
    })
  }
}
</script>
