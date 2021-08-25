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
import { useScoresheet } from '../hooks/scoresheets'

import type { PropType } from 'vue'
import type { CompetitionEvent } from '../store/schema'
import type { RulesetId } from '../rules'

const props = defineProps({
  scoresheetId: {
    type: String,
    required: true
  },
  ruleset: {
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

const scoresheet = useScoresheet(props.scoresheetId)
const judgeType = computed(() =>
  useRuleset(props.ruleset)
    .value?.competitionEvents[props.competitionEvent]?.judges
    .find(j => j.id === props.judgeType)
)

const result = computed(() => {
  if (!scoresheet.value) return
  return judgeType.value?.calculateScoresheet(scoresheet.value)
})
</script>
