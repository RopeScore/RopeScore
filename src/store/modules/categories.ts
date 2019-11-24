// import { Module } from 'vuex'
// import Vue from 'vue'
import { leftFillNum, roundToMultiple } from '@/common'

import { Module, VuexModule, Mutation } from 'vuex-module-decorators'
import store from '@/store/store'

import VuexPersistance from 'vuex-persist'

const VuexLocal = new VuexPersistance({
  storage: window.localStorage,
  modules: ['categories'],
  key: 'ropescore-categories'
})

interface Categories {
  [key: string]: Category
}

interface Category {
  config: {
    name?: string
    group?: string
    ruleset?: string
    type?: string
    events?: string[]
  },
  judges: [],
  participants: [],
  scores: [],
  dns: [],
  printConfig: {}
}

@Module({ namespaced: true, name: 'catetgories', dynamic: true, store })
export default class CategoriesModule extends VuexModule {
  categories: Categories = {}

  @Mutation
  addCategory({ id }: { id: string }) {
    this.categories[id] = {
      config: {
        name: '',
        group: '',
        ruleset: '',
        type: '',
        events: []
      },
      judges: [],
      participants: [],
      scores: [],
      dns: [],
      printConfig: {}
    }
  }

  @Mutation
  deleteCategory({ id }: { id: string }) {
    delete this.categories[id]
  }

  @Mutation
  setCategoryName({ id, value }: { id: string, value: string }) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.name = value
  }

  @Mutation
  setCategoryGroup({ id, value }: { id: string, value: string }) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.group = value
  }

  @Mutation
  setCategoryRuleset({ id, value }: { id: string, value: string }) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.ruleset = value
  }

  @Mutation
  setCategoryType({ id, value }: { id: string, value: string }) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.ruleset = value
    this.categories[id].participants = []
  }

  @Mutation
  setCategoryEvents({ id, value }: { id: string, value: string[] }) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.events = value
  }

  @Mutation
  sortCategoryEvents({ id, template }: { id: string, template: string[] }) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {};

    (this.categories[id].config.events || []).sort((a, b) => template.indexOf(a) - template.indexOf(b))
  }
}

VuexLocal.plugin(store)

// const module: Module<any, any> = {
//   state: {},
//   mutations: {
//,

//     addJudge(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].judges) Vue.set(state[payload.id], 'judges', [])

//       state[payload.id].judges.push({
//         id: payload.judgeID
//       })
//     },
//     setJudgeID(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].judges) Vue.set(state[payload.id], 'judges', [])

//       // TODO: remove duplicates

//       let idx = state[payload.id].judges.findIndex(el => el.id === payload.judgeID)
//       if (idx >= 0) state[payload.id].judges[idx].id = payload.newID
//     },
//     deleteJudge(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].judges) Vue.set(state[payload.id], 'judges', [])

//       let idx = state[payload.id].judges.findIndex(el => el.id === payload.judgeID)
//       if (idx >= 0) state[payload.id].judges.splice(idx, 1)
//     },
//     setJudgeAssignment(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].judges) Vue.set(state[payload.id], 'judges', [])

//       let idx = state[payload.id].judges.findIndex(el => el.id === payload.judgeID)
//       if (idx >= 0) {
//         Vue.set(state[payload.id].judges[idx], payload.event, payload.judgeType)
//       }
//     },
//     deleteJudgeAssignment(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].judges) Vue.set(state[payload.id], 'judges', [])

//       let idx = state[payload.id].judges.findIndex(el => el.id === payload.judgeID)
//       if (idx >= 0) {
//         if (state[payload.id].judges[idx][payload.event]) Vue.delete(state[payload.id].judges[idx], payload.event)
//       }
//     },

//     setParticipants(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].participants) Vue.set(state[payload.id], 'participants', [])

//       Vue.set(state[payload.id], 'participants', payload.value)
//     },

//     setScore(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].scores) Vue.set(state[payload.id], 'scores', [])

//       let idx = state[payload.id].scores.findIndex(el => {
//         return el.event === payload.event &&
//           el.participant === payload.participant &&
//           el.judgeID === payload.judgeID
//       })
//       if (idx >= 0) {
//         Vue.set(state[payload.id].scores[idx], payload.field, payload.value)
//       } else {
//         state[payload.id].scores.push({
//           event: payload.event,
//           participant: payload.participant,
//           judgeID: payload.judgeID,
//           [payload.field]: payload.value
//         })
//       }
//     },
//     deleteScore(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].scores) Vue.set(state[payload.id], 'scores', [])

