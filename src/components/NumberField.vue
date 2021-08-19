<template>
  <div class="relative">
    <input
      :id="id"
      type="number"
      :min="min"
      :max="max"
      :step="step"
      :placeholder="dense ? label : ' '"
      :value="modelValue"
      :disabled="disabled"
      class="block border-0 border-b-2 w-full bg-transparent disabled:bg-gray-100"
      :class="{
        'p-0': dense,
        'px-0.5': dense,
        'm-0': dense,

        'pt-4': !dense,
        'pb-1': !dense,
        'px-3': !dense,
        'mt-2': !dense
      }"
      @input="input"
    >
    <label
      v-if="!dense"
      :for="id"
      class="absolute top-4 left-3 transition-all text-base text-gray-500 cursor-text whitespace-nowrap overflow-ellipsis"
    >{{ label }}</label>
  </div>
</template>

<script setup lang="ts">
import { v4 as uuid } from 'uuid'
import { clampNumber } from '../helpers'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  dense: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Number,
    default: undefined
  },
  min: {
    type: Number,
    default: undefined
  },
  max: {
    type: Number,
    default: undefined
  },
  step: {
    type: Number,
    default: undefined
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const id = uuid().replace(/^[^a-z]+/, '')

function input (event: any) {
  let num = parseInt((event.target as HTMLInputElement).value, 10)
  if (Number.isNaN(num)) return emit('update:modelValue', num)

  num = clampNumber(num, { min: props.min, max: props.max, step: props.step })

  emit('update:modelValue', num)
}
</script>

<style>
input:focus + label,
input:not(:placeholder-shown) + label {
  @apply top-0.5;
  @apply text-xs;
}
</style>
