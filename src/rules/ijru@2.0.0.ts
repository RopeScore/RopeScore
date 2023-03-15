import type {
  CalcEntryFn, FieldDefinition, JudgeTypeFn, RankEntriesFn,
  RankOverallFn, Ruleset, TableHeader, TableHeaderGroup, EntryResult
} from '.'
import {
  calculateTally, filterLatestScoresheets, formatFactor, roundTo,
  roundToCurry, filterParticipatingInAll, ScoreTally, CompetitionEvent
} from '../helpers'

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
      step: 1
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
export const calculateSpeedEntry: CalcEntryFn = cEvtDef => (meta, rawScsh) => {
  const judgeTypes = Object.fromEntries(ruleset.competitionEvents[cEvtDef]?.judges.map(j => [j.id, j]) ?? [])
  // only take the newest scoresheet per judge
  const scoresheets = filterLatestScoresheets(rawScsh, cEvtDef)

  if (!scoresheets.length) return

  const results = scoresheets.map(scsh => judgeTypes[scsh.judgeType].calculateScoresheet(scsh))

  // Calc a
  const as = results.map(res => res.a).filter(a => typeof a === 'number')
  const a = ijruAverage(as) ?? 0

  // Calc m
  const ms = results.map(res => res.m).filter(m => typeof m === 'number')
  const m = ijruAverage(ms) ?? 0

  // calc withinThree
  const minDiff = Math.min(...results
    .map(res => res.a)
    .sort((a, b) => a - b)
    .flatMap((res, idx, arr) => arr[idx + 1] - res)
    .filter(n => !Number.isNaN(n)))
  const withinThree = minDiff <= 3 ? 1 : 0

  return {
    entryId: meta.entryId,
    participantId: meta.participantId,
    competitionEvent: cEvtDef,
    result: {
      a,
      m,
      R: roundTo(a - m, 2),

      withinThree
    }
  }
}

export const calculateFreestyleEntry: CalcEntryFn = cEvtDef => (meta, rawScsh) => {
  const judgeTypes = Object.fromEntries(ruleset.competitionEvents[cEvtDef]?.judges.map(j => [j.id, j]) ?? [])
  // only take the newest scoresheet per judge
  const scoresheets = filterLatestScoresheets(rawScsh, cEvtDef)

  if (!scoresheets.length) return

  const results = scoresheets.map(scsh => judgeTypes[scsh.judgeType].calculateScoresheet(scsh))
  const raw: { [prop: string]: number } = {}

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

  return {
    entryId: meta.entryId,
    participantId: meta.participantId,
    competitionEvent: cEvtDef,
    result: raw
  }
}

// =======
// RANKING
// =======
export const rankFreestyleEntries: RankEntriesFn = cEvtDef => res => {
  let results = [...res]
  // const tiePriority = ['R', 'M', 'Q', 'P', 'U', 'D'] as const
  results.sort(function (a, b) {
    if (a.result.R !== b.result.R) return (b.result.R ?? 0) - (a.result.R ?? 0) // descending 100 wins over 50
    if (a.result.M !== b.result.M) return (b.result.M ?? 1) - (a.result.M ?? 1) // descending *1 wins over *.9
    if (a.result.Q !== b.result.Q) return (b.result.Q ?? 1) - (a.result.Q ?? 1) // descending *1 wins over *.9
    if (a.result.P !== b.result.P) return (b.result.P ?? 1) - (a.result.P ?? 1) // descending 1.35 wins over 0.95
    if (a.result.U !== b.result.U) return (a.result.U ?? 0) - (b.result.U ?? 0) // ascending 0 wins over 5
    if (a.result.D !== b.result.D) return (b.result.D ?? 0) - (a.result.D ?? 0) // descending 100 wins over 50
    return 0
  })

  const high = results.length > 0 ? results[0].result.R ?? 0 : 0
  const low = results.length > 1 ? results[results.length - 1].result.R ?? 0 : 0

  results = results.map((el, idx, arr) => ({
    ...el,
    result: {
      ...el.result,
      S: arr.findIndex(score =>
        score.result.R === el.result.R &&
        score.result.M === el.result.M &&
        score.result.Q === el.result.Q &&
        score.result.P === el.result.P &&
        score.result.U === el.result.U &&
        score.result.D === el.result.D
      ) + 1,
      N: roundTo((((100 - 1) * ((el.result.R ?? 0) - low)) / ((high - low) !== 0 ? high - low : 1)) + 1, 2)
    }
  }))

  return results
}

