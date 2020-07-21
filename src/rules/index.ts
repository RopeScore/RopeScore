import FISAC1718, { FISAC1718Score, FISAC1718Result, FISAC1718Events, FISAC1718Overalls } from './FISAC1718'
import IJRU1_1_0, { IJRU1_1_0Events, IJRU1_1_0Overalls, IJRU1_1_0Result, IJRU1_1_0Score } from './IJRU1-1-0'
import IJRU2_0_0, { IJRU2_0_0Overalls, IJRU2_0_0Result, IJRU2_0_0Score } from './IJRU2-0-0'
import SvGFVH18, { SvGFVH18Score, SvGFVH18Result, SvGFVH18Events, SvGFVH18Overalls } from './SvGFVH18'
import SvGFRH20 from './SvGFRH20'

export type Score = FISAC1718Score | IJRU1_1_0Score | IJRU2_0_0Score | SvGFVH18Score
export type Result = FISAC1718Result | IJRU1_1_0Result | IJRU2_0_0Result | SvGFVH18Result
export type EventTypes = FISAC1718Events | IJRU1_1_0Events | SvGFVH18Events
export type Overalls = FISAC1718Overalls | IJRU1_1_0Overalls | IJRU2_0_0Overalls | SvGFVH18Overalls

export interface ScoreInfo<E = EventTypes> {
  eventID: E;
  judgeID: string
  participantID: string;
}

export interface ResultInfo {
  judgeID?: string
  participantID?: string
}

export interface InputField<S = Score, E = EventTypes> {
  fieldID: keyof Omit<S, keyof ScoreInfo<E>>
  name: string
  min?: number
  max?: number
  step?: number
}

export interface JudgeType<S = Score, R = Result, E = EventTypes> {
  judgeTypeID: string,
  name: string
  fields: InputField<S, E>[]
  result: (scores: Partial<Omit<S, keyof ScoreInfo<E>>>) => Partial<R> | undefined
}

export interface ResultTableHeader<E = EventTypes> {
  text: string
  value: string
  eventID?: E | 'overall'
  color?: string
}

export interface ResultTableHeaderGroup<E = EventTypes> extends ResultTableHeader<E> {
  colspan?: number
  rowspan?: number
}

export interface ResultTableHeaders<E = EventTypes> {
  groups?: ResultTableHeaderGroup<E>[][]
  headers: ResultTableHeader<E>[]
}

export interface Event<S = Score, R = Result, E = EventTypes, O = Overalls> {
  eventID: E
  name: string
  judges: JudgeType<S, R, E>[]
  result: (scores: { [judgeID: string]: S; }, judges: [string, string][]) => R
  rank: (results: R[]) => R[]
  headers: ResultTableHeaders<E | 'overall'>
  scoreMultiplier?: number
  rankMultiplier?: number
  multipleEntry?: boolean
}

type eventResults<R, T> = { [K in T extends string ? T : never]?: R[] }

export interface Overall<S = Score, R = Result, E = EventTypes, O = Overalls> extends ResultTableHeaders<E | 'overall'> {
  overallID: O
  text: string
  type: 'team' | 'individual'
  events: E[]
  rank: (results?: eventResults<R, E>) => ({ overall: R[] } & eventResults<R, E>) | undefined
}

export interface Ruleset<S = Score, R = Result, E = EventTypes, O = Overalls> {
  rulesetID: string
  name: string
  events: Event<S, R, E>[]
  overalls: Overall<S, R, E, O>[]
}

export type Rulesets<S = Score, R = Result, E = EventTypes, O = Overalls> = Ruleset<S, R, E, O>[]

export default [
  FISAC1718,
  IJRU1_1_0,
  IJRU2_0_0,
  SvGFRH20,
  SvGFVH18
]
