import { Module } from 'vuex'
import Vue from 'vue'
import { leftFillNum } from '@/common'

export interface Person {
  name: string
  club: string
  country: string
  ijruID: string
}

export interface PersonWithID extends Person {
  id: string
}

export interface Team {
  name: string
  club: string
  country: string
  ijruID: string
  members: string[]
}

export interface TeamWithID extends Team {
  id: string
}

export interface PeopleModuleState {
  people: {
    [id: string]: Person
  }
  teams: {
    [id: string]: Team
  }
}

const module: Module<PeopleModuleState, any> = {
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
    deletePerson ({ people }, payload) {
      Vue.delete(people, payload.id)
    },
    setPersonName ({ people }, payload) {
      Vue.set(people[payload.id], 'name', payload.value)
    },
    setPersonClub ({ people }, payload) {
      Vue.set(people[payload.id], 'club', payload.value)
    },
    setPersonCountry ({ people }, payload) {
      Vue.set(people[payload.id], 'country', payload.value)
    },

    newTeam ({ teams }, payload) {
      Vue.set(teams, payload.id, {
        name: '',
        club: '',
        country: '',
        ijruID: '',
        members: []
      })
    },
    deleteTeam ({ teams }, payload) {
      Vue.delete(teams, payload.id)
    },
    setTeamName ({ teams }, payload) {
      Vue.set(teams[payload.id], 'name', payload.value)
    },
    setTeamClub ({ teams }, payload) {
      Vue.set(teams[payload.id], 'club', payload.value)
    },
    setTeamCountry ({ teams }, payload) {
      Vue.set(teams[payload.id], 'country', payload.value)
    },
    setTeamMembers ({ teams }, payload) {
      Vue.set(teams[payload.id], 'members', payload.value)
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
      commit('setPersonName', { id, value: payload.name || '' })
      commit('setPersonClub', { id, value: payload.club || '' })
      commit('setPersonCountry', { id, value: payload.country || '' })
    },
    updatePerson ({ commit, state }, payload) {
      if (!state.people[payload.id]) return
      commit('setPersonName', { id: payload.id, value: payload.name })
      commit('setPersonClub', { id: payload.id, value: payload.club })
      commit('setPersonCountry', { id: payload.id, value: payload.country })
    },
    deletePerson ({ commit, state }, payload) {
      if (!state.people[payload.id]) return
      commit('deletePerson', { id: payload.id })
    },

    newTeam ({ commit, state }, payload) {
      let id = 'T001RS'
      let ids = Object.keys(state.teams).sort((a, b) => Number(a.substring(1, 4)) - Number(b.substring(1, 4)))

      if (ids.length > 0) {
        let last = ids[ids.length - 1]
        let lastID = Number(last.substring(1, 4))

        id = `T${leftFillNum(lastID + 1, 3)}RS`
      }
      commit('newTeam', { id })
      commit('setTeamName', { id, value: payload.name || '' })
      commit('setTeamClub', { id, value: payload.club || '' })
      commit('setTeamCountry', { id, value: payload.country || '' })
    },
    deleteTeam ({ commit, state }, payload) {
      if (!state.teams[payload.id]) return
      commit('deleteTeam', { id: payload.id })
    }

  },
  getters: {
    clubs: ({ people }): string[] => {
      return Object.keys(people)
        .map(id => people[id].club)
        .filter((el: string, idx: number, arr: string[]): boolean => arr.indexOf(el) === idx)
        .filter((el: string): boolean => !!el)
    },
    peopleArray: ({ people }): PersonWithID[] => {
      return Object.keys(people)
        .map((id: string): PersonWithID => ({
          id,
          ...people[id]
        }))
    },
    teamsArray: ({ teams }): TeamWithID[] => {
      return Object.keys(teams)
        .map((id: string): TeamWithID => ({
          id,
          ...teams[id]
        }))
    }
  }
}

export default module
