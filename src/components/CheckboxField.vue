<template>
  <label class="flex gap-2 items-center cursor-pointer" :class="{ 'mt-2': !dense }">
    <input
      :value="modelValue"
      type="checkbox"
      class="hidden"
      aria-hidden="false"
      :disabled="disabled"
      @change="emit('update:modelValue', !modelValue)"
    >

    <div
      class="p-0 hover:bg-gray-200 border rounded flex justify-center items-center"
      :class="{
        'bg-green-500': modelValue,
        'hover:bg-green-300': modelValue,

        'h-8': !dense,
        'w-8': !dense,

        'h-6': dense,
        'w-6': dense
      }"
    >
      <icon-check class="text-white" />
    </div>

    <span>{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
import { v4 as uuid } from 'uuid'

import IconCheck from 'virtual:icons/mdi/check'

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
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
</script>
