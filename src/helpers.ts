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

export function factorFormat (value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return ''
  else if (value === 1) return '±0 %'
  else if (value > 1) return `+${roundTo((value - 1) * 100, 0)} %`
  else return `-${roundTo((1 - value) * 100, 0)} %`
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
      if (typeof field.min === 'number' && tally[field.schema] < field.min) tally[field.schema] = field.min
      if (typeof field.max === 'number' && tally[field.schema] > field.max) tally[field.schema] = field.max
      if (typeof field.step === 'number') tally[field.schema] = roundToMultiple(tally[field.schema], field.step)
    }
  }

  if (allowedSchemas) {
    const extra = Object.keys(tally).filter(schema => !allowedSchemas.includes(schema))

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    for (const schema of extra) delete tally[schema]
  }

  return tally
}
