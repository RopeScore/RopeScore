import { type Athlete, type Judge, type MarkScoresheet, type Participant, type ScoresheetBaseFragment, type TallyScoresheet, type Team } from './graphql/generated'
import type { FieldDefinition, EntryResult } from './rules'

const locales = ['en-SE', 'en-AU', 'en-GB']

export type CompetitionEvent = `e.${string}.${'fs' | 'sp' | 'oa'}.${'sr' | 'dd' | 'wh' | 'ts' | 'xd'}.${string}.${number}.${`${number}x${number}` | number}`

export interface GenericMark {
  timestamp: number
  sequence: number
  schema: string
  value?: number
  [prop: string]: any
}
export function isGenericMark (x: any): x is GenericMark { return x && typeof x.schema === 'string' && typeof x.sequence === 'number' }
export function isClearMark (x: any): x is GenericMark { return x && typeof x.schema === 'string' && x.schema === 'clear' }

export interface UndoMark {
  timestamp: number
  sequence: number
  schema: 'undo'
  target: number
}
export function isUndoMark (x: any): x is UndoMark { return x && x.schema === 'undo' }

export type Mark = GenericMark | UndoMark

export type ScoreTally<T extends string = string> = Record<T, number>

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
  return cEvtDef.split('.')[4]
}

/**
 * Returns whether a competition event definition identified an overall
 */
export function isOverall (cEvtDef: CompetitionEvent) {
  return cEvtDef.split('.')[2] === 'oa'
}

/**
 * prepends a number with 0 until it is the specified length
 */
export function leftFillNum (num: number, width: number): string {
  return num
    .toString()
    .padStart(width, '0')
}

/**
 * Rounds a number to the closest multiple of the specified multiple.
 *
 * For example if the multiple is 0.5 and the input is 1.25 the number will be
 * rounded to 1.5
 */
export function roundToMultiple (num: number, multiple: number): number {
  const resto = num % multiple
  if (resto <= multiple / 2) {
    return num - resto
  } else {
    return num + multiple - resto
  }
}

/**
 * Rounds a number to the specified number of digits
 */
export function roundTo (n: number, digits: number = 0): number {
  const multiplicator = Math.pow(10, digits)
  n = n * multiplicator
  const test = (Math.round(n) / multiplicator)
  if (isNaN(test)) return NaN
  return test
}

/**
 * Returns a function that will round a number to the number of digits passed
 * to the outer function. This also casts the result to a string
 *
 * Useful for creating formatters for table headers
 */
export function roundToCurry (digits: number = 0) {
  return (n: number) => roundTo(n, digits).toFixed(digits)
}

/**
 * Clamps a number to within the specified max and min,
 * if a step size is provided, the number will be rounded to the closest
 * multiple of this step size.
 */
export function clampNumber (n: number, { min, max, step }: { min?: number, max?: number, step?: number }) {
  let num = n
  if (typeof min === 'number' && num < min) num = min
  if (typeof max === 'number' && num > max) num = max
  if (typeof step === 'number') num = roundToMultiple(num, step)
  return num
}

/**
 * Formats a multiplication factor into a percentage adjustment string.
 * For example:
 * - a multiplication factor of 1    (100%) results in an adjustment of  ±0 %
 * - a multiplication factor of 1.35 (135%) results in an adjustment of +35 %
 * - a multiplication factor of 0.77 ( 77%) results in an adjustment of -23 %
 */
export function formatFactor (value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return ''
  else if (value === 1) return '±0 %'
  else if (value > 1) return `+${roundTo((value - 1) * 100, 0)} %`
  else return `-${roundTo((1 - value) * 100, 0)} %`
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

/**
 * Takes a scoresheet and returns a tally
 *
 * if a MarkScoresheet is provided the marks array will be tallied taking undos
 * into account.
 *
 * Each value of the tally will also be clamped to the specified max, min and
 * step size for that field schema.
 */
export function calculateTally (scoresheet: Pick<TallyScoresheet, 'tally'> | Pick<MarkScoresheet, 'marks'>, tallyFields?: Readonly<FieldDefinition[]>): ScoreTally {
  let tally: ScoreTally = isTallyScoresheet(scoresheet) ? { ...(scoresheet.tally ?? {}) } : {}
  const allowedSchemas = tallyFields?.map(f => f.schema)

  if (isMarkScoresheet(scoresheet)) {
    for (const mark of scoresheet.marks) {
      if (isUndoMark(mark)) {
        const target = scoresheet.marks[mark.target]
        if (!target || isUndoMark(target)) continue
        tally[target.schema] = (tally[target.schema] ?? 0) - (target.value ?? 1)
      } else if (isClearMark(mark)) {
        tally = {}
      } else if (isGenericMark(mark)) {
        tally[mark.schema] = (tally[mark.schema] ?? 0) + (mark.value ?? 1)
      }
    }
  }

  if (tallyFields) {
    for (const field of tallyFields) {
      if (typeof tally[field.schema] !== 'number') continue
      tally[field.schema] = clampNumber(tally[field.schema], field)
    }
  }

  if (allowedSchemas) {
    const extra = Object.keys(tally).filter(schema => !allowedSchemas.includes(schema))

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    for (const schema of extra) delete tally[schema]
  }

  return tally
}

/**
 * Filters an array of scoresheets returning only scoresheets for the specified
 * competition event and only the newest scoresheet for each judge assignment.
 *
 * For example if J001 is judge type S and has submitted a MarkScoresheet at
 * timestamp 1 and a TallyScoresheet at timestamp 5, only the TallyScoresheet
 * will be left
 */
export function filterLatestScoresheets<T extends Pick<ScoresheetBaseFragment, 'createdAt' | 'excludedAt' | 'competitionEventId' | 'judgeType'> & { judge: Pick<Judge, 'id'> }> (scoresheets: T[], cEvtDef: CompetitionEvent): T[] {
  return [...scoresheets]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter(scsh => scsh.excludedAt == null)
    .filter((scsh, idx, arr) =>
      scsh.competitionEventId === cEvtDef &&
      idx === arr.findIndex(s => s.judge.id === scsh.judge.id && s.judgeType === scsh.judgeType)
    )
}

/**
 * Filters an array of all results into only results of component entries where
 * that participant has results for every competition event of competitionEvents
 */
export function filterParticipatingInAll (results: EntryResult[], competitionEvents: CompetitionEvent[]) {
  const participants = [...new Set(results.map(res => res.participantId))]
    .filter(pId => competitionEvents.every(cEvt =>
      results.find(res => res.participantId === pId && res.competitionEvent === cEvt)
    ))

  return results.filter(res =>
    participants.includes(res.participantId) &&
    competitionEvents.includes(res.competitionEvent)
  )
}

export type DataListItem = string | number | { value: string | number, text: string }
