<template>
  <div
    class="border-l border-l-4 py-2 px-4 mt-2"
    :class="{
      'bg-blue-100': color === 'blue' || !color,
      'border-l-blue-300': color === 'blue' || !color,

      'bg-green-100': color === 'green',
      'border-l-green-300': color === 'green',

      'bg-red-100': color === 'red',
      'border-l-red-300': color === 'red',

      'bg-orange-100': color === 'orange',
      'border-l-orange-300': color === 'orange',
    }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
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
