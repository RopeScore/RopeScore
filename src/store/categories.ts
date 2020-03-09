// import { Module } from 'vuex'
// import Vue from 'vue'
import { leftFillNum, roundToMultiple } from '@/common'
import Vue from 'vue'

import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import store from '@/plugins/store'

import VuexPersistance from 'vuex-persist'

const VuexLocal = new VuexPersistance({
  storage: window.localStorage,
  modules: ['categories'],
  key: 'ropescore-categories'
})

interface BasePayload<T = string> {
  id: string
  value?: T
}

interface ParticipantDataPayload extends BasePayload<TeamPerson> {
  participantID: string
}

interface JudgeDataPayload<T = Omit<Judge, 'id'>> extends BasePayload<T> {
  judgeID: string
}

interface EventBasePayload<T = string> extends BasePayload<T> {
  eventID: string
}

interface ScoreBasePayload<T = string> extends BasePayload<T> {
  eventID: string
  participantID: string
}

interface SetScorePayload extends Omit<ScoreBasePayload<undefined>, 'value'> {
  judgeID: string
  value: number
  fieldID: string
}

interface SetScorePayloadExtended extends Omit<SetScorePayload, 'value'> {
  min?: number
  max?: number
  step?: number
  value?: number
}

interface TableBasePayload<T = string> extends BasePayload<T> {
  table: string
}

interface Score {
  participantID: string
  eventID: string
  judgeID: string
  [prop: string]: number | string
}

interface Categories {
  [key: string]: Category
}

interface Category {
  config: {
    name?: string
    group?: string
    ruleset?: string
    type?: 'team' | 'individual'
    events?: string[]
  },
  judges: Judge[],
  participants: TeamPerson[],
  scores: Score[],
  dns: DNS[],
  printConfig: PrintConfig
}

interface PrintConfig {
  logo?: string
  exclude: string[]
  zoom: [string, number][]
}

interface TPBase {
  participantID: string
  name: string
  club: string
  country: string
}

export interface Person extends TPBase {
  ijruID?: string
}

export interface Team extends TPBase {
  members: Person[]
}

export type TeamPerson = Team | Person

export interface Judge {
  judgeID: string
  name: string
  ijruID?: string
  assignments: Assignment[]
}

interface Assignment {
  eventID: string
  judgeTypeID: string
}

interface DNS {
  participantID: string;
  eventID: string;
}

@Module({ namespaced: true, name: 'categories', dynamic: true, store })
export default class CategoriesModule extends VuexModule {
  categories: Categories = {}

  @Mutation
  _addCategory({ id }: BasePayload) {
    Vue.set(this.categories, id, <Category>{
      config: {
        name: '',
        group: '',
        ruleset: '',
        type: undefined,
        events: []
      },
      judges: [],
      participants: [],
      scores: [],
      dns: [],
      printConfig: {
        logo: '',
        exclude: [],
        zoom: []
      }
    })
  }

  @Mutation
  _deleteCategory({ id }: BasePayload) {
    Vue.delete(this.categories, id)
  }

  @Mutation
  _setCategoryName({ id, value }: BasePayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.name = value
  }

  @Mutation
  _setCategoryGroup({ id, value }: BasePayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.group = value
  }

  @Mutation
  _setCategoryRuleset({ id, value }: BasePayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.ruleset = value
  }

