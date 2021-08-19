import { roundTo, calculateTally, formatFactor } from '../helpers'

import type { Ruleset, JudgeTypeFn, CalcEntryFn, FieldDefinition } from '.'
import type { CompetitionEvent, ScoreTally } from '../store/schema'

// pres
const Fp = 0.6
const FpM = Fp * 0.25
const FpE = Fp * 0.25
const FpF = Fp * 0.5

// deduc
const Fd = 0.025
const Fq = Fd
const SpeedDed = 10

// Diff
export function L (l: number): number {
  if (l === 0) return 0
  return roundTo(0.1 * Math.pow(1.8, l), 2)
}

export const ijruAverage = (scores: number[]): number => {
  // sort ascending
  scores.sort(function (a, b) {
    return a - b
  })

  if (scores.length >= 4) {
    scores.pop()
    scores.shift()

    const score = scores.reduce((a, b) => a + b)
    return score / scores.length
  } else if (scores.length === 3) {
    const closest = scores[1] - scores[0] <= scores[2] - scores[1] ? scores[1] + scores[0] : scores[2] + scores[1]
    return closest / 2
  } else if (scores.length === 2) {
    const score = scores.reduce((a, b) => a + b)
    return score / scores.length
  } else {
    return scores[0]
  }
}

// ======
// JUDGES
// ======
export const speedJudge: JudgeTypeFn = () => {
  const tallyFields: Readonly<FieldDefinition[]> = [{
    schema: 'step',
    name: 'Score',
    min: 0,
    step: 1
  }] as const
  return {
    id: 'S',
    name: 'Speed',
    tallyFields,
    calculateScoresheet: scsh => {
      const tally: ScoreTally<(typeof tallyFields)[number]['schema']> = calculateTally(scsh, tallyFields)
      return {
        a: tally.step ?? 0
      }
    }
  }
}

const falseSwitches: Record<CompetitionEvent, number> = {
  'e.ijru.sp.sr.srsr.4.4x30': 3,
  'e.ijru.sp.sr.srdr.2.2x30': 1,
  'e.ijru.sp.dd.ddsr.4.4x30': 3
}
export const speedHeadJudge: JudgeTypeFn = cEvtDef => {
  const tallyFields = [
    {
      schema: 'step',
      name: 'Score',
      min: 0,
      step: 1
    },
    {
      schema: 'falseStart',
      name: 'False Start',
      min: 0,
      max: 1,
      step: 1
    },
    ...(cEvtDef in falseSwitches
      ? [{
          schema: 'falseSwitch',
          name: 'False Switches',
          min: 0,
          max: falseSwitches[cEvtDef],
          step: 1
        }]
      : [])
  ] as const
  return {
    id: 'Shj',
    name: 'Speed Head Judge',
    tallyFields,
    calculateScoresheet: scsh => {
      const tally: ScoreTally<(typeof tallyFields)[number]['schema']> = calculateTally(scsh, tallyFields)
      return {
        a: tally.step ?? 0,
        m: ((tally.falseStart ?? 0) + (tally.falseSwitch ?? 0)) * SpeedDed
      }
    }
  }
}

export const routinePresentationJudge: JudgeTypeFn = () => {
  const tallyFields = [
    {
      schema: 'entertainmentPlus',
      name: 'Entertainment +',
      min: 0,
      step: 1
    },
    {
      schema: 'entertainmentCheck',
      name: 'Entertainment ✓',
      min: 0,
      step: 1
    },
    {
      schema: 'entertainmentMinus',
      name: 'Entertainment -',
      min: 0,
      step: 1
    },

    {
      schema: 'musicalityPlus',
      name: 'Musicality +',
      min: 0,
      step: 1
    },
    {
      schema: 'musicalityCheck',
      name: 'Musicality ✓',
      min: 0,
      step: 1
    },
    {
      schema: 'musicalityMinus',
      name: 'Musicality -',
      min: 0,
      step: 1
    }
  ] as const
  return {
    id: 'Pr',
    name: 'Routine Presentation',
    tallyFields,
    calculateScoresheet: scsh => {
      const tally: ScoreTally<(typeof tallyFields)[number]['schema']> = calculateTally(scsh)
      const enTop = (tally.entertainmentPlus ?? 0) - (tally.entertainmentMinus ?? 0)
      const enBottom = (tally.entertainmentPlus ?? 0) + (tally.entertainmentCheck ?? 0) + (tally.entertainmentMinus ?? 0)
      const enAvg = enTop / (enBottom || 1)

      const muTop = (tally.musicalityPlus ?? 0) - (tally.musicalityMinus ?? 0)
      const muBottom = (tally.musicalityPlus ?? 0) + (tally.musicalityCheck ?? 0) + (tally.musicalityMinus ?? 0)
      const muAvg = muTop / (muBottom || 1)

      return {
        aE: roundTo((enAvg * FpE), 6),
        aM: roundTo((muAvg * FpM), 6)
      }
    }
  }
}

