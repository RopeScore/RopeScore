<template>
  <slot />
</template>

<script setup lang="ts">
import { provide, ref, watch } from 'vue'
import Excel from 'exceljs'
import { useSystem } from '../hooks/system'
import { nameCleaner, formatShortDate } from '../helpers'
import { version } from '../../package.json'

const props = defineProps({
  name: {
    type: String,
    default: ''
  }
})

const system = useSystem()
const workbook = ref<Excel.Workbook>()

watch(workbook, () => {
  if (!workbook.value) return
  workbook.value.title = props.name
  workbook.value.creator = system.value.computerName || `RopeScore v${version}`
  workbook.value.created = new Date()
  workbook.value.views = [
    {
      x: 0,
      y: 0,
      width: 10000,
      height: 20000,
      firstSheet: 0,
      activeTab: 0,
      visibility: 'visible'
    }
  ]
})

workbook.value = new Excel.Workbook()

async function print () {
  if (!workbook.value) return
  workbook.value.lastPrinted = new Date()
  const bytes = await workbook.value.xlsx.writeBuffer()
  const blob = new Blob([bytes], { type: 'application/octet-stream' })
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = `RopeScore-${nameCleaner(props.name)}-${formatShortDate(workbook.value.lastPrinted)}.xlsx`
  link.click()
}

provide('workbook', workbook)

defineExpose({
  print
})
</script>
