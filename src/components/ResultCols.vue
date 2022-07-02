<template>
  <td
    v-for="col of columns"
    :key="col.key"
  >
    {{ result ? col.formatter?.(result.result[col.key]) ?? result.result[col.key] : '' }}
  </td>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRuleset } from '../hooks/rulesets'

import type { PropType } from 'vue'
import type { TableHeader } from '../rules'

const props = defineProps({
  categoryId: {
    type: String,
    required: true
  },
  entryId: {
    type: String,
    required: true
  },
  columns: {
    type: Object as PropType<TableHeader[]>,
    required: true
  }
})

const category = useCategory(props.categoryId)
const ruleset = computed(() => useRuleset(category.value?.ruleset).value)
const entry = useEntry(props.entryId)
const scoresheets = useScoresheets(props.entryId as string, undefined)

const result = computed(() => {
  if (!entry.value) return
  return ruleset.value?.competitionEvents[entry.value.competitionEvent]?.calculateEntry(entry.value, scoresheets.value)
})
</script>