export const rankSpeedEntries: RankEntriesFn = cEvtDef => res => {
  let results = [...res]
  results.sort(function (a, b) {
    return (b.result.R ?? 0) - (a.result.R ?? 0) // sort descending
  })

  const high = results.length > 0 ? results[0].result.R ?? 0 : 0
  const low = results.length > 1 ? results[results.length - 1].result.R ?? 0 : 0

  results = results.map((el, _, arr) => ({
    ...el,
    result: {
      ...el.result,
      S: arr.findIndex(obj => obj.result.R === el.result.R) + 1,
      N: roundTo((((100 - 1) * ((el.result.R ?? 0) - low)) / ((high - low !== 0) ? high - low : 1)) + 1, 2)
    }
  }))

  return results
}

export const rankOverall: RankOverallFn = oEvtDef => res => {
  const overallObj = ruleset.overalls[oEvtDef]
  if (!overallObj) throw new TypeError('Invalid Overall Event Definition provided')
  const components: Partial<Record<CompetitionEvent, EntryResult[]>> = {}

  const results = filterParticipatingInAll(res, overallObj.competitionEvents.map(([cEvtDef]) => cEvtDef))
  const participantIds = [...new Set(results.map(r => r.participantId))]

  for (const [cEvtDef] of overallObj.competitionEvents) {
    const eventObj = ruleset.competitionEvents[cEvtDef]
    if (!eventObj) {
      console.warn('Component event', cEvtDef, 'for overall', oEvtDef, 'not found')
      continue
    }
    const ranked = eventObj.rankEntries(results.filter(result => result.competitionEvent === cEvtDef))

    components[cEvtDef] = ranked
  }

  const ranked = participantIds.map(participantId => {
    const cRes = overallObj.competitionEvents
      .map(([cEvt]) => components[cEvt]?.find(r => r.participantId === participantId))
      .filter(r => !!r) as EntryResult[]

    const R = roundTo(cRes.reduce((acc, curr) =>
      acc + (
        (curr.result.R ?? 0) *
        (overallObj.competitionEvents.find(([cEvt]) => cEvt === curr.competitionEvent)?.[1].resultMultiplier ?? 1)
      )
    , 0), 4)
    const T = cRes.reduce((acc, curr) =>
      acc + (
        (curr.result.S ?? 0) *
        (overallObj.competitionEvents.find(([cEvt]) => cEvt === curr.competitionEvent)?.[1].rankMultiplier ?? 1)
      )
    , 0)
    const B = roundTo(cRes.reduce((acc, curr) =>
      acc + (
        (curr.result.N ?? 0) *
        (overallObj.competitionEvents.find(([cEvt]) => cEvt === curr.competitionEvent)?.[1].normalisationMultiplier ?? 1)
      )
    , 0), 2)

    return {
      participantId,
      competitionEvent: oEvtDef,
      result: { R, T, B, S: 0 },
      componentResults: Object.fromEntries(cRes.map(r => [r.competitionEvent, r]))
    }
  })

  ranked.sort((a, b) => {
    if (a.result.T !== b.result.T) return a.result.T - b.result.T
    return b.result.B - a.result.B
  })

  for (let idx = 0; idx < ranked.length; idx++) {
    ranked[idx].result.S = ranked.findIndex(obj => obj.result.B === ranked[idx].result.B) + 1
  }

  return ranked
}

