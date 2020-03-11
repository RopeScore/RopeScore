import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

Vue.use(Router)

export default new Router({
  mode: process.env.IS_ELECTRON ? 'hash' : 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/system',
      name: 'system',
      component: () => import(/* webpackChunkName: "system" */ '@/views/SysConfig.vue')
    },
    {
      path: '/new',
      name: 'newcategory',
      component: () => import(/* webpackChunkName: "newcategory" */ '@/components/NewCategory.vue')
    },
    {
      path: '/category/:id',
      name: 'category',
      component: () => import(/* webpackChunkName: "category" */ '@/views/Category.vue')
    },
    {
      path: '/category/:id/config',
      name: 'categoryconfig',
      component: () => import(/* webpackChunkName: "categoryconfig" */ '@/views/CategoryConfig.vue')
    },
    {
      path: '/category/:id/score/:event',
      name: 'scoreevent',
      component: () => import(/* webpackChunkName: "scoreevent" */ '@/views/ScoreEvent.vue')
    },
    {
      path: '/category/:id/score/:event/:participant',
      name: 'scoreparticipant',
      component: () => import(/* webpackChunkName: "scoreparticipant" */ '@/views/ScoreParticipant.vue')
    },
    {
      path: '/category/:id/results',
      name: 'categoryresults',
      component: () => import(/* webpackChunkName: "categoryresults" */ '@/views/CategoryResults.vue')
    }
  ]
})
