import {
  calculateTally,
  filterLatestScoresheets,
  filterParticipatingInAll,
  roundTo,
  roundToCurry,
  clampNumber,
  ScoreTally,
  CompetitionEvent,
  formatFactor
} from '../helpers'

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

export function L (l: number): number {
  if (l === 0) return 0
  return l === 0.5 ? 0.5 : (0.5 * l) + 0.5
}

export function average (scores: number[]): number {
  if (scores.length === 0) return 0
  return scores.reduce((a, b) => a + b) / scores.length
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

export const timingJudge: JudgeTypeFn = () => {
  const tallyFields: Readonly<FieldDefinition[]> = [{
    schema: 'seconds',
    name: 'Seconds',
    min: 0,
    step: 1
  }] as const
  return {
    id: 'T',
    name: 'Timing',
    tallyFields,
    calculateScoresheet: scsh => {
      const tally: ScoreTally<(typeof tallyFields)[number]['schema']> = calculateTally(scsh, tallyFields)
      return {
        t: tally.seconds
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
  const tallyFields = [
    {
      schema: 'musicOnBeat',
      name: 'Takt',
      min: 1,
      max: 3,
      step: 1
    },
    {
      schema: 'formExecution',
      name: 'Teknik',
      min: 1,
      max: 3,
      step: 1
    },
    {
      schema: 'impression',
      name: 'Presentation',
      min: 1,
      max: 3,
      step: 1
    },
    {
      schema: 'miss',
      name: 'Missar',
      min: 1,
      max: 3,
      step: 1
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

export const requiredElementsJudge: JudgeTypeFn = cEvtDef => {
  const isDD = cEvtDef.split('.')[3] === 'dd'
  let tallyFields: FieldDefinition[]

  if (isDD) {
    tallyFields = [
      {
        schema: 'rqHighKnee',
        name: '4 höga knä',
        min: 0,
        max: 1,
        step: 1
      },
      {
        schema: 'rqSki',
        name: '4 skidhopp',
        min: 0,
        max: 1,
        step: 1
      },
      {
        schema: 'rqTurn',
        name: 'Snurra runt',
        min: 0,
        max: 1,
        step: 1
      },
      {
        schema: 'rqPair',
        name: 'Parövning',
        min: 0,
        max: 1,
        step: 1
      },
      {
        schema: 'rqTool',
        name: 'Handredskap',
        min: 0,
        max: 1,
        step: 1
      }
    ]
  } else {
    tallyFields = [
      {
        schema: 'rqHighKnee',
        name: '4 höga knä',
        min: 0,
        max: 1,
        step: 1
      },
      {
        schema: 'rqBack',
        name: '4 baklänges hopp',
        min: 0,
        max: 1,
        step: 1
      },
      {
        schema: 'rqCross',
        name: '4 korshopp',
        min: 0,
        max: 1,
        step: 1
      },
      {
        schema: 'rqSideJump',
        name: '4 sidsväng-hopp',
        min: 0,
        max: 1,
        step: 1
      },
      {
        schema: 'rqOutTogether',
        name: '4 ut-ihop med benen',
        min: 0,
        max: 1,
        step: 1
      }
    ]
  }
  return {
    id: 'O',
    name: 'Obligatoriska',
    tallyFields,
    calculateScoresheet: scsh => {
      const tally: ScoreTally<(typeof tallyFields)[number]['schema']> = calculateTally(scsh, tallyFields)

      const completed = tallyFields
        .map<number>(f => (tally[f.schema] ?? 0) >= 1 ? 1 : 0)
        .reduce((a, b) => a + b)

      const score = 1 - ((5 - completed) * 0.1)

      return {
        O: roundTo(score, 1)
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
  const a = average(as) ?? 0

  return {
    entryId: meta.entryId,
    participantId: meta.participantId,
    competitionEvent: cEvtDef,
    result: {
      a,
      R: roundTo(a, 2)
    }
  }
}

export const calculateTimingEntry: CalcEntryFn = cEvtDef => (meta, rawScsh) => {
  const judgeTypes = Object.fromEntries(ruleset.competitionEvents[cEvtDef]?.judges.map(j => [j.id, j]) ?? [])
  // only take the newest scoresheet per judge
  const scoresheets = filterLatestScoresheets(rawScsh, cEvtDef)

  if (!scoresheets.length) return

  const results = scoresheets.map(scsh => judgeTypes[scsh.judgeType].calculateScoresheet(scsh))

  // Calc t
  const ts = results.map(res => res.t).filter(t => typeof t === 'number')
  const t = average(ts) ?? 0

  return {
    entryId: meta.entryId,
    participantId: meta.participantId,
    competitionEvent: cEvtDef,
    result: {
      t,
      R: roundTo(t, 2)
    }
  }
}

export const calculateFreestyleEntry: CalcEntryFn = cEvtDef => (meta, rawScsh) => {
  const judgeTypes = Object.fromEntries(ruleset.competitionEvents[cEvtDef]?.judges.map(j => [j.id, j]) ?? [])
  // only take the newest scoresheet per judge
  const scoresheets = filterLatestScoresheets(rawScsh, cEvtDef)

  if (!scoresheets.length) return

  const results = scoresheets.map(scsh => judgeTypes[scsh.judgeType].calculateScoresheet(scsh))

  const Ps = results.map(res => res.P).filter(P => typeof P === 'number')
  const P = average(Ps) ?? 0

  const Ds = results.map(res => res.D).filter(D => typeof D === 'number')
  const D = average(Ds) ?? 0

  const Os = results.map(res => res.O).filter(O => typeof O === 'number')
  const O = average(Os) ?? 0

  const Rdo = clampNumber((D ?? 0) * (O ?? 1), { min: 0 })

  return {
    entryId: meta.entryId,
    participantId: meta.participantId,
    competitionEvent: cEvtDef,
    result: {
      P: roundTo(P, 2),
      D: roundTo(D, 2),
      O: roundTo(O, 2),
      Rdo: roundTo(Rdo, 2),
      Rp: roundTo(P, 2)
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

export const rankTimingEntries: RankEntriesFn = cEvtDef => res => {
  let results = [...res]
  results.sort(function (a, b) {
    return (a.result.R ?? 0) - (b.result.R ?? 0) // sort ascending
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
  const CScores = results.map(el => el.result.Rp ?? -Infinity)
  const DScores = results.map(el => el.result.Rdo ?? -Infinity)

  /* sort descending */
  CScores.sort(function (a, b) {
    return b - a // sort descending
  })
  DScores.sort(function (a, b) {
    return b - a // sort descending
  })

  results = results.map((el, idx, arr) => {
    const CRank = CScores.findIndex(score => score === el.result.Rp) + 1
    const DRank = DScores.findIndex(score => score === el.result.Rdo) + 1

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

  /* sort ascending on rank but alphabetically on id if ranksums are equal */
  results.sort((a, b) => {
    if (a.result.T === b.result.T) {
      return a.participantId.localeCompare(b.participantId)
    } else {
      return (a.result.T ?? 0) - (b.result.T ?? 0)
    }
  })

  results = results.map((el, idx, arr) => ({
    ...el,
    result: {
      ...el.result,
      S: arr.findIndex(score => score.result.T === el.result.T) + 1
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

    const T = cRes.reduce((acc, curr) => acc + (curr.result.S ?? 0), 0)

    return {
      participantId,
      competitionEvent: oEvtDef,
      result: { T, S: 0 },
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
  { text: 'Result (R)', key: 'R' }
]

export const timingPreviewTableHeaders: TableHeader[] = [
  { text: 'Seconds (t)', key: 't' },
  { text: 'Result (R)', key: 'R' }
]

export const freestylePreviewTableHeaders: TableHeader[] = [
  { text: 'Pres (P)', key: 'P', formatter: roundToCurry(2) },
  { text: 'Diff (D)', key: 'D', formatter: roundToCurry(2) },
  { text: 'Obliga (O)', key: 'O', formatter: formatFactor },
  { text: 'Diff - Obliga (Rdo)', key: 'Rdo', formatter: roundToCurry(2) }
]

export const speedResultTableHeaders: TableHeader[] = [
  { text: 'Steps', key: 'R' },
  { text: 'Rank', key: 'S', color: 'red' }
]

export const timingResultTableHeaders: TableHeader[] = [
  { text: 'Seconds', key: 'R' },
  { text: 'Rank', key: 'S', color: 'red' }
]

export const freestyleResultTableHeaders: TableHeader[] = [
  { text: 'Pres', key: 'Rp', formatter: roundToCurry(2) },
  { text: 'Crea Rank', key: 'CRank', color: 'red' },

  { text: 'Diff - Obliga', key: 'Rdo', formatter: roundToCurry(2) },
  { text: 'Diff Rank', key: 'DRank', color: 'red' },

  { text: 'Rank Sum', key: 'T', color: 'green' },
  { text: 'Rank', key: 'S', color: 'red' }
]

export const overallTableFactory: (cEvtDefs: CompetitionEvent[]) => { groups: TableHeaderGroup[][], headers: TableHeader[] } = cEvtDefs => {
  const groups: TableHeaderGroup[][] = []

  const srEvts = cEvtDefs
    .filter(cEvt => cEvt.split('.')[3] === 'sr')
  const srEvtCols = srEvts.length * 2
  const ddEvts = cEvtDefs
    .filter(cEvt => cEvt.split('.')[3] === 'dd')
  const ddEvtCols = ddEvts.length * 2

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
    evtGroup.push({
      text: cEvtToName[cEvt].replace(/^(Double Dutch|Single Rope) /, ''),
      key: cEvt,
      colspan: 2
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
        text: 'Rank Sum',
        key: 'T',
        component: cEvt
      }, {
        text: 'Rank',
        key: 'S',
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
const speedJudges = [speedJudge]
const timingJudges = [timingJudge]
const freestyleJudges = [presentationJudge, difficultyJudge, requiredElementsJudge]

const cEvtToName: Record<CompetitionEvent, string> = {
  'e.ijru.sp.sr.srss.1.30': 'Single Rope Speed Sprint',
  'e.svgf.sp.sr.srdu.1.30': 'Single Rope Double Unders',
  'e.svgf.sp.sr.srse.1.120': 'Single Rope Speed Endurance',
  'e.ijru.fs.sr.srif.1.75': 'Single Rope Individual Freestyle',
  'e.ijru.sp.sr.srsr.4.4x30': 'Single Rope Speed Relay',
  'e.svgf.sp.sr.srdr.4.4x30': 'Single Rope Double Unders Relay',
  'e.ijru.fs.sr.srtf.4.75': 'Single Rope Team Freestyle',
  'e.svgf.sp.dd.ddsr.4.2x45': 'Double Dutch Speed Relay',
  'e.svgf.sp.dd.ddut.4.0': 'Double Dutch Utmaningen',
  'e.svgf.fs.dd.ddpf.4.120': 'Double Dutch Pair Freestyle'
}

const ruleset: Ruleset = {
  id: 'svgf-vh@2023',
  name: 'SvGF Vikingahoppet 2023',
  competitionEvents: {
    'e.ijru.sp.sr.srss.1.30': {
      name: 'Single Rope Speed Sprint',
      judges: speedJudges.map(j => j('e.ijru.sp.sr.srss.1.30')),
      calculateEntry: calculateSpeedEntry('e.ijru.sp.sr.srss.1.30'),
      rankEntries: rankSpeedEntries('e.ijru.sp.sr.srss.1.30'),
      previewTable: speedPreviewTableHeaders,
      resultTable: { headers: speedResultTableHeaders }
    },
    'e.svgf.sp.sr.srdu.1.30': {
      name: 'Single Rope Double Unders',
      judges: speedJudges.map(j => j('e.svgf.sp.sr.srdu.1.30')),
      calculateEntry: calculateSpeedEntry('e.svgf.sp.sr.srdu.1.30'),
      rankEntries: rankSpeedEntries('e.svgf.sp.sr.srdu.1.30'),
      previewTable: speedPreviewTableHeaders,
      resultTable: { headers: speedResultTableHeaders }
    },
    'e.svgf.sp.sr.srse.1.120': {
      name: 'Single Rope Speed Endurance',
      judges: speedJudges.map(j => j('e.svgf.sp.sr.srse.1.120')),
      calculateEntry: calculateSpeedEntry('e.svgf.sp.sr.srse.1.120'),
      rankEntries: rankSpeedEntries('e.svgf.sp.sr.srse.1.120'),
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
    'e.svgf.sp.sr.srdr.4.4x30': {
      name: 'Single Rope Double Unders Relay',
      judges: speedJudges.map(j => j('e.svgf.sp.sr.srdr.4.4x30')),
      calculateEntry: calculateSpeedEntry('e.svgf.sp.sr.srdr.4.4x30'),
      rankEntries: rankSpeedEntries('e.svgf.sp.sr.srdr.4.4x30'),
      previewTable: speedPreviewTableHeaders,
      resultTable: { headers: speedResultTableHeaders }
    },
    'e.ijru.fs.sr.srtf.4.75': {
      name: 'Single Rope Team Freestyle',
      judges: freestyleJudges.map(j => j('e.ijru.fs.sr.srtf.4.75')),
      calculateEntry: calculateFreestyleEntry('e.ijru.fs.sr.srtf.4.75'),
      rankEntries: rankFreestyleEntries('e.ijru.fs.sr.srtf.4.75'),
      previewTable: freestylePreviewTableHeaders,
      resultTable: { headers: freestyleResultTableHeaders }
    },

    'e.svgf.sp.dd.ddsr.4.2x45': {
      name: 'Double Dutch Speed Relay',
      judges: speedJudges.map(j => j('e.svgf.sp.dd.ddsr.4.2x45')),
      calculateEntry: calculateSpeedEntry('e.svgf.sp.dd.ddsr.4.2x45'),
      rankEntries: rankSpeedEntries('e.svgf.sp.dd.ddsr.4.2x45'),
      previewTable: speedPreviewTableHeaders,
      resultTable: { headers: speedResultTableHeaders }
    },
    'e.svgf.sp.dd.ddut.4.0': {
      name: 'Double Dutch Utmaningen',
      judges: timingJudges.map(j => j('e.svgf.sp.dd.ddut.4.0')),
      calculateEntry: calculateTimingEntry('e.svgf.sp.dd.ddut.4.0'),
      rankEntries: rankTimingEntries('e.svgf.sp.dd.ddut.4.0'),
      previewTable: timingPreviewTableHeaders,
      resultTable: { headers: timingResultTableHeaders }
    },
    'e.svgf.fs.dd.ddpf.4.120': {
      name: 'Double Dutch Pair Freestyle',
      judges: freestyleJudges.map(j => j('e.svgf.fs.dd.ddpf.4.120')),
      calculateEntry: calculateFreestyleEntry('e.svgf.fs.dd.ddpf.4.120'),
      rankEntries: rankFreestyleEntries('e.svgf.fs.dd.ddpf.4.120'),
      previewTable: freestylePreviewTableHeaders,
      resultTable: { headers: freestyleResultTableHeaders }
    }
  },
  overalls: {
    'e.svgf.oa.sr.vhio.1.0': {
      name: 'Individuell Overall',
      competitionEvents: [
        ['e.ijru.sp.sr.srss.1.30', {}],
        ['e.svgf.sp.sr.srdu.1.30', {}],
        ['e.svgf.sp.sr.srse.1.120', {}],
        ['e.ijru.fs.sr.srif.1.75', {}]
      ],
      resultTable: overallTableFactory([
        'e.ijru.sp.sr.srss.1.30',
        'e.svgf.sp.sr.srdu.1.30',
        'e.svgf.sp.sr.srse.1.120',
        'e.ijru.fs.sr.srif.1.75'
      ]),
      rankOverall: rankOverall('e.svgf.oa.sr.vhio.1.0')
    },
    'e.svgf.oa.sr.vhto.4.0': {
      name: 'Enkelrep Overall',
      competitionEvents: [
        ['e.ijru.sp.sr.srsr.4.4x30', {}],
        ['e.svgf.sp.sr.srdr.4.4x30', {}],
        ['e.ijru.fs.sr.srtf.4.75', {}]
      ],
      resultTable: overallTableFactory([
        'e.ijru.sp.sr.srsr.4.4x30',
        'e.svgf.sp.sr.srdr.4.4x30',
        'e.ijru.fs.sr.srtf.4.75'
      ]),
      rankOverall: rankOverall('e.svgf.oa.sr.vhto.4.0')
    },
    'e.svgf.oa.dd.vhto.4.0': {
      name: 'Dubbelrep Overall',
      competitionEvents: [
        ['e.svgf.sp.dd.ddsr.4.2x45', {}],
        ['e.svgf.sp.dd.ddut.4.0', {}],
        ['e.svgf.fs.dd.ddpf.4.120', {}]
      ],
      resultTable: overallTableFactory([
        'e.svgf.sp.dd.ddsr.4.2x45',
        'e.svgf.sp.dd.ddut.4.0',
        'e.svgf.fs.dd.ddpf.4.120'
      ]),
      rankOverall: rankOverall('e.svgf.oa.dd.vhto.4.0')
    }
  }
}

export default ruleset
