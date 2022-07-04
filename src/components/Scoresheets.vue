<template>
  <div class="border rounded w-full h-full flex flex-col">
    <h3 class="text-lg mt-1 px-2 border-b">
      <span class="font-semibold">{{ judge.id }}</span>
      <span v-if="judge?.name" class="font-thin">&ndash;{{ judge.name }}</span>
    </h3>

    <details
      v-for="(scoresheet, idx) of scoresheets"
      :key="scoresheet.id"
      :open="idx === scoresheets.length - 1"
      class="px-2 border-b"
    >
      <summary tabindex="-1" class="cursor-pointer" :class="{ 'text-gray-400': idx !== scoresheets.length - 1 }">
        {{ isTallyScoresheet(scoresheet) ? 'Tally' : 'Mark' }} at {{ formatDate(scoresheet.createdAt) }} <span class="text-gray-700 text-[0.5rem]">({{ scoresheet.id }})</span>
      </summary>

      <tally-scoresheet
        v-if="isTallyScoresheet(scoresheet)"
        :scoresheet="scoresheet"
        :rules-id="rulesId"
        :competition-event="competitionEvent"
        :judge-type="judgeType"
        :disabled="disabled || idx !== scoresheets.length - 1"
      />

      <mark-scoresheet
        v-else-if="isMarkScoresheet(scoresheet)"
        :scoresheet="scoresheet"
        :rules-id="rulesId"
        :competition-event="competitionEvent"
        :judge-type="judgeType"
        :disabled="disabled || idx !== scoresheets.length - 1"
      />

      <scoresheet-result
        :scoresheet="scoresheet"
        :rules-id="rulesId"
        :competition-event="competitionEvent"
        :judge-type="judgeType"
        class="mb-2 w-full"
      />
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
        :loading="createTallyScoresheetMutation.loading.value"
        @click="createTallyScoresheet(scoresheets[scoresheets.length - 1])"
      >
        Create Tally
      </text-button>
      <text-button
        dense
        :disabled="disabled"
        :tabindex="scoresheets.length ? -1 : undefined"
        :loading="createTallyScoresheetMutation.loading.value"
        @click="createTallyScoresheet()"
      >
        Create Blank
      </text-button>
    </menu>
  </div>
</template>

<script setup lang="ts">
import { formatDate, calculateTally, CompetitionEvent, isTallyScoresheet, isMarkScoresheet } from '../helpers'

import { TextButton } from '@ropescore/components'
import TallyScoresheet from './TallyScoresheet.vue'
import MarkScoresheet from './MarkScoresheet.vue'
import ScoresheetResult from './ScoresheetResult.vue'

import type { PropType } from 'vue'
import { Judge, MarkScoresheetFragment, ScoresheetBaseFragment, TallyScoresheetFragment, useCreateTallyScoresheetMutation } from '../graphql/generated'
import { RulesetId } from '../rules'

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
    type: String as PropType<RulesetId>,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const createTallyScoresheetMutation = useCreateTallyScoresheetMutation({
  refetchQueries: ['EntryWithScoresheets'],
  awaitRefetchQueries: true
})

function createTallyScoresheet (previousScoresheet?: ScoresheetBaseFragment) {
  console.log(previousScoresheet)
  if (!props.judgeType) return
  let tally = {}

  if (isMarkScoresheet(previousScoresheet)) tally = calculateTally(previousScoresheet)
  else if (isTallyScoresheet(previousScoresheet)) tally = previousScoresheet.tally ?? {}

  createTallyScoresheetMutation.mutate({
    entryId: props.entryId,
    judgeId: props.judge.id,
    data: {
      tally
    }
  })
}
</script>
