import Home from './views/Home.vue'
import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/system',
      name: 'system',
      component: async () => import('./views/System.vue')
    },
    {
      path: '/groups/:groupId/settings',
      name: 'group-settings',
      component: async () => import('./views/GroupSettings.vue')
    },
    {
      path: '/groups/:groupId/heats',
      name: 'group-devices',
      component: async () => import('./views/Heats.vue'),
      meta: { prevCategory: true }
    },
    {
      path: '/groups/:groupId/results',
      name: 'group-results',
      component: async () => import('./views/Results.vue'),
      meta: { prevCategory: true }
    },
    {
      path: '/groups/:groupId/categories/:categoryId',
      name: 'category',
      component: async () => import('./views/Category.vue')
    },
    {
      path: '/groups/:groupId/categories/:categoryId/settings',
      name: 'category-settings',
      component: async () => import('./views/CategorySettings.vue')
    },
    {
      path: '/groups/:groupId/categories/:categoryId/results',
      name: 'category-results',
      component: async () => import('./views/Results.vue')
    },
    {
      path: '/groups/:groupId/categories/:categoryId/entries/:entryId',
      name: 'entry',
      component: async () => import('./views/Entry.vue')
    },
    {
      path: '/groups/:groupId/categories/:categoryId/competition-events/:competitionEventId',
      name: 'competition-event',
      component: async () => import('./views/CompetitionEvent.vue')
    }
  ]
})
