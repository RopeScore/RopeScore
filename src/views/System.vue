<template>
  <section class="container mx-auto">
    <h1>System Settings</h1>

    <fieldset>
      <text-field v-model="system.computerName" label="System Name" />
    </fieldset>
  </section>

  <section class="container mx-auto mt-8">
    <h1>Changelog</h1>
    <changelog />
  </section>
</template>

<script setup lang="ts">
import { useSystem } from '../hooks/system'

import Changelog from '../components/Changelog.vue'
import TextField from '../components/TextField.vue'

const system = useSystem()
</script>
