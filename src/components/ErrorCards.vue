<template>
  <aside class="fixed bottom-2 right-2 max-w-[30vw] z-2000 flex flex-col gap-2">
    <note-card v-for="err of notifications.notifications.value" :key="err.id" :color="'type' in err ? (err.type === 'server' ? 'red' : 'orange') : err.color">
      {{ err.message }}
    </note-card>
  </aside>
</template>

<script lang="ts" setup>
import { NoteCard } from '@ropescore/components'
import useNotifications from '../hooks/notifications'

const notifications = useNotifications()
</script>
