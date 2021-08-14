<template>
  <div class="container mx-auto">
    <div class="flex justify-between">
      <h1 class="font-semibold text-2xl" :class="{ 'text-green-700': !!group?.completedAt }">
        {{ group?.name }}
      </h1>

      <menu class="p-0 m-0">
        <text-button @click="toggleCompleted">
          {{ group?.completedAt ? 'Uncomplete' : 'Complete' }}
        </text-button>
        <text-button @click="goBack">
          Back
        </text-button>
      </menu>
    </div>

    <!-- TODO: remote -->
    <!-- TODO: devices -->
    <!-- TODO: judges -->
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useGroup } from '../hooks/groups'

import TextButton from '../components/TextButton.vue'

const route = useRoute()
const router = useRouter()
const group = useGroup(route.params.groupId as string)

function toggleCompleted () {
  if (!group.value) return

  if (group.value.completedAt) group.value.completedAt = null
  else group.value.completedAt = Date.now()
}

function goBack () {
  router.go(-1)
}
</script>
