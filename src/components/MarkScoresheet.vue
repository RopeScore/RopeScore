<template>
  <fieldset v-if="!table" class="mb-2">
    <number-field
      v-for="tField of judgeTypes?.[judgeType]?.tallyFields ?? []"
      :key="tField.schema"
      :model-value="tally[tField.schema]"
      :label="tField.name"
      :disabled="true"
    />
  </fieldset>
  <template v-else>
    <td
      v-for="tField of judgeTypes?.[judgeType]?.tallyFields ?? []"
      :key="tField.schema"
    >
      <number-field
        :model-value="tally[tField.schema]"
        :label="tField.name"
        :disabled="true"
        dense
      />
    </td>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRuleset } from '../hooks/rulesets'
// import { useScoresheet } from '../hooks/scoresheets'
import { calculateTally } from '../helpers'

import type { PropType } from 'vue'
import type { CompetitionEvent } from '../helpers'
import type { RulesetId } from '../rules'

import { NumberField } from '@ropescore/components'

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

const tally = computed(() => {
  console.log(scoresheet.value)
  if (!scoresheet.value) return {}
  const t = calculateTally(scoresheet.value, judgeTypes.value?.[props.judgeType]?.tallyFields ?? [])
  console.log(t)
  return t
})
</script>
