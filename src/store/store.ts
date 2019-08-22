import Vue from 'vue'
import Vuex from 'vuex'
import modules from './modules'
import VuexPersistence from 'vuex-persist'
import createMutationsSharer from "vuex-shared-mutations";

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

const persistSysConfig = new VuexPersistence({
  storage: window.localStorage,
  modules: ['system'],
  key: 'system'
})

const MutationSharer = createMutationsSharer({
  predicate: () => true
})

Vue.use(Vuex)

export default new Vuex.Store({
  modules,
  plugins: [persistCategories.plugin, persistPeople.plugin, persistSysConfig.plugin, MutationSharer]
})