export const athletePresentationJudge: JudgeTypeFn = () => {
  const tallyFields = [
    {
      name: 'Form and Execution +',
      schema: 'formExecutionPlus',
      min: 0,
      step: 1
    },
    {
      name: 'Form and Execution ✓',
      schema: 'formExecutionCheck',
      min: 0,
      step: 1
    },
    {
      name: 'Form and Execution -',
      schema: 'formExecutionMinus',
      min: 0,
      step: 1
    },

    {
      name: 'Misses',
      schema: 'miss',
      min: 0
    }
  ] as const
  return {
    id: 'Pa',
    name: 'Athlete Presentation',
    tallyFields,
    calculateScoresheet: scsh => {
      const tally: ScoreTally<(typeof tallyFields)[number]['schema']> = calculateTally(scsh)
      const top = (tally.formExecutionPlus ?? 0) - (tally.formExecutionMinus ?? 0)
      const bottom = (tally.formExecutionPlus ?? 0) + (tally.formExecutionCheck ?? 0) + (tally.formExecutionMinus ?? 0)
      const avg = top / (bottom || 1)

      return {
        m: roundTo(1 - ((tally.miss ?? 0) * Fd), 3),
        aF: roundTo(avg * FpF, 6)
      }
    }
  }
}

export const requiredElementsJudge: JudgeTypeFn = cEvtDef => {
  const isDD = cEvtDef.split('.')[3] === 'dd'
  const hasInteractions = parseInt(cEvtDef.split('.')[5], 10) > (cEvtDef.split('.')[3] === 'dd' ? 3 : 1)
  const tallyFields = [
    {
      schema: 'timeViolation',
      name: 'Time Violations',
      min: 0,
      max: 2,
      step: 1
    },
    {
      schema: 'spaceViolation',
      name: 'Space Violations',
      min: 0,
      step: 1
    },
    {
      schema: 'miss',
      name: 'Misses',
      min: 0,
      step: 1
    },

    {
      schema: 'rqGymnasticsPower',
      name: 'Amount of different Gymnastics and Power Skills',
      min: 0,
      max: 4,
      step: 1
    },
    ...(isDD
      ? [{
          schema: 'rqTurnerInvolvement',
          name: 'Amount of different Turner Involvement Skills',
          min: 0,
          max: 4,
          step: 1
        }]
      : [{
          schema: 'rqMultiples',
          name: 'Amount of different Multiples',
          min: 0,
          max: 4,
          step: 1
        }, {
          schema: 'rqWrapsReleases',
          name: 'Amount of different Wraps and Releases',
          min: 0,
          max: 4,
          step: 1
        }]),
    ...(hasInteractions
      ? [{
          schema: 'rqInteractions',
          name: 'Amount of different Interactions',
          min: 0,
          max: 4,
          step: 1
        }]
      : []),

    ...Array(6).fill(undefined).map((el, idx) => ({
      schema: `repL${idx + 3}` as const,
      name: `Repeated Skills Level ${idx + 3}`
    }))
  ] as const
  const levels = Object.fromEntries(Array(6).fill(undefined).map((el, idx) => [`repL${idx + 3}`, idx + 3] as const))
  const rqFields = tallyFields.filter(f => f.schema.startsWith('rq'))
  const repFields = tallyFields.filter(f => f.schema.startsWith('repL'))
  const max: number = rqFields.reduce((acc, f: FieldDefinition) => (acc + (f.max ?? 0)), 0)
  return {
    id: 'R',
    name: 'Required Elements',
    tallyFields,
    calculateScoresheet: scsh => {
      const tally: ScoreTally<(typeof tallyFields)[number]['schema']> = calculateTally(scsh, tallyFields)

      let score = rqFields.map(f => tally[f.schema] ?? 0).reduce((a, b) => a + b)
      score = score > max ? max : score
      const missing = max - score

      const diffResult = repFields.map(f => (tally[f.schema] ?? 0) * L(levels[f.schema])).reduce((a, b) => a + b)

      return {
        Q: roundTo(1 - (missing * Fq), 3),
        m: roundTo(1 - ((tally.miss ?? 0) * Fd), 3),
        v: roundTo(1 - (((tally.spaceViolation ?? 0) + (tally.timeViolation ?? 0)) * Fd), 3),
        U: roundTo(diffResult, 3)
      }
    }
  }
}

