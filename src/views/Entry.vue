<template>
  <div class="sticky top-[3.5rem] -mt-4 py-2 w-full border-b flex items-center justify-between bg-white z-1000">
    <div>
      <div>{{ category?.name }}</div>
      <div>
        <span class="font-bold">{{ competitionEvent?.name }}</span> entry for
        <span class="font-bold">{{ entry?.participant.name }}</span> from
        <span class="font-bold">{{ entry?.participant.club }}</span>
        ({{ entry?.participant.id }})
      </div>
    </div>

    <div class="flex items-stretch">
      <text-button @click="goBack">
        Back
      </text-button>
      <!-- <text-button>Previous</text-button> -->
      <!-- <text-button>Next</text-button> -->
      <text-button :disabled="!!entry?.lockedAt && !entry.didNotSkipAt" :loading="toggleLock.loading.value" :color="!!entry?.didNotSkipAt ? undefined : 'red'" @click="toggleLock.mutate({ entryId: route.params.entryId as string, lock: !entry?.lockedAt, didNotSkip: true })">
        {{ entry?.didNotSkipAt ? 'Did Skip' : 'Did Not Skip' }}
      </text-button>
      <text-button :disabled="!!entry?.didNotSkipAt" :loading="toggleLock.loading.value" @click="toggleLock.mutate({ entryId: route.params.entryId as string, lock: !entry?.lockedAt, didNotSkip: false })">
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
          :key="assignment.judge.id"
          :entry-id="entry?.id"
          :judge-id="assignment.judge.id"
          :category-id="category?.id ?? ''"
          :competition-event="entry.competitionEventId"
          :disabled="!!entry.lockedAt"
        />
      </div>
    </section>
  </div>

  <div class="mt-10" />

  <div v-if="!entry?.didNotSkipAt" class="fixed bottom-0 right-0 left-0 h-18 bg-white  flex justify-center items-center border-t">
    <div class="grid grid-rows-2 grid-cols-[repeat(auto-fill,1fr)] container">
      <template v-for="col of previewTable ?? []" :key="col.key">
        <span class="row-start-1 font-bold px-2 border-b">{{ col.text }}</span>
        <span v-if="result" class="row-start-2 px-2">{{ col.formatter?.(result.result[col.key]) ?? result.result[col.key] }}</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, UnwrapRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRuleset } from '../hooks/rulesets'

import { TextButton } from '@ropescore/components'
import Scoresheets from '../components/Scoresheets.vue'

import { EntryBaseFragment, JudgeAssignmentFragment, useEntryWithScoresheetQuery, useToggleEntryLockMutation } from '../graphql/generated'

const route = useRoute()
const router = useRouter()

const entryWithScoresheetQuery = useEntryWithScoresheetQuery({
  groupId: route.params.groupId as string,
  categoryId: route.params.categoryId as string,
  entryId: route.params.entryId as string
})

const category = computed(() => entryWithScoresheetQuery.result.value?.group?.category)
const entry = computed(() => entryWithScoresheetQuery.result.value?.group?.entry)
const judgeAssignments = computed(() =>  entryWithScoresheetQuery.result.value?.group?.category?.judgeAssignments)

const ruleset = computed(() => useRuleset(category.value?.rulesId).value)

const competitionEvent = computed(() => {
  if (!entry.value?.competitionEventId) return
  return ruleset.value?.competitionEvents[entry.value?.competitionEventId]
})

const result = computed(() => {
  if (!entry.value) return
  return ruleset.value?.competitionEvents[entry.value.competitionEventId]?.calculateEntry({ entryId: entry.value.id, participantId: entry.value.participant.id }, entry.value.scoresheets)
})

const previewTable = computed(() => {
  if (!entry.value) return
  return ruleset.value?.competitionEvents[entry.value.competitionEventId]?.previewTable
})

function goBack () {
  router.go(-1)
}

const toggleLock = useToggleEntryLockMutation({})

toggleLock.onDone(() => {
  router.go(-1)
})

function filterAssignments (assignments: UnwrapRef<typeof judgeAssignments>, judgeType: string, entry: EntryBaseFragment | undefined) {
  return assignments?.filter(ja => ja.judgeType === judgeType && ja.competitionEventId === entry?.competitionEventId) ?? []
}
</script>
