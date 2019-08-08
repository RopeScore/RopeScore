import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
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
      path: '/people',
      name: 'people',
      component: () => import(/* webpackChunkName: "people" */ '@/views/People.vue')
    }
  ]
})
