import { roundToMultiple, nextID, getInfoFromCategories } from '@/common'
import Vue from 'vue'
import { version } from '../../package.json'
import { DateTime } from 'luxon'

import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import store from '@/plugins/store'

import VuexPersistance from 'vuex-persist'
import { Score, EventTypes, Overalls } from '@/rules'

const VuexLocal = new VuexPersistance({
  storage: window.localStorage,
  modules: ['categories'],
  key: 'ropescore-categories'
})

interface BasePayload<T = string> {
  id: string
  value?: T
}

interface ParticipantDataPayload extends BasePayload<Partial<TeamPerson>> {
  participantID: string
}

interface JudgeDataPayload<T = Omit<Judge, 'id'>> extends BasePayload<T> {
  judgeID: string
}

interface EventBasePayload<T = string> extends BasePayload<T> {
  eventID: EventTypes
}

interface ScoreBasePayload<T = string> extends BasePayload<T> {
  eventID: EventTypes
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

interface UpdateParticipantsPayload {
  id: string
  participants: Array<Partial<TeamPerson>>
}

interface TableBasePayload<T = string> extends BasePayload<T> {
  table: EventTypes | Overalls
}

export interface Categories {
  [key: string]: Category
}

export interface Category {
  config: {
    name?: string
    group?: string
    ruleset?: string
    type?: 'team' | 'individual'
    events?: EventTypes[]
  },
  judges: Judge[],
  participants: TeamPerson[],
  scores: Score[],
  dns: DNS[],
  printConfig: PrintConfig
}

interface PrintConfig {
  logo?: string
  exclude: (EventTypes | Overalls)[]
  zoom: [EventTypes | Overalls, number][]
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
  eventID: EventTypes
  judgeTypeID: string
}

interface DNS {
  participantID: string;
  eventID: EventTypes;
}

export interface CategoryWithInfo {
  id: string
  name?: string
  group?: string
  ruleset?: string
}

export interface Export {
  version: string
  exportedAt: number
  computerName?: string
  categories: Categories
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
  _importCategory({ id, value }: BasePayload<Category>) {
    Vue.set(this.categories, id, value)
  }

  @Mutation
  _setCategoryName({ id, value }: BasePayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set name`)
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.name = value
  }

  @Mutation
  _setCategoryGroup({ id, value }: BasePayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set group`)
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.group = value
  }

  @Mutation
  _setCategoryRuleset({ id, value }: BasePayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set ruleset`)
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.ruleset = value
  }

  @Mutation
  _setCategoryType({ id, value }: BasePayload<'team' | 'individual'>) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set type`)
    if (!this.categories[id].config) this.categories[id].config = {}

