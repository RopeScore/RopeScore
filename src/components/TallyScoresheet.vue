<template>
  <fieldset v-if="!table && isTallyScoresheet(scoresheet)" class="mb-2">
    <number-field
      v-for="tField of judgeTypes?.[judgeType]?.tallyFields ?? []"
      :key="tField.schema"
      :model-value="scoresheet.tally[tField.schema]"
      :label="tField.name"
      :max="tField.max"
      :min="tField.min"
      :step="tField.step"
      :disabled="disabled"
      @update:model-value="setTally(tField.schema, $event)"
    />
  </fieldset>
  <template v-else-if="table && isTallyScoresheet(scoresheet)">
    <td
      v-for="tField of judgeTypes?.[judgeType]?.tallyFields ?? []"
      :key="tField.schema"
      class="min-w-16"
    >
      <number-field
        :model-value="scoresheet.tally[tField.schema]"
        :label="tField.name"
        :max="tField.max"
        :min="tField.min"
        :step="tField.step"
        :disabled="disabled"
        dense
        @update:model-value="setTally(tField.schema, $event)"
      />
    </td>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRuleset } from '../hooks/rulesets'
import { useScoresheet } from '../hooks/scoresheets'
import { isTallyScoresheet } from '../store/schema'

import type { PropType } from 'vue'
import type { CompetitionEvent } from '../store/schema'
import type { RulesetId } from '../rules'

import NumberField from './NumberField.vue'

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
  },
  disabled: {
    type: Boolean,
    default: false
  },
  table: {
    type: Boolean,
    default: false
  }
})

const scoresheet = useScoresheet(props.scoresheetId)
const judgeTypes = computed(() => Object.fromEntries(
  useRuleset(props.ruleset)
    .value?.competitionEvents[props.competitionEvent]?.judges
    .map(j => [j.id, j] as const) ?? []
))

// TODO: debounce/queue changes
const setTally = (schema: string, value: number) => {
  if (!isTallyScoresheet(scoresheet.value)) return
  scoresheet.value.tally[schema] = value
}
</script>
