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
import { computed, toRef } from 'vue'
import { useRuleset } from '../hooks/rulesets'
import { calculateTally } from '../helpers'

import type { PropType } from 'vue'
import type { CompetitionEvent } from '../helpers'
import type { RulesetId } from '../rules'

import { NumberField } from '@ropescore/components'
import { type MarkScoresheetFragment, type ScoresheetBaseFragment } from '../graphql/generated'

const props = defineProps({
  scoresheet: {
    type: Object as PropType<ScoresheetBaseFragment & MarkScoresheetFragment>,
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

const scoresheet = toRef(props, 'scoresheet')

const judgeTypes = computed(() => Object.fromEntries(
  useRuleset(props.rulesId)
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
