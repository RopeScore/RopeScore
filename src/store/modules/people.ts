import { Module } from 'vuex'
import Vue from 'vue'
import { leftFillNum } from '@/common'

const module: Module<any, any> = {
  state: {
    people: {},
    teams: {}
  },
  mutations: {
    newPerson ({ people }, payload) {
      Vue.set(people, payload.id, {
        name: '',
        club: '',
        country: '',
        ijruID: ''
      })
    },
    setName ({ people }, payload) {
      Vue.set(people[payload.id], 'name', payload.value)
    },
    setClub ({ people }, payload) {
      Vue.set(people[payload.id], 'club', payload.value)
    },
    setCountry ({ people }, payload) {
      Vue.set(people[payload.id], 'country', payload.value)
    },
    deletePerson ({ people }, payload) {
      Vue.delete(people, payload.id)
    }
  },
  actions: {
    newPerson ({ commit, state }, payload) {
      let id = 'P001RS'
      let ids = Object.keys(state.people).sort((a, b) => Number(a.substring(1, 4)) - Number(b.substring(1, 4)))

      if (ids.length > 0) {
        let last = ids[ids.length - 1]
        let lastID = Number(last.substring(1, 4))

        id = `P${leftFillNum(lastID + 1, 3)}RS`
      }
      commit('newPerson', { id })
      commit('setName', { id, value: payload.name })
      commit('setClub', { id, value: payload.club })
      commit('setCountry', { id, value: payload.country })
    },
    updatePerson ({ commit, state }, payload) {
      if (!state.people[payload.id]) return
      commit('setName', { id: payload.id, value: payload.name })
      commit('setClub', { id: payload.id, value: payload.club })
      commit('setCountry', { id: payload.id, value: payload.country })
    },
    deletePerson ({ commit, state }, payload) {
      if (!state.people[payload.id]) return
      commit('deletePerson', { id: payload.id })
    }
  },
  getters: {
    clubs: ({ people }) => {
      return Object.keys(people)
        .map(id => people[id].club)
        .filter((el: string, idx: number, arr: string[]): boolean => arr.indexOf(el) === idx)
        .filter((el: string): boolean => !!el)
    },
    peopleArray: ({ people }) => {
      return Object.keys(people)
        .map(id => ({
          id,
          ...people[id]
        }))
    }
    //   categoriesList: state => {
    //     return Object.keys(state).map((id: string) => ({
    //       id,
    //       name: state[id].config.name,
    //       group: state[id].config.group,
    //       ruleset: state[id].config.ruleset
    //     }))
    //   },
    //   groups: state => {
    //     return Object.keys(state)
    //       .map((id: string) => state[id].config.group)
    //       .filter((el: string, idx: number, arr: string[]): boolean => arr.indexOf(el) === idx)
    //       .filter((el: string): boolean => !!el)
    //   },
    //   groupedCategories: function (state) {
    //     return Object.keys(state)
    //       .map((id: string) => state[id].config.group || 'Ungrouped')
    //       .filter((el: string, idx: number, arr: string[]): boolean => arr.indexOf(el) === idx)
    //       .map(group => {
    //         return {
    //           name: group,
    //           categories: Object.keys(state).map((id: string) => ({
    //             id,
    //             name: state[id].config.name,
    //             group: state[id].config.group,
    //             ruleset: state[id].config.ruleset
    //           })).filter(el => (el.group || 'Ungrouped') === group)
    //         }
    //       })
    //   }
  }
}

export default module