// ======
// TABLES
// ======
export const speedPreviewTableHeaders: TableHeader[] = [
  { text: 'Steps (a)', key: 'a' },
  { text: 'Deduc (m)', key: 'm' },
  { text: 'Result (R)', key: 'R' },

  { text: 'Reskip Allowed', key: 'withinThree', formatter: (n) => n === 1 ? 'No' : 'Yes' }
]

export const freestylePreviewTableHeaders: TableHeader[] = [
  { text: 'Diff (D)', key: 'D', formatter: roundToCurry(2) },
  { text: 'Rep  (U)', key: 'U', formatter: (n) => `-${roundTo(n, 2)}` },
  { text: 'Pres (P)', key: 'P', formatter: formatFactor },
  { text: 'Req. El (Q)', key: 'Q', formatter: formatFactor },
  { text: 'Deduc (M)', key: 'M', formatter: formatFactor },
  { text: 'Result (R)', key: 'R', formatter: roundToCurry(2) }
]

export const speedResultTableHeaders: TableHeader[] = [
  { text: 'Score', key: 'R' },
  { text: 'Rank', key: 'S', color: 'red' }
]

export const freestyleResultTableHeaders: TableHeader[] = [
  { text: 'Diff', key: 'D', color: 'gray', formatter: roundToCurry(2) },
  { text: 'Rep', key: 'U', color: 'gray', formatter: (n) => `-${roundTo(n, 2)}` },
  { text: 'Pres', key: 'P', color: 'gray', formatter: formatFactor },
  { text: 'Req. El', key: 'Q', color: 'gray', formatter: formatFactor },
  { text: 'Deduc', key: 'M', color: 'gray', formatter: formatFactor },

  { text: 'Score', key: 'R', formatter: roundToCurry(2) },
  { text: 'Rank', key: 'S', color: 'red' }
]

export const overallTableFactory: (cEvtDefs: CompetitionEvent[]) => { groups: TableHeaderGroup[][], headers: TableHeader[] } = cEvtDefs => {
  const groups: TableHeaderGroup[][] = []

  const srEvts = cEvtDefs.filter(cEvt => cEvt.split('.')[3] === 'sr')
  const ddEvts = cEvtDefs.filter(cEvt => cEvt.split('.')[3] === 'dd')

  const disciplineGroup: TableHeaderGroup[] = []

  if (srEvts.length) {
    disciplineGroup.push({
      text: 'Single Rope',
      key: 'sr',
      colspan: srEvts.length * 2
    })
  }

  if (ddEvts.length) {
    disciplineGroup.push({
      text: 'Double Dutch',
      key: 'dd',
      colspan: ddEvts.length * 2
    })
  }

  disciplineGroup.push({
    text: 'Overall',
    key: 'oa',
    colspan: 3,
    rowspan: 2
  })

  groups.push(disciplineGroup)

  const evtGroup: TableHeaderGroup[] = []

  for (const cEvt of [...srEvts, ...ddEvts]) {
    evtGroup.push({
      text: cEvtToName[cEvt].replace(/^(Double Dutch|Single Rope) /, ''),
      key: cEvt,
      colspan: 2
    })
  }

  groups.push(evtGroup)

  const headers: TableHeader[] = []

  for (const cEvt of [...srEvts, ...ddEvts]) {
    headers.push({
      text: 'Score',
      key: 'R',
      component: cEvt
    }, {
      text: 'Rank',
      key: 'S',
      component: cEvt,
      color: 'red'
    })
  }

  headers.push({
    text: 'Normalised',
    key: 'B',
    color: 'gray',
    formatter: roundToCurry(2)
  }, {
    text: 'Rank Sum',
    key: 'T',
    color: 'green'
  }, {
    text: 'Rank',
    key: 'S',
    color: 'red'
  })

  return {
    groups,
    headers
  }
}

// ==========
// DEFINITION
// ==========
const speedJudges = [speedJudge, speedHeadJudge]
const freestyleJudges = [routinePresentationJudge, athletePresentationJudge, requiredElementsJudge, difficultyJudge]

