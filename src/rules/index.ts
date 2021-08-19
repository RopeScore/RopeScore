import IJRU_2_0_0 from './ijru@2.0.0'

import type { CompetitionEvent, Scoresheet } from '../store/schema'

// export const rulesetIds = ['ijru@2.0.0', 'ijru@1.1.0', 'svgf-rh@2020', 'svgf-vh@2020', 'svgf-vh@2018', 'fisac@2017-2018'] as const
export type RulesetId = keyof typeof rulesets

export const rulesets = {
  'ijru@2.0.0': IJRU_2_0_0
}

export interface Ruleset {
  id: string
  name: string
  competitionEvents: Partial<Record<CompetitionEvent, CompetitionEventDefinition>>
}

export interface CompetitionEventDefinition {
  name: string
  judges: JudgeType[]
  calculateEntry: ReturnType<CalcEntryFn>
}

export interface JudgeType {
  id: string
  name: string
  tallyFields: Readonly<FieldDefinition[]>
  calculateScoresheet: (scoresheet: Scoresheet) => { [prop: string]: number }
}

export type JudgeTypeFn = (cEvtDef: CompetitionEvent) => JudgeType

export type CalcEntryFn = (cEvtDef: CompetitionEvent) => (scoresheets: Scoresheet[]) => { raw: { [prop: string]: number}, formatted: { [prop: string]: string } }

export interface FieldDefinition {
  schema: string
  name: string
  min?: number
  max?: number
  step?: number
}
