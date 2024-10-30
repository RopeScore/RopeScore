<template>
  <fieldset v-if="!table" class="mb-2">
    <number-field
      v-for="tField of judgeTypes?.[judgeType]?.tallyDefinitions ?? []"
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
      v-for="tField of judgeTypes?.[judgeType]?.tallyDefinitions ?? []"
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
import { type CompetitionEvent } from '../helpers'
import { name } from '../../package.json'
import { version } from '../helpers'

import type { PropType } from 'vue'

import { NumberField } from '@ropescore/components'
import { type ScoresheetBaseFragment, type TallyScoresheetFragment, useFillTallyScoresheetMutation } from '../graphql/generated'
import { useDebounceFn } from '@vueuse/core'
import { onBeforeRouteLeave } from 'vue-router'
import { useCompetitionEvent } from '../hooks/rulesets'
import { type ScoreTally } from '@ropescore/rulesets'

const props = defineProps({
  scoresheet: {
    type: Object as PropType<ScoresheetBaseFragment & TallyScoresheetFragment>,
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

const tally = ref<ScoreTally>({})
const dirty = ref<boolean>(false)

const scsh = toRef(props, 'scoresheet')
watch(() => scsh.value.tally, () => {
  tally.value = { ...(scsh.value.tally ?? {}) }
}, { immediate: true })

const setTally = async (schema: string, value: number) => {
  tally.value[schema] = value
  dirty.value = true
  emit('update:tally', tally.value)
  await saveTally()
}

const fillTallyScoresheetMutation = useFillTallyScoresheetMutation({})

const saveTally = useDebounceFn(async () => {
  await fillTallyScoresheetMutation.mutate({
    scoresheetId: props.scoresheet.id,
    tally: tally.value,
    programVersion: `${name}@${version}`
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
