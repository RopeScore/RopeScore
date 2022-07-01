<template>
  <div class="container mx-auto">
    <dialog-button ref="dialogRef" label="Create Group">
      <h1 class="mx-2">
        New Group
      </h1>
      <form method="dialog" class="mt-4" @submit.prevent="addGroup">
        <text-field v-model="newGroup.name" label="Group Name" />

        <div v-if="!system.rsApiToken">
          <note-card color="orange" class="mb-4">
            You need to enable App Scoring in system settings if you want to
            connect this group to app scoring.
          </note-card>
          <button-link to="/system">
            System
          </button-link>
        </div>
        <div v-else>
          <checkbox-field v-model="newGroup.remote" label="App scoring" />
        </div>

        <text-button color="blue" class="mt-4" type="submit" :loading="loading">
          Create Group
        </text-button>
      </form>
    </dialog-button>
    <group-card v-for="group of groups" :key="group.id" :group-id="group.id" class="my-4" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { v4 as uuid } from 'uuid'
import { useGroups } from '../hooks/groups'
import { useSystem } from '../hooks/system'
import { useCreateGroupMutation } from '../graphql/generated'

import { ButtonLink, TextField, DialogButton, TextButton, CheckboxField, NoteCard } from '@ropescore/components'
import GroupCard from '../components/GroupCard.vue'

const system = useSystem()
const groups = useGroups()

const dialogRef = ref<typeof DialogButton>()
const newGroup = reactive({
  name: '',
  remote: false
})

const { mutate: createGroup, loading } = useCreateGroupMutation({})

async function addGroup () {
  let res
  if (newGroup.remote) {
    res = await createGroup({ name: newGroup.name })
  }

  const id = uuid()
  groups.value.push({
    id: res?.data?.createGroup.id ?? id,
    name: newGroup.name,
    remote: newGroup.remote
  })

  newGroup.name = ''
  newGroup.remote = false

  dialogRef.value?.close()
}
</script>
