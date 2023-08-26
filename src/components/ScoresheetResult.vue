<template>
  <table>
    <tr v-for="(score, symbol) of result" :key="symbol">
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
import { computed } from 'vue'
import { useRuleset } from '../hooks/rulesets'

import type { PropType } from 'vue'
import type { RulesetId } from '../rules'
import { type CompetitionEvent } from '../helpers'
import { type MarkScoresheetFragment, type TallyScoresheetFragment, type ScoresheetBaseFragment } from '../graphql/generated'

const props = defineProps({
  scoresheet: {
    type: Object as PropType<ScoresheetBaseFragment & (TallyScoresheetFragment | MarkScoresheetFragment)>,
    required: true
  },
  rulesId: {
    type: String as PropType<RulesetId>,
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

const judgeType = computed(() =>
  useRuleset(props.rulesId)
    .value?.competitionEvents[props.competitionEvent]?.judges
    .find(j => j.id === props.judgeType)
)

const result = computed(() => {
  return judgeType.value?.calculateScoresheet(props.scoresheet)
})
</script>
