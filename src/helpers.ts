import { parseCompetitionEventDefinition } from '@ropescore/rulesets'
import { ResultVisibilityLevel, type Athlete, type MarkScoresheet, type Participant, type TallyScoresheet, type Team, type ScoresheetBaseFragment } from './graphql/generated'
import type { DataListItem } from '@ropescore/components'

const locales = ['en-SE', 'en-AU', 'en-GB']

export type CompetitionEvent = `e.${string}.${'fs' | 'sp' | 'oa'}.${'sr' | 'dd' | 'wh' | 'ts' | 'xd'}.${string}.${number}.${`${number}x${number}` | number}@${string}`

export function isTeam (participant: Pick<Participant, '__typename'>): participant is Team {
  return participant.__typename === 'Team'
}

export function isAthlete (participant: Pick<Participant, '__typename'>): participant is Athlete {
  return participant.__typename === 'Athlete'
}

/**
 * Generates a comma separated list of members of a team given a Participant
 */
export function memberNames (participant?: Partial<Participant>): string {
  if (participant?.__typename !== 'Team') return ''
  return participant.members?.join(', ') ?? ''
}

/**
 * Removes characters that are invalid in filenames
 */
export function nameCleaner (str: string): string {
  return str.replace(/[#%&{}\\<>*?/$!'":@|\s]/gi, '_')
}

/**
 * Gets the 4-character abbreviation of a competition event definition
 */
export function getAbbr (cEvtDef: CompetitionEvent) {
  return parseCompetitionEventDefinition(cEvtDef).eventAbbr
}

/**
 * Returns whether a competition event definition identifies an overall
 */
export function isOverall (cEvtDef: CompetitionEvent) {
  return parseCompetitionEventDefinition(cEvtDef).type === 'oa'
}

/**
 * Returns whether a competition event definition identified a speed event
 */
export function isSpeedEvent (cEvtDef: CompetitionEvent) {
  return parseCompetitionEventDefinition(cEvtDef).type === 'sp'
}

const dateFormatter = Intl.DateTimeFormat(locales, {
  dateStyle: 'medium',
  timeStyle: 'medium',
  hour12: false
})
/**
 * Formats a date and time into a human readable format, in the en-SE locale
 * this results in something like 22 Aug 2021, 21:08:27
 */
export function formatDate (timestamp: number | Date): string {
  return dateFormatter.format(timestamp)
}

const shortDateFormatter = Intl.DateTimeFormat(locales, {
  dateStyle: 'short'
})
/**
 * Formats a date, in the en-SE locale this results in YYYY-MM-DD
 */
export function formatShortDate (value: number | Date): string {
  return shortDateFormatter.format(value)
}

export function isTallyScoresheet (scoresheet: any): scoresheet is TallyScoresheet {
  return typeof scoresheet === 'object' && 'tally' in scoresheet
}

export function isMarkScoresheet (scoresheet: any): scoresheet is MarkScoresheet {
  return typeof scoresheet === 'object' && 'marks' in scoresheet
}

export const resultVisibilitiesDataList: DataListItem[] = [
  { text: 'Private', value: ResultVisibilityLevel.Private },
  { text: 'Latest public version', value: ResultVisibilityLevel.PublicVersions },
  { text: 'Live (as soon as entries are locked)', value: ResultVisibilityLevel.Live }
]

export function filterLatestScoresheets <T extends Pick<ScoresheetBaseFragment, 'createdAt' | 'excludedAt' | 'judgeType' | 'judge'>> (scoresheets: T[]): T[] {
  return [...scoresheets]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter(scsh => scsh.excludedAt == null)
    .filter((scsh, idx, arr) =>
      idx === arr.findIndex(s => s.judge.id === scsh.judge.id && s.judgeType === scsh.judgeType)
    )
}
