import {
  calculateTally,
  filterLatestScoresheets,
  filterParticipatingInAll,
  roundTo,
  roundToCurry,
  clampNumber
} from '../helpers'
import { ijruAverage } from './ijru@2.0.0'

import type {
  Ruleset,
  FieldDefinition,
  TableHeader,
  TableHeaderGroup,
  EntryResult,
  JudgeTypeFn,
  CalcEntryFn,
  RankEntriesFn,
  RankOverallFn
} from '.'
import type { ScoreTally, CompetitionEvent } from '../store/schema'

// deduc
const SpeedDed = 10

export function L (l: number): number {
  if (l === 0) return 0
  return l === 0.5 ? 0.5 : (0.5 * l) + 0.5
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
  'e.svgf.sp.dd.ddsr.4.4x45': 3
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

export const difficultyJudge: JudgeTypeFn = () => {
  const tallyFields = [
    {
      name: 'Level 0.5',
      schema: 'diffL0.5',
      min: 0,
      step: 1
    },
    ...Array(5).fill(undefined).map((el, idx) => ({
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

export const presentationJudge: JudgeTypeFn = cEvtDef => {
  const isDD = cEvtDef.split('.')[3] === 'dd'
  const tallyFields = [
    {
      schema: 'musicOnBeat',
      name: 'Hoppar i takt till musiken',
      min: 0,
      max: 10,
      step: 0.5
    },
    ...(isDD
      ? [{
          schema: 'interactions',
          name: 'Interaktioner',
          min: 0,
          max: 10,
          step: 0.5
        }]
      : [{
          schema: 'usingMusic',
          name: 'Använder musiken',
          min: 0,
          max: 10,
          step: 0.5
        }]
    ),
    {
      schema: 'movement',
      name: 'Rörelse',
      min: 0,
      max: 10,
      step: 0.5
    },
    {
      schema: 'formExecution',
      name: 'Utförande, teknik',
      min: 0,
      max: 10,
      step: 0.5
    },
    {
      schema: 'impression',
      name: 'Helhetsintryck',
      min: 0,
      max: 10,
      step: 0.5
    },
    {
      schema: 'miss',
      name: 'Missar',
      min: 0,
      max: 10,
      step: 0.5
    }
  ]
  return {
    id: 'P',
    name: 'Presentation',
    tallyFields,
    calculateScoresheet: scsh => {
      const tally: ScoreTally<(typeof tallyFields)[number]['schema']> = calculateTally(scsh, tallyFields)

      const score = tallyFields.map(f => tally[f.schema] ?? 0).reduce((a, b) => a + b)

      return {
        P: roundTo(score, 2)
      }
    }
  }
}

// =======
// ENTRIES
// =======
export const calculateSpeedEntry: CalcEntryFn = cEvtDef => (entry, rawScsh) => {
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
    entryId: entry.id,
    participantId: entry.participantId,
    competitionEvent: cEvtDef,
    result: {
      a,
      m,
      R: roundTo(a - m, 2),

      withinThree
    }
  }
}

export const calculateFreestyleEntry: CalcEntryFn = cEvtDef => (entry, rawScsh) => {
  const judgeTypes = Object.fromEntries(ruleset.competitionEvents[cEvtDef]?.judges.map(j => [j.id, j]) ?? [])
  // only take the newest scoresheet per judge
  const scoresheets = filterLatestScoresheets(rawScsh, cEvtDef)

  if (!scoresheets.length) return

  const results = scoresheets.map(scsh => judgeTypes[scsh.judgeType].calculateScoresheet(scsh))

  const Ps = results.map(res => res.P).filter(P => typeof P === 'number')
  const P = ijruAverage(Ps) ?? 0

  const Ds = results.map(res => res.D).filter(D => typeof D === 'number')
  const D = ijruAverage(Ds) ?? 0

  const R = clampNumber((D ?? 0) + (P ?? 0), { min: 0 })

  return {
    entryId: entry.id,
    participantId: entry.participantId,
    competitionEvent: cEvtDef,
    result: {
      P: roundTo(P, 2),
      D: roundTo(D, 2),
      R: roundTo(R, 2)
    }
  }
}

// =======
// RANKING
// =======
export const rankSpeedEntries: RankEntriesFn = cEvtDef => res => {
  let results = [...res]
  results.sort(function (a, b) {
    return (b.result.R ?? 0) - (a.result.R ?? 0) // sort descending
  })

  results = results.map((el, _, arr) => ({
    ...el,
    result: {
      ...el.result,
      S: arr.findIndex(obj => obj.result.R === el.result.R) + 1
    }
  }))

  return results
}

export const rankFreestyleEntries: RankEntriesFn = cEvtDef => res => {
  let results = [...res]
  const CScores = results.map(el => el.result.P ?? -Infinity)
  const DScores = results.map(el => el.result.D ?? -Infinity)

  /* sort descending */
  CScores.sort(function (a, b) {
    return b - a // sort descending
  })
  DScores.sort(function (a, b) {
    return b - a // sort descending
  })

  results = results.map((el, idx, arr) => {
    const CRank = CScores.findIndex(score => score === el.result.P) + 1
    const DRank = DScores.findIndex(score => score === el.result.D) + 1

    return {
      ...el,
      result: {
        ...el.result,
        CRank,
        DRank,
        T: CRank + DRank
      }
    }
  })

  /* sort ascending on rank but descending on score if ranksums are equal */
  results.sort((a, b) => {
    if (a.result.T === b.result.T) {
      return a.participantId - b.participantId
    } else {
      return (a.result.T ?? 0) - (b.result.T ?? 0)
    }
  })

  results = results.map((el, idx, arr) => ({
    ...el,
    S: arr.findIndex(score => score.result.T === el.result.T) + 1
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

    const R = roundTo(cRes.reduce((acc, curr) => acc + (curr.result.R ?? 0), 0), 4)
    const T = cRes.reduce((acc, curr) => acc + (curr.result.T ?? curr.result.S ?? 0), 0)

    return {
      participantId,
      competitionEvent: oEvtDef,
      result: { R, T, S: 0 },
      componentResults: Object.fromEntries(cRes.map(r => [r.competitionEvent, r]))
    }
  })

  ranked.sort((a, b) => {
    return a.result.T - b.result.T
  })

  for (let idx = 0; idx < ranked.length; idx++) {
    ranked[idx].result.S = ranked.findIndex(obj => obj.result.T === ranked[idx].result.T) + 1
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
  { text: 'Pres (P)', key: 'P', formatter: roundToCurry(2) },
  { text: 'Diff (D)', key: 'D', formatter: roundToCurry(2) },
  { text: 'Result (R)', key: 'R', formatter: roundToCurry(2) }
]

export const speedResultTableHeaders: TableHeader[] = [
  { text: 'Score', key: 'R' },
  { text: 'Rank', key: 'S', color: 'red' }
]

export const freestyleResultTableHeaders: TableHeader[] = [
  { text: 'Pres', key: 'P', formatter: roundToCurry(2) },
  { text: 'Crea Rank', key: 'CRank', color: 'red' },

  { text: 'Diff', key: 'D', formatter: roundToCurry(2) },
  { text: 'Diff Rank', key: 'DRank', color: 'red' },

  { text: 'Rank Sum', key: 'T', color: 'green' }
]

export const overallTableFactory: (cEvtDefs: CompetitionEvent[]) => { groups: TableHeaderGroup[][], headers: TableHeader[] } = cEvtDefs => {
  const groups: TableHeaderGroup[][] = []

  const srEvts = cEvtDefs
    .filter(cEvt => cEvt.split('.')[3] === 'sr')
  const srEvtCols = srEvts
    .map(cEvt => cEvt.split('.')[2] === 'sp' ? 2 : 4)
    .reduce((acc, curr) => acc + curr, 0)
  const ddEvts = cEvtDefs
    .filter(cEvt => cEvt.split('.')[3] === 'dd')
  const ddEvtCols = ddEvts
    .map(cEvt => cEvt.split('.')[2] === 'sp' ? 2 : 4)
    .reduce((acc, curr) => acc + curr, 0)

  const disciplineGroup: TableHeaderGroup[] = []

  if (srEvtCols) {
    disciplineGroup.push({
      text: 'Single Rope',
      key: 'sr',
      colspan: srEvtCols
    })
  }

  if (ddEvtCols) {
    disciplineGroup.push({
      text: 'Double Dutch',
      key: 'dd',
      colspan: ddEvtCols
    })
  }

  disciplineGroup.push({
    text: 'Overall',
    key: 'oa',
    colspan: 2,
    rowspan: 2
  })

  groups.push(disciplineGroup)

  const evtGroup: TableHeaderGroup[] = []

  for (const cEvt of [...srEvts, ...ddEvts]) {
    const isSp = cEvt.split('.')[2] === 'sp'
    evtGroup.push({
      text: cEvtToName[cEvt].replace(/^(Double Dutch|Single Rope) /, ''),
      key: cEvt,
      colspan: isSp ? 2 : 4
    })
  }

  groups.push(evtGroup)

  const headers: TableHeader[] = []

  for (const cEvt of [...srEvts, ...ddEvts]) {
    const isSp = cEvt.split('.')[2] === 'sp'
    if (isSp) {
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
    } else {
      headers.push({
        text: 'Pres',
        key: 'P',
        component: cEvt
      }, {
        text: 'Rank',
        key: 'CRank',
        component: cEvt,
        color: 'red'
      }, {
        text: 'Diff',
        key: 'D',
        component: cEvt
      }, {
        text: 'Rank',
        key: 'DRank',
        component: cEvt,
        color: 'red'
      })
    }
  }

  headers.push({
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
const freestyleJudges = [presentationJudge, difficultyJudge]

const cEvtToName: Record<CompetitionEvent, string> = {
  'e.ijru.sp.sr.srss.1.30': 'Single Rope Speed Sprint',
  'e.ijru.sp.sr.srse.1.180': 'Single Rope Speed Endurance',
  'e.ijru.sp.sr.srtu.1.0': 'Single Rope Triple Unders',
  'e.ijru.fs.sr.srif.1.75': 'Single Rope Individual Freestyle',
  'e.ijru.sp.sr.srsr.4.4x30': 'Single Rope Speed Relay',
  'e.ijru.sp.sr.srdr.2.2x30': 'Single Rope Double Unders Relay',
  'e.svgf.sp.dd.ddsr.4.4x45': 'Double Dutch Speed Relay',
  'e.ijru.sp.dd.ddss.3.60': 'Double Dutch Speed Sprint',
  'e.ijru.fs.sr.srpf.2.75': 'Single Rope Pair Freestyle',
  'e.ijru.fs.sr.srtf.4.75': 'Single Rope Team Freestyle',
  'e.ijru.fs.dd.ddsf.3.75': 'Double Dutch Single Freestyle',
  'e.ijru.fs.dd.ddpf.4.75': 'Double Dutch Pair Freestyle'
}

const ruleset: Ruleset = {
  id: 'svgf-rh@2020',
  name: 'SvGF Rikshoppet 2020',
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
    'e.svgf.sp.dd.ddsr.4.4x45': {
      name: 'Double Dutch Speed Relay',
      judges: speedJudges.map(j => j('e.svgf.sp.dd.ddsr.4.4x45')),
      calculateEntry: calculateSpeedEntry('e.svgf.sp.dd.ddsr.4.4x45'),
      rankEntries: rankSpeedEntries('e.svgf.sp.dd.ddsr.4.4x45'),
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
    }
  },
  overalls: {
    'e.ijru.oa.sr.isro.1.0': {
      name: 'Individuell Overall',
      competitionEvents: [
        ['e.ijru.sp.sr.srss.1.30', {}],
        ['e.ijru.sp.sr.srse.1.180', {}],
        ['e.ijru.fs.sr.srif.1.75', {}]
      ],
      resultTable: overallTableFactory([
        'e.ijru.sp.sr.srss.1.30',
        'e.ijru.sp.sr.srse.1.180',
        'e.ijru.fs.sr.srif.1.75'
      ]),
      rankOverall: rankOverall('e.ijru.oa.sr.isro.1.0')
    },
    'e.svgf.oa.xd.rsaa.4.0': {
      name: 'Rikshoppet 6:an Overall',
      competitionEvents: [
        ['e.ijru.sp.sr.srdr.2.2x30', {}],
        ['e.ijru.sp.sr.srsr.4.4x30', {}],
        ['e.ijru.fs.sr.srtf.4.75', {}],

        ['e.ijru.sp.dd.ddss.3.60', {}],
        ['e.svgf.sp.dd.ddsr.4.4x45', {}],
        ['e.ijru.fs.dd.ddpf.4.75', {}]
      ],
      resultTable: overallTableFactory([
        'e.ijru.sp.sr.srdr.2.2x30',
        'e.ijru.sp.sr.srsr.4.4x30',
        'e.ijru.fs.sr.srtf.4.75',

        'e.ijru.sp.dd.ddss.3.60',
        'e.svgf.sp.dd.ddsr.4.4x45',
        'e.ijru.fs.dd.ddpf.4.75'
      ]),
      rankOverall: rankOverall('e.svgf.oa.xd.rsaa.4.0')
    },
    'e.svgf.oa.xd.reaa.4.0': {
      name: 'Rikshoppet 8:an Overall',
      competitionEvents: [
        ['e.ijru.sp.sr.srdr.2.2x30', {}],
        ['e.ijru.sp.sr.srsr.4.4x30', {}],
        ['e.ijru.fs.sr.srpf.2.75', {}],
        ['e.ijru.fs.sr.srtf.4.75', {}],

        ['e.ijru.sp.dd.ddss.3.60', {}],
        ['e.svgf.sp.dd.ddsr.4.4x45', {}],
        ['e.ijru.fs.dd.ddsf.3.75', {}],
        ['e.ijru.fs.dd.ddpf.4.75', {}]
      ],
      resultTable: overallTableFactory([
        'e.ijru.sp.sr.srdr.2.2x30',
        'e.ijru.sp.sr.srsr.4.4x30',
        'e.ijru.fs.sr.srpf.2.75',
        'e.ijru.fs.sr.srtf.4.75',

        'e.ijru.sp.dd.ddss.3.60',
        'e.svgf.sp.dd.ddsr.4.4x45',
        'e.ijru.fs.dd.ddsf.3.75',
        'e.ijru.fs.dd.ddpf.4.75'
      ]),
      rankOverall: rankOverall('e.svgf.oa.xd.reaa.4.0')
    }
  }
}

export default ruleset
