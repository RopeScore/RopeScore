import { Entry, Judge, MarkScoresheet, Participant, Scoresheet, TallyScoresheet } from '../graphql/generated'
import { CompetitionEvent } from '../helpers'
import IJRU_2_0_0 from './ijru@2.0.0'
import IJRU_3_0_0 from './ijru@3.0.0'
import SvGF_RH_20 from './svgf-rh@2020'
import SvGF_Par_2_0_0 from './svgf-par@2.0.0'

// export const rulesetIds = ['ijru@2.0.0', 'ijru@1.1.0', 'svgf-rh@2020', 'svgf-vh@2020', 'svgf-vh@2018', 'fisac@2017-2018'] as const
export type RulesetId = keyof typeof rulesets

export const rulesets = {
  'ijru@2.0.0': IJRU_2_0_0,
  'ijru@3.0.0': IJRU_3_0_0,
  'svgf-rh@2020': SvGF_RH_20,
  'svgf-par@2.0.0': SvGF_Par_2_0_0
}

export interface Ruleset {
  id: string
  name: string
  competitionEvents: Partial<Record<CompetitionEvent, CompetitionEventRulesDefinition>>
  overalls: Partial<Record<CompetitionEvent, OverallRulesDefinition>>
}

export interface CompetitionEventRulesDefinition {
  name: string
  judges: JudgeType[]
  previewTable: TableHeader[]
  resultTable: TableDefinition
  calculateEntry: ReturnType<CalcEntryFn>
  rankEntries: ReturnType<RankEntriesFn>
}

export interface OverallRulesDefinition {
  name: string
  competitionEvents: Array<[CompetitionEvent, { rankMultiplier?: number, resultMultiplier?: number, normalisationMultiplier?: number }]>
  resultTable: TableDefinition
  rankOverall: ReturnType<RankOverallFn>
}

export function isOverallRulesDefinition (x: any): x is OverallRulesDefinition { return 'rankOverall' in x }

export interface JudgeType {
  id: string
  name: string
  tallyFields: Readonly<FieldDefinition[]>
  calculateScoresheet: (scoresheet: Pick<TallyScoresheet, 'tally'> | Pick<MarkScoresheet, 'marks'>) => { [prop: string]: number }
}

export type JudgeTypeFn = (cEvtDef: CompetitionEvent) => JudgeType

export type CalcEntryFn = (cEvtDef: CompetitionEvent) => (metadata: { entryId: Entry['id'], participantId: Participant['id'] }, scoresheets: Array<(Pick<TallyScoresheet, 'tally'> | Pick<MarkScoresheet, 'marks'>) & Pick<Scoresheet, 'createdAt' | 'competitionEventId' | 'judgeType'> & { judge: Pick<Judge, 'id'> }>) => EntryResult | undefined

export type RankEntriesFn = (cEvtDef: CompetitionEvent) => (results: EntryResult[]) => EntryResult[]

export type RankOverallFn = (cEvtDef: CompetitionEvent) => (results: EntryResult[]) => OverallResult[]

export interface FieldDefinition {
  schema: string
  name: string
  min?: number
  max?: number
  step?: number
}

export interface EntryResult {
  entryId: Entry['id']
  participantId: Participant['id']
  competitionEvent: CompetitionEvent
  result: { [prop: string]: number }
}

export interface OverallResult {
  participantId: Participant['id']
  competitionEvent: CompetitionEvent
  result: { [prop: string]: number }
  componentResults: Record<CompetitionEvent, EntryResult>
}
export function isOverallResult (x: any): x is OverallResult { return !!x && 'componentResults' in x }

export interface TableHeader {
  text: string
  key: string
  formatter?: (n: number) => string
  color?: 'red' | 'green' | 'gray'
  component?: CompetitionEvent
}

export interface TableHeaderGroup {
  text: string
  key: string
  color?: 'red' | 'green' | 'gray'
  rowspan?: number
  colspan?: number
}

export interface TableDefinition {
  groups?: TableHeaderGroup[][]
  headers: TableHeader[]
}
