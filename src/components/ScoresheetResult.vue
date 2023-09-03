<template>
  <table>
    <tr v-for="(score, symbol) of result?.result" :key="symbol">
      <th class="text-left w-[50%]">
        {{ symbol }}
      </th>
      <td class="text-right">
        {{ score }}
      </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'

import type { PropType } from 'vue'
import { isMarkScoresheet, isTallyScoresheet, type CompetitionEvent } from '../helpers'
import { type MarkScoresheetFragment, type TallyScoresheetFragment, type ScoresheetBaseFragment } from '../graphql/generated'
import { type ScoreTally, type Mark } from '@ropescore/rulesets'
import { useCompetitionEvent } from '../hooks/rulesets'

const props = defineProps({
  scoresheet: {
    type: Object as PropType<ScoresheetBaseFragment & (TallyScoresheetFragment | MarkScoresheetFragment)>,
    required: true
  },
  rulesId: {
    type: String,
    required: true
  },
  competitionEvent: {
    type: String as PropType<CompetitionEvent>,
    required: true
  },
  judgeType: {
    type: String,
    required: true
  }
})

const competitionEventId = toRef(props, 'competitionEvent')
const cEvt = useCompetitionEvent(competitionEventId)

const judgeType = computed(() =>
  cEvt.value?.judges
  // TODO apply options
    .map(j => j({}))
    .find(j => j.id === props.judgeType)
)

const result = computed(() => {
  if (!isTallyScoresheet(props.scoresheet) && !isMarkScoresheet(props.scoresheet)) return
  return judgeType.value?.calculateScoresheet({
    meta: {
      judgeId: props.scoresheet.judge.id,
      judgeTypeId: props.scoresheet.judgeType,
      entryId: '1',
      participantId: '1',
      competitionEvent: props.competitionEvent
    },
    ...(isMarkScoresheet(props.scoresheet) ? { marks: props.scoresheet.marks as Array<Mark<string>> } : { tally: props.scoresheet.tally as ScoreTally })
  })
})
</script>
