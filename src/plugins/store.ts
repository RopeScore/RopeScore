// import Vue from 'vue'
// import Vuex from 'vuex'
// import modules from './modules'
// import VuexPersistence from 'vuex-persist'
// import createMutationsSharer from "vuex-shared-mutations";

// const persistCategories = new VuexPersistence({
//   storage: window.localStorage,
//   modules: ['categories'],
//   key: 'categories'
// })

// const persistPeople = new VuexPersistence({
//   storage: window.localStorage,
//   modules: ['people'],
//   key: 'people'
// })

// const persistSysConfig = new VuexPersistence({
//   storage: window.localStorage,
//   modules: ['system'],
//   key: 'system'
// })

// const MutationSharer = createMutationsSharer({
//   predicate: () => true
// })

// Vue.use(Vuex)

// export default new Vuex.Store({
//   modules,
//   plugins: [persistCategories.plugin, persistPeople.plugin, persistSysConfig.plugin, MutationSharer]
// })

import Vue from 'vue'
import Vuex from 'vuex'

// TEMP: fix for IE 11 which doesn't have name defined on the constructor
// waiting on https://github.com/championswimmer/vuex-persist/pull/137
if (window.localStorage && window.localStorage.constructor && !window.localStorage.constructor.name) {
  (window.localStorage.constructor as any).name = 'Storage'
}

Vue.use(Vuex)

export default new Vuex.Store({
  // plugins: [VuexLocal.plugin]
})
