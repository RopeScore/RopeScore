import Vue from 'vue'
import Vuex from 'vuex'
import modules from './modules'
import VuexPersistence from 'vuex-persist'

const persistCategories = new VuexPersistence({
  storage: window.localStorage,
  modules: ['categories'],
  key: 'categories'
})

const persistPeople = new VuexPersistence({
  storage: window.localStorage,
  modules: ['people'],
  key: 'people'
})

Vue.use(Vuex)

export default new Vuex.Store({
  modules,
  plugins: [persistCategories.plugin, persistPeople.plugin]
})
