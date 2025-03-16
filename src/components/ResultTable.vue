<template>
  <div
    class="
      relative w-max my-4
      mx-auto
      2xl:(grid grid-cols-[max-content,auto] gap-2 items-start)
    "
  >
    <div
      class="
        noprint nozoom border-gray-300
        <2xl:(absolute top-[1px] right-[1px] border-l border-b rounded-bl)
        2xl:(border rounded col-start-2)
        p-2 bg-white
      "
    >
      <div class="flex justify-between">
        <text-button class="nozoom" :loading="setPagePrintConfigMutation.loading.value" @click="setPagePrintConfigMutation.mutate({ categoryId: category.id, competitionEventId, data: { zoom: zoom - 0.03 } })">
          Zoom -
        </text-button>
        <text-button class="nozoom" :loading="setPagePrintConfigMutation.loading.value" @click="setPagePrintConfigMutation.mutate({ categoryId: category.id, competitionEventId, data: { zoom: 1 } })">
          Reset
        </text-button>
        <text-button class="nozoom" :loading="setPagePrintConfigMutation.loading.value" @click="setPagePrintConfigMutation.mutate({ categoryId: category.id, competitionEventId, data: { zoom: zoom + 0.03 } })">
          Zoom +
        </text-button>
        <text-button
          class="nozoom"
          :color="excluded ? 'red' : undefined"
          :loading="setPagePrintConfigMutation.loading.value"
          @click="setPagePrintConfigMutation.mutate({ categoryId: category.id, competitionEventId, data: { exclude: !excluded } })"
        >
          {{ excluded ? 'Include' : 'Exclude' }}
        </text-button>
      </div>
      <div class="grid items-baseline gap-2 grid-cols-[15rem,6rem]">
        <select-field
          :model-value="selectedResult?.id"
          label="Version"
          :data-list="versionsDataList"
          @update:model-value="selectResult($event as string)"
        />
        <dialog-button v-if="selectedResult?.versionType === ResultVersionType.Temporary" ref="dialogRef" :disabled="selectedResult == null" color="green" label="Save">
          <h1 class="mx-2">
            Save Result Version
          </h1>

          <form method="dialog" class="mt-4" @submit.prevent="storeVersion()">
            <text-field v-model="newVersion.name" label="Version Name" required />
            <select-field :model-value="newVersion.type" label="Version Type" required :data-list="[ResultVersionType.Private, ResultVersionType.Public]" />

            <text-button
              color="blue"
              class="mt-4"
              type="submit"
              :loading="setRankedResultVersionMutation.loading.value"
            >
              Save
            </text-button>
          </form>
        </dialog-button>
        <text-button v-else :loading="relaseRankedResultVersionMutation.loading.value" :disabled="selectedResult == null" color="red" @click="relaseRankedResultVersionMutation.mutate({ resultId: selectedResult?.id! })">
          Release
        </text-button>
      </div>
      <span v-if="selectedResult != null" class="noprint text-gray-400 text-sm font-normal">Locked until {{ formatDate(selectedResult?.maxEntryLockedAt) }}</span>
    </div>
    <section
      class="page p-2 flex flex-col justify-between flex-nowrap 2xl:(col-start-1 row-start-1)"
      :class="{ 'bg-gray-100': excluded, 'noprint': excluded }"
    >
      <header class="flex justify-between flex-grow-0 mb-4">
        <div class="flex-grow">
          <h1 class="text-xl">
            {{ category?.name }} <span v-if="groupName != null"> &ndash; {{ groupName }}</span>
          </h1>
          <h2 class="text-xl text-gray-500">
            {{ cEvt?.name }}
          </h2>
        </div>

        <!-- TODO: logo <div class="min-w-[20mm]">
          <img v-if="category?.logo" :src="category.logo" class="h-[20mm]">
        </div> -->
      </header>

      <main class="overflow-x-auto w-full flex-grow">
        <table v-if="category != null && cEvt != null">
          <thead>
            <tr
              v-for="(row, idx) of resultTable.groups ?? []"
              :key="`group-${String(idx)}`"
            >
              <th
                v-if="idx === 0"
                :colspan="category.type === CategoryType.Team ? 3 : 2"
                :rowspan="(resultTable.groups ?? []).length"
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
              <template v-if="category.type === CategoryType.Team">
                <th>Team Name</th>
                <th>Team Members</th>
              </template>
              <th v-else>
                Name
              </th>
              <th>Club</th>

              <th
                v-for="header in resultTable.headers"
                :key="header.key"
                :class="`text-${header.color}-500`"
              >
                {{ header.text }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="entryRes of results" :key="entryRes.meta.participantId">
              <td>
                {{ getParticipant(entryRes.meta.participantId)?.name }}
              </td>
              <td v-if="category.type === CategoryType.Team" class="text-xs">
                {{ memberNames(getParticipant(entryRes.meta.participantId)) }}
              </td>
              <td>{{ getParticipant(entryRes.meta.participantId)?.club }}</td>

              <td
                v-for="header in resultTable.headers"
                :key="header.key"
                class="text-right"
                :class="`text-${header.color}-500`"
              >
                {{ extractTableScore(header, entryRes) }}
              </td>
            </tr>
          </tbody>
        </table>
      </main>

      <footer class="text-sm flex-grow-0 text-right mt-2">
        Scores from RopeScore v{{ version }} - <a class="text-blue-500">ropescore.com</a>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { inject, computed, watch, onUnmounted, toRef, ref, reactive } from 'vue'
import type Excel from 'exceljs'
import { version, memberNames, type CompetitionEvent, formatDate, extractTableScore } from '../helpers'
import { useCompetitionEventOrOverall } from '../hooks/rulesets'

import { TextButton, SelectField, type DataListItem, DialogButton, TextField } from '@ropescore/components'

import type { Ref, PropType } from 'vue'
import { type CategoryBaseFragment, type CategoryPrintFragment, type CategoryResultsFragment, CategoryType, useSetPagePrintConfigMutation, type RankedResultBaseFragment, useSetRankedResultVersionMutation, useReleaseRankedResultVersionMutation, ResultVersionType } from '../graphql/generated'
import { parseCompetitionEventDefinition, type EntryResult, type OverallResult } from '@ropescore/rulesets'

const workbook = inject<Ref<Excel.Workbook>>('workbook')

const props = defineProps({
  category: {
    type: Object as PropType<CategoryBaseFragment & CategoryPrintFragment & CategoryResultsFragment>,
    required: true
  },
  groupName: {
    type: String,
    default: () => null
  },
  competitionEventId: {
    type: String as PropType<CompetitionEvent>,
    required: true
  },
  rankedResults: {
    type: Array as PropType<RankedResultBaseFragment[]>,
    required: true
  }
})

const category = toRef(props, 'category')
const cEvtId = toRef(props, 'competitionEventId')

const participants = computed(() => category.value.participants ?? [])

const cEvt = useCompetitionEventOrOverall(cEvtId)
// TODO apply options
const resultTable = computed(() => cEvt.value?.resultTable({}) ?? { headers: [], groups: [] })

const selectedResult = ref<RankedResultBaseFragment | undefined>(props.rankedResults[0])
const results = computed(() => (selectedResult.value?.results ?? []) as EntryResult[] | OverallResult[])

function selectResult (resultId: string) {
  const result = props.rankedResults.find(rr => rr.id === resultId)
  if (result == null) return
  selectedResult.value = result
}

watch(() => props.rankedResults, (newResults) => {
  selectedResult.value = newResults[0]
})

const zoom = computed(() => {
  const conf = category.value.pagePrintConfig.find(ppc => ppc.competitionEventId === props.competitionEventId)
  return conf?.zoom ?? 1
})

const zoomPercentage = computed(() => {
  return `${Math.round(zoom.value * 100)}%`
})

const excluded = computed(() => {
  const conf = category.value.pagePrintConfig.find(ppc => ppc.competitionEventId === props.competitionEventId)
  return !!conf?.exclude
})

const versionsDataList = computed<DataListItem[]>(() => props.rankedResults
  .map(rr => ({
    text: rr.versionType === ResultVersionType.Temporary ? `(Unsaved) Locked until ${formatDate(rr.maxEntryLockedAt)}` : `(${rr.versionType}) ${rr.versionName}`,
    value: rr.id
  }))
)

const setRankedResultVersionMutation = useSetRankedResultVersionMutation()
const relaseRankedResultVersionMutation = useReleaseRankedResultVersionMutation()

const newVersion = reactive({
  name: '',
  type: ResultVersionType.Private
})
const dialogRef = ref<typeof DialogButton>()

async function storeVersion () {
  if (selectedResult.value == null) return
  await setRankedResultVersionMutation.mutate({
    resultId: selectedResult.value.id,
    type: newVersion.type,
    name: newVersion.name
  })
  newVersion.name = ''
  newVersion.type = ResultVersionType.Private
  dialogRef.value?.close()
}

function getParticipant (participantId: string | number) {
  return participants.value.find(p => p.id === participantId)
}

const setPagePrintConfigMutation = useSetPagePrintConfigMutation({})

// spreadsheet stuff
const sheetId = computed(() => `${props.competitionEventId} - ${category.value?.name ?? ''}`.substring(0, 31))

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
    cEvt.value?.name ??
    parseCompetitionEventDefinition(props.competitionEventId).eventAbbr
  } - ${category.value?.name}&R${props.groupName ?? ''}` // worksheet name, add &R&G to add the logo?

  return worksheet
}

watch(() => [results.value, cEvt.value] as const, () => {
  if (!workbook || !category.value || !cEvt.value) return
  removeWorksheet()
  const sheet = createWorksheet()

  if (!sheet) return

  addGroupTableHeaders(sheet, category.value.type)
  addTableHeaders(sheet, category.value.type)
  addParticipantRows(sheet, category.value.type)
}, { immediate: true })

onUnmounted(() => {
  removeWorksheet()
})

function addGroupTableHeaders (worksheet: Excel.Worksheet, type: CategoryType) {
  if (!Array.isArray(resultTable.value.groups) || resultTable.value.groups.length === 0) return
  const excelGroupedHeaderRows: any[][] = []
  const merges: Array<[number, number, number, number]> = []
  const groups = [...(resultTable.value.groups?.map(gr => [...gr]) ?? [])]

  groups[0].unshift({ text: '', key: 'parts', colspan: type === CategoryType.Team ? 3 : 2, rowspan: groups.length })
  // create array
  /*
    let rows = [
      ['',    empty, empty, 'Single Rope', empty, empty,         empty, empty,              empty],
      [empty, empty, empty, 'Speed Sprint, empty, 'Speed Relay', empty, 'Single Freestyle', empty]
    ]
  */
  for (let groupRow = 0; groupRow < groups.length; groupRow++) {
    if (!excelGroupedHeaderRows[groupRow]) {
      excelGroupedHeaderRows[groupRow] = []
    }
    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for (const groupCell in groups[groupRow]) {
      for (
        let cspan = 0;
        cspan < (groups[groupRow][groupCell].colspan || 1);
        cspan++
      ) {
        let free = 0
        for (
          let i = 0;
          i < excelGroupedHeaderRows[groupRow].length;
          i++
        ) {
          if (excelGroupedHeaderRows[groupRow][i] == null) {
            break
          }
          free = i + 1
        }
        for (
          let rspan = 0;
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
    excelGroupedHeaderRows[groupRow] = ([] as any[]).concat.apply(
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

function addTableHeaders (worksheet: Excel.Worksheet, type: CategoryType) {
  const row = new Array(1)

  const baseHeaders = type === CategoryType.Team ? ['Team Name', 'Team Members', 'Club'] : ['Name', 'Club']

  for (const headerText of baseHeaders) {
    row.push({
      richText: [{
        alignment: { horizontal: 'center', vertical: 'middle' },
        font: { bold: true },
        text: headerText
      }]
    })
  }

  for (const header of resultTable.value.headers ?? []) {
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
  type: CategoryType
) {
  for (const entryRes of results.value) {
    const row = new Array<string | number>(1)
    if (type === CategoryType.Team) {
      row.push(
        getParticipant(entryRes.meta.participantId)?.name ?? '',
        memberNames(getParticipant(entryRes.meta.participantId)),
        getParticipant(entryRes.meta.participantId)?.club ?? ''
      )
    } else {
      row.push(
        getParticipant(entryRes.meta.participantId)?.name ?? '',
        getParticipant(entryRes.meta.participantId)?.club ?? ''
      )
    }
    for (const header of resultTable.value.headers ?? []) {
      // row.push({
      //   richText: [
      //     {
      //       text: this.getScore(result, header.value, header.event),
      //       font: { color: { argb: this.nameToARGB(headers[i].color) } }
      //     }
      //   ]
      // });
      row.push(extractTableScore(header, entryRes))
    }

    worksheet.addRow(row)

    const offset = type === CategoryType.Team ? 3 : 2

    const lastRow: any = worksheet.lastRow
    lastRow.eachCell((cell: any) => {
      cell.font = {
        color: {
          argb: nameToARGB(resultTable.value.headers[cell.col - 1 - offset]?.color)
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

function nameToARGB (color: 'red' | 'green' | 'gray' | 'blue' | undefined) {
  switch (color) {
    case 'red':
      return 'FFEF4444'
    case 'green':
      return 'FF10B981'
    case 'gray':
      return 'FF6B7280'
    case 'blue':
      return 'FF3B82F6'
    default:
      return 'FF000000'
  }
}
</script>

<style scoped>
td, th {
  @apply border-black;
}

.page header,
.page main,
.page footer {
  zoom: v-bind(zoomPercentage);
}
</style>
