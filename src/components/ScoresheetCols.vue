<template>
  <template v-if="scoresheet != null">
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

    <td class="border-r-4">
      <div class="grid grid-cols-1 min-w-max">
        <text-button
          dense
          :disabled="disabled || isTallyScoresheet(scoresheet)"
          :tabindex="scoresheet ? -1 : undefined"
          @click="createTallyScoresheet(scoresheet)"
        >
          +T
        </text-button>
      </div>
    </td>
  </template>

  <td v-else :colspan="colspan" class="border-r-4">
    <text-button
      dense
      :disabled="disabled"
      :loading="createTallyScoresheetMutation.loading.value"
      @click="createTallyScoresheet()"
    >
      +B
    </text-button>
  </td>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { isTallyScoresheet, type CompetitionEvent, isMarkScoresheet } from '../helpers'
import { type Mark, isMarkScoresheet as rsIsMarkScoresheet, isTallyScoresheet as rsIsTallyScoresheet } from '@ropescore/rulesets'

import { TextButton } from '@ropescore/components'
import TallyScoresheet from './TallyScoresheet.vue'
import MarkScoresheet from './MarkScoresheet.vue'

import type { PropType } from 'vue'
import { type Judge, type MarkScoresheetFragment, type ScoresheetBaseFragment, type TallyScoresheetFragment, useCreateTallyScoresheetMutation } from '../graphql/generated'
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

const createTallyScoresheetMutation = useCreateTallyScoresheetMutation({
  refetchQueries: ['EntriesWithScoresheets'],
  awaitRefetchQueries: true
})

async function createTallyScoresheet (previousScoresheet?: ScoresheetBaseFragment) {
  console.log(previousScoresheet)
  if (!props.judgeType) return
  let tally = {}

  if (rsIsMarkScoresheet(previousScoresheet)) {
    tally = judgeTypes.value?.[props.judgeType]?.calculateTally({
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
