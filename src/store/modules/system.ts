import { Module } from 'vuex'
import Vue from 'vue'

const module: Module<any, any> = {
  state: {
    computerName: ''
  },
  mutations: {
    setComputerName(state, payload) {
      console.log(payload)
      state.computerName = payload.value
    }
  }
}

export default module
