<template>
  <div class="container mx-auto">
    <div class="flex justify-between">
      <dialog-button ref="dialogRef" label="Create Group">
        <h1 class="mx-2">
          New Group
        </h1>
        <form method="dialog" class="mt-4" @submit.prevent="createGroup({ data: newGroup })">
          <text-field v-model="newGroup.name" label="Group Name" required />
          <select-field
            :v-model="newGroup.resultVisibility"
            label="Result visibility"
            required
            :data-list="resultVisibilitiesDataList"
          />

          <text-button color="blue" class="mt-4" type="submit" :loading="loading">
            Create Group
          </text-button>
        </form>
      </dialog-button>

      <div class="pt-2 px-2">
        <text-button :loading="groupsQuery.loading.value" @click="groupsQuery.refetch()">
          Refresh
        </text-button>
      </div>
    </div>

    <group-card v-for="group of groups" :key="group.id" :group="group" :categories="group.categories" class="my-4" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { type CreateGroupInput, useCreateGroupMutation, useGroupsQuery, ResultVisibilityLevel } from '../graphql/generated'

import { TextField, DialogButton, TextButton } from '@ropescore/components'
import GroupCard from '../components/GroupCard.vue'
import { resultVisibilitiesDataList } from '../helpers'

const groupsQuery = useGroupsQuery({
  fetchPolicy: 'cache-and-network'
})
const groups = computed(() => groupsQuery.result.value?.groups)

const dialogRef = ref<typeof DialogButton>()
const newGroup = reactive<CreateGroupInput>({
  name: '',
  resultVisibility: ResultVisibilityLevel.Private
})

const { mutate: createGroup, loading, onDone } = useCreateGroupMutation({
  refetchQueries: ['Groups']
})

onDone(() => {
  newGroup.name = ''
  newGroup.resultVisibility = ResultVisibilityLevel.Private

  dialogRef.value?.close()
})
</script>
