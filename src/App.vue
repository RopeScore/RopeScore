<template>
  <div class="grid grid-rows-[3.5rem,auto,2rem] grid-cols-1 min-h-[100vh] w-full">
    <header class="noprint col-span-2 bg-gray-100 flex justify-between items-center px-4 sticky top-0 z-1000">
      <div>
        <text-button @click="sidebarOpen = !sidebarOpen">
          <icon-menu class="transform origin-center" :class="{ 'rotate-90': sidebarOpen, '-mb-[2px]': !sidebarOpen, '-mb-[3px]': sidebarOpen }" />
        </text-button>
        <router-link to="/">
          <span class="text-2xl font-semibold">RopeScore</span>
          <span v-if="me?.name" class="text-2xl font-light">&nbsp;&ndash; {{ me?.name }}</span>
        </router-link>
      </div>

      <nav>
        <button-link v-if="route.params.categoryId" :to="`/groups/${route.params.groupId}/categories/${route.params.categoryId}/results`">
          Results
        </button-link>
        <button-link v-if="route.params.categoryId ?? route.query.categoryId" :to="`/groups/${route.params.groupId}/categories/${route.params.categoryId ?? route.query.categoryId}`">
          Category
        </button-link>
        <button-link v-if="route.params.groupId" :to="`/groups/${route.params.groupId}/heats`">
          Heats
        </button-link>
        <button-link to="/system">
          System
        </button-link>
        <button-link to="/">
          Dashboard
        </button-link>
      </nav>
    </header>
    <aside :class="{ 'hidden': !sidebarOpen }" class="noprint bg-white border-r border-r-gray-200 fixed z-2000 top-[3.5rem] bottom-0 overflow-y-auto w-[33%]">
      <nav v-if="auth.isAuthenticated.value" class="px-4 pt-4">
        <template v-for="group, idx of groups" :key="group.id">
          <group-sidebar-item :group="group" :categories="group.categories" />
          <hr v-if="idx !== (groups?.length ?? 0) - 1" class="border-t-0 border-b border-gray-300 my-2">
        </template>
      </nav>
    </aside>
    <main class="px-2 py-4">
      <router-view />
    </main>
    <footer class="noprint flex col-span-2 justify-between items-center bg-gray-100 px-4">
      <span>&copy; Swantzter 2017-2024</span>
      <span>{{ version }}</span>
    </footer>
  </div>
  <error-cards />
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { version } from './helpers'
import useFirebaseAuth from './hooks/firebase-auth'

import IconMenu from 'virtual:icons/mdi/menu'
import { ButtonLink, TextButton } from '@ropescore/components'
import ErrorCards from './components/ErrorCards.vue'
import GroupSidebarItem from './components/GroupSidebarItem.vue'
import { useGroupsQuery, useMeQuery } from './graphql/generated'
import { computed, ref } from 'vue'

const route = useRoute()
const router = useRouter()

const auth = useFirebaseAuth()

const sidebarOpen = ref(false)

const meQuery = useMeQuery()
const me = computed(() => meQuery.result.value?.me)

const groupsQuery = useGroupsQuery({
  fetchPolicy: 'cache-and-network',
  enabled: auth.isAuthenticated
})
const groups = computed(() => groupsQuery.result.value?.groups)

router.beforeEach((to, from) => {
  if (from.params.categoryId && !to.query.categoryId && to.meta.prevCategory === true) {
    to.query.categoryId = from.params.categoryId
    return to
  }
})

router.afterEach(() => {
  sidebarOpen.value = false
})
</script>

<style>
table tbody tr:nth-child(even) {
  @apply bg-gray-100;
}

.page {
  width: 277mm !important;
  height: 190mm !important;

  @apply overflow-hidden;
  @apply mx-auto;
  @apply border;
  @apply border-gray-300;
  @apply rounded;
}

.table-wrapper {
  @apply overflow-x-auto;
  @apply max-w-[calc(100vw-1rem)];
  @apply relative mt-4;
}

@media print {
  body {
    background: #fff !important;
  }
  main {
    padding: 0 !important;
    margin-bottom: 0 !important;
  }
  .container:not(.page),
  .noprint {
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
  .table-wrapper {
    overflow-x: hidden !important;
  }
}
</style>
