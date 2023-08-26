<template>
  <div class="container mx-auto">
    <h1>Results</h1>

    <p class="mb-2">
      Unfortunately we can't control some aspects of the default settings when
      using the print function, so when you click print below, make sure to
      check the following:

      <ol class="list-decimal ml-6">
        <li>Zoom the pages below so all of the results fits on the pages</li>
        <li>Click Print (or Ctrl+P/Cmd+P)</li>
        <li>Change the paper orientation to landscape</li>
      </ol>
    </p>

    <p class="mb-2">
      Similarly, we're unable to control some aspects of the excel export,
      for example any logos you imort won't be included in the generated
      excel sheets. However, a feature that won't be visible until you print in
      Excel is that the category name and the result table name will be
      displayed in the page header
    </p>

    <text-button color="blue" @click="print">
      Print
    </text-button>
    <text-button @click="workbook?.print">
      Export to Excel
    </text-button>
    <!-- <text-button @click="setLogos">
      Set Logo
    </text-button>
    <text-button v-if="hasLogo" color="red" @click="removeLogos">
      Remove Logo
    </text-button> -->
  </div>

  <excel-workbook ref="workbook" :name="group?.name">
    <template v-for="category of categories">
      <result-table
        v-for="oEvt of getOveralls(category)"
        :key="`${category.id}${oEvt}`"
        :category="category"
        :group-name="categories.length > 1 ? group?.name : undefined"
        :competition-event-id="oEvt"
      />

      <result-table
        v-for="cEvtDef of category.competitionEventIds"
        :key="`${category.id}${cEvtDef}`"
        :category="category"
        :group-name="categories.length > 1 ? group?.name : undefined"
        :competition-event-id="cEvtDef"
      />
    </template>
  </excel-workbook>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useRuleset } from '../hooks/rulesets'

import { TextButton } from '@ropescore/components'
import ExcelWorkbook from '../components/ExcelWorkbook.vue'
import ResultTable from '../components/ResultTable.vue'
import { type CompetitionEvent } from '../helpers'
import { type CategoryBaseFragment, useResultsQuery } from '../graphql/generated'

const route = useRoute()
const workbook = ref<typeof ExcelWorkbook>()

const resultsQuery = useResultsQuery({
  groupId: route.params.groupId as string,
  categoryId: route.params.categoryId as string ?? '',
  singleCategory: !!route.params.categoryId
})

const group = computed(() => resultsQuery.result.value?.group)

const categories = computed(() => {
  if (resultsQuery.result.value?.group?.category) {
    return [resultsQuery.result.value?.group?.category]
  } else if (resultsQuery.result.value?.group?.categories) {
    return resultsQuery.result.value?.group?.categories
  } else return []
})

const hasLogo = computed(() => {
  // TODO return categories.value.map(c => c.print.logo).some(l => !!l)
  return false
})

function getOveralls (category: CategoryBaseFragment & { competitionEventIds: CompetitionEvent[] }) {
  const ruleset = useRuleset(category.rulesId).value

  if (!ruleset) return []

  return Object.entries(ruleset.overalls)
    .map(([oEvt, def]) => [oEvt, def?.competitionEvents.map(([cEvt]) => cEvt)])
    .filter(([oEvt, defs]) => (defs as CompetitionEvent[])?.every(cEvt => category.competitionEventIds.includes(cEvt)))
    .map(([oEvt]) => oEvt) as CompetitionEvent[]
}

function print () {
  window.print()
}

// TODO
// function setLogos () {
//   const input = document.createElement('input')
//   input.type = 'file'
//   input.accept = 'image/*'

//   input.onchange = e => {
//     const file = (e.target as HTMLInputElement & EventTarget)?.files?.[0]
//     if (!file?.type.match('image.*')) return

//     const reader = new FileReader()
//     reader.onload = readerEvent => {
//       const data = readerEvent.target?.result as string

//       for (const cat of categories.value) {
//         cat.print.logo = data
//       }
//     }
//     reader.readAsDataURL(file)
//   }

//   input.click()
// }

// function removeLogos () {
//   for (const cat of categories.value) {
//     cat.print.logo = undefined
//   }
// }
</script>
