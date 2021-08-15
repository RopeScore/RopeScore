<template>
  <button
    class="px-2 mx-1 transition-colors rounded uppercase font-semibold disabled:text-gray-400 disabled:cursor-default whitespace-nowrap"
    :class="{
      'py-1': !dense,
      'hover:bg-gray-200': !color,

      'text-blue-500': color === 'blue',
      'hover:bg-blue-100': color === 'blue',

      'text-green-500': color === 'green',
      'hover:bg-green-100': color === 'green',

      'text-red-500': color === 'red',
      'hover:bg-red-100': color === 'red',

      'text-orange-500': color === 'orange',
      'hover:bg-orange-100': color === 'orange'
    }"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  dense: {
    type: Boolean,
    default: false
  },
  color: {
    type: String as PropType<'blue' | 'green' | 'red' | 'orange'>,
    validator (value: unknown) {
      return (
        typeof value === 'string' &&
        ['blue', 'green', 'red', 'orange'].includes(value)
      ) || typeof value === 'undefined'
    },
    default: undefined
  }
})
</script>
