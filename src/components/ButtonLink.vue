<template>
  <router-link v-slot="{ navigate }" custom>
    <text-button :dense="dense" @click="navigate">
      <slot />
    </text-button>
  </router-link>
</template>

<script setup lang="ts">
import TextButton from './TextButton.vue'

defineProps({
  dense: {
    type: Boolean,
    default: false
  }
})
</script>
