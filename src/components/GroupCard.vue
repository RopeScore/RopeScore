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
        :to="`/groups/${group.id}/categories/${category.id}`"
        class="bg-gray-100 hover:bg-gray-300 rounded px-2 py-1"
      >
        <span class="font-semibold">{{ category.name }}</span>
        <br>{{ category.rulesId }} &ndash; {{ category.type }}
      </router-link>
    </div>

    <menu class="p-0 m-0 flex justify-end">
      <button-link :to="`/groups/${group?.id}/results`">
        Results
      </button-link>
      <button-link :to="`/groups/${group?.id}/heats`">
        Heats
      </button-link>
      <button-link :to="`/groups/${group?.id}/settings`">
        Settings
      </button-link>
      <dialog-button ref="dialogRef" label="Create Category">
        <h1 class="mx-2">
          New Category
        </h1>
        <span class="mx-2">Group: {{ group?.name }}</span>
        <form method="dialog" class="mt-4" @submit.prevent="createCategory({ groupId: group.id, data: newCategory as CreateCategoryInput })">
          <text-field v-model="newCategory.name" label="Category Name" required />
          <select-field v-model="newCategory.rulesId" label="Ruleset" required :data-list="rulesetIds" />
          <select-field v-model="newCategory.type" label="Competition Type" required :data-list="[CategoryType.Individual, CategoryType.Team]" />

          <text-button
            color="blue"
            class="mt-4"
            type="submit"
            :disabled="!newCategory.name || !newCategory.rulesId || !newCategory.type"
            :loading="loading"
          >
            Create Category
          </text-button>
        </form>
      </dialog-button>
    </menu>
  </details>
</template>

<script lang="ts" setup>
import { type PropType, reactive, ref } from 'vue'
import { rulesets } from '../rules'

import { ButtonLink, TextField, SelectField, DialogButton, TextButton } from '@ropescore/components'
import { type GroupBaseFragment, type CategoryBaseFragment, CategoryType, useCreateCategoryMutation, type CreateCategoryInput } from '../graphql/generated'

defineProps({
  group: {
    type: Object as PropType<GroupBaseFragment>,
    required: true
  },
  categories: {
    type: Array as PropType<CategoryBaseFragment[]>,
    required: true
  }
})

const dialogRef = ref<typeof DialogButton>()

const rulesetIds = Object.keys(rulesets)

const newCategory = reactive<Partial<CreateCategoryInput>>({
  name: undefined,
  rulesId: undefined,
  type: CategoryType.Individual
})

const { mutate: createCategory, onDone, loading } = useCreateCategoryMutation({
  refetchQueries: ['Groups']
})

onDone(() => {
  newCategory.name = undefined
  newCategory.rulesId = undefined
  newCategory.type = CategoryType.Individual

  dialogRef.value?.close()
})
</script>
