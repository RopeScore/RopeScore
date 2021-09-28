import { BatteryStatus } from '../graphql/generated'
import { RulesetId } from '../rules'

export type CompetitionEvent = `e.${string}.${'fs' | 'sp' | 'oa'}.${'sr' | 'dd' | 'wh' | 'ts' | 'xd'}.${string}.${number}.${`${number}x${number}` | number}`

export interface Group {
  readonly id: string
  name: string
  remote: boolean
  completedAt?: number | null
}

export interface Category {
  readonly id: string
  readonly groupId: Group['id']

  name: string
  ruleset: RulesetId
  type: 'team' | 'individual'
  competitionEvents: CompetitionEvent[]

  print: PrintConfig
}

export interface PrintConfig {
  logo?: string
  exclude: CompetitionEvent[]
  zoom: Record<CompetitionEvent, number>
}

export interface Judge {
  readonly id: number
  readonly groupId: Group['id']

  name: string
  ijruId?: string
}

export interface JudgeAssignment {
  readonly id: number
  readonly categoryId: Category['id']
  readonly judgeId: Judge['id']

  judgeType: string
  competitionEvent: CompetitionEvent
}

export interface Device {
  readonly id: string
  readonly groupId: Group['id']

  battery?: Omit<BatteryStatus, '__typename'>
}

interface TPBase {
  readonly id: number
  readonly categoryId: Category['id']

  name: string
  club: string
  country: string
}

export interface Person extends TPBase {
  ijruId?: string
}
export function isPerson (x: any): x is Person { return !!x && !('members' in x) }

export interface TeamPerson {
  readonly id: number
  name: string
  ijruId?: string
}

export interface Team extends TPBase {
  members: TeamPerson[]
}
export function isTeam (x: any): x is Team { return !!x && 'members' in x }

export type Participant = Team | Person

export interface Entry {
  readonly id: string
  readonly categoryId: Category['id']
  readonly participantId: Participant['id']
  readonly competitionEvent: CompetitionEvent

  didNotSkipAt?: number | null
  lockedAt?: number | null

  heat?: number
}

export interface GenericMark {
  timestamp: number
  sequence: number
  schema: string
  value?: number
  [prop: string]: any
}

export interface UndoMark {
  timestamp: number
  sequence: number
  schema: 'undo'
  target: number
}
export function isUndoMark (x: any): x is UndoMark { return x && x.schema === 'undo' }

export type Mark = GenericMark | UndoMark

export type ScoreTally<T extends string = string> = Record<T, number>

export interface ScoresheetBase {
  readonly id: string
  readonly judgeId: Judge['id']
  readonly entryId: Entry['id']
  readonly judgeType: string
  readonly competitionEvent: CompetitionEvent

  createdAt: number
  updatedAt: number
}

export interface MarkScoresheet extends ScoresheetBase {
  readonly deviceId: Device['id']

  openedAt?: number[]
  completedAt?: number
  submittedAt?: number

  options?: { [prop: string]: any }

  marks: Mark[]
}
export function isMarkScoresheet (x: any): x is MarkScoresheet { return !!x && 'deviceId' in x }

export interface TallyScoresheet extends ScoresheetBase {
  tally: ScoreTally
}
export function isTallyScoresheet (x: any): x is TallyScoresheet { return !!x && !('deviceId' in x) }

export type Scoresheet = TallyScoresheet | MarkScoresheet
