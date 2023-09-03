<template>
  <tally-scoresheet
    v-if="!didNotSkip && isTallyScoresheet(scoresheet)"
    :scoresheet="scoresheet"
    :rules-id="rulesId"
    :competition-event="competitionEvent"
    :judge-type="judgeType"
    :disabled="disabled"
    table
  />

  <mark-scoresheet
    v-else-if="!didNotSkip && isMarkScoresheet(scoresheet)"
    :scoresheet="scoresheet"
    :rules-id="rulesId"
    :competition-event="competitionEvent"
    :judge-type="judgeType"
    :disabled="disabled"
    table
  />

  <td v-else :colspan="colspan - 1" />

  <td class="border-r-4">
    <div class="grid grid-cols-1 min-w-max">
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
        :loading="createTallyScoresheetMutation.loading.value"
        :tabindex="scoresheet ? -1 : undefined"
        @click="createTallyScoresheet()"
      >
        +B
      </text-button>
    </div>
  </td>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { isTallyScoresheet, type CompetitionEvent, isMarkScoresheet } from '../helpers'
import { calculateTally, isMarkScoresheet as rsIsMarkScoresheet, isTallyScoresheet as rsIsTallyScoresheet } from '@ropescore/rulesets'

import { TextButton } from '@ropescore/components'
import TallyScoresheet from './TallyScoresheet.vue'
import MarkScoresheet from './MarkScoresheet.vue'

import type { PropType } from 'vue'
import { type Judge, type MarkScoresheetFragment, type ScoresheetBaseFragment, type TallyScoresheetFragment, useCreateTallyScoresheetMutation } from '../graphql/generated'

const props = defineProps({
  entryId: {
    type: String,
    required: true
  },
  scoresheets: {
    type: Array as PropType<Array<ScoresheetBaseFragment & (MarkScoresheetFragment | TallyScoresheetFragment)>>,
    required: true
  },
  judge: {
    type: Object as PropType<Pick<Judge, 'id' | 'name'>>,
    required: true
  },
  competitionEvent: {
    type: String as PropType<CompetitionEvent>,
    required: true
  },
  judgeType: {
    type: String,
    required: true
  },
  rulesId: {
    type: String,
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

const scoresheets = toRef(props, 'scoresheets')

const scoresheet = computed(() => scoresheets.value[scoresheets.value.length - 1])

const createTallyScoresheetMutation = useCreateTallyScoresheetMutation({
  refetchQueries: ['EntriesWithScoresheets'],
  awaitRefetchQueries: true
})

function createTallyScoresheet (previousScoresheet?: ScoresheetBaseFragment) {
  console.log(previousScoresheet)
  if (!props.judgeType) return
  let tally = {}

  if (rsIsMarkScoresheet(previousScoresheet)) tally = calculateTally(previousScoresheet)
  else if (rsIsTallyScoresheet(previousScoresheet)) tally = previousScoresheet.tally ?? {}

  createTallyScoresheetMutation.mutate({
    entryId: props.entryId,
    judgeId: props.judge.id,
    data: {
      tally
    }
  })
}
</script>