export const difficultyJudge: JudgeTypeFn = () => {
  const tallyFields = [
    {
      name: 'Level 0.5',
      schema: 'diffL0.5',
      min: 0,
      step: 1
    },
    ...Array(8).fill(undefined).map((el, idx) => ({
      name: `Level ${idx + 1}`,
      schema: `diffL${idx + 1}` as const,
      min: 0,
      step: 1,
      level: idx + 1
    }))
  ] as const
  const levels: { [prop: string]: number } = Object.fromEntries(Array(8).fill(undefined).map((el, idx) => [`diffL${idx + 1}`, idx + 1] as const))
  levels['diffL0.5'] = 0.5
  return {
    id: 'D',
    name: 'Difficulty',
    tallyFields,
    calculateScoresheet: scsh => {
      const tally: ScoreTally<(typeof tallyFields)[number]['schema']> = calculateTally(scsh, tallyFields)
      const D = tallyFields.map(f => (tally[f.schema] ?? 0) * L(levels[f.schema])).reduce((a, b) => a + b)
      return {
        D: roundTo(D, 2)
      }
    }
  }
}

// =======
// ENTRIES
// =======
export const calculateSpeedEntry: CalcEntryFn = cEvtDef => rawScsh => {
  const judgeTypes = Object.fromEntries(ruleset.competitionEvents[cEvtDef]?.judges.map(j => [j.id, j]) ?? [])
  // only take the newest scoresheet per judge
  const scoresheets = rawScsh
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((scsh, idx, arr) =>
      scsh.competitionEvent === cEvtDef &&
        idx === arr.findIndex(s => s.judgeId === scsh.judgeId && s.judgeType === scsh.judgeType)
    )

  console.log(scoresheets)

  const results = scoresheets.map(scsh => judgeTypes[scsh.judgeType].calculateScoresheet(scsh))

  // Calc a
  const as = results.map(res => res.a).filter(a => typeof a === 'number')
  const a = ijruAverage(as) ?? 0

  // Calc m
  const ms = results.map(res => res.m).filter(m => typeof m === 'number')
  const m = ijruAverage(ms) ?? 0

  return {
    raw: {
      a,
      m,
      R: roundTo(a - m, 2)
    },
    formatted: {
      a: `${a}`,
      m: `${m}`,
      R: `${roundTo(a - m, 2)}`
    }
  }
}

const calculateFreestyleEntry: CalcEntryFn = cEvtDef => rawScsh => {
  const judgeTypes = Object.fromEntries(ruleset.competitionEvents[cEvtDef]?.judges.map(j => [j.id, j]) ?? [])
  // only take the newest scoresheet per judge
  const scoresheets = rawScsh
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((scsh, idx, arr) =>
      scsh.competitionEvent === cEvtDef &&
        idx === arr.findIndex(s => s.judgeId === scsh.judgeId && s.judgeType === scsh.judgeType)
    )

  const results = scoresheets.map(scsh => judgeTypes[scsh.judgeType].calculateScoresheet(scsh))
  const raw: { [prop: string]: number } = {}
  const formatted: { [prop: string]: string } = {}

  for (const scoreType of ['D', 'aF', 'aE', 'aM', 'm', 'v', 'Q', 'U'] as const) {
    const scores = results.map(el => el[scoreType]).filter(el => typeof el === 'number')
    if (['m', 'v'].includes(scoreType)) raw[scoreType] = roundTo(ijruAverage(scores), 4)
    else if (['aF', 'aE', 'aM'].includes(scoreType)) raw[scoreType] = roundTo(ijruAverage(scores), 6)
    else raw[scoreType] = roundTo(ijruAverage(scores), 2) // D, Q, U

    if (typeof raw[scoreType] !== 'number' || isNaN(Number(raw[scoreType]))) raw[scoreType] = (['D', 'U', 'aF', 'aE', 'aM'].includes(scoreType) ? 0 : 1)
  }

  raw.M = roundTo(-(1 - raw.m - raw.v), 2) // the minus is because they're already prepped to 1- and that needs to be reversed

  raw.P = roundTo(1 + (raw.aE + raw.aF + raw.aM), 2)

  raw.R = roundTo((raw.D - raw.U) * raw.P * raw.M * raw.Q, 2)
  raw.R = raw.R < 0 ? 0 : raw.R

  // Format
  formatted.D = `${raw.D}`
  formatted.U = `-${raw.U}`
  formatted.P = formatFactor(raw.P)
  formatted.Q = formatFactor(raw.Q)
  formatted.M = formatFactor(raw.M)
  formatted.R = `${raw.R}`
  return { raw, formatted }
}

