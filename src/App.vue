<template>
  <div class="grid grid-rows-[3.5rem,auto,2rem] grid-cols-[auto,1fr] min-h-[100vh] w-full">
    <header class="col-span-2 bg-gray-100 flex justify-between items-center px-4">
      <router-link to="/">
        <span class="text-2xl font-semibold">RopeScore</span>
        <span v-if="system.computerName" class="text-2xl font-light">&nbsp;&ndash; {{ system.computerName }}</span>
      </router-link>

      <nav>
        <button-link v-if="route.params.categoryId" :to="`/groups/${route.params.groupId}/categories/${route.params.categoryId}/results`">
          Results
        </button-link>
        <button-link v-if="route.params.categoryId" :to="`/groups/${route.params.groupId}/categories/${route.params.categoryId}`">
          Category
        </button-link>
        <button-link v-if="route.params.groupId" :to="`/groups/${route.params.groupId}/devices`">
          Devices
        </button-link>
        <button-link to="/system">
          System
        </button-link>
        <button-link to="/">
          Dashboard
        </button-link>
      </nav>
    </header>
    <aside />
    <main class="px-2 py-4">
      <router-view />
    </main>
    <footer class="flex col-span-2 justify-between items-center bg-gray-100 px-4">
      <span>&copy; Swantzter 2017-2021</span>
      <span>{{ version }}</span>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { version } from '../package.json'
import { useSystem } from './hooks/system'

import ButtonLink from './components/ButtonLink.vue'

const route = useRoute()

const system = useSystem()
</script>

<style>
.page {
  width: 277mm !important;
  height: 190mm !important;
  margin: auto;
  overflow: hidden;
}

@media print {
  .v-application {
    background: #fff !important;
  }
  .v-main,
  .container,
  .v-card {
    padding: 0 !important;
    margin-bottom: 0 !important;
  }
  .v-card {
    box-shadow: none !important;
  }
  .v-card:not(.page),
  .v-app-bar,
  .v-footer {
    display: none !important;
  }
  @page {
    margin: 10mm !important;
    size: A4 landscape !important;
  }
  .page {
    border-color: #000 !important;
    /* border: 1px solid !important; */
    border: none;
    page-break-after: always !important;
    page-break-inside: avoid !important;
    position: relative !important;
    overflow: hidden !important;
    overflow-x: hidden !important;
    margin: auto;
  }
  .table {
    overflow-x: hidden !important;
  }
}
</style>