//       let idx = state[payload.id].scores.findIndex(el => {
//         return el.event === payload.event &&
//           el.participant === payload.participant &&
//           el.judgeID === payload.judgeID
//       })
//       if (idx >= 0) {
//         Vue.delete(state[payload.id].scores[idx], payload.field)
//         if (Object.keys(state[payload.id].scores[idx])
//           .filter(el => !['event', 'participant', 'judgeID']
//             .includes(el)).length === 0) state[payload.id].scores.splice(idx, 1)
//       }
//     },

//     setDNS(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].dns) Vue.set(state[payload.id], 'dns', [])

//       state[payload.id].dns.push({
//         participant: payload.participant,
//         event: payload.event
//       })
//     },
//     deleteDNS(state, payload) {
//       let idx = (state[payload.id].dns || []).findIndex(el => el.event === payload.event && el.participant === payload.participant)

//       if (idx >= 0) {
//         state[payload.id].dns.splice(idx, 1)
//       }
//     },

//     tableZoomChange(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].printConfig) Vue.set(state[payload.id], 'printConfig', {})
//       if (!state[payload.id].printConfig[payload.table]) Vue.set(state[payload.id].printConfig, payload.table, {})

//       Vue.set(state[payload.id].printConfig[payload.table], 'zoom', payload.value)
//     },

//     setCategoryLogo(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].printConfig) Vue.set(state[payload.id], 'printConfig', {})

//       Vue.set(state[payload.id].printConfig, 'logo', payload.value)
//     },

//     deleteCategoryLogo(state, payload) {
//       Vue.delete(state[payload.id].printConfig, 'logo')
//     },

//     setExcludeTable(state, payload) {
//       if (!state[payload.id]) return
//       if (!state[payload.id].printConfig) Vue.set(state[payload.id], 'printConfig', {})
//       if (!state[payload.id].printConfig[payload.table]) Vue.set(state[payload.id].printConfig, payload.table, {})

//       Vue.set(state[payload.id].printConfig[payload.table], 'exclude', payload.value)
//     },

//     deleteExcludeTable(state, payload) {
//       Vue.delete(state[payload.id].printConfig[payload.table], 'exclude')
//     }
//   },
//   actions: {
//     updateEvents: ({ commit }, payload) => {
//       // TODO: get prev state, compare to new state remove scores entered for that event
//       // also use addCategoryEvent and deleteCategoryEvent methods for each changed event
//       commit('setCategoryEvents', {
//         id: payload.id,
//         value: payload.events.filter(el => !!el)
//       })
//       if (payload.template) commit('sortCategoryEvents', { id: payload.id, template: payload.template })
//     },

//     updateParticipants: ({ commit }, payload) => {
//       // TODO: get prev state, compare to new state remove scores entered for that event
//       // also use addParticipant and deleteParticipant methods for each changed event
//       commit('setParticipants', {
//         id: payload.id,
//         value: payload.participants.filter(el => !!el)
//       })
//     },

//     addJudge: ({ commit, state }, payload) => {
//       if (!state[payload.id]) return
//       if (!state[payload.id].judges) Vue.set(state[payload.id], 'judges', [])

//       let judgeID = 'J001RS'
//       let judgeIDs = state[payload.id].judges
//         .map((el: any): string => el.id)
//         .filter((el: string): boolean => el.substring(0, 1) === 'J')
//         .sort((a: string, b: string): number => Number(a.substring(1, 4)) - Number(b.substring(1, 4)))

//       if (judgeIDs.length > 0) {
//         let last = judgeIDs[judgeIDs.length - 1]
//         let lastID = Number(last.substring(1, 4))

//         judgeID = `J${leftFillNum(lastID + 1, 3)}RS`
//       }

