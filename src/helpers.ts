import { isTeam, isTallyScoresheet, isMarkScoresheet } from './store/schema'

import type { Participant, CompetitionEvent, ScoreTally, Scoresheet } from './store/schema'
import type { FieldDefinition } from './rules'

export function memberNames (participant?: Participant): string {
  if (!isTeam(participant)) return ''
  return participant.members?.map(psn => psn.name + (psn.ijruId ? ` (${psn.ijruId})` : '')).join(', ') ?? ''
}

export function getAbbr (cEvtDef: CompetitionEvent) {
  return cEvtDef.split('.')[4]
}

export function leftFillNum (num: number, width: number): string {
  return num
    .toString()
    .padStart(width, '0')
}

export function roundToMultiple (num: number, multiple: number): number {
  const resto = num % multiple
  if (resto <= multiple / 2) {
    return num - resto
  } else {
    return num + multiple - resto
  }
}

export function roundTo (n: number, digits: number = 0): number {
  const multiplicator = Math.pow(10, digits)
  n = n * multiplicator
  const test = (Math.round(n) / multiplicator)
  if (isNaN(test)) return NaN
  return test
}

export function clampNumber (n: number, { min, max, step }: { min?: number, max?: number, step?: number }) {
  let num = n
  if (typeof min === 'number' && num < min) num = min
  if (typeof max === 'number' && num > max) num = max
  if (typeof step === 'number') num = roundToMultiple(num, step)
  return num
}

export function formatFactor (value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return ''
  else if (value === 1) return '±0 %'
  else if (value > 1) return `+${roundTo((value - 1) * 100, 0)} %`
  else return `-${roundTo((1 - value) * 100, 0)} %`
}

const dateFormatter = Intl.DateTimeFormat(['en-SE', 'en-AU', 'en-GB'], {
  dateStyle: 'medium',
  timeStyle: 'medium',
  hour12: false
})
export function formatDate (timestamp: number): string {
  return dateFormatter.format(timestamp)
}

export function calculateTally (scoresheet: Scoresheet, tallyFields?: Readonly<FieldDefinition[]>): ScoreTally {
  const tally: ScoreTally = isTallyScoresheet(scoresheet) ? scoresheet.tally : {}
  const allowedSchemas = tallyFields?.map(f => f.schema)

  if (isMarkScoresheet(scoresheet)) {
    for (const mark of scoresheet.marks) {
      if (mark.schema === 'undo') {
        const target = scoresheet.marks[mark.target]
        if (!target || target.schema === 'undo') continue
        tally[target.schema] = (tally[target.schema] ?? 0) - 1
      } else {
        tally[mark.schema] = (tally[mark.schema] ?? 0) + 1
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
