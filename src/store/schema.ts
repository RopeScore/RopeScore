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
export function isPerson (x: any): x is Person { return !('members' in x) }

export interface TeamPerson {
  readonly id: number
  name: string
  ijruId?: string
}

export interface Team extends TPBase {
  members: TeamPerson[]
}
export function isTeam (x: any): x is Team { return 'members' in x }

export type Participant = Team | Person

export interface Entry {
  readonly id: string
  readonly categoryId: Category['id']
  readonly participantId: Participant['id']
  readonly competitionEvent: CompetitionEvent

  didNotSkipAt?: number | null
  lockedAt?: number | null
}

interface Mark {
  timestamp: number
  sequence: number
  schema: string
  [prop: string]: any
}

export interface ScoresheetBase {
  readonly id: string
  readonly judgeId: Judge['id']
  readonly entryId: Entry['id']
  readonly judgeType: string
}

export interface RemoteScoresheet extends ScoresheetBase {
  readonly deviceId: Device['id']

  createdAt: number
  updatedAt: number
  submittedAt: number
  openedAt: number
  completedAt: number

  heat: number

  options?: { [prop: string]: any }

  marks: Mark[]
}
export function isRemoteScoresheet (x: any): x is TallyScoresheet { return 'deviceId' in x }

export interface TallyScoresheet extends ScoresheetBase {
  tally: Record<string, number>
}
export function isTallyScoresheet (x: any): x is TallyScoresheet { return 'tally' in x }

export type Scoresheet = TallyScoresheet | RemoteScoresheet
