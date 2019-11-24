import { expose } from 'comlink'
import FISAC1718 from './FISAC1718'
import IJRU1_0_0 from './IJRU1-0-0'
// import SvGFRH1718 from './SvGFRH1718'
import SvGFVH18 from './SvGFVH18'

export interface ScoreInfo {
  event: string;
  judgeID: string
  participant: string;
}

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
  result: (scores: { [field: string]: number }) => { [field: string]: number } | undefined
}

export interface ResultTableHeader {
  text: string
  value: string
  event?: string
  color?: string
}

export interface ResultTableHeaderGroup extends ResultTableHeader {
  colspan?: number
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

const rulesets: Rulesets = {
  [FISAC1718.id]: FISAC1718,
  [IJRU1_0_0.id]: IJRU1_0_0,
  // [SvGFRH1718.id]: SvGFRH1718,
  [SvGFVH18.id]: SvGFVH18,
}

console.log(rulesets)
expose(rulesets)

export default {} as typeof Worker & { new(): Worker }
