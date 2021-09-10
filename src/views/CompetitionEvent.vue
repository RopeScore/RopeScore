<template>
  <div class="sticky top-[3.5rem] -mt-4 py-2 w-full border-b flex items-center justify-between bg-white z-1000">
    <div>
      <div>{{ category?.name }}</div>
      <div>
        <span class="font-bold">{{ competitionEvent?.name }}</span>
      </div>
    </div>

    <div class="flex items-stretch">
      <text-button @click="goBack">
        Back
      </text-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategory } from '../hooks/categories'
import { useRuleset } from '../hooks/rulesets'

import TextButton from '../components/TextButton.vue'

import type { CompetitionEvent } from '../store/schema'

const route = useRoute()
const router = useRouter()
const category = useCategory(route.params.categoryId as string)
const ruleset = computed(() => useRuleset(category.value?.ruleset).value)
const competitionEvent = computed(() => {
  if (!route.params.competitionEvent) return
  return ruleset.value?.competitionEvents[route.params.competitionEvent as CompetitionEvent]
})

function goBack () {
  router.go(-1)
}

</script>
