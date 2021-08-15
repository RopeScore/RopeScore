<template>
  <div class="sticky top-0 w-full border-b flex items-center justify-between">
    <div>
      <div>{{ category?.name }}</div>
      <div>
        <span class="font-bold">{{ getCEvt(entry?.competitionEvent)?.name }}</span> entry for
        <span class="font-bold">{{ participant.value?.name }}</span> from
        <span class="font-bold">{{ participant.value?.club }}</span>
        ({{ participant.value?.id }})
      </div>
    </div>

    <div class="flex items-stretch">
      <text-button @click="goBack">
        Back
      </text-button>
      <text-button>Previous</text-button>
      <text-button>Next</text-button>
      <text-button :disabled="!!entry?.lockedAt" :color="!!entry?.didNotSkipAt ? undefined : 'red'" @click="toggleDNS">
        {{ entry?.didNotSkipAt ? 'Did Skip' : 'Did Not Skip' }}
      </text-button>
      <text-button @click="toggleLock">
        {{ entry?.lockedAt ? 'Unlock' : 'Lock' }}
      </text-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategory } from '../hooks/categories'
import { useParticipant } from '../hooks/participants'
import { useRuleset } from '../hooks/rulesets'
import { useEntry } from '../hooks/entries'

import TextButton from '../components/TextButton.vue'

import type { CompetitionEvent } from '../store/schema'

const route = useRoute()
const router = useRouter()
const category = useCategory(route.params.categoryId as string)
const entry = useEntry(route.params.entryId as string)
const ruleset = computed(() => useRuleset(category.value?.ruleset))
const participant = computed(() => useParticipant(entry.value?.participantId))

function getCEvt (cEvt?: CompetitionEvent) {
  if (!cEvt) return
  return ruleset.value?.ruleset.value?.competitionEvents[cEvt]
}

function goBack () {
  router.go(-1)
}

function toggleDNS () {
  if (!entry.value) return
  if (entry.value.didNotSkipAt) entry.value.didNotSkipAt = null
  else entry.value.didNotSkipAt = Date.now()
}

function toggleLock () {
  if (!entry.value) return
  if (entry.value.lockedAt) entry.value.lockedAt = null
  else entry.value.lockedAt = Date.now()
}
</script>
