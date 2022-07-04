<template>
  <aside class="fixed bottom-2 right-2 max-w-[30vw] z-100000 flex flex-col gap-2">
    <note-card v-for="err of errors" :key="err.id" :color="err.type === 'server' ? 'red' : 'orange'">
      {{ err.message }}
    </note-card>
  </aside>
</template>

<script lang="ts" setup>
import { errors } from '../apollo'

import { NoteCard } from '@ropescore/components'
</script>
