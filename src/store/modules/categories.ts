import { Module } from 'vuex'
import Vue from 'vue'
import { leftFillNum } from '@/common'

const module: Module<any, any> = {
  state: {},
  mutations: {
    addCategory (state, payload) {
      Vue.set(state, payload.id, {
        config: {
          name: '',
          group: '',
          ruleset: '',
          type: '',
          events: []
        },
        judges: [],
        participants: [],
        scores: {}
      })
    },

    setCategoryName (state, payload) {
      if (!state[payload.id]) return
      if (!state[payload.id].config) Vue.set(state[payload.id], 'config', {})

      Vue.set(state[payload.id].config, 'name', payload.value)
    },
    setCategoryGroup (state, payload) {
      if (!state[payload.id]) return
      if (!state[payload.id].config) Vue.set(state[payload.id], 'config', {})

      Vue.set(state[payload.id].config, 'group', payload.value)
    },
    setCategoryRuleset (state, payload) {
      if (!state[payload.id]) return
      if (!state[payload.id].config) Vue.set(state[payload.id], 'config', {})

      Vue.set(state[payload.id].config, 'ruleset', payload.value)
    },
    setCategoryType (state, payload) {
      if (!state[payload.id]) return
      if (!state[payload.id].config) Vue.set(state[payload.id], 'config', {})

      Vue.set(state[payload.id].config, 'type', payload.value)
    },
    setCategoryEvents (state, payload) {
      if (!state[payload.id]) return
      if (!state[payload.id].config) Vue.set(state[payload.id], 'config', {})

      Vue.set(state[payload.id].config, 'events', payload.value)
    },

    addJudge (state, payload) {
      if (!state[payload.id]) return
      if (!state[payload.id].judges) Vue.set(state[payload.id], 'judges', [])

      state[payload.id].judges.push({
        id: payload.judgeID
      })
    },
    deleteJudge (state, payload) {
      if (!state[payload.id]) return
      if (!state[payload.id].judges) Vue.set(state[payload.id], 'judges', [])

      let idx = state[payload.id].judges.findIndex(el => el.id === payload.judgeID)
      if (idx >= 0) state[payload.id].judges.splice(idx, 1)
    }
  },
  actions: {
    updateEvents: ({ commit }, payload) => {
      // TODO: get prev state, compare to new state remove scores entered for that event
      commit('setCategoryEvents', {
        id: payload.id,
        value: payload.events
      })
    },

    addJudge: ({ commit, state }, payload) => {
      if (!state[payload.id]) return
      if (!state[payload.id].judges) Vue.set(state[payload.id], 'judges', [])

      let judgeID = 'J001RS'
      let judgeIDs = state[payload.id].judges
        .map((el: any): string => el.id)
        .filter((el: string): boolean => el.substring(0, 1) === 'J')
        .sort((a: string, b: string): number => Number(a.substring(1, 4)) - Number(b.substring(1, 4)))

      if (judgeIDs.length > 0) {
        let last = judgeIDs[judgeIDs.length - 1]
        let lastID = Number(last.substring(1, 4))

        judgeID = `J${leftFillNum(lastID + 1, 3)}RS`
      }

      commit('addJudge', { id: payload.id, judgeID })
    },
    deleteJudge: ({ commit }, payload) => {
      // TODO: remove all scores by that judge
      commit('deleteJudge', { id: payload.id, judgeID: payload.judgeID })
    }
  },
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
