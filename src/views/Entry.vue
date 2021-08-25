<template>
  <div class="sticky top-[3.5rem] -mt-4 py-2 w-full border-b flex items-center justify-between bg-white z-1000">
    <div>
      <div>{{ category?.name }}</div>
      <div>
        <span class="font-bold">{{ competitionEvent?.name }}</span> entry for
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
      <text-button :disabled="!!entry?.didNotSkipAt" @click="toggleLock">
        {{ entry?.lockedAt ? 'Unlock' : 'Lock' }}
      </text-button>
    </div>
  </div>

  <div v-if="entry && !entry?.didNotSkipAt">
    <section v-for="judgeType of competitionEvent?.judges" :key="judgeType.id" class="mt-4">
      <h2>{{ judgeType.name }} ({{ judgeType.id }})</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
        <scoresheets
          v-for="assignment of filterAssignments(judgeAssignments, judgeType.id, entry)"
          :key="assignment.judgeId"
          :entry-id="entry?.id"
          :judge-id="assignment.judgeId"
          :category-id="category?.id ?? ''"
          :competition-event="entry.competitionEvent"
          :disabled="!!entry.lockedAt"
        />
      </div>
    </section>
  </div>

  <div class="mt-10" />

  <div class="fixed bottom-0 right-0 left-0 h-18 bg-white  flex justify-center items-center border-t">
    <div class="grid grid-rows-2 grid-cols-[repeat(auto-fill,1fr)] container">
      <template v-for="col of previewTable ?? []" :key="col.key">
        <span class="row-start-1 font-bold px-2 border-b">{{ col.text }}</span>
        <span v-if="result" class="row-start-2 px-2">{{ col.formatter?.(result.result[col.key]) ?? result.result[col.key] }}</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategory } from '../hooks/categories'
import { useParticipant } from '../hooks/participants'
import { useJudgeAssignments } from '../hooks/judgeAssignments'
import { useRuleset } from '../hooks/rulesets'
import { useEntry } from '../hooks/entries'
import { useScoresheets } from '../hooks/scoresheets'

import TextButton from '../components/TextButton.vue'
import Scoresheets from '../components/Scoresheets.vue'

import type { Entry, JudgeAssignment } from '../store/schema'

const route = useRoute()
const router = useRouter()
const category = useCategory(route.params.categoryId as string)
const entry = useEntry(route.params.entryId as string)
const ruleset = computed(() => useRuleset(category.value?.ruleset).value)
const participant = computed(() => useParticipant(entry.value?.participantId))
const judgeAssignments = useJudgeAssignments(route.params.categoryId as string)
const scoresheets = useScoresheets(route.params.entryId as string, undefined)

const competitionEvent = computed(() => {
  if (!entry.value?.competitionEvent) return
  return ruleset.value?.competitionEvents[entry.value?.competitionEvent]
})

const result = computed(() => {
  if (!entry.value) return
  return ruleset.value?.competitionEvents[entry.value.competitionEvent]?.calculateEntry(entry.value, scoresheets.value)
})

const previewTable = computed(() => {
  if (!entry.value) return
  return ruleset.value?.competitionEvents[entry.value.competitionEvent]?.previewTable
})

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
  else {
    entry.value.lockedAt = Date.now()
    router.go(-1)
  }
}

function filterAssignments (assignments: JudgeAssignment[] | undefined, judgeType: string, entry: Entry | undefined) {
  return assignments?.filter(ja => ja.judgeType === judgeType && ja.competitionEvent === entry?.competitionEvent) ?? []
}
</script>
