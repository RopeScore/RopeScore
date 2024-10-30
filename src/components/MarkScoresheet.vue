<template>
  <fieldset v-if="!table" class="mb-2">
    <number-field
      v-for="tField of judgeTypes?.[judgeType]?.tallyDefinitions ?? []"
      :key="tField.schema"
      :model-value="tally[tField.schema]"
      :label="tField.name"
      :disabled="true"
    />
  </fieldset>
  <template v-else>
    <td
      v-for="tField of judgeTypes?.[judgeType]?.tallyDefinitions ?? []"
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
import type { Mark, ScoreTally } from '@ropescore/rulesets'

import type { PropType } from 'vue'
import type { CompetitionEvent } from '../helpers'

import { NumberField } from '@ropescore/components'
import { type MarkScoresheetFragment, type ScoresheetBaseFragment } from '../graphql/generated'
import { useCompetitionEvent } from '../hooks/rulesets'

const props = defineProps({
  scoresheet: {
    type: Object as PropType<ScoresheetBaseFragment & MarkScoresheetFragment>,
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

const tally = computed<ScoreTally>(() => {
  if (!scoresheet.value) return {}
  return judgeTypes.value?.[props.judgeType]?.calculateTally({
    meta: {
      judgeId: props.scoresheet.judge.id,
      judgeTypeId: props.scoresheet.judgeType,
      entryId: '1',
      participantId: '1',
      competitionEvent: props.competitionEvent
    },
    marks: (scoresheet.value.marks as Array<Mark<string>> | undefined) ?? []
  })?.tally ?? {}
})
</script>
