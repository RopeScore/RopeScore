import { roundTo } from '@/common'
import { Ruleset, JudgeType, ResultTableHeader, ResultTableHeaders, ResultTableHeaderGroup, InputField, ScoreInfo, ResultInfo, Event } from './'

import {
  SpeedJudge as FISACSpeedJudge,
  SpeedHeadJudgeMasters as FISACSpeedHeadJudgeMasters,
  SpeedHeadJudgeRelays as FISACSpeedHeadJudgeRelays,
} from './FISAC1718'
import { IJRU1_1_0average } from './IJRU1-1-0'

export type SvGFRH20Events =
  // Ind
  'srss' | 'srse' | 'srtu' | 'srif' |
  // Team SR
  'srsr' | 'srdr' | 'srpf' | 'srtf' |
  // Team DD
  'ddsr' | 'ddss' | 'ddsf' | 'ddpf'

export type SvGFRH20Overalls = 'indoverall' | 'teamoverall6' | 'teamoverall8'

export interface SvGFRH20Score extends ScoreInfo<SvGFRH20Events> {
  // speed
  s?: number
  fStart?: number
  fSwitch?: number

  // Presentation
  pmob?: number
  puom?: number
  pmov?: number
  pfbe?: number
  pimp?: number
  pmis?: number
  pint?: number

  // Diff
  l05?: number
  l1?: number
  l2?: number
  l3?: number
  l4?: number
  l5?: number
}

export interface SvGFRH20Result extends ResultInfo {
  // Speed
  a?: number
  m?: number

  // FS
  D?: number
  P?: number

  // common
  R?: number

  DRank?: number
  CRank?: number
  S?: number
  T?: number
}

interface DifficultyField extends InputField<SvGFRH20Score> {
  level: number
}

interface DifficultyJudge extends JudgeType<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events> {
  fields: DifficultyField[]
}

/* SPEED */
export const SpeedJudge: JudgeType<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events> = {
  ...FISACSpeedJudge as JudgeType<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events>,
  result: scores => ({
    a: scores.s
  })
}

export const SpeedHeadJudgeMasters: JudgeType<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events> = {
  ...FISACSpeedHeadJudgeMasters as JudgeType<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events>,
  result: scores => ({
    a: scores.s ?? 0,
    m: ((scores.fStart ?? 0) + (scores.fSwitch ?? 0)) * 10
  })
}

export const SpeedHeadJudgeRelays: JudgeType<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events> = {
  ...FISACSpeedHeadJudgeRelays as JudgeType<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events>,
  result: SpeedHeadJudgeMasters.result
}

/* DIFFICULTY */
export const DifficultyJudgeMasters: DifficultyJudge = {
  name: 'Difficulty',
  judgeTypeID: 'D',
  fields: [
    {
      name: 'Level 0.5',
      fieldID: 'l05',
      min: 0,
      level: 0.5
    },
    ...Array(5).fill(undefined).map((el, idx) => ({
      name: `Level ${idx + 1}`,
      fieldID: `l${idx + 1}` as 'l1' | 'l2' | 'l3' | 'l4' | 'l5',
      level: idx + 1
    }))
  ],
  result: function (scores) {
    if (!this) return
    let l = (x: number): number => x === 0.5 ? 0.5 : (0.5 * x) + 0.5

    let score = this.fields.map(field => (scores[field.fieldID] ?? 0) * l(field.level)).reduce((a, b) => a + b)

    return {
      D: roundTo(score, 2)
    }
  }
}

export const DifficultyJudgeTeams: DifficultyJudge = {
  ...DifficultyJudgeMasters,
  fields: [
    {
      name: 'Level 0.5',
      fieldID: 'l05',
      min: 0,
      level: 0.5
    },
    ...Array(5).fill(undefined).map((el, idx) => ({
      name: `Level ${idx + 1}`,
      fieldID: `l${idx + 1}` as 'l1' | 'l2' | 'l3' | 'l4' | 'l5',
      level: idx + 1
    }))
  ]
}