const cEvtToName: Record<CompetitionEvent, string> = {
  'e.ijru.sp.sr.srss.1.30': 'Single Rope Speed Sprint',
  'e.ijru.sp.sr.srse.1.180': 'Single Rope Speed Endurance',
  'e.ijru.sp.sr.srtu.1.0': 'Single Rope Triple Unders',
  'e.ijru.fs.sr.srif.1.75': 'Single Rope Individual Freestyle',
  'e.ijru.sp.sr.srsr.4.4x30': 'Single Rope Speed Relay',
  'e.ijru.sp.sr.srdr.2.2x30': 'Single Rope Double Unders Relay',
  'e.ijru.sp.dd.ddsr.4.4x30': 'Double Dutch Speed Relay',
  'e.ijru.sp.dd.ddss.3.60': 'Double Dutch Speed Sprint',
  'e.ijru.fs.sr.srpf.2.75': 'Single Rope Pair Freestyle',
  'e.ijru.fs.sr.srtf.4.75': 'Single Rope Team Freestyle',
  'e.ijru.fs.dd.ddsf.3.75': 'Double Dutch Single Freestyle',
  'e.ijru.fs.dd.ddpf.4.75': 'Double Dutch Pair Freestyle',
  'e.ijru.fs.dd.ddtf.5.90': 'Double Dutch Triad Freestyle',
  'e.ijru.fs.wh.whpf.2.75': 'Wheel Pair Freestyle',
  'e.ijru.fs.ts.sctf.8.300': 'Show Freestyle',
  'e.ijru.oa.sr.isro.1.0': 'Individual Single Rope Overall',
  'e.ijru.oa.sr.tsro.4.0': 'Team Single Rope Overall',
  'e.ijru.oa.dd.tddo.4.0': 'Team Double Dutch Overall',
  'e.ijru.oa.xd.tcaa.4.0': 'Team All-Around (Cross-Discipline)'
}

