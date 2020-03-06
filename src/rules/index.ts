// import { expose } from 'comlink'
import FISAC1718 from './FISAC1718'
import IJRU1_0_0 from './IJRU1-0-0'
// import SvGFRH1718 from './SvGFRH1718'
import SvGFVH18 from './SvGFVH18'

export interface ScoreInfo {
  eventID: string;
  judgeID: string
  participantID: string;
}

export interface InputField {
  fieldID: string
  name: string
  min?: number
  max?: number
  step?: number
}

export interface JudgeType {
  judgeTypeID: string,
  name: string
  fields: InputField[]
  result: (scores: { [fieldID: string]: number }) => { [fieldID: string]: number } | undefined
}

export interface ResultTableHeader {
  text: string
  value: string
  eventID?: string
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
  eventID: string
  name: string
  judges: JudgeType[]
  result: Function
  rank: Function
  headers: ResultTableHeaders
  scoreMultiplier?: number
  rankMultiplier?: number
  multipleEntry?: boolean
}

export interface Overall extends ResultTableHeaders {
  overallID: string
  text: string
  type: string
  events: string[]
  rank: Function
}

export interface Ruleset {
  rulesetID: string
  name: string
  versions: string[]
  events: Event[]
  overalls: Overall[]
}

export type Rulesets = Ruleset[]

export default [
  FISAC1718,
  IJRU1_0_0,
  // SvGFRH1718,
  SvGFVH18
]

// export default {} as typeof Worker & { new(): Worker }
