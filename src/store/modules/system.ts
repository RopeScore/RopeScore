import { Module, VuexModule, Mutation } from 'vuex-module-decorators'
import store from '@/store/store'

import VuexPersistance from 'vuex-persist'

const VuexLocal = new VuexPersistance({
  storage: window.localStorage,
  modules: ['system'],
  key: 'ropescore-system'
})

@Module({ namespaced: true, name: 'system', dynamic: true, store })
export default class SystemModule extends VuexModule {
  computerName = ''

  @Mutation
  setComputerName({ value }: { value: string }) {
    this.computerName = value
  }
}

VuexLocal.plugin(store)