  @Mutation
  _setCategoryType({ id, value }: BasePayload<'team' | 'individual'>) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.type = value
    this.categories[id].participants = []
  }

  @Mutation
  _setCategoryEvents({ id, value }: BasePayload<string[]>) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.events = value
  }

  @Mutation
  _sortCategoryEvents({ id, template }: { id: string, template: string[] }) {
    if (!this.categories[id]) return
    if (!this.categories[id].config) this.categories[id].config = {};

    (this.categories[id].config.events || []).sort((a, b) => template.indexOf(a) - template.indexOf(b))
  }

  @Mutation
  _addParticipant({ id, value }: BasePayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].judges) this.categories[id].judges = []
    if (!value) return

    this.categories[id].participants.push(<TPBase>{
      participantID: value,
      name: '',
      club: '',
      country: ''
    })
  }

  @Mutation
  _setParticipantInfo({ id, participantID, value }: ParticipantDataPayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].participants) this.categories[id].participants = []
    if (!value) return

    let idx = this.categories[id].participants.findIndex(el => el.participantID === participantID)
    if (idx >= 0) {
      this.categories[id].participants.splice(idx, 1, {
        ...this.categories[id].participants[idx],
        ...value
      })
    }
  }

  @Mutation
  _deleteParticipant({ id, value }: BasePayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].participants) this.categories[id].participants = []
    if (!value) return

    let idx = this.categories[id].participants.findIndex(el => el.participantID === value)
    if (idx >= 0) this.categories[id].participants.splice(idx, 1)
  }

  @Mutation
  _addJudge({ id, value }: BasePayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].judges) this.categories[id].judges = []
    if (!value) return

    this.categories[id].judges.push({
      judgeID: value,
      name: '',
      assignments: []
    })
  }

  @Mutation
  _setJudgeInfo({ id, judgeID, value }: JudgeDataPayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].judges) this.categories[id].judges = []
    if (!value) return

    let idx = this.categories[id].judges.findIndex(el => el.judgeID === judgeID)
    if (idx >= 0) {
      this.categories[id].judges.splice(idx, 1, {
        ...this.categories[id].participants[idx],
        ...value
      })
    }
  }

  @Mutation
  _setJudgeAssignment({ id, judgeID, value }: JudgeDataPayload<Assignment>) {
    if (!this.categories[id]) return
    if (!this.categories[id].judges) this.categories[id].judges = []
    if (!value) return

    const jIdx = this.categories[id].judges.findIndex(el => el.judgeID === judgeID)
    if (jIdx < 0) return

    const aIdx = this.categories[id].judges[jIdx].assignments.findIndex(asg => asg.eventID === value.eventID)
    if (aIdx >= 0 && !value.judgeTypeID) {
      // is assigned but new assignment is none, remove
      this.categories[id].judges[jIdx].assignments.splice(aIdx, 1)
    }

    if (aIdx >= 0 && value.judgeTypeID) {
      // is assigned and has changed
      this.categories[id].judges[jIdx].assignments.splice(aIdx, 1, value)
    }

    if (aIdx < 0 && value.judgeTypeID) {
      // not assigned but will be
      this.categories[id].judges[jIdx].assignments.push(value)
    }
  }

  @Mutation
  _deleteJudge({ id, value }: BasePayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].judges) this.categories[id].judges = []
    if (!value) return

    let idx = this.categories[id].judges.findIndex(el => el.judgeID === value)
    if (idx >= 0) this.categories[id].judges.splice(idx, 1)
  }

  @Mutation
  _setDNS ({ id, participantID, eventID }: ScoreBasePayload<undefined>) {
    if (!this.categories[id]) return
    if (!this.categories[id].dns) Vue.set(this.categories[id], 'dns', [])

    this.categories[id].dns.push({
      participantID: participantID,
      eventID: eventID
    })
  }

  @Mutation
  _deleteDNS ({ id, participantID, eventID }: ScoreBasePayload<undefined>) {
    if (!this.categories[id]) return
    if (!this.categories[id].dns) Vue.set(this.categories[id], 'dns', [])

    let idx = this.categories[id].dns.findIndex(el => el.eventID === eventID && el.participantID === participantID)

    if (idx >= 0) {
      this.categories[id].dns.splice(idx, 1)
    }
  }

  @Mutation
  _setScore({ id, eventID, participantID, judgeID, value, fieldID }: SetScorePayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].scores) Vue.set(this.categories[id], 'scores', [])

    let idx = this.categories[id].scores.findIndex(score => {
      return score.eventID === eventID &&
        score.participantID === participantID &&
        score.judgeID === judgeID
    })

    if (idx >= 0) {
      Vue.set(this.categories[id].scores[idx], fieldID, value)
    } else {
      this.categories[id].scores.push({
        eventID: eventID,
        participantID: participantID,
        judgeID: judgeID,
        [fieldID]: value
      })
    }
  }

  @Mutation
  _deleteScore({ id, eventID, participantID, judgeID, fieldID }: Omit<SetScorePayload, 'value'>) {
    if (!this.categories[id]) return
    if (!this.categories[id].scores) Vue.set(this.categories[id], 'scores', [])

    let idx = this.categories[id].scores.findIndex(score => {
      return score.eventID === eventID &&
        score.participantID === participantID &&
        score.judgeID === judgeID
    })

    if (idx >= 0) {
      Vue.delete(this.categories[id].scores[idx], fieldID)
      if (Object.keys(this.categories[id].scores[idx]).filter(el => !['eventID', 'participantID', 'judgeID'].includes(el)).length === 0) {
        this.categories[id].scores.splice(idx, 1)
      }
    }
  }

  @Mutation
  _tableZoomChange({ id, table, value }: TableBasePayload) {
    if (!this.categories[id]) return
    if (typeof value !== 'number') return
    if (!this.categories[id].printConfig) Vue.set(this.categories[id], 'printConfig', <PrintConfig>{ exclude: [], zoom: [] })

    const zoomIdx = this.categories[id].printConfig.zoom.findIndex(([tbl, _]) => tbl === table)

    if (zoomIdx > -1) this.categories[id].printConfig.zoom[zoomIdx][1] = value
    else this.categories[id].printConfig.zoom.push([table, value])
  }

  @Mutation
  _setCategoryLogo({ id, value }: BasePayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].printConfig) Vue.set(this.categories[id], 'printConfig', {})

    Vue.set(this.categories[id].printConfig, 'logo', value)
  }

  @Mutation
  _deleteCategoryLogo({ id }: BasePayload) {
    Vue.delete(this.categories[id].printConfig, 'logo')
  }

  @Mutation
  _toggleExcludeTable({ id, table }: TableBasePayload) {
    if (!this.categories[id]) return
    if (!this.categories[id].printConfig) Vue.set(this.categories[id], 'printConfig', <PrintConfig>{ exclude: [], zoom: [] })

    const excludeIdx = this.categories[id].printConfig.exclude.indexOf(table)

    if (excludeIdx > -1) this.categories[id].printConfig.exclude.splice(excludeIdx, 1)
    else this.categories[id].printConfig.exclude.push(table)
  }

  @Action
  newParticipant({ id, value }: BasePayload<Omit<TeamPerson, 'participantID'>>) {
    if (!this.categories[id]) return
    if (!this.categories[id].participants) this.categories[id].participants = []
    if (!value) return

    let participantID = 'P001RS'
    const participantIDs = this.categories[id].participants
      .map(el => el.participantID)
      .sort((a, b) => Number(a.substring(1, 4)) - Number(b.substring(1, 4)))

    if (participantIDs.length > 0) {
      let last = participantIDs[participantIDs.length - 1]
      let lastID = Number(last.substring(1, 4))

      participantID = `P${leftFillNum(lastID + 1, 3)}RS`
    }

    this.context.commit('_addParticipant', { id, value: participantID })
    this.context.commit('_setParticipantInfo', { id, participantID, value })
  }

  @Action
  deleteParticipant({ id, value }: BasePayload) {
    // TODO: remove the aprticipant's scores
    this.context.commit('_deleteParticipant', { id, value })
  }

  @Action
  addJudge({ id, value }: BasePayload<Omit<Judge, 'id'>>) {
    if (!this.categories[id]) return
    if (!this.categories[id].judges) this.categories[id].judges = []

    let judgeID = 'J001RS'
    const judgeIDs = this.categories[id].judges
      .map(el => el.judgeID)
      .sort((a, b) => Number(a.substring(1, 4)) - Number(b.substring(1, 4)))

    if (judgeIDs.length > 0) {
      let last = judgeIDs[judgeIDs.length - 1]
      let lastID = Number(last.substring(1, 4))

      judgeID = `J${leftFillNum(lastID + 1, 3)}RS`
    }

    this.context.commit('_addJudge', { id, value: judgeID })
    this.context.commit('_setJudgeInfo', { id, judgeID, value })
  }

  @Action
  updateEvents({ id, events, template }: { id: string, events: string[], template: string[] }) {
    // TODO: get prev state, compare to new state remove scores entered for that event
    // also use addCategoryEvent and deleteCategoryEvent methods for each changed event
    this.context.commit('_setCategoryEvents', {
      id: id,
      value: events.filter(el => !!el)
    })
    if (template) this.context.commit('_sortCategoryEvents', { id, template })
  }

  @Action
  deleteJudge({ id, value }: BasePayload) {
    // TODO: remove the judges scores
    this.context.commit('_deleteJudge', { id, value })
  }

  @Action
  toggleDNS ({ id, eventID, participantID }: ScoreBasePayload<undefined>) {
    let idx = (this.categories[id].dns || []).findIndex(dns => dns.eventID === eventID && dns.participantID === participantID)

    if (idx >= 0) {
      this.context.commit('_deleteDNS', { id, participantID, eventID })
    } else {
      this.context.commit('_setDNS', { id, participantID, eventID })
      // TODO: remove all related scores
    }
  }

  @Action
  setScore ({ id, eventID, participantID, judgeID, fieldID, value, min, max, step }: SetScorePayloadExtended) {
    if (value !== 0 && !value) {
      return this.context.commit('_deleteScore', {
        id,
        eventID,
        participantID,
        judgeID,
        fieldID
      })
    }

    value = Number(value)
    value = roundToMultiple(value, step || 1)
    if (min && value < min) value = Number(min)
    if (max && value > max) value = Number(max)

    this.context.commit('_setScore', {
      id,
      eventID,
      participantID,
      judgeID,
      fieldID,
      value
    })
  }

  @Action
  zoomChange ({ id, table, value }: TableBasePayload<number>) {
    this.context.commit('_tableZoomChange', { id, table, value })
  }

  @Action
  printLogo ({ id, value }: BasePayload) {
    if (!value) this.context.commit('_deleteCategoryLogo', { id })
    this.context.commit('_setCategoryLogo', { id, value })
  }

  @Action
  excludePrint ({ id, table }: TableBasePayload) {
    this.context.commit('_toggleExcludeTable', { id, table })
  }

  get participantScoreObj () {
    return ({ id, eventID, participantID }: ScoreBasePayload<undefined>) => {
      let obj: { [judgeID: string]: Score } = {}
      let related = this.categories[id].scores.filter(el => el.eventID === eventID && el.participantID === participantID)
      related.forEach(el => { obj[el.judgeID] = { ...el } })
      return obj
    }
  }

  get groupedCategories () {
    return Object.keys(this.categories)
      .map(id => this.categories[id].config.group || 'Ungrouped')
      .filter((el, idx, arr) => arr.indexOf(el) === idx)
      .map(group => {
        return {
          name: group,
          categories: Object.keys(this.categories).map(id => ({
            id,
            name: this.categories[id].config.name,
            group: this.categories[id].config.group,
            ruleset: this.categories[id].config.ruleset
          })).filter(el => (el.group || 'Ungrouped') === group)
        }
      })
  }

  get eventScoreObj () {
    return ({ id, eventID }: EventBasePayload<undefined>) => {
      let obj: { [participantID: string]: { [judgeID: string]: Score } } = {}
      let related = this.categories[id].scores.filter(el => el.eventID === eventID)
      related.forEach(el => {
        if (!obj[el.participantID]) obj[el.participantID] = {}
        obj[el.participantID][el.judgeID] = { ...el }
      })
      return obj
    }
  }
}

VuexLocal.plugin(store)

// const module: Module<any, any> = {
//   state: {},
//   mutations: {
//   },
//   actions: {
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
// }

// export default module