/* PRESENTATION */
export const PresentationJudgeSingleRope: JudgeType<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events> = {
  name: 'Presentation',
  judgeTypeID: 'P',
  fields: [
    {
      name: 'Hoppar i takt till musiken',
      fieldID: 'pmob',
      min: 0,
      max: 10,
      step: 0.5
    },
    {
      name: 'Använder Musiken',
      fieldID: 'puom',
      min: 0,
      max: 10,
      step: 0.5
    },
    {
      name: 'Rörelse',
      fieldID: 'pmov',
      min: 0,
      max: 10,
      step: 0.5
    },
    {
      name: 'Utförande, teknik',
      fieldID: 'pfbe',
      min: 0,
      max: 10,
      step: 0.5
    },
    {
      name: 'Helhetsintryck',
      fieldID: 'pimp',
      min: 0,
      max: 10,
      step: 0.5
    },
    {
      name: 'Missar',
      fieldID: 'pmis',
      min: 0,
      max: 10,
      step: 0.5
    },
  ],
  result: function (scores) {
    if (!this) return
    let l = (x: number): number => x === 0.5 ? 0.5 : (0.5 * x) + 0.5

    let score = this.fields.map(field => scores[field.fieldID] ?? 0).reduce((a, b) => a + b)

    return {
      P: roundTo(score, 2)
    }
  }
}

const ddPresFields = PresentationJudgeSingleRope.fields.slice(0)
ddPresFields.splice(
  PresentationJudgeSingleRope.fields.findIndex(field => field.fieldID === 'puom'),
  1,
  {
    name: 'Interaktioner',
    fieldID: 'pint',
    min: 0,
    max: 10,
    step: 0.5
  }
)

export const PresentationJudgeDoubleDutch: JudgeType<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events> = {
  ...PresentationJudgeSingleRope,
  fields: ddPresFields
}

export const SpeedResultTableHeaders: ResultTableHeaders<SvGFRH20Events> = {
  headers: [{
    text: 'Score',
    value: 'R'
  }, {
    text: 'Rank',
    value: 'S',
    color: 'red'
  }]
}

export const FreestyleResultTableHeaders: ResultTableHeaders<SvGFRH20Events> = {
  headers: [{
    text: 'Pres',
    value: 'P',
  }, {
    text: 'Crea Rank',
    value: 'CRank',
    color: 'red'
  }, {
    text: 'Diff',
    value: 'D',
  }, {
    text: 'Diff Rank',
    value: 'DRank',
    color: 'red'
  },

  {
    text: 'Rank Sum',
    value: 'T',
    color: 'green'
  }, {
    text: 'Rank',
    value: 'S',
    color: 'red'
  }]
}

export const OverallResultTableGroupsIndividual: ResultTableHeaderGroup<SvGFRH20Events>[][] = [
  [{
    text: 'Single Rope',
    value: 'sr',
    colspan: 8
  }, {
    text: 'Overall',
    value: 'oa',
    colspan: 2,
    rowspan: 2
  }],

  [{
    text: 'Speed Sprint',
    value: 'srss',
    colspan: 2
  }, {
    text: 'Speed Endurance',
    value: 'srse',
    colspan: 2
  }, {
    text: 'Individual Freestyle',
    value: 'srif',
    colspan: 4
  }]
]

export const OverallResultTableHeadersIndividual: ResultTableHeader<SvGFRH20Events>[] = [
  {
    text: 'Score',
    value: 'R',
    eventID: 'srss'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'srss',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    eventID: 'srse'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'srse',
    color: 'red'
  },

  {
    text: 'Pres',
    value: 'P',
    eventID: 'srif'
  }, {
    text: 'Rank',
    value: 'CRank',
    eventID: 'srif',
    color: 'red'
  }, {
    text: 'Diff',
    value: 'D',
    eventID: 'srif'
  }, {
    text: 'Rank',
    value: 'DRank',
    eventID: 'srif',
    color: 'red'
  },

  {
    text: 'Rank Sum',
    value: 'T',
    color: 'green',
    eventID: 'overall'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'overall',
    color: 'red'
  }
]

