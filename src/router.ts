import Home from './views/Home.vue'
import { getAuth } from '@firebase/auth'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

const router = createRouter({
  history: import.meta.env.VITE_USE_WEB_HISTORY === 'true' ? createWebHistory() : createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { requiresUserAuth: true }
    },
    {
      path: '/system',
      name: 'system',
      component: async () => await import('./views/System.vue')
    },
    {
      path: '/groups/:groupId/settings',
      name: 'group-settings',
      component: async () => await import('./views/GroupSettings.vue'),
      meta: { requiresUserAuth: true }
    },
    {
      path: '/groups/:groupId/heats',
      name: 'group-devices',
      component: async () => await import('./views/Heats.vue'),
      meta: { prevCategory: true, requiresUserAuth: true }
    },
    {
      path: '/groups/:groupId/results',
      name: 'group-results',
      component: async () => await import('./views/Results.vue'),
      meta: { prevCategory: true, requiresUserAuth: true }
    },
    {
      path: '/groups/:groupId/categories/:categoryId',
      name: 'category',
      component: async () => await import('./views/Category.vue'),
      meta: { requiresUserAuth: true }
    },
    {
      path: '/groups/:groupId/categories/:categoryId/settings',
      name: 'category-settings',
      component: async () => await import('./views/CategorySettings.vue'),
      meta: { requiresUserAuth: true }
    },
    {
      path: '/groups/:groupId/categories/:categoryId/results',
      name: 'category-results',
      component: async () => await import('./views/Results.vue'),
      meta: { requiresUserAuth: true }
    },
    {
      path: '/groups/:groupId/categories/:categoryId/entries/:entryId',
      name: 'entry',
      component: async () => await import('./views/Entry.vue'),
      meta: { requiresUserAuth: true }
    },
    {
      path: '/groups/:groupId/categories/:categoryId/competition-events/:competitionEventId',
      name: 'competition-event',
      component: async () => await import('./views/CompetitionEvent.vue'),
      meta: { requiresUserAuth: true }
    }
  ]
})
export default router

router.beforeEach(async (to) => {
  if (!to.meta.requiresUserAuth) return true
  const auth = getAuth()

  return await new Promise(resolve => {
    const off = auth.onAuthStateChanged(user => {
      off()
      if (user) resolve(true)
      else {
        resolve({
          path: '/system',
          replace: true
        })
      }
    })
  })
})
