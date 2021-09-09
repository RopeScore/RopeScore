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
      <button-link v-if="!!group?.remote" :to="`/groups/${group?.id}/devices`">
        Devices
      </button-link>
      <button-link :to="`/groups/${group?.id}/settings`">
        Settings
      </button-link>
      <dialog-button ref="dialogRef" label="Create Category">
        <h1 class="mx-2">
          New Category
        </h1>
        <span class="mx-2">Group: {{ group?.name }}</span>
        <form method="dialog" class="mt-4" @submit.prevent="addCategory">
          <text-field v-model="newCategory.name" label="Category Name" />
          <select-field v-model="newCategory.ruleset" label="Ruleset" :data-list="rulesetIds" />
          <select-field v-model="newCategory.type" label="Competition Type" :data-list="['individual', 'team']" />

          <text-button
            color="blue"
            class="mt-4"
            type="submit"
            :disable="!newCategory.name || !newCategory.ruleset || !newCategory.type"
          >
            Create Category
          </text-button>
        </form>
      </dialog-button>
    </menu>
  </details>
</template>

<script lang="ts" setup>
import { v4 as uuid } from 'uuid'
import { reactive, ref } from 'vue'
import { useCategories } from '../hooks/categories'
import { useGroup } from '../hooks/groups'
import { rulesets } from '../rules'

import ButtonLink from './ButtonLink.vue'
import TextField from '../components/TextField.vue'
import SelectField from '../components/SelectField.vue'
import DialogButton from '../components/DialogButton.vue'
import TextButton from '../components/TextButton.vue'

const props = defineProps({
  groupId: {
    type: String,
    required: true
  }
})

const group = useGroup(props.groupId)
const categories = useCategories(props.groupId)
const dialogRef = ref<typeof DialogButton>()

const rulesetIds = Object.keys(rulesets)

const newCategory = reactive({
  name: '',
  ruleset: undefined,
  type: 'individual' as 'individual' | 'team'
})

function addCategory () {
  if (!newCategory.ruleset) return

  categories.value.push({
    id: uuid(),
    groupId: props.groupId,

    name: newCategory.name,
    ruleset: newCategory.ruleset,
    type: newCategory.type,
    competitionEvents: [],

    print: {
      exclude: [],
      zoom: {}
    }
  })

  dialogRef.value?.close()
}
</script>
