<template>
  <tally-scoresheet
    v-if="!didNotSkip && category && assignment && isTallyScoresheet(scoresheet)"
    :scoresheet-id="scoresheet.id"
    :ruleset="category.ruleset"
    :competition-event="competitionEvent"
    :judge-type="assignment.judgeType"
    :disabled="disabled"
    table
  />

  <mark-scoresheet
    v-else-if="!didNotSkip && category && assignment && isMarkScoresheet(scoresheet)"
    :scoresheet-id="scoresheet.id"
    :ruleset="category.ruleset"
    :competition-event="competitionEvent"
    :judge-type="assignment.judgeType"
    :disabled="disabled"
    table
  />

  <td v-else :colspan="colspan - 1" />

  <td class="border-r-4">
    <div class="grid grid-cols-1 min-w-max">
      <!-- TODO: adding a new scoresheet doesn't trigger an update -->
      <!-- <text-button
        dense
        :disabled="disabled || !scoresheet"
        :tabindex="scoresheet ? -1 : undefined"
        @click="createTallyScoresheet(scoresheet)"
      >
        +T
      </text-button> -->
      <text-button
        dense
        :disabled="disabled || !!scoresheet"
        :tabindex="scoresheet ? -1 : undefined"
        @click="createTallyScoresheet()"
      >
        +B
      </text-button>
    </div>
  </td>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { v4 as uuid } from 'uuid'
import { calculateTally, CompetitionEvent, isMarkScoresheet, isTallyScoresheet, ScoreTally } from '../helpers'

import { TextButton } from '@ropescore/components'
import TallyScoresheet from './TallyScoresheet.vue'
import MarkScoresheet from './MarkScoresheet.vue'

import type { PropType } from 'vue'
import { Scoresheet } from '../graphql/generated'

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
  },
  didNotSkip: {
    type: Boolean,
    default: false
  },
  colspan: {
    type: Number,
    required: true
  }
})

const assignment = useJudgeAssignment(props.judgeId, props.categoryId, props.competitionEvent)
const scoresheets = useScoresheets(props.entryId, props.judgeId)
const category = useCategory(props.categoryId)

const scoresheet = computed(() => scoresheets.value[scoresheets.value.length - 1])

function createTallyScoresheet (previousScoresheet?: Scoresheet) {
  if (!assignment.value?.judgeType) return
  let tally: ScoreTally = {}

  if (isMarkScoresheet(previousScoresheet)) tally = calculateTally(previousScoresheet)
  else if (isTallyScoresheet(previousScoresheet)) tally = previousScoresheet.tally ?? {}

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
