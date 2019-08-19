export interface InputField {
  name: string
  id: string
  min?: number
  max?: number
  step?: number
}

export interface Judge {
  name: string
  id: string,
  fields: InputField[]
  result: Function
}

export interface ResultTableHeader {
  text: string
  value: string
  event?: string
  color?: string
}

export interface ResultTableHeaderGroup extends ResultTableHeader {
  colspan: number
  rowspan?: number
}

export interface ResultTableHeaders {
  groups?: ResultTableHeaderGroup[][]
  headers: ResultTableHeader[]
}

export interface Event {
  name: string
  id: string
  judges: Judge[]
  result: Function
  rank: Function
  headers: ResultTableHeaders
  scoreMultiplier?: number
  rankMultiplier?: number
  multipleEntry?: boolean
}

export interface Overall extends ResultTableHeaders {
  id: string
  text: string
  type: string
  events: string[]
  rank: Function
}

export interface Ruleset {
  name: string
  id: string
  events: Event[]
  overalls: Overall[]
}

export interface Rulesets {
  [any: string]: Ruleset
}

// Get all and export in one object

const requireRuleset = require.context('.', false, /\.ts$/)
const rulesets: Rulesets = {}

requireRuleset.keys().forEach(fileName => {
  console.log(fileName)
  if (fileName === './index.ts') return
  const ruleset = requireRuleset(fileName).default || requireRuleset(fileName)
  rulesets[ruleset.id] = ruleset
})

console.log(rulesets)

export default rulesets