export const OverallResultTableGroupsTeam6: ResultTableHeaderGroup<SvGFRH20Events>[][] = [
  [{
    text: 'Single Rope',
    value: 'sr',
    colspan: 8
  }, {
    text: 'Double Dutch',
    value: 'dd',
    colspan: 8
  }, {
    text: 'Overall',
    value: 'oa',
    colspan: 2,
    rowspan: 2
  }],

  [{
    text: 'Speed Relay',
    value: 'srsr',
    colspan: 2
  }, {
    text: 'Pairs Double Unders',
    value: 'srdr',
    colspan: 2
  }, {
    text: 'Team Freestyle',
    value: 'srtf',
    colspan: 4
  },

  {
    text: 'Speed Relay',
    value: 'ddsr',
    colspan: 2
  }, {
    text: 'Speed Sprint',
    value: 'ddss',
    colspan: 2
  }, {
    text: 'Pair Freestyle',
    value: 'ddpf',
    colspan: 4
  }]
]

export const OverallResultTableGroupsTeam8: ResultTableHeaderGroup<SvGFRH20Events>[][] = [
  [{
    text: 'Single Rope',
    value: 'sr',
    colspan: 12
  }, {
    text: 'Double Dutch',
    value: 'dd',
    colspan: 12
  }, {
    text: 'Overall',
    value: 'oa',
    colspan: 2,
    rowspan: 2
  }],

  [{
    text: 'Speed Relay',
    value: 'srsr',
    colspan: 2
  }, {
    text: 'Pairs Double Unders',
    value: 'srdr',
    colspan: 2
  }, {
    text: 'Pair Freestyle',
    value: 'srpf',
    colspan: 4
  }, {
    text: 'Team Freestyle',
    value: 'srtf',
    colspan: 4
  },

  {
    text: 'Speed Relay',
    value: 'ddsr',
    colspan: 2
  }, {
    text: 'Speed Sprint',
    value: 'ddss',
    colspan: 2
  }, {
    text: 'Pair Freestyle',
    value: 'ddsf',
    colspan: 4
  }, {
    text: 'Team Freestyle',
    value: 'ddpf',
    colspan: 4
  }]
]

export const OverallResultTableHeadersTeam6: ResultTableHeader<SvGFRH20Events>[] = [
  {
    text: 'Score',
    value: 'R',
    eventID: 'srsr'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'srsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    eventID: 'srdr'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'srdr',
    color: 'red'
  },

  {
    text: 'Pres',
    value: 'P',
    eventID: 'srtf'
  }, {
    text: 'Crea Rank',
    value: 'CRank',
    color: 'red',
    eventID: 'srtf'
  }, {
    text: 'Diff',
    value: 'D',
    eventID: 'srtf'
  }, {
    text: 'Diff Rank',
    value: 'DRank',
    color: 'red',
    eventID: 'srtf'
  },

  {
    text: 'Score',
    value: 'R',
    eventID: 'ddsr'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'ddsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    eventID: 'ddss'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'ddss',
    color: 'red'
  },

  {
    text: 'Pres',
    value: 'P',
    eventID: 'ddpf'
  }, {
    text: 'Crea Rank',
    value: 'CRank',
    color: 'red',
    eventID: 'ddpf'
  }, {
    text: 'Diff',
    value: 'D',
    eventID: 'ddpf'
  }, {
    text: 'Diff Rank',
    value: 'DRank',
    color: 'red',
    eventID: 'ddpf'
  },

  {
    text: 'Rank Sum',
    value: 'T',
    color: 'green'
  }, {
    text: 'Rank',
    value: 'S',
    color: 'red'
  }
]

