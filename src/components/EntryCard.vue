<template>
  <div
    :class="{
      'bg-blue-100': !entry.didNotSkipAt && !entry?.lockedAt,
      'bg-green-100': entry?.lockedAt && !entry.didNotSkipAt,
      'bg-gray-100': entry.didNotSkipAt
    }"
    class="p-2 rounded"
  >
    <p class="font-semibold">
      {{ category.name }}
    </p>
    <p>Pool: {{ entry.pool ?? '-' }}</p>
    <p><span class="font-semibold">{{ participant.name }}</span></p>
    <p><span class="font-semibold">{{ entry.competitionEventId }}</span></p>

    <div class="py-2">
      <button-link :to="`/groups/${groupId}/categories/${category.id}/entries/${entry.id}`">Edit</button-link>
      <text-button color="red" :loading="reorderEntryMutation.loading.value" @click="reorderEntryMutation.mutate({ entryId: entry.id })">Unheat</text-button>
      <text-button
        :disabled="!!entry?.lockedAt && !entry.didNotSkipAt"
        :loading="toggleLock.loading.value"
        :color="!!entry?.didNotSkipAt ? undefined : 'red'"
        @click="toggleLock.mutate({ entryId: entry.id, lock: !entry?.lockedAt, didNotSkip: true })"
      >
        {{ entry?.didNotSkipAt ? 'DS' : 'DNS' }}
      </text-button>
    </div>

    <table class="w-full">
      <thead>
        <tr>
          <th>Judge</th>
          <th class="w-4"><abbr title="Status: (C)reated, (O)pened, (S)ubmitted">S</abbr></th>
          <th class="w-4"><abbr title="Live display">L</abbr></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="assignment of judgeAssignments" :key="assignment.id">
          <td><span class="font-semibold">{{ assignment.judgeType }}</span>: {{ assignment.judge.name }}</td>
          <td
            class="text-center w-6 font-mono"
            :class="{
              'bg-gray-500': scoresheetStatus(scoresheetsObj[assignment.judge.id]?.[assignment.judgeType]) === 'missing',
              'bg-blue-500': scoresheetStatus(scoresheetsObj[assignment.judge.id]?.[assignment.judgeType]) === 'created',
              'bg-orange-500': scoresheetStatus(scoresheetsObj[assignment.judge.id]?.[assignment.judgeType]) === 'opened',
              'bg-green-500': scoresheetStatus(scoresheetsObj[assignment.judge.id]?.[assignment.judgeType]) === 'submitted'
            }"
          >
            <span v-if="scoresheetStatus(scoresheetsObj[assignment.judge.id]?.[assignment.judgeType]) === 'missing'" title="Missing">&ndash;</span>
            <span v-else-if="scoresheetStatus(scoresheetsObj[assignment.judge.id]?.[assignment.judgeType]) === 'created'" title="Created">C</span>
            <span v-else-if="scoresheetStatus(scoresheetsObj[assignment.judge.id]?.[assignment.judgeType]) === 'opened'" title="Opened">O</span>
            <span v-else-if="scoresheetStatus(scoresheetsObj[assignment.judge.id]?.[assignment.judgeType]) === 'submitted'" title="Submitted">S</span>
          </td>
          <td>
            <checkbox-field
              dense
              :loading="setScoresheetOptions.loading.value"
              :disabled="!scoresheetsObj[assignment.judge.id]?.[assignment.judgeType]?.device.id"
              :model-value="scoresheetsObj[assignment.judge.id]?.[assignment.judgeType]?.options?.live"
              @change="toggleScoresheetLive(scoresheetsObj[assignment.judge.id]?.[assignment.judgeType])"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'

import type { PropType } from 'vue'
import { CheckboxField, ButtonLink, TextButton } from '@ropescore/components'
import { isMarkScoresheet } from '../helpers'
import { AthleteFragment, EntryBaseFragment, CategoryBaseFragment, JudgeAssignmentFragment, JudgeBaseFragment, MarkScoresheetFragment, MarkScoresheetStatusFragment, ScoresheetBaseFragment, TeamFragment, useSetScoresheetOptionsMutation, useHeatsQuery, useReorderEntryMutation, useToggleEntryLockMutation } from '../graphql/generated'

const props = defineProps({
  groupId: {
    type: String,
    required: true
  },
  category: {
    type: Object as PropType<Pick<CategoryBaseFragment, 'id' | 'name'>>,
    required: true
  },
  entry: {
    type: Object as PropType<Readonly<EntryBaseFragment>>,
    required: true
  },
  participant: {
    type: Object as PropType<AthleteFragment | TeamFragment>,
    required: true
  },
  scoresheets: {
    type: Array as PropType<Readonly<Array<ScoresheetBaseFragment & MarkScoresheetStatusFragment>>>,
    default: () => []
  },
  judgeAssignments: {
    type: Object as PropType<Array<JudgeAssignmentFragment & { judge: JudgeBaseFragment }>>,
    required: true
  }
})

const jAs = toRef(props, 'judgeAssignments')

const reorderEntryMutation = useReorderEntryMutation({})

const judgeAssignments = computed(() => {
  if (!jAs.value) return []
  return jAs.value.filter(jA => jA.competitionEventId === props.entry.competitionEventId)
})

const scoresheetsObj = computed(() => {
  const result: Record<string | number, Record<string, ScoresheetBaseFragment & MarkScoresheetFragment>> = {}

  // sort ascending by createdAt time so that the last one will be picked
  // in the loop below
  const scoresheets = [...props.scoresheets].filter(scsh => scsh.__typename === 'MarkScoresheet') as Array<ScoresheetBaseFragment & MarkScoresheetFragment>
  scoresheets.sort((a, b) => a.createdAt - b.createdAt)

  for (const scoresheet of scoresheets) {
    result[scoresheet.judge.id] ??= {}
    result[scoresheet.judge.id][scoresheet.judgeType] = scoresheet
  }

  return result
})

function scoresheetStatus (scoresheet: MarkScoresheetFragment | undefined) {
  if (!scoresheet) return 'missing' as const
  else if (scoresheet?.submittedAt) return 'submitted' as const
  else if (!scoresheet.openedAt?.length) return 'created' as const
  else return 'opened' as const
}

const setScoresheetOptions = useSetScoresheetOptionsMutation({})

async function toggleScoresheetLive (scsh: ScoresheetBaseFragment) {
  const options = {
    ...(scsh.options ?? {}),
    live: !scsh.options?.live
  }

  setScoresheetOptions.mutate({ scoresheetId: scsh.id, options })
}

const toggleLock = useToggleEntryLockMutation({})
</script>
