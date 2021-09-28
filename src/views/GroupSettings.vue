<template>
  <div class="container mx-auto">
    <div class="flex justify-between">
      <h1 class="font-semibold text-2xl" :class="{ 'text-green-700': !!group?.completedAt }">
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
        This group is set up to use app scoring, eventually you'll be able to
        add more ropescore core systems as viewers/editors here.
      </p>
      <button-link :to="`/groups/${group.id}/devices`">
        Devices
      </button-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroup } from '../hooks/groups'
import { useSystem } from '../hooks/system'
import { useCreateGroupMutation } from '../graphql/generated'
import { db } from '../store/idbStore'

import TextButton from '../components/TextButton.vue'
import ButtonLink from '../components/ButtonLink.vue'
import TextField from '../components/TextField.vue'
import NoteCard from '../components/NoteCard.vue'

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