export const OverallResultTableHeadersTeam8: ResultTableHeader<SvGFRH20Events>[] = [
  {
    text: 'Score',
    value: 'R',
    eventID: 'srsr'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'srsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    eventID: 'srdr'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'srdr',
    color: 'red'
  },

  {
    text: 'Pres',
    value: 'P',
    eventID: 'srpf'
  }, {
    text: 'Crea Rank',
    value: 'CRank',
    color: 'red',
    eventID: 'srpf'
  }, {
    text: 'Diff',
    value: 'D',
    eventID: 'srpf'
  }, {
    text: 'Diff Rank',
    value: 'DRank',
    color: 'red',
    eventID: 'srpf'
  },

  {
    text: 'Pres',
    value: 'P',
    eventID: 'srtf'
  }, {
    text: 'Crea Rank',
    value: 'CRank',
    color: 'red',
    eventID: 'srtf'
  }, {
    text: 'Diff',
    value: 'D',
    eventID: 'srtf'
  }, {
    text: 'Diff Rank',
    value: 'DRank',
    color: 'red',
    eventID: 'srtf'
  },

  {
    text: 'Score',
    value: 'R',
    eventID: 'ddsr'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'ddsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    eventID: 'ddss'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'ddss',
    color: 'red'
  },

  {
    text: 'Pres',
    value: 'P',
    eventID: 'ddsf'
  }, {
    text: 'Crea Rank',
    value: 'CRank',
    color: 'red',
    eventID: 'ddsf'
  }, {
    text: 'Diff',
    value: 'D',
    eventID: 'ddsf'
  }, {
    text: 'Diff Rank',
    value: 'DRank',
    color: 'red',
    eventID: 'ddsf'
  },

  {
    text: 'Pres',
    value: 'P',
    eventID: 'ddpf'
  }, {
    text: 'Crea Rank',
    value: 'CRank',
    color: 'red',
    eventID: 'ddpf'
  }, {
    text: 'Diff',
    value: 'D',
    eventID: 'ddpf'
  }, {
    text: 'Diff Rank',
    value: 'DRank',
    color: 'red',
    eventID: 'ddpf'
  },

  {
    text: 'Rank Sum',
    value: 'T',
    color: 'green'
  }, {
    text: 'Rank',
    value: 'S',
    color: 'red'
  }
]

export const SpeedResult = function (eventID: SvGFRH20Events): Event<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events, SvGFRH20Overalls>['result'] {
  return function (scores: { [judgeID: string]: SvGFRH20Score }, judges: [string, string][]) {
    let judgeResults: SvGFRH20Result[] = []
    let output: SvGFRH20Result = {}

    let eventObj = config.events.find(el => el.eventID === eventID)
    if (!eventObj) throw new Error('Could not find event ' + eventID)
    let eventJudgeTypes = eventObj.judges

    for (let JudgeType of judges) {
      let judgeID = JudgeType[0]
      let judgeType = JudgeType[1]

      let judgeObj = eventJudgeTypes!.find(el => el.judgeTypeID === judgeType)!
      let resultFunction = judgeObj.result

      let idx: number = judgeResults.findIndex(el => el.judgeID === judgeID)
      if (idx < 0) {
        judgeResults.push({
          judgeID,
          ...resultFunction.call(judgeObj, scores[judgeID] ?? {})
        })
      } else {
        judgeResults[idx] = {
          ...judgeResults[idx],
          ...resultFunction.call(judgeObj, scores[judgeID] ?? {})
        }
      }
    }

    // Calc a
    let as = judgeResults.map(el => el.a).filter(el => typeof el === 'number') as number[]
    output.a = IJRU1_1_0average(as)

    // Calc m
    let ms = judgeResults.map(el => el.m).filter(el => typeof el === 'number') as number[]
    output.m = IJRU1_1_0average(ms)

    output.R = roundTo((output.a ?? 0) - (output.m ?? 0), 2)

    return output
  }
}

export const SpeedRank: Event<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events, SvGFRH20Overalls>['rank'] = function (results = []) {
  // results = results.filter(el => typeof el.Y === 'number')
  results.sort(function (a, b) {
    return (b.R ?? 0) - (a.R ?? 0) // sort descending
  })

  results = results.map((el, _, arr) => ({
    ...el,
    S: arr.findIndex(obj => obj.R === el.R) + 1
  }))

  // DEV SORT BY ID
  // results.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

  return results
}