    this.categories[id].config.type = value
    this.categories[id].participants.splice(0, this.categories[id].participants.length)
  }

  @Mutation
  _setCategoryEvents({ id, value }: BasePayload<string[]>) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set events`)
    if (!this.categories[id].config) this.categories[id].config = {}

    Vue.set(this.categories[id].config, 'events', value)
  }

  @Mutation
  _sortCategoryEvents({ id, template }: { id: string, template: string[] }) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't sort events`)
    if (!this.categories[id].config) this.categories[id].config = {};

    (this.categories[id].config.events || []).sort((a, b) => template.indexOf(a) - template.indexOf(b))
  }

  @Mutation
  _addParticipant({ id, value }: BasePayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't add participant`)
    if (!this.categories[id].judges) this.categories[id].judges = []
    if (!value) throw new Error(`no participantID for new participant provided`)

    this.categories[id].participants.push(<TPBase>{
      participantID: value,
      name: '',
      club: '',
      country: ''
    })
  }

  @Mutation
  _setParticipantInfo({ id, participantID, value }: ParticipantDataPayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].participants) this.categories[id].participants = []
    if (!value) throw new Error(`No participantID to update provided`)

    if ((value as Partial<Team>)?.members) delete (value as Team).members
    if (this.categories[id].config.type === 'team' && typeof (value as Partial<Person>)?.ijruID === 'string') delete (value as Person).ijruID

    let idx = this.categories[id].participants.findIndex(el => el.participantID === participantID)
    if (idx >= 0) {
      this.categories[id].participants.splice(idx, 1, {
        ...this.categories[id].participants[idx],
        ...value
      })
    } else {
      throw new Error(`Participant ${participantID} not found in category ${id}. Can't update`)
    }
  }

  @Mutation
  _deleteParticipant({ id, value }: BasePayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].participants) this.categories[id].participants = []
    if (!value) throw new Error(`No participantID to delete provided`)

    let idx = this.categories[id].participants.findIndex(el => el.participantID === value)
    if (idx >= 0) this.categories[id].participants.splice(idx, 1)
  }

  @Mutation
  _addTeamMember ({ id, participantID, value }: { id: string, participantID: string, value: Person }) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't add participant`)
    if (!this.categories[id].participants) this.categories[id].participants = []
    if (!participantID) throw new Error(`no participantID provided to add team member to`)
    if (!value) throw new Error(`no teamMember to add provided`)

    const pIdx = this.categories[id].participants.findIndex(part => part.participantID === participantID)

    if (pIdx < 0) throw new Error(`Team ${participantID} to add member to doesn't exist on category ${id}`)
    if (!(this.categories[id].participants[pIdx] as Team).members) Vue.set(this.categories[id].participants[pIdx], 'members', []);

    (this.categories[id].participants[pIdx] as Team).members.push(value)
  }

  @Mutation
  _deleteTeamMember ({ id, participantID, teamMemberID }: { id: string, participantID: string, teamMemberID: string }) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't add participant`)
    if (!this.categories[id].participants) this.categories[id].participants = []
    if (!participantID) throw new Error(`no participantID provided to add team member to`)
    if (!teamMemberID) throw new Error(`no teamMemberID to delete provided`)

    const pIdx = this.categories[id].participants.findIndex(part => part.participantID === participantID)

    if (pIdx < 0) throw new Error(`Team ${participantID} to add member to doesn't exist on category ${id}`)
    if (!(this.categories[id].participants[pIdx] as Team).members) Vue.set(this.categories[id].participants[pIdx], 'members', [])

    let idx = (this.categories[id].participants[pIdx] as Team).members.findIndex(el => el.participantID === teamMemberID)
    if (idx >= 0) (this.categories[id].participants[pIdx] as Team).members.splice(idx, 1)
  }

  @Mutation
  _addJudge({ id, value }: BasePayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].judges) this.categories[id].judges = []
    if (!value) throw new Error(`No judgeID provided for new judge`)

    this.categories[id].judges.push({
      judgeID: value,
      name: '',
      assignments: []
    })
  }

  @Mutation
  _setJudgeInfo({ id, judgeID, value }: JudgeDataPayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].judges) this.categories[id].judges = []
    if (!value) throw new Error(`No judgeID to update provided`)

    let idx = this.categories[id].judges.findIndex(el => el.judgeID === judgeID)
    if (idx >= 0) {
      this.categories[id].judges.splice(idx, 1, {
        ...this.categories[id].participants[idx],
        ...value
      })
    } else {
      throw new Error(`Judge ${judgeID} not found in category ${id}. Can't update`)
    }
  }

  @Mutation
  _setJudgeAssignment({ id, judgeID, value }: JudgeDataPayload<Assignment>) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].judges) this.categories[id].judges = []
    if (!value) throw new Error(`No judgeID to assign provided`)

    const jIdx = this.categories[id].judges.findIndex(el => el.judgeID === judgeID)
    if (jIdx < 0) throw new Error(`Judge ${judgeID} not found in category ${id}. Can't assign`)

    const aIdx = this.categories[id].judges[jIdx].assignments.findIndex(asg => asg.eventID === value.eventID)
    if (aIdx >= 0 && !value.judgeTypeID) {
      // is assigned but new assignment is none, remove
      this.categories[id].judges[jIdx].assignments.splice(aIdx, 1)
    } else if (aIdx >= 0 && value.judgeTypeID) {
      // is assigned and has changed
      this.categories[id].judges[jIdx].assignments.splice(aIdx, 1, value)
    } else if (aIdx < 0 && value.judgeTypeID) {
      // not assigned but will be
      this.categories[id].judges[jIdx].assignments.push(value)
    } else {
      throw new Error(`no judgeType provided for assignment`)
    }
  }

  @Mutation
  _deleteJudge({ id, value }: BasePayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].judges) this.categories[id].judges = []
    if (!value) throw new Error(`No judgeID to delete provided`)

    let idx = this.categories[id].judges.findIndex(el => el.judgeID === value)
    if (idx >= 0) this.categories[id].judges.splice(idx, 1)
    else throw new Error(`Judge ${value} not found in category ${id}. Can't delete`)
  }

  @Mutation
  _setDNS ({ id, participantID, eventID }: ScoreBasePayload<undefined>) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].dns) Vue.set(this.categories[id], 'dns', [])

    this.categories[id].dns.push({
      participantID: participantID,
      eventID: eventID
    })
  }

  @Mutation
  _deleteDNS ({ id, participantID, eventID }: ScoreBasePayload<undefined>) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].dns) Vue.set(this.categories[id], 'dns', [])

    let idx = this.categories[id].dns.findIndex(el => el.eventID === eventID && el.participantID === participantID)

    if (idx >= 0) {
      this.categories[id].dns.splice(idx, 1)
    } else {
      throw new Error(`the participant ${participantID} is not listed in DNS for category ${id}. Can't unset`)
    }
  }

  @Mutation
  _setScore({ id, eventID, participantID, judgeID, value, fieldID }: SetScorePayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
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
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
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
    } else throw new Error(`Score for participant ${participantID} and event ${eventID} by judgeID ${judgeID} not found in category ${id}. Can't delete`)
  }

  @Mutation
  _tableZoomChange({ id, table, value }: TableBasePayload<number>) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (typeof value !== 'number') throw new Error(`Must provide a number for table zoom`)
    if (!this.categories[id].printConfig || !this.categories[id].printConfig.zoom) Vue.set(this.categories[id], 'printConfig', <PrintConfig>{ exclude: [], zoom: [] })

    const zoomIdx = this.categories[id].printConfig.zoom.findIndex(([tbl, _]) => tbl === table)

    if (zoomIdx > -1) this.categories[id].printConfig.zoom[zoomIdx].splice(1, 1, value)
    else this.categories[id].printConfig.zoom.push([table, value])
  }

  @Mutation
  _setCategoryLogo({ id, value }: BasePayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].printConfig) Vue.set(this.categories[id], 'printConfig', {})

    Vue.set(this.categories[id].printConfig, 'logo', value)
  }

  @Mutation
  _deleteCategoryLogo({ id }: BasePayload) {
    Vue.delete(this.categories[id].printConfig, 'logo')
  }

  @Mutation
  _toggleExcludeTable({ id, table }: TableBasePayload) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].printConfig || !this.categories[id].printConfig.exclude) Vue.set(this.categories[id], 'printConfig', <PrintConfig>{ exclude: [], zoom: [] })

    const excludeIdx = this.categories[id].printConfig.exclude.indexOf(table)

    if (excludeIdx > -1) this.categories[id].printConfig.exclude.splice(excludeIdx, 1)
    else this.categories[id].printConfig.exclude.push(table)
  }

  @Action
  newParticipant({ id, value, startAt }: BasePayload<Omit<Team & Person, 'participantID'>> & { startAt?: number }) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].participants) this.categories[id].participants = []
    if (!value) return

    const team = this.categories[id].config.type === 'team'
    const prefix = team ? 'T' : 'P'
    const suffix = 'RS'

    const participantID = nextID(
      this.categories[id].participants.map(el => el.participantID),
      prefix,
      suffix,
      startAt
    )

    const members = value.members ? [ ...value.members ] : []

    this.context.commit('_addParticipant', { id, value: participantID })
    this.context.commit('_setParticipantInfo', { id, participantID, value })

    if (team && members) {
      for (const teamMember of members) {
        this.addTeamMember({ id, participant: { participantID, ...value }, teamMember })
      }
    }
  }

  @Action
  updateParticipants ({ id, participants }: UpdateParticipantsPayload) {
    for (const participant of participants) {
      this.context.commit('_setParticipantInfo', { id, participantID: participant.participantID, value: participant })
    }
  }

  @Action
  deleteParticipant({ id, value }: BasePayload<TeamPerson>) {
    if (!value) return
    // TODO: remove the participant's scores
    this.context.commit('_deleteParticipant', { id, value: value.participantID })
  }

  @Action
  addTeamMember({ id, participant: { participantID }, teamMember }: { id: string; participant: Team; teamMember: Partial<Person> }) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].participants) this.categories[id].participants = []

    const members = (this.categories[id].participants as Team[]).find(p => p.participantID === participantID)?.members || []
    const teamMemberID = nextID(
      members.map(m => m.participantID),
      participantID
    )

    this.context.commit('_addTeamMember', {
      id,
      participantID,
      value: {
        participantID: teamMemberID,
        ...teamMember
      }
    })
  }

  @Action
  addJudge({ id, value, startAt }: BasePayload<Omit<Judge, 'id'>> & { startAt?: number }) {
    if (!this.categories[id]) throw new Error(`Category ${id} doesn't exist. Can't set participant info`)
    if (!this.categories[id].judges) this.categories[id].judges = []

    const prefix = 'J'
    const suffix = 'RS'

    const judgeID = nextID(
      this.categories[id].judges.map(el => el.judgeID),
      prefix,
      suffix,
      startAt
    )

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
  resetStore () {
    for (const id of Object.keys(this.categories)) {
      this.context.commit('_deleteCategory', { id })
    }
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

  get categoriesWithInfo (): CategoryWithInfo[]  {
    return getInfoFromCategories(this.categories)
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

  get clubs () {
    return [...new Set(Object.values(this.categories).flatMap(cat => cat.participants).map(part => part.club))]
  }

  get tableZoom () {
    return ({ id, table }: TableBasePayload) => (this.categories[id].printConfig.zoom ?? []).find(([tbl, _]) => table === tbl)?.[1] ?? 1
  }

  get hasCategory () {
    return (id: string): boolean => Object.prototype.hasOwnProperty.call(this.categories, id)
  }

  get export () {
    return ({ ids, computerName }: { computerName?: string, ids?: Array<keyof Categories> }): Export => {
      let categoryEntries = Object.entries(this.categories)

      if (ids) categoryEntries = categoryEntries.filter(([id]) => ids.includes(id))

      const categories = Object.fromEntries(categoryEntries)
      return {
        version,
        categories,
        exportedAt: DateTime.local().toSeconds(),
        computerName
      }
    }
  }
}

VuexLocal.plugin(store)
