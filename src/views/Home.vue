<template>
  <div class="container mx-auto">
    <!-- TODO: dialog to name it -->
    <text-button @click="addGroup">
      Add Group
    </text-button>
    <group-card v-for="group of groups" :key="group.id" :group-id="group.id" class="my-4" />
  </div>
</template>

<script setup lang="ts">
import { v4 as uuid } from 'uuid'
import { useGroups } from '../hooks/groups'

import GroupCard from '../components/GroupCard.vue'
import TextButton from '../components/TextButton.vue'

import type { Group } from '../store/schema'

const groups = useGroups()

function addGroup () {
  const id = uuid()
  groups.value.push({
    id,
    name: 'Test Group',
    remote: false
  })
}

function deleteGroup (id: Group['id']) {
  const idx = groups.value?.findIndex(g => g.id === id)
  groups.value.splice(idx, 1)
}
</script>