const ruleset: Ruleset = {
  id: 'ijru@2.0.0',
  name: 'IJRU v2.0.0',
  competitionEvents: {
    'e.ijru.sp.sr.srss.1.30': {
      name: 'Single Rope Speed Sprint',
      judges: speedJudges.map(j => j('e.ijru.sp.sr.srss.1.30')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.sr.srss.1.30'),
      rankEntries: rankSpeedEntries('e.ijru.sp.sr.srss.1.30'),
      previewTable: speedPreviewTableHeaders,
      resultTable: { headers: speedResultTableHeaders }
    },
    'e.ijru.sp.sr.srse.1.180': {
      name: 'Single Rope Speed Endurance',
      judges: speedJudges.map(j => j('e.ijru.sp.sr.srse.1.180')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.sr.srse.1.180'),
      rankEntries: rankSpeedEntries('e.ijru.sp.sr.srse.1.180'),
      previewTable: speedPreviewTableHeaders,
      resultTable: { headers: speedResultTableHeaders }
    },
    'e.ijru.sp.sr.srtu.1.0': {
      name: 'Single Rope Triple Unders',
      judges: speedJudges.map(j => j('e.ijru.sp.sr.srtu.1.0')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.sr.srtu.1.0'),
      rankEntries: rankSpeedEntries('e.ijru.sp.sr.srtu.1.0'),
      previewTable: speedPreviewTableHeaders,
      resultTable: { headers: speedResultTableHeaders }
    },
    'e.ijru.fs.sr.srif.1.75': {
      name: 'Single Rope Individual Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.sr.srif.1.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.sr.srif.1.75'),
      rankEntries: rankFreestyleEntries('e.ijru.fs.sr.srif.1.75'),
      previewTable: freestylePreviewTableHeaders,
      resultTable: { headers: freestyleResultTableHeaders }
    },

    'e.ijru.sp.sr.srsr.4.4x30': {
      name: 'Single Rope Speed Relay',
      judges: speedJudges.map(j => j('e.ijru.sp.sr.srsr.4.4x30')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.sr.srsr.4.4x30'),
      rankEntries: rankSpeedEntries('e.ijru.sp.sr.srsr.4.4x30'),
      previewTable: speedPreviewTableHeaders,
      resultTable: { headers: speedResultTableHeaders }
    },
    'e.ijru.sp.sr.srdr.2.2x30': {
      name: 'Single Rope Double Unders Relay',
      judges: speedJudges.map(j => j('e.ijru.sp.sr.srdr.2.2x30')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.sr.srdr.2.2x30'),
      rankEntries: rankSpeedEntries('e.ijru.sp.sr.srdr.2.2x30'),
      previewTable: speedPreviewTableHeaders,
      resultTable: { headers: speedResultTableHeaders }
    },
    'e.ijru.sp.dd.ddsr.4.4x30': {
      name: 'Double Dutch Speed Relay',
      judges: speedJudges.map(j => j('e.ijru.sp.dd.ddsr.4.4x30')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.dd.ddsr.4.4x30'),
      rankEntries: rankSpeedEntries('e.ijru.sp.dd.ddsr.4.4x30'),
      previewTable: speedPreviewTableHeaders,
      resultTable: { headers: speedResultTableHeaders }
    },
    'e.ijru.sp.dd.ddss.3.60': {
      name: 'Double Dutch Speed Sprint',
      judges: speedJudges.map(j => j('e.ijru.sp.dd.ddss.3.60')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.dd.ddss.3.60'),
      rankEntries: rankSpeedEntries('e.ijru.sp.dd.ddss.3.60'),
      previewTable: speedPreviewTableHeaders,
      resultTable: { headers: speedResultTableHeaders }
    },

    'e.ijru.fs.sr.srpf.2.75': {
      name: 'Single Rope Pair Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.sr.srpf.2.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.sr.srpf.2.75'),
      rankEntries: rankFreestyleEntries('e.ijru.fs.sr.srpf.2.75'),
      previewTable: freestylePreviewTableHeaders,
      resultTable: { headers: freestyleResultTableHeaders }
    },
    'e.ijru.fs.sr.srtf.4.75': {
      name: 'Single Rope Team Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.sr.srtf.4.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.sr.srtf.4.75'),
      rankEntries: rankFreestyleEntries('e.ijru.fs.sr.srtf.4.75'),
      previewTable: freestylePreviewTableHeaders,
      resultTable: { headers: freestyleResultTableHeaders }
    },
    'e.ijru.fs.dd.ddsf.3.75': {
      name: 'Double Dutch Single Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.dd.ddsf.3.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.dd.ddsf.3.75'),
      rankEntries: rankFreestyleEntries('e.ijru.fs.dd.ddsf.3.75'),
      previewTable: freestylePreviewTableHeaders,
      resultTable: { headers: freestyleResultTableHeaders }
    },
    'e.ijru.fs.dd.ddpf.4.75': {
      name: 'Double Dutch Pair Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.dd.ddpf.4.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.dd.ddpf.4.75'),
      rankEntries: rankFreestyleEntries('e.ijru.fs.dd.ddpf.4.75'),
      previewTable: freestylePreviewTableHeaders,
      resultTable: { headers: freestyleResultTableHeaders }
    },
    'e.ijru.fs.dd.ddtf.5.90': {
      name: 'Double Dutch Triad Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.dd.ddtf.5.90')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.dd.ddtf.5.90'),
      rankEntries: rankFreestyleEntries('e.ijru.fs.dd.ddtf.5.90'),
      previewTable: freestylePreviewTableHeaders,
      resultTable: { headers: freestyleResultTableHeaders }
    },
    'e.ijru.fs.wh.whpf.2.75': {
      name: 'Wheel Pair Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.wh.whpf.2.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.wh.whpf.2.75'),
      rankEntries: rankFreestyleEntries('e.ijru.fs.wh.whpf.2.75'),
      previewTable: freestylePreviewTableHeaders,
      resultTable: { headers: freestyleResultTableHeaders }
    }
    // 'e.ijru.fs.ts.sctf.8.300': { name: 'Show Freestyle' }
  },
  overalls: {
    'e.ijru.oa.sr.isro.1.0': {
      name: 'Individual Single Rope Overall',
      competitionEvents: [
        ['e.ijru.sp.sr.srss.1.30', {}],
        ['e.ijru.sp.sr.srse.1.180', {}],
        ['e.ijru.fs.sr.srif.1.75', { rankMultiplier: 2, normalisationMultiplier: 2 }]
      ],
      resultTable: overallTableFactory([
        'e.ijru.sp.sr.srss.1.30',
        'e.ijru.sp.sr.srse.1.180',
        'e.ijru.fs.sr.srif.1.75'
      ]),
      rankOverall: rankOverall('e.ijru.oa.sr.isro.1.0')
    },
    'e.ijru.oa.sr.tsro.4.0': {
      name: 'Team Single Rope Overall',
      competitionEvents: [
        ['e.ijru.sp.sr.srdr.2.2x30', {}],
        ['e.ijru.sp.sr.srsr.4.4x30', {}],
        ['e.ijru.fs.sr.srpf.2.75', {}],
        ['e.ijru.fs.sr.srtf.4.75', {}]
      ],
      resultTable: overallTableFactory([
        'e.ijru.sp.sr.srdr.2.2x30',
        'e.ijru.sp.sr.srsr.4.4x30',
        'e.ijru.fs.sr.srpf.2.75',
        'e.ijru.fs.sr.srtf.4.75'
      ]),
      rankOverall: rankOverall('e.ijru.oa.sr.tsro.4.0')
    },
    'e.ijru.oa.dd.tddo.4.0': {
      name: 'Team Double Dutch Overall',
      competitionEvents: [
        ['e.ijru.sp.dd.ddss.3.60', {}],
        ['e.ijru.sp.dd.ddsr.4.4x30', {}],
        ['e.ijru.fs.dd.ddsf.3.75', {}],
        ['e.ijru.fs.dd.ddpf.4.75', {}]
      ],
      resultTable: overallTableFactory([
        'e.ijru.sp.dd.ddss.3.60',
        'e.ijru.sp.dd.ddsr.4.4x30',
        'e.ijru.fs.dd.ddsf.3.75',
        'e.ijru.fs.dd.ddpf.4.75'
      ]),
      rankOverall: rankOverall('e.ijru.oa.dd.tddo.4.0')
    },
    'e.ijru.oa.xd.tcaa.4.0': {
      name: 'Team All-Around (Cross-Discipline)',
      competitionEvents: [
        ['e.ijru.sp.sr.srdr.2.2x30', {}],
        ['e.ijru.sp.sr.srsr.4.4x30', {}],
        ['e.ijru.fs.sr.srpf.2.75', {}],
        ['e.ijru.fs.sr.srtf.4.75', {}],

        ['e.ijru.sp.dd.ddss.3.60', {}],
        ['e.ijru.sp.dd.ddsr.4.4x30', {}],
        ['e.ijru.fs.dd.ddsf.3.75', {}],
        ['e.ijru.fs.dd.ddpf.4.75', {}]
      ],
      resultTable: overallTableFactory([
        'e.ijru.sp.sr.srdr.2.2x30',
        'e.ijru.sp.sr.srsr.4.4x30',
        'e.ijru.fs.sr.srpf.2.75',
        'e.ijru.fs.sr.srtf.4.75',

        'e.ijru.sp.dd.ddss.3.60',
        'e.ijru.sp.dd.ddsr.4.4x30',
        'e.ijru.fs.dd.ddsf.3.75',
        'e.ijru.fs.dd.ddpf.4.75'
      ]),
      rankOverall: rankOverall('e.ijru.oa.xd.tcaa.4.0')
    }
  }
}

export default ruleset
