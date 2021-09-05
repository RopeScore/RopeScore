<template>
  <section
    class="page my-4 p-2 flex flex-col justify-between flex-nowrap"
    :class="{ 'bg-gray-100': excluded, 'noprint': excluded }"
  >
    <header class="flex justify-between flex-grow-0 mb-4">
      <div class="flex-grow">
        <h1 class="text-xl">
          {{ category?.name }} <span v-if="group"> &ndash; {{ group.name }}</span>
        </h1>
        <h2 class="text-xl text-gray-500">
          {{ cEvt?.name }}
        </h2>
      </div>

      <div class="noprint nozoom">
        <text-button class="nozoom" @click="changeZoom(-0.03)">
          Zoom -
        </text-button>
        <text-button class="nozoom" @click="changeZoom()">
          Reset
        </text-button>
        <text-button class="nozoom" @click="changeZoom(0.03)">
          Zoom +
        </text-button>
        <text-button
          class="nozoom"
          :color="excluded ? 'red' : undefined"
          @click="togglePrint"
        >
          {{ excluded ? 'Include' : 'Exclude' }}
        </text-button>
      </div>

      <div class="min-w-[20mm]">
        <img v-if="category?.print.logo" :src="category.print.logo" class="h-[20mm]">
      </div>
    </header>

    <main class="overflow-x-auto w-full flex-grow">
      <table v-if="category && cEvt">
        <thead>
          <tr
            v-for="(row, idx) of cEvt.resultTable.groups ?? []"
            :key="`group-${String(idx)}`"
          >
            <th
              v-if="idx === 0"
              :colspan="category.type === 'team' ? 4 : 3"
              :rowspan="(cEvt.resultTable.groups ?? []).length"
            />

            <th
              v-for="hGroup of row"
              :key="hGroup.key"
              :colspan="hGroup.colspan ?? 1"
              :rowspan="hGroup.rowspan ?? 1"
            >
              {{ hGroup.text }}
            </th>
          </tr>

          <tr>
            <template v-if="category.type === 'team'">
              <th>Team Name</th>
              <th>Team Members</th>
            </template>
            <th v-else>
              Name
            </th>
            <th>Club</th>
            <th>ID</th>

            <th
              v-for="header in cEvt.resultTable.headers ?? cEvt.resultTable"
              :key="header.key"
              :class="`text-${header.color}-500`"
            >
              {{ header.text }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="entryRes of results" :key="entryRes.participantId">
            <td>{{ getParticipant(entryRes.participantId)?.name }}</td>
            <td v-if="category.type === 'team'" class="text-xs">
              {{ memberNames(getParticipant(entryRes.participantId)) }}
            </td>
            <td>{{ getParticipant(entryRes.participantId)?.club }}</td>
            <td class="text-right">
              {{ getParticipant(entryRes.participantId)?.id }}
            </td>

            <td
              v-for="header in cEvt.resultTable.headers ?? cEvt.resultTable"
              :key="header.key"
              class="text-right"
              :class="`text-${header.color}-500`"
            >
              {{ getScore(header, entryRes) }}
            </td>
          </tr>
        </tbody>
      </table>
    </main>

    <footer class="text-sm flex-grow-0 text-right mt-2">
      Scores from RopeScore v{{ version }} - <a class="text-blue-500">ropescore.com</a>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { inject, computed, watch, ref, onUnmounted } from 'vue'
import Excel from 'exceljs'
import { isOverallRulesDefinition } from '../rules'
import { memberNames, isOverall, getAbbr } from '../helpers'
import { useRuleset } from '../hooks/rulesets'
import { useCategory } from '../hooks/categories'
import { useGroup } from '../hooks/groups'
import { useEntries } from '../hooks/entries'
import { useParticipants } from '../hooks/participants'
import { version } from '../../package.json'
import { db } from '../store/idbStore'

import TextButton from './TextButton.vue'

import type { Ref, PropType } from 'vue'
import type { CompetitionEvent, Participant } from '../store/schema'
import type { EntryResult, OverallResult, TableHeader } from '../rules'

const workbook = inject<Ref<Excel.Workbook>>('workbook')

const props = defineProps({
  categoryId: {
    type: String,
    required: true
  },
  groupId: {
    type: String,
    default: undefined
  },
  competitionEvent: {
    type: String as PropType<CompetitionEvent>,
    required: true
  }
})

const category = useCategory(props.categoryId)
const group = useGroup(props.groupId)
const entries = useEntries(props.categoryId)
const participants = useParticipants(props.categoryId)

const ruleset = computed(() => useRuleset(category.value?.ruleset).value)

const cEvt = computed(() => {
  if (isOverall(props.competitionEvent)) {
    return ruleset.value?.overalls[props.competitionEvent]
  } else {
    return ruleset.value?.competitionEvents[props.competitionEvent]
  }
})

const zoom = computed(() => {
  return `${Math.round((category.value?.print.zoom[props.competitionEvent] ?? 1) * 100)}%`
})

const excluded = computed(() => {
  return category.value?.print.exclude.includes(props.competitionEvent)
})

const results = ref<EntryResult[] | OverallResult[]>([])

async function calculateResults () {
  if (!entries.value.length || !cEvt.value) return
  const res: EntryResult[] = []
  for (const entry of entries.value) {
    if (entry.didNotSkipAt) continue
    const scoresheets = await db.scoresheets.where({ entryId: entry.id }).toArray()

    if (isOverallRulesDefinition(cEvt.value)) {
      const score = ruleset.value?.competitionEvents[entry.competitionEvent]?.calculateEntry(entry, scoresheets)
      if (score) res.push(score)
    } else {
      if (entry.competitionEvent !== props.competitionEvent) continue
      const score = cEvt.value.calculateEntry(entry, scoresheets)
      if (score) res.push(score)
    }
  }

  if (isOverallRulesDefinition(cEvt.value)) {
    const ranked = cEvt.value.rankOverall(res)
    results.value = ranked
  } else {
    const ranked = cEvt.value.rankEntries(res)
    results.value = ranked
  }
}

watch(ruleset, calculateResults)
watch(entries, calculateResults, { deep: true })

function getParticipant (participantId: Participant['id']) {
  return participants.value.find(p => p.id === participantId)
}

function getScore (header: TableHeader, result: EntryResult | OverallResult) {
  let score: number
  if (header.component) score = result.componentResults[header.component].result[header.key]
  else score = result.result[header.key]
  return header.formatter?.(score) ?? score ?? ''
}

function changeZoom (change?: number) {
  if (!category.value) return
  if (!change) category.value.print.zoom[props.competitionEvent] = 1
  else {
    category.value.print.zoom[props.competitionEvent] =
      (category.value.print.zoom[props.competitionEvent] ?? 1) + change
  }
}

function togglePrint () {
  if (!category.value) return
  const exclIdx = category.value.print.exclude.indexOf(props.competitionEvent)

  if (exclIdx === -1) {
    category.value.print.exclude ??= []
    category.value.print.exclude.push(props.competitionEvent)
  } else {
    category.value.print.exclude.splice(exclIdx, 1)
  }
}

// spreadsheet stuff

const sheetId = computed(() => `${getAbbr(props.competitionEvent)} - ${category.value?.name ?? ''}`)

function removeWorksheet () {
  if (!category.value) return
  if (workbook?.value.getWorksheet(sheetId.value)) {
    workbook.value.removeWorksheet(sheetId.value)
  }
}

function createWorksheet () {
  if (!workbook) return

  const worksheet = workbook.value.addWorksheet(sheetId.value)

  worksheet.pageSetup.paperSize = 9 // letter = undefined, A4 = 9
  worksheet.pageSetup.orientation = 'landscape'
  worksheet.pageSetup.fitToPage = true
  // worksheet.pageSetup.printArea = "A1:G20"

  worksheet.headerFooter.oddFooter = `&LScores from RopeScore v${version} - ropescore.com&RPage &P of &N`
  worksheet.headerFooter.oddHeader = `&L${
    ruleset.value?.competitionEvents[props.competitionEvent]?.name ??
    ruleset.value?.overalls[props.competitionEvent]?.name ??
    getAbbr(props.competitionEvent)
  } - ${category.value?.name}&R${group.value?.name ?? ''}` // worksheet name, add &R&G to add the logo?

  return worksheet
}

watch(results, () => {
  if (!workbook || !category.value) return

  removeWorksheet()
  const sheet = createWorksheet()

  if (!sheet) return

  addGroupTableHeaders(sheet, category.value.type)
  addTableHeaders(sheet, category.value.type)
  addParticipantRows(sheet, category.value.type)
})

onUnmounted(() => {
  removeWorksheet()
})

function addGroupTableHeaders (worksheet: Excel.Worksheet, type: 'individual' | 'team') {
  if (!isOverallRulesDefinition(cEvt.value)) return
  const excelGroupedHeaderRows: any[][] = []
  const merges: [number, number, number, number][] = []
  const groups = [...cEvt.value.resultTable.groups.map(gr => [...gr])]

  groups[0].unshift({ text: '', key: 'parts', colspan: type === 'team' ? 4 : 3, rowspan: groups.length })
  // create array
  /*
    let rows = [
      ['',    empty, empty, empty, 'Single Rope', empty, empty,         empty, empty,              empty],
      [empty, empty, empty, empty, 'Speed Sprint, empty, 'Speed Relay', empty, 'Single Freestyle', empty]
    ]
  */
  for (let groupRow = 0; groupRow < groups.length; groupRow++) {
    if (!excelGroupedHeaderRows[groupRow]) {
      excelGroupedHeaderRows[groupRow] = []
    }
    for (const groupCell in groups[groupRow]) {
      for (
        let cspan: number = 0;
        cspan < (groups[groupRow][groupCell].colspan || 1);
        cspan++
      ) {
        let free: number = 0
        for (
          let i: number = 0;
          i < excelGroupedHeaderRows[groupRow].length;
          i++
        ) {
          if (excelGroupedHeaderRows[groupRow][i] == null) {
            break
          }
          free = i + 1
        }
        for (
          let rspan: number = 0;
          rspan < (groups[groupRow][groupCell].rowspan || 1);
          rspan++
        ) {
          if (!excelGroupedHeaderRows[groupRow + rspan]) {
            excelGroupedHeaderRows[groupRow + rspan] = []
          }

          excelGroupedHeaderRows[groupRow + rspan][free] = new Array<any>(1)

          if (cspan === 0 && rspan === 0) {
            excelGroupedHeaderRows[groupRow][free][0] = {
              richText: [
                {
                  alignment: {
                    horizontal: 'center',
                    vertical: 'middle'
                  },
                  font: {
                    bold: true,
                    color: {
                      argb: nameToARGB(groups[groupRow][groupCell].color)
                    }
                  },
                  text: groups[groupRow][groupCell].text
                }
              ]
            }
            if (
              (groups[groupRow][groupCell].colspan || 0) > 1 ||
                (groups[groupRow][groupCell].rowspan || 0) > 1
            ) {
              merges.push([
                groupRow + 1,
                free + 1,
                groupRow + (groups[groupRow][groupCell].rowspan || 1),
                free + (groups[groupRow][groupCell].colspan || 1)
              ]) // top,left,bottom,right
            }
          }
        }
      }
    }
    excelGroupedHeaderRows[groupRow] = [].concat.apply(
      new Array(1),
      excelGroupedHeaderRows[groupRow]
    )
  }

  // for (let excelRow of excelGroupedHeaderRows) {
  worksheet.addRows(excelGroupedHeaderRows)
  // let row = worksheet.lastRow;
  // }

  for (const merge of merges) {
    try {
      worksheet.mergeCells(...merge) // top,left,bottom,right
    } catch {
      console.log('already merged')
    }
  }

  worksheet.eachRow((row: any) =>
    row.eachCell((cell: any) => {
      cell.font = { bold: true }
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
  )
}

function addTableHeaders (worksheet: Excel.Worksheet, type: 'individual' | 'team') {
  const row = new Array(1)

  const baseHeaders = type === 'team' ? ['Team Name', 'Team Members', 'Club', 'ID'] : ['Name', 'Club', 'ID']

  for (const headerText of baseHeaders) {
    row.push({
      richText: [{
        alignment: { horizontal: 'center', vertical: 'middle' },
        font: { bold: true },
        text: headerText
      }]
    })
  }

  for (const header of cEvt.value?.resultTable.headers ?? cEvt.value?.resultTable ?? []) {
    row.push({
      richText: [{
        alignment: { horizontal: 'center', vertical: 'middle' },
        font: { bold: true, color: { argb: nameToARGB(header.color) } },
        text: header.text
      }]
    })
  }

  worksheet.addRow(row)

  worksheet.eachRow((row: any) =>
    row.eachCell((cell: any) => {
      cell.font = { bold: true }
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
  )
}

function addParticipantRows (
  worksheet: Excel.Worksheet,
  type: 'team' | 'individual'
) {
  for (const entryRes of results.value) {
    const row: Array<string | number> = new Array(1)
    if (type === 'team') {
      row.push(
        getParticipant(entryRes.participantId)?.name ?? '',
        memberNames(getParticipant(entryRes.participantId)),
        getParticipant(entryRes.participantId)?.club ?? '',
        getParticipant(entryRes.participantId)?.id ?? ''
      )
    } else {
      row.push(
        getParticipant(entryRes.participantId)?.name ?? '',
        getParticipant(entryRes.participantId)?.club ?? '',
        getParticipant(entryRes.participantId)?.id ?? ''
      )
    }
    for (const header of cEvt.value?.resultTable.headers ?? cEvt.value?.resultTable ?? []) {
      // row.push({
      //   richText: [
      //     {
      //       text: this.getScore(result, header.value, header.event),
      //       font: { color: { argb: this.nameToARGB(headers[i].color) } }
      //     }
      //   ]
      // });
      row.push(getScore(header, entryRes))
    }

    worksheet.addRow(row)

    const offset = type === 'team' ? 4 : 3

    const lastRow: any = worksheet.lastRow
    lastRow.eachCell((cell: any) => {
      cell.font = {
        color: {
          argb: nameToARGB((cEvt.value?.resultTable.headers ?? cEvt.value?.resultTable)[cell.col - 1 - offset]?.color)
        }
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'right'
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
  }
}

function nameToARGB (color : 'red' | 'green' | 'gray' | undefined) {
  switch (color) {
    case 'red':
      return 'FFEF4444'
    case 'green':
      return 'FF10B981'
    case 'gray':
      return 'FF6B7280'
    default:
      return 'FF000000'
  }
}
</script>

<style scoped>
td, th {
  @apply border-black;
}

.page header *:not(.nozoom),
.page main,
.page footer {
  zoom: v-bind(zoom);
}
</style>
