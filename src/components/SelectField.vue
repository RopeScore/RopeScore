<template>
  <div class="relative">
    <select
      :id="id"
      placeholder=" "
      :value="modelValue"
      class="block border-0 border-b-2 pt-4 pb-1 px-3 mt-2 w-full"
      @change="input"
    >
      <option v-for="item of dataList" :key="value(item)">
        {{ text(item) }}
      </option>
    </select>
    <label
      :for="id"
      class="absolute top-4 left-3 transition-all text-base text-dark-100 cursor-text"
    >{{ label }}</label>
  </div>
</template>

<script setup lang="ts">
import { v4 as uuid } from 'uuid'

import type { PropType } from 'vue'

defineProps({
  label: {
    type: String,
    required: true
  },
  modelValue: {
    type: String,
    default: ''
  },
  dataList: {
    type: Array as PropType<Readonly<Array<string | { value: string, text: string }>>>,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const id = uuid().replace(/^[^a-z]+/, '')

function input (event: any) {
  console.log(event)
  // emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function value (item: string | { value: string, text: string }) {
  return (item as any).value ?? item
}

function text (item: string | { value: string, text: string }) {
  return (item as any).text ?? item
}
</script>

<style>
select:focus + label,
select:not(:placeholder-shown) + label {
  @apply top-0.5;
  @apply text-xs;
}
</style>
