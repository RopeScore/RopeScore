<template>
  <div
    :class="{
      'bg-blue-100': !entry.didNotSkipAt && !localEntry?.lockedAt,
      'bg-green-100': localEntry?.lockedAt,
      'bg-gray-100': entry.didNotSkipAt
    }"
    class="p-2 rounded"
  >
    <p class="font-semibold">
      {{ entry.categoryName }}
    </p>
    <p>Pool: {{ entry.pool ?? '-' }}</p>
    <p>{{ entry.participantId }}: <span class="font-semibold">{{ entry.participantName }}</span></p>
    <p><span class="font-semibold">{{ entry.competitionEventLookupCode }}</span></p>

    <table class="w-full">
      <thead>
        <tr>
          <th>Judge</th>
          <th>Device</th>
          <th><abbr title="Status: (C)reated, (O)pened, (S)ubmitted">S</abbr></th>
          <th><abbr title="Live display">L</abbr></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="assignment of judgeAssignments" :key="assignment.id">
          <td>{{ assignment.judgeId }} (<span class="font-semibold">{{ assignment.judgeType }}</span>): <span class="font-semibold">{{ findJudge(assignment.judgeId)?.name }}</span></td>
          <td class="max-w-40">
            <select-field
              :model-value="scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]?.device.id"
              class="min-w-24"
              dense
              :data-list="getDataList(scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]?.device)"
              label="Device"
              :disabled="loading || !!localEntry?.lockedAt || !!localEntry?.didNotSkipAt || !!scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]?.submittedAt"
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
          <td>
            <checkbox-field
              dense
              :loading="setScoresheetOptions.loading.value"
              :disabled="!scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]?.device.id"
              :model-value="scoresheetsObj[assignment.judgeId]?.[assignment.judgeType]?.options?.live"
              @change="setScoresheetLive(scoresheetsObj[assignment.judgeId]?.[assignment.judgeType])"
            />
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
import { useCreateScoresheetMutation, useReassignScoresheetMutation, ScoresheetFragmentDoc, Device, useSetScoresheetOptionsMutation } from '../graphql/generated'

import { SelectField, CheckboxField } from '@ropescore/components'

import type { PropType } from 'vue'
import type { EntryFragment, ScoresheetFragment } from '../graphql/generated'
import type { JudgeAssignment } from '../store/schema'
import type { DataListItem } from '../helpers'

const props = defineProps({
  entry: {
    type: Object as PropType<Readonly<EntryFragment>>,
    required: true
  },
  scoresheets: {
    type: Array as PropType<Readonly<ScoresheetFragment[]>>,
    default: () => []
  },
  groupId: {
    type: String,
    required: true
  },
  devices: {
    type: Array as PropType<Readonly<Array<Pick<Device, 'id' | 'name'>>>>,
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

  // sort ascending by createdAt time so that the last one will be picked
  // in the loop below
  const scoresheets = [...props.scoresheets]
  scoresheets.sort((a, b) => a.createdAt - b.createdAt)

  for (const scoresheet of scoresheets) {
    result[scoresheet.judgeId] ??= {}
    result[scoresheet.judgeId][scoresheet.judgeType] = scoresheet
  }

  return result
})

function getDataList (self?: Pick<Device, 'id' | 'name'>): DataListItem[] {
  const assigned = props.scoresheets.map(scsh => scsh.device.id)

  const arr = props.devices.filter(({ id }) =>
    !assigned.includes(id) ||
    id === self?.id
  )

  return arr.map(d => ({ value: d.id, text: d.name ? `${d.id} (${d.name})` : d.id }))
}

function scoresheetStatus (scoresheet: typeof props.scoresheets[number] | undefined) {
  if (!scoresheet) return 'missing' as const
  else if (scoresheet?.submittedAt) return 'submitted' as const
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
            fragment: ScoresheetFragmentDoc,
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

const setScoresheetOptions = useSetScoresheetOptionsMutation({})

async function setScoresheetLive (scsh: ScoresheetFragment) {
  const promises = []
  for (const scoresheet of props.scoresheets) {
    if (scoresheet.id === scsh.id) continue
    if (scoresheet.completedAt) continue
    if (!scoresheet.options?.live) continue

    const { live, ...options } = scoresheet.options

    promises.push(setScoresheetOptions.mutate({ scoresheetId: scoresheet.id, options }))
  }

  const options = {
    ...(scsh.options ?? {}),
    live: true
  }

  promises.push(setScoresheetOptions.mutate({ scoresheetId: scsh.id, options }))

  await Promise.all(promises)
}
</script>