export const FreestyleResult = function (eventID: SvGFRH20Events): Event<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events, SvGFRH20Overalls>['result'] {
  return function (scores, judges) {
    let judgeResults: SvGFRH20Result[] = []
    let output: SvGFRH20Result = {}

    let eventObj = config.events.find(el => el.eventID === eventID)
    if (!eventObj) throw new Error('Could not find event ' + eventID)
    let eventJudgeTypes = eventObj.judges

    for (let JudgeType of judges) {
      let judgeID = JudgeType[0]
      let judgeType = JudgeType[1]

      let judgeObj = eventJudgeTypes.find(el => el.judgeTypeID === judgeType)
      if (!judgeObj) throw new Error('Invalid judgeType')
      let resultFunction = judgeObj.result

      let idx: number = judgeResults.findIndex(el => el.judgeID === judgeID)
      if (idx < 0) {
        judgeResults.push({
          judgeID,
          ...resultFunction.call(judgeObj, scores[judgeID] || {})
        })
      } else {
        judgeResults[idx] = {
          ...judgeResults[idx],
          ...resultFunction.call(judgeObj, scores[judgeID] || {})
        }
      }
    }

    const Ps = judgeResults.map(score => score.P).filter(el => typeof el === 'number') as number[]
    output.P = roundTo(IJRU1_1_0average(Ps) ?? 0, 2)

    const Ds = judgeResults.map(score => score.D).filter(el => typeof el === 'number') as number[]
    output.D = roundTo(IJRU1_1_0average(Ds) ?? 0, 2)

    output.R = roundTo((output.D ?? 0) + (output.P ?? 0), 2)
    output.R = output.R < 0 ? 0 : output.R

    return output
  }
}

export const FreestyleRank: Event<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events, SvGFRH20Overalls>['rank'] = function (results = []) {
  const CScores = results.map(el => el.P ?? -Infinity)
  const DScores = results.map(el => el.D ?? -Infinity)

  /* sort descending */
  CScores.sort(function (a, b) {
    return b - a // sort descending
  })
  DScores.sort(function (a, b) {
    return b - a // sort descending
  })

  results = results.map(result => {
    let CRank = CScores.findIndex(score => score === result.P) + 1
    let DRank = DScores.findIndex(score => score === result.D) + 1;

    return {
      ...result,
      CRank,
      DRank,
      T: CRank + DRank
    }
  })

  /* sort ascending on rank but descending on score if ranksums are equal */
  results.sort((a, b) => {
    if (a.T === b.T) {
      return a.participantID?.localeCompare(b.participantID ?? '') ?? 0
    } else {
      return (a.T ?? 0) - (b.T ?? 0)
    }
  })

  results = results.map((el, idx, arr) => ({
    ...el,
    S: arr.findIndex(score => score.T === el.T) + 1,
  }))

  // DEV SORT BY ID
  // results.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

  return results
}

type eventResults = {
  [eventID in SvGFRH20Events]?: SvGFRH20Result[]
}