//       commit('addJudge', { id: payload.id, judgeID })
//     },
//     updateJudgeID: ({ commit }, payload) => {
//       // TODO: update judge's scores
//       commit('setJudgeID', {
//         id: payload.id,
//         judgeID: payload.judgeID,
//         newID: payload.newID
//       })
//     },
//     deleteJudge: ({ commit }, payload) => {
//       // TODO: remove all scores by that judge
//       commit('deleteJudge', { id: payload.id, judgeID: payload.judgeID })
//     },
//     updateJudgeAssignment: ({ commit }, payload) => {
//       if (!payload.id && !payload.judgeID && !payload.event) return
//       if (!payload.judgeType) {
//         commit('deleteJudgeAssignment', {
//           id: payload.id,
//           judgeID: payload.judgeID,
//           event: payload.event
//         })
//       } else {
//         commit('setJudgeAssignment', {
//           id: payload.id,
//           judgeID: payload.judgeID,
//           event: payload.event,
//           judgeType: payload.judgeType
//         })
//       }
//     },

//     setScore: ({ commit }, payload) => {
//       if (payload.value !== 0 && !payload.value) {
//         return commit('deleteScore', {
//           id: payload.id,
//           event: payload.event,
//           participant: payload.participant,
//           judgeID: payload.judgeID,
//           field: payload.field
//         })
//       }
//       payload.value = Number(payload.value)
//       payload.value = roundToMultiple(payload.value, payload.step || 1)
//       if (payload.min && payload.value < payload.min) payload.value = Number(payload.min)
//       if (payload.max && payload.value > payload.max) payload.value = Number(payload.max)

//       commit('setScore', {
//         id: payload.id,
//         event: payload.event,
//         participant: payload.participant,
//         judgeID: payload.judgeID,
//         field: payload.field,
//         value: payload.value
//       })
//     },
//     toggleDNS: ({ commit, state }, { id, event, participant }) => {
//       let idx = (state[id].dns || []).findIndex(el => el.event === event && el.participant === participant)

//       if (idx >= 0) {
//         commit('deleteDNS', { id, participant, event })
//       } else {
//         commit('setDNS', { id, participant, event })
//         // TODO: remove all related scores
//       }
//     },

//     zoomChange: ({ commit }, { id, table, zoom }) => {
//       commit('tableZoomChange', { id, table, value: zoom })
//     },

//     printLogo: ({ commit }, { id, data }) => {
//       if (!data) commit('deleteCategoryLogo', { id })
//       commit('setCategoryLogo', { id, value: data })
//     },

//     excludePrint: ({ commit }, { id, table, value }) => {
//       // if (!value) commit('deleteExcludeTable', { id, table })
//       commit('setExcludeTable', { id, table, value })
//     }
//   },
//   getters: {
//     categoriesList: state => {
//       return Object.keys(state).map((id: string) => ({
//         id,
//         name: state[id].config.name,
//         group: state[id].config.group,
//         ruleset: state[id].config.ruleset
//       }))
//     },
//     groups: state => {
//       return Object.keys(state)
//         .map((id: string) => state[id].config.group)
//         .filter((el: string, idx: number, arr: string[]): boolean => arr.indexOf(el) === idx)
//         .filter((el: string): boolean => !!el)
//     },
//     groupedCategories: function (state) {
//       return Object.keys(state)
//         .map((id: string) => state[id].config.group || 'Ungrouped')
//         .filter((el: string, idx: number, arr: string[]): boolean => arr.indexOf(el) === idx)
//         .map(group => {
//           return {
//             name: group,
//             categories: Object.keys(state).map((id: string) => ({
//               id,
//               name: state[id].config.name,
//               group: state[id].config.group,
//               ruleset: state[id].config.ruleset
//             })).filter(el => (el.group || 'Ungrouped') === group)
//           }
//         })
//     },

//     eventScoreObj: state => ({ id, event }) => {
//       let obj = {}
//       let related = state[id].scores.filter(el => el.event === event)
//       related.forEach(el => {
//         if (!obj[el.participant]) obj[el.participant] = {}
//         obj[el.participant][el.judgeID] = { ...el }
//       })
//       return obj
//     },

//     participantScoreObj: state => ({ id, event, participant }) => {
//       let obj = {}
//       let related = state[id].scores.filter(el => el.event === event && el.participant === participant)
//       related.forEach(el => { obj[el.judgeID] = { ...el } })
//       return obj
//     },

//     fieldScore: (state, getters) => ({ id, event, participant, judgeID, field }) => {
//       return (getters.participantScoreObj({ id, event, participant })[judgeID] || {})[field]
//     },

//     dns: state => ({ id, event, participant }) => {
//       let idx = (state[id].dns || []).findIndex(el => el.event === event && el.participant === participant)

//       if (idx >= 0) {
//         return true
//       } else {
//         return false
//       }
//     }
//   }
// }

// export default module
