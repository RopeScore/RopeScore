<template>
  <div class="container mx-auto">
    <div class="flex justify-between">
      <h1
        class="font-semibold text-2xl"
        :class="{ 'text-green-700': !!group?.completedAt }"
      >
        {{ group?.name }}
      </h1>

      <menu class="p-0 m-0">
        <text-button @click="toggleCompleted">
          {{ group?.completedAt ? 'Uncomplete' : 'Complete' }}
        </text-button>
        <text-button @click="goBack">
          Back
        </text-button>
      </menu>
    </div>

    <fieldset v-if="group">
      <text-field v-model="group.name" label="Group Name" :disabled="group.remote" />
    </fieldset>

    <h2 class="mt-4">
      App scoring
    </h2>

    <div v-if="!system.rsApiToken">
      <note-card color="orange" class="mb-4">
        You need to enable App Scoring in system settings before you can
        connect a group to app scoring.
      </note-card>
      <button-link to="/system">
        System
      </button-link>
    </div>
    <div v-else-if="!group?.remote">
      <note-card>
        Note that it's not currently possible to change the name of the group
        after you have connected in to app scoring.
      </note-card>
      <text-button
        color="blue"
        class="mt-4 mb-2"
        :loading="loading"
        :disabled="loading || called"
        @click="createGroup({ name: group?.name ?? '' })"
      >
        Connect App Scoring
      </text-button>
    </div>
    <div v-else>
      <p class="mb-2">
        This group is set up to use app scoring
      </p>

      <h3 class="mt-4 container mx-auto">
        Group Viewers
      </h3>

      <div class="table-wrapper">
        <table class="min-w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="viewer of groupViewers"
              :key="viewer.id"
            >
              <td><code>{{ viewer.id }}</code></td>
              <td>
                <text-button
                  color="red"
                  dense
                  :loading="removeGroupViewer.loading.value"
                  @click="removeGroupViewer.mutate({ groupId, userId: viewer.id })"
                >
                  Remove Viewer
                </text-button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>
                <text-field label="User ID" dense :model-value="newViewerId" @update:model-value="newViewerId = $event" />
              </td>
              <td>
                <text-button
                  color="blue"
                  dense
                  :disabled="!newViewerId"
                  :loading="addGroupViewer.loading.value"
                  @click="addGroupViewer.mutate({ groupId, userId: newViewerId! })"
                >
                  Add Viewer
                </text-button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- <button-link :to="`/groups/${group.id}/devices`">Devices</button-link> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroup } from '../hooks/groups'
import { useSystem } from '../hooks/system'
import { useAddGroupViewerMutation, useCreateGroupMutation, useGroupInfoQuery, useRemoveGroupViewerMutation } from '../graphql/generated'
import { db } from '../store/idbStore'

import { NoteCard, TextButton, TextField, ButtonLink } from '@ropescore/components'
import { useResult } from '@vue/apollo-composable'

const route = useRoute()
const router = useRouter()

const groupId = ref<string>(route.params.groupId as string)
watch(() => route.params.groupId, newId => { groupId.value = newId as string })
const group = useGroup(groupId)
const system = useSystem()

const { mutate: createGroup, loading, onDone, onError, called } = useCreateGroupMutation({})

onDone(async res => {
  if (res.data?.createGroup) {
    const oldId = group.value?.id
    const newId = res.data.createGroup.id
    await db.transaction('rw', [db.categories, db.devices, db.groups], async () => {
      await db.categories.where({ groupId: oldId }).modify({ groupId: newId })
      await db.judges.where({ groupId: oldId }).modify({ groupId: newId })
      await db.devices.where({ groupId: oldId }).delete()
      await db.groups.where({ id: oldId }).modify({ id: newId, remote: true })
    })
    router.replace(`/groups/${newId}/settings`)
  }
})

onError(() => {
  called.value = false
})

const isRemote = computed(() => {
  return group.value?.remote
})

const groupInfoQuery = useGroupInfoQuery({ groupId: groupId as unknown as string }, { enabled: isRemote as unknown as boolean })

const groupViewers = useResult(groupInfoQuery.result, [], res => {
  return res.group.viewers
})

const newViewerId = ref<string>()

const addGroupViewer = useAddGroupViewerMutation({})
const removeGroupViewer = useRemoveGroupViewerMutation({})

function toggleCompleted () {
  if (!group.value) return

  // TODO: mark remote group completed

  if (group.value.completedAt) group.value.completedAt = null
  else group.value.completedAt = Date.now()
}

function goBack () {
  router.go(-1)
}
</script>
