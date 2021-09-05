<template>
  <div class="relative" :class="{ 'mt-2': !dense }">
    <select
      :id="id"
      :name="id"
      :placeholder="dense ? label : ' '"
      :value="modelValue"
      :disabled="disabled"
      class="block border-0 border-b-2 w-full min-w-12 bg-transparent"
      :class="{
        'p-0': dense,
        'px-0.5': dense,
        'm-0': dense,

        'pt-4': !dense,
        'pb-1': !dense,
        'px-3': !dense,

        'bg-gray-200': disabled
      }"
      @change="input"
    >
      <option v-for="item of dataList" :key="value(item)" :value="value(item)">
        {{ text(item) }}
      </option>
    </select>
    <label
      v-if="!dense"
      :for="id"
      class="-z-1 absolute top-4 left-3 transition-all text-base text-dark-100 cursor-default"
      :class="{
        'text-xs': !!modelValue,
        'top-0.5': !!modelValue
      }"
    >{{ label }}</label>
  </div>
</template>

<script setup lang="ts">
import { v4 as uuid } from 'uuid'

import type { PropType } from 'vue'
import type { DataListItem } from '../helpers'

defineProps({
  dense: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    required: true
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  dataList: {
    type: Array as PropType<Readonly<Array<DataListItem>>>,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const id = uuid().replace(/^[^a-z]+/, '')

function input (event: any) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function value (item: DataListItem) {
  return (item as any).value ?? item
}

function text (item: DataListItem) {
  return (item as any).text ?? item
}
</script>
