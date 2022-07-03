<template>
  <td
    v-for="col of columns"
    :key="col.key"
  >
    {{ result ? col.formatter?.(result.result[col.key]) ?? result.result[col.key] : '' }}
  </td>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useRuleset } from '../hooks/rulesets'

import type { PropType } from 'vue'
import type { TableHeader } from '../rules'
import { EntryBaseFragment, MarkScoresheetFragment, ScoresheetBaseFragment, TallyScoresheetFragment } from '../graphql/generated'

const props = defineProps({
  rulesId: {
    type: String,
    required: true
  },
  columns: {
    type: Object as PropType<TableHeader[]>,
    required: true
  },
  participantId: {
    type: String,
    required: true
  },
  entry: {
    type: Object as PropType<EntryBaseFragment & { scoresheets: Array<ScoresheetBaseFragment & (TallyScoresheetFragment | MarkScoresheetFragment)> }>,
    required: true
  }
})

const ruleset = computed(() => useRuleset(props.rulesId).value)
const entry = toRef(props, 'entry')

const result = computed(() => {
  if (!entry.value) return
  return ruleset.value?.competitionEvents[entry.value.competitionEventId]?.calculateEntry({ entryId: entry.value.id, participantId: props.participantId }, entry.value.scoresheets)
})
</script>
