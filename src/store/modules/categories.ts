import { Module } from 'vuex'
import Vue from 'vue'
import moment from 'moment'

const module: Module<any, any> = {
  state: {},
  mutations: {
    new (state, payload) {
      Vue.set(state, payload.id, {
        config: {
          name: '',
          group: '',
          ruleset: ''
        },
        participants: [],
        scores: {}
      })
    },
    setName (state, payload) {
      if (!state[payload.id]) return
      state[payload.id].config.name = payload.name
    },
    setGroup (state, payload) {
      if (!state[payload.id]) return
      state[payload.id].config.group = payload.group
    },
    setRuleset (state, payload) {
      if (!state[payload.id]) return
      state[payload.id].config.ruleset = payload.ruleset
    }
  },
  actions: {},
  getters: {
    categoriesList: state => {
      return Object.keys(state).map((id: string) => ({
        id,
        name: state[id].config.name,
        group: state[id].config.group,
        ruleset: state[id].config.ruleset
      }))
    },
    groups: state => {
      return Object.keys(state)
        .map((id: string) => state[id].config.group)
        .filter((el: string, idx: number, arr: string[]): boolean => arr.indexOf(el) === idx)
        .filter((el: string): boolean => !!el)
    },
    groupedCategories: function (state) {
      return Object.keys(state)
        .map((id: string) => state[id].config.group || 'Ungrouped')
        .filter((el: string, idx: number, arr: string[]): boolean => arr.indexOf(el) === idx)
        .map(group => {
          return {
            name: group,
            categories: Object.keys(state).map((id: string) => ({
              id,
              name: state[id].config.name,
              group: state[id].config.group,
              ruleset: state[id].config.ruleset
            })).filter(el => (el.group || 'Ungrouped') === group)
          }
        })
    }
  }
}

export default module
