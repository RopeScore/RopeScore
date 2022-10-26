<template>
  <details :open="!group?.completedAt" class="py-2">
    <summary class="cursor-pointer text-lg font-bold">
      <span :class="{ 'text-green-700': !!group?.completedAt }">{{ group?.name }}</span>
      <span v-if="!!group?.completedAt" class="font-thin">&nbsp;&ndash; (completed)</span>
    </summary>

    <ul class="list-none ml-7">
      <li>
        <button-link :to="`/groups/${group?.id}/heats`">
          Heats
        </button-link>
      </li>
      <li>
        <button-link :to="`/groups/${group?.id}/results`">
          Results
        </button-link>
      </li>
      <li>
        <button-link :to="`/groups/${group?.id}/settings`">
          Settings
        </button-link>
      </li>
    </ul>

    <ul class="list-none ml-5">
      <li
        v-for="category of categories"
        :key="category.id"
        class="mb-2"
      >
        <span class="font-semibold">{{ category.name }}</span>
        <br>{{ category.rulesId }} &ndash; {{ category.type }}

        <ul class="list-none ml-2">
          <li>
            <button-link :to="`/groups/${group.id}/categories/${category.id}`">
              Category
            </button-link>
          </li>
          <li>
            <button-link :to="`/groups/${group.id}/categories/${category.id}/results`">
              Results
            </button-link>
          </li>
          <li>
            <button-link :to="`/groups/${group.id}/categories/${category.id}/settings`">
              Settings
            </button-link>
          </li>
        </ul>
      </li>
    </ul>
  </details>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'

import { ButtonLink } from '@ropescore/components'
import { GroupBaseFragment, CategoryBaseFragment } from '../graphql/generated'

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
</script>
