<template>
  <div class="border rounded w-full h-full flex flex-col">
    <h3 class="text-lg mt-1 px-2 border-b">
      <span class="font-semibold">{{ judgeId }}</span>
      <span v-if="judge?.name" class="font-thin">&ndash;{{ judge.name }}</span>
    </h3>

    <details
      v-for="(scoresheet, idx) of scoresheets"
      :key="scoresheet.id"
      :open="idx === scoresheets.length - 1"
      class="px-2 border-b"
    >
      <summary tabindex="-1" class="cursor-pointer" :class="{ 'text-gray-400': idx !== scoresheets.length - 1 }">
        {{ isTallyScoresheet(scoresheet) ? 'Tally' : 'Mark' }} at {{ formatDate(scoresheet.createdAt) }}
      </summary>

      <template v-if="category && assignment">
        <tally-scoresheet
          v-if="isTallyScoresheet(scoresheet)"
          :scoresheet-id="scoresheet.id"
          :ruleset="category.ruleset"
          :competition-event="competitionEvent"
          :judge-type="assignment.judgeType"
          :disabled="disabled || idx !== scoresheets.length - 1"
        />

        <mark-scoresheet
          v-else-if="isMarkScoresheet(scoresheet)"
          :scoresheet-id="scoresheet.id"
          :ruleset="category.ruleset"
          :competition-event="competitionEvent"
          :judge-type="assignment.judgeType"
          :disabled="disabled || idx !== scoresheets.length - 1"
        />

        <scoresheet-result
          :scoresheet-id="scoresheet.id"
          :ruleset="category.ruleset"
          :competition-event="competitionEvent"
          :judge-type="assignment.judgeType"
          class="mb-2 w-full"
        />
      </template>
    </details>

    <div v-if="!scoresheets.length" class="w-full px-1">
      No scoresheets
    </div>

    <div class="flex-grow" />

    <menu class="m-0 p-1 text-right">
      <text-button
        dense
        :disabled="disabled || !scoresheets.length"
        :tabindex="scoresheets.length ? -1 : undefined"
        @click="createTallyScoresheet(scoresheets[scoresheets.length - 1])"
      >
        Create Tally
      </text-button>
      <text-button
        dense
        :disabled="disabled"
        :tabindex="scoresheets.length ? -1 : undefined"
        @click="createTallyScoresheet()"
      >
        Create Blank
      </text-button>
    </menu>
  </div>
</template>

<script setup lang="ts">
import { v4 as uuid } from 'uuid'
import { useJudge } from '../hooks/judges'
import { useScoresheets } from '../hooks/scoresheets'
import { useCategory } from '../hooks/categories'
import { useJudgeAssignment } from '../hooks/judgeAssignments'
import { isTallyScoresheet, isMarkScoresheet } from '../store/schema'
import { formatDate, calculateTally } from '../helpers'

import { TextButton } from '@ropescore/components'
import TallyScoresheet from './TallyScoresheet.vue'
import MarkScoresheet from './MarkScoresheet.vue'
import ScoresheetResult from './ScoresheetResult.vue'

import type { PropType } from 'vue'
import type { CompetitionEvent, Scoresheet } from '../store/schema'

const props = defineProps({
  categoryId: {
    type: String,
    required: true
  },
  entryId: {
    type: String,
    required: true
  },
  judgeId: {
    type: Number,
    required: true
  },
  competitionEvent: {
    type: String as PropType<CompetitionEvent>,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const judge = useJudge(props.judgeId)
const assignment = useJudgeAssignment(props.judgeId, props.categoryId, props.competitionEvent)
const scoresheets = useScoresheets(props.entryId, props.judgeId)
const category = useCategory(props.categoryId)

function createTallyScoresheet (previousScoresheet?: Scoresheet) {
  console.log(previousScoresheet)
  if (!assignment.value?.judgeType) return
  let tally = {}

  if (isMarkScoresheet(previousScoresheet)) tally = calculateTally(previousScoresheet)
  else if (isTallyScoresheet(previousScoresheet)) tally = previousScoresheet.tally

  scoresheets.value.push({
    id: uuid(),
    judgeId: props.judgeId,
    entryId: props.entryId,
    competitionEvent: props.competitionEvent,
    judgeType: assignment.value.judgeType,

    createdAt: Date.now(),
    updatedAt: Date.now(),

    tally
  })
}
</script>
