<template>
  <div class="border rounded w-full h-full flex flex-col">
    <h3 class="text-lg mt-1 px-2 border-b">
      <span>{{ judge.name }}</span>
      <span class="text-xs font-normal">&nbsp;({{ judge.id }})</span>
    </h3>

    <details
      v-for="(scoresheet, idx) of scoresheets"
      :key="scoresheet.id"
      :open="idx === lastIncludedIdx"
      class="px-2 border-b relative"
    >
      <summary tabindex="-1" class="cursor-pointer" :class="{ 'text-gray-400': idx !== lastIncludedIdx }">
        <div class="inline-grid items-start grid-rows-[max-content,max-content]">
          <div>
            {{ isTallyScoresheet(scoresheet) ? 'Tally' : 'Mark' }} at {{ formatDate(scoresheet.createdAt) }}
          </div>
          <div class="text-gray-700 text-[0.5rem] whitespace-nowrap row-start-2 mb-1">
            ({{ scoresheet.id }}) app: {{ scoresheet.submitterProgramVersion ?? '-' }}
          </div>
        </div>
      </summary>

      <tally-scoresheet
        v-if="isTallyScoresheet(scoresheet)"
        :scoresheet="scoresheet"
        :rules-id="rulesId"
        :competition-event="competitionEvent"
        :judge-type="judgeType"
        :disabled="disabled || idx !== lastIncludedIdx"
      />

      <mark-scoresheet
        v-else-if="isMarkScoresheet(scoresheet)"
        :scoresheet="scoresheet"
        :rules-id="rulesId"
        :competition-event="competitionEvent"
        :judge-type="judgeType"
        :disabled="disabled || idx !== lastIncludedIdx"
      />

      <scoresheet-result
        :scoresheet="scoresheet"
        :rules-id="rulesId"
        :competition-event="competitionEvent"
        :judge-type="judgeType"
        class="mb-2 w-full"
      />

      <div class="mb-2 text-right">
        <text-button
          dense
          :color="scoresheet.excludedAt ? 'green' : 'orange'"
          :loading="setScoresheetExclusionMutation.loading.value"
          :disabled="disabled"
          @click="setScoresheetExclusionMutation.mutate({ scoresheetId: scoresheet.id, exclude: scoresheet.excludedAt == null })"
        >
          {{ scoresheet.excludedAt ? 'Include' : 'Exclude' }}
        </text-button>
      </div>
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
import { computed, toRef } from 'vue'
import { formatDate, type CompetitionEvent, isTallyScoresheet, isMarkScoresheet } from '../helpers'

import { TextButton } from '@ropescore/components'
import TallyScoresheet from './TallyScoresheet.vue'
import MarkScoresheet from './MarkScoresheet.vue'
import ScoresheetResult from './ScoresheetResult.vue'

import type { PropType } from 'vue'
import { type Judge, type MarkScoresheetFragment, type ScoresheetBaseFragment, type TallyScoresheetFragment, useCreateTallyScoresheetMutation, useSetScoresheetExclusionMutation } from '../graphql/generated'
import { type Mark, isMarkScoresheet as rsIsMarkScoresheet, isTallyScoresheet as rsIsTallyScoresheet } from '@ropescore/rulesets'
import { useCompetitionEvent } from '../hooks/rulesets'

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
  }
})

const lastIncludedIdx = computed(() => props.scoresheets.findLastIndex(scsh => scsh.excludedAt == null))

const createTallyScoresheetMutation = useCreateTallyScoresheetMutation({
  refetchQueries: ['EntryWithScoresheets'],
  awaitRefetchQueries: true
})

const setScoresheetExclusionMutation = useSetScoresheetExclusionMutation()

const competitionEventId = toRef(props, 'competitionEvent')
const cEvt = useCompetitionEvent(competitionEventId)

const judgeTypes = computed(() => Object.fromEntries(
  cEvt.value?.judges
    .map(j => {
      // TODO apply options
      const judge = j({})
      return [judge.id, judge] as const
    }) ?? []
))

async function createTallyScoresheet (previousScoresheet?: ScoresheetBaseFragment) {
  console.log(previousScoresheet)
  if (!props.judgeType) return
  let tally = {}

  if (rsIsMarkScoresheet(previousScoresheet)) {
    judgeTypes.value?.[props.judgeType]?.calculateTally({
      meta: {
        judgeId: previousScoresheet.judge.id,
        judgeTypeId: previousScoresheet.judgeType,
        entryId: '1',
        participantId: '1',
        competitionEvent: props.competitionEvent
      },
      marks: (previousScoresheet.marks as Array<Mark<string>> | undefined) ?? []
    })?.tally ?? {}
  } else if (rsIsTallyScoresheet(previousScoresheet)) {
    tally = previousScoresheet.tally ?? {}
  }

  await createTallyScoresheetMutation.mutate({
    entryId: props.entryId,
    judgeId: props.judge.id,
    data: {
      tally
    }
  })
}
</script>
