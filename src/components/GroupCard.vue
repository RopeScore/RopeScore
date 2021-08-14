<template>
  <details class="rounded p-2 shadow shadow-dark-900" :open="!group?.completedAt">
    <summary class="cursor-pointer">
      <span :class="{ 'text-green-700': !!group?.completedAt }">{{ group?.name }}</span>
      <span v-if="!!group?.completedAt" class="font-thin">&nbsp;&ndash; (completed)</span>
    </summary>

    <div class="my-4 flex flex-col gap-2">
      <router-link
        v-for="category of categories"
        :key="category.id"
        :to="`/groups/${props.groupId}/categories/${category.id}`"
        class="bg-gray-100 hover:bg-gray-300 rounded px-2 py-1"
      >
        <span class="font-semibold">{{ category.name }}</span>
        <br>{{ category.ruleset }}
      </router-link>
    </div>

    <menu class="p-0 m-0 flex justify-end">
      <button-link :to="`/groups/${group?.id}/results`">
        Results
      </button-link>
      <button-link :to="`/groups/${group?.id}/settings`">
        Settings
      </button-link>
      <!-- TODO: dialog to create category -->
      <button @click="addCat">
        Add Category
      </button>
    </menu>
  </details>
</template>

<script lang="ts" setup>
import { v4 as uuid } from 'uuid'
import { ref } from 'vue'
import { useCategories } from '../hooks/categories'
import { useGroup } from '../hooks/groups'

import ButtonLink from './ButtonLink.vue'

const props = defineProps({
  groupId: {
    type: String,
    required: true
  }
})

const group = useGroup(props.groupId)
const categories = useCategories(props.groupId)

const idx = ref(1)

function addCat () {
  categories.value.push({
    id: uuid(),
    groupId: props.groupId,

    name: `Test Category ${idx.value++}`,
    ruleset: 'ijru@2.0.0',
    type: 'individual',
    competitionEvents: [],

    print: {
      exclude: [],
      zoom: {}
    }
  })
}
</script>