const speedJudges = [speedJudge, speedHeadJudge]
const freestyleJudges = [routinePresentationJudge, athletePresentationJudge, requiredElementsJudge, difficultyJudge]

const ruleset: Ruleset = {
  id: 'ijru@2.0.0',
  name: 'IJRU v2.0.0',
  competitionEvents: {
    'e.ijru.sp.sr.srss.1.30': {
      name: 'Single Rope Speed Sprint',
      judges: speedJudges.map(j => j('e.ijru.sp.sr.srss.1.30')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.sr.srss.1.30')
    },
    'e.ijru.sp.sr.srse.1.180': {
      name: 'Single Rope Speed Endurance',
      judges: speedJudges.map(j => j('e.ijru.sp.sr.srse.1.180')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.sr.srse.1.180')
    },
    'e.ijru.sp.sr.srtu.1.0': {
      name: 'Single Rope Triple Unders',
      judges: speedJudges.map(j => j('e.ijru.sp.sr.srtu.1.0')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.sr.srtu.1.0')
    },
    'e.ijru.fs.sr.srif.1.75': {
      name: 'Single Rope Individual Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.sr.srif.1.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.sr.srif.1.75')
    },

    'e.ijru.sp.sr.srsr.4.4x30': {
      name: 'Single Rope Speed Relay',
      judges: speedJudges.map(j => j('e.ijru.sp.sr.srsr.4.4x30')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.sr.srsr.4.4x30')
    },
    'e.ijru.sp.sr.srdr.2.2x30': {
      name: 'Single Rope Double Unders Relay',
      judges: speedJudges.map(j => j('e.ijru.sp.sr.srdr.2.2x30')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.sr.srdr.2.2x30')
    },
    'e.ijru.sp.dd.ddsr.4.4x30': {
      name: 'Double Dutch Speed Relay',
      judges: speedJudges.map(j => j('e.ijru.sp.dd.ddsr.4.4x30')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.dd.ddsr.4.4x30')
    },
    'e.ijru.sp.dd.ddss.3.60': {
      name: 'Double Dutch Speed Sprint',
      judges: speedJudges.map(j => j('e.ijru.sp.dd.ddss.3.60')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.dd.ddss.3.60')
    },

    'e.ijru.fs.sr.srpf.2.75': {
      name: 'Single Rope Pair Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.sr.srpf.2.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.sr.srpf.2.75')
    },
    'e.ijru.fs.sr.srtf.4.75': {
      name: 'Single Rope Team Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.sr.srtf.4.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.sr.srtf.4.75')
    },
    'e.ijru.fs.dd.ddsf.3.75': {
      name: 'Double Dutch Single Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.dd.ddsf.3.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.dd.ddsf.3.75')
    },
    'e.ijru.fs.dd.ddpf.4.75': {
      name: 'Double Dutch Pair Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.dd.ddpf.4.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.dd.ddpf.4.75')
    },
    'e.ijru.fs.dd.ddtf.5.90': {
      name: 'Double Dutch Triad Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.dd.ddtf.5.90')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.dd.ddtf.5.90')
    },
    'e.ijru.fs.wh.whpf.2.75': {
      name: 'Wheel Pair Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.wh.whpf.2.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.wh.whpf.2.75')
    }
    // 'e.ijru.fs.ts.sctf.8.300': { name: 'Show Freestyle' }
  }
}

export default ruleset
