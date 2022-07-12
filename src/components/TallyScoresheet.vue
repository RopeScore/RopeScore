<template>
  <fieldset v-if="!table" class="mb-2">
    <number-field
      v-for="tField of judgeTypes?.[judgeType]?.tallyFields ?? []"
      :key="tField.schema"
      :model-value="scoresheet.tally?.[tField.schema]"
      :label="tField.name"
      :max="tField.max"
      :min="tField.min"
      :step="tField.step"
      :disabled="disabled"
      @update:model-value="setTally(tField.schema, $event)"
    />
  </fieldset>
  <template v-else-if="table">
    <td
      v-for="tField of judgeTypes?.[judgeType]?.tallyFields ?? []"
      :key="tField.schema"
      class="min-w-16"
    >
      <number-field
        :model-value="scoresheet.tally?.[tField.schema]"
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
import { computed, ref, toRef, watch } from 'vue'
import { useRuleset } from '../hooks/rulesets'
import { CompetitionEvent, ScoreTally } from '../helpers'

import type { PropType } from 'vue'
import type { RulesetId } from '../rules'

import { NumberField } from '@ropescore/components'
import { ScoresheetBaseFragment, TallyScoresheetFragment, useFillTallyScoresheetMutation } from '../graphql/generated'
import { useDebounceFn } from '@vueuse/core'
import { onBeforeRouteLeave } from 'vue-router'

const props = defineProps({
  scoresheet: {
    type: Object as PropType<ScoresheetBaseFragment & TallyScoresheetFragment>,
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

const emit = defineEmits(['update:tally', 'dirty'])

const judgeTypes = computed(() => Object.fromEntries(
  useRuleset(props.rulesId)
    .value?.competitionEvents[props.competitionEvent]?.judges
    .map(j => [j.id, j] as const) ?? []
))

const tally = ref<ScoreTally>({})
const dirty = ref<boolean>(false)

const scsh = toRef(props, 'scoresheet')
watch(() => scsh.value.tally, () => {
  tally.value = { ...(scsh.value.tally ?? {}) }
}, { immediate: true })

const setTally = (schema: string, value: number) => {
  tally.value[schema] = value
  dirty.value = true
  emit('update:tally', tally.value)
  saveTally()
}

const fillTallyScoresheetMutation = useFillTallyScoresheetMutation({})

const saveTally = useDebounceFn(() => {
  fillTallyScoresheetMutation.mutate({
    scoresheetId: props.scoresheet.id,
    tally: tally.value
  })
}, 2000)

fillTallyScoresheetMutation.onDone(() => {
  dirty.value = false
})

onBeforeRouteLeave(async (to, from, next) => {
  if (dirty.value) {
    await fillTallyScoresheetMutation.mutate({
      scoresheetId: props.scoresheet.id,
      tally: tally.value
    })
  }
  next()
})
</script>