const OverallRank = function (overallID: string) {
  return function (results: eventResults = {}) {
    let ranked: { overall: SvGFRH20Result[] } & eventResults = {
      overall: []
    }
    const overallObj = config.overalls.find(el => el.overallID === overallID)
    if (!overallObj) throw new Error('Could not find event ' + overallID)

    for (const eventID of overallObj.events) {
      const eventObj = config.events.find(el => el.eventID === eventID)
      if (!eventObj) continue
      ranked[eventID] = eventObj.rank(results[eventID]!)

      for (const scoreObj of ranked[eventID]!) {
        let idx = ranked.overall.findIndex(el => el.participantID === scoreObj.participantID)
        if (!scoreObj) continue
        console.log(scoreObj)

        if (idx >= 0) {
          ranked.overall[idx].R = roundTo((ranked.overall[idx].R ?? 0) + (scoreObj.R ?? 0), 4)
          ranked.overall[idx].T = ((ranked.overall[idx].T ?? 0) + (scoreObj.T ?? scoreObj.S ?? 0)) ?? 0
        } else {
          let R = roundTo(scoreObj.R ?? 0, 4)
          ranked.overall.push({
            participantID: scoreObj.participantID,
            R,
            T: scoreObj.T ?? scoreObj.S ?? 0
          })
        }
      }
    }

    console.log(ranked)

    ranked.overall.sort((a, b) => {
      return (a.T ?? Infinity) - (b.T ?? Infinity)
    })
    ranked.overall = ranked.overall.map((el, idx, arr) => ({
      ...el,
      S: arr.findIndex(obj => obj.T === el.T) + 1
    }))

    // DEV SORT BY ID
    // ranked.overall.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

    return ranked
  }
}


const config: Ruleset<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events, SvGFRH20Overalls> = {
  name: 'SvGF Rikshoppet 2020',
  rulesetID: 'SvGFRH20',
  events: [{
    eventID: 'srss',
    name: 'Single Rope Speed Sprint',
    judges: [SpeedJudge, SpeedHeadJudgeMasters],
    result: SpeedResult('srss'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'srse',
    name: 'Single Rope Speed Endurance',
    judges: [SpeedJudge, SpeedHeadJudgeMasters],
    result: SpeedResult('srse'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'srtu',
    name: 'Single Rope Triple Unders',
    judges: [SpeedJudge, SpeedHeadJudgeMasters],
    result: SpeedResult('srtu'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'srif',
    name: 'Single Rope Master Freestyle',
    judges: [PresentationJudgeSingleRope, DifficultyJudgeMasters],
    result: FreestyleResult('srif'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'srsr',
    name: 'Single Rope Speed Relay',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('srsr'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'srdr',
    name: 'Single Rope Double Unders Relay',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('srdr'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'ddsr',
    name: 'Double Dutch Speed Relay',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('ddsr'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'ddss',
    name: 'Double Dutch Speed Sprint',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('ddss'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'srpf',
    name: 'Single Rope Pair Freestyle',
    judges: [PresentationJudgeSingleRope, DifficultyJudgeTeams],
    result: FreestyleResult('srpf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'srtf',
    name: 'Single Rope Team Freestyle',
    judges: [PresentationJudgeSingleRope, DifficultyJudgeTeams],
    result: FreestyleResult('srtf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'ddsf',
    name: 'Double Dutch Single Freestyle',
    judges: [PresentationJudgeDoubleDutch, DifficultyJudgeTeams],
    result: FreestyleResult('ddsf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'ddpf',
    name: 'Double Dutch Pair Freestyle',
    judges: [PresentationJudgeDoubleDutch, DifficultyJudgeTeams],
    result: FreestyleResult('ddpf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }],

  overalls: [{
    overallID: 'indoverall',
    text: 'Overall',
    type: 'individual',
    groups: OverallResultTableGroupsIndividual,
    headers: OverallResultTableHeadersIndividual,
    events: ['srss', 'srse', 'srif'],
    rank: OverallRank('indoverall')
  },
  {
    overallID: 'teamoverall6',
    text: 'Rikshoppet 6:an Overall',
    type: 'team',
    groups: OverallResultTableGroupsTeam6,
    headers: OverallResultTableHeadersTeam6,
    events: ['srsr', 'srdr', 'ddsr', 'ddss', 'srtf', 'ddpf'],
    rank: OverallRank('teamoverall6')
  },
  {
    overallID: 'teamoverall8',
    text: 'Rikshoppet 8:an Overall',
    type: 'team',
    groups: OverallResultTableGroupsTeam8,
    headers: OverallResultTableHeadersTeam8,
    events: ['srsr', 'srdr', 'ddsr', 'ddss', 'srpf', 'srtf', 'ddsf', 'ddpf'],
    rank: OverallRank('teamoverall8')
  }]
}

export default config
