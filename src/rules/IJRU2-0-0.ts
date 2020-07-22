import { Ruleset, JudgeType, ResultTableHeader, ResultTableHeaders, ResultTableHeaderGroup, InputField, ResultInfo, Event } from '.'
import { roundTo, factorFormat } from '@/common'

import {
  IJRU1_1_0Events as IJRU2_0_0Events,
  IJRU1_1_0Score,
  IJRU1_1_0average,
  SpeedJudge,
  SpeedHeadJudgeMasters,
  SpeedHeadJudgeRelays,
  AthletePresentationJudge,
  DifficultyJudge,
  SpeedResult,
  SpeedRank,
  OverallRank
} from './IJRU1-1-0'

// we just remove the count for repeated skills and use the difficulty levels to track repeated skills instead
export type IJRU2_0_0Score = Omit<IJRU1_1_0Score, 'rep'>

// taac was renamed to tcaa between 1.1.0 and 2.0.0
export type IJRU2_0_0Overalls = 'isro' | 'tsro' | 'tddo' | 'tcaa'

export interface IJRU2_0_0Result extends ResultInfo {
  // speed
  a?: number // count
  m?: number // violations in SP, misses in FS

  // FS
  D?: number // diff
  DFmt?: string

  U?: number // repeated skills
  UFmt?: string

  P?: number // pres
  PFmt?: string
  aF?: number // pres component form
  aE?: number // pres component exec
  aM?: number // pres component mus

  Q?: number // ReqEl
  QFmt?: string

  M?: number // Miss
  MFmt?: string
  v?: number // violations

  R?: number // Result

  // Overall
  S?: number // rank
  N?: number // normalised score
  T?: number // rank sum
  B?: number // tie-breaker (sum of N's)
}

/* PRESENTATION */
// removes rep
export const RoutinePresentationJudge: JudgeType<IJRU2_0_0Score, IJRU2_0_0Result, IJRU2_0_0Events> = {
  name: 'Routine Presentation',
  judgeTypeID: 'Pr',
  fields: [
    {
      name: 'Entertainment +',
      fieldID: 'prenp',
      min: 0,
      step: 1
    },
    {
      name: 'Entertainment ✓',
      fieldID: 'prenc',
      min: 0,
      step: 1
    },
    {
      name: 'Entertainment -',
      fieldID: 'prenm',
      min: 0,
      step: 1
    },

    {
      name: 'Musicality +',
      fieldID: 'prmup',
      min: 0,
      step: 1
    },
    {
      name: 'Musicality ✓',
      fieldID: 'prmuc',
      min: 0,
      step: 1
    },
    {
      name: 'Musicality -',
      fieldID: 'prmum',
      min: 0,
      step: 1
    }
  ],
  result: scores => {
    const enTop = (scores.prenp ?? 0) - (scores.prenm ?? 0)
    const enBottom = (scores.prenp ?? 0) + (scores.prenc ?? 0) + (scores.prenm ?? 0)
    const enAvg = enTop / (enBottom || 1)

    const muTop = (scores.prmup ?? 0) - (scores.prmum ?? 0)
    const muBottom = (scores.prmup ?? 0) + (scores.prmuc ?? 0) + (scores.prmum ?? 0)
    const muAvg = muTop / (muBottom || 1)

    return {
      aE: roundTo((enAvg * 0.35 * 0.25), 6),
      aM: roundTo((muAvg * 0.35 * 0.25), 6)
    }
  }
}

/* REQUIRED ELEMENTS */
interface ReqElField extends InputField<IJRU2_0_0Score> {
  level?: number
}

interface ReqElJudge extends JudgeType<IJRU2_0_0Score, IJRU2_0_0Result, IJRU2_0_0Events> {
  fields: ReqElField[]
}

// include diff levels for repeated skills
export const MissJudgeSingleRopeIndividual: ReqElJudge = {
  name: 'Required Elements',
  judgeTypeID: 'R',
  fields: [
    {
      name: 'Time Violations',
      fieldID: 'tim',
      min: 0,
      max: 2
    },
    {
      name: 'Space Violations',
      fieldID: 'spc',
      min: 0
    },
    {
      name: 'Misses',
      fieldID: 'mis',
      min: 0
    },

    {
      name: 'Amount of different Gymnastics and Power Skills',
      fieldID: 'rqgyp',
      min: 0,
      max: 4
    },
    {
      name: 'Amount of different Multiples',
      fieldID: 'rqmul',
      min: 0,
      max: 4
    },
    {
      name: 'Amount of different Wraps and Releases',
      fieldID: 'rqwrr',
      min: 0,
      max: 4
    },

    ...DifficultyJudge.fields as InputField<IJRU2_0_0Score, IJRU2_0_0Events>[]
  ],
  result: function (scores) {
    if (!this) return
    const rqFields: InputField<IJRU2_0_0Score>[] = this.fields.filter(field => field.fieldID !== 'mis' && field.fieldID !== 'spc' && field.fieldID !== 'tim' && !field.level)
    const max: number = rqFields.reduce((acc, curr) => (acc + (curr.max ?? 0)), 0)

    let score = rqFields.map(field => scores[field.fieldID] ?? 0).reduce((a, b) => a + b)
    score = score > max ? max : score

    const missing = max - score

    const diffResult = DifficultyJudge.result(scores)

    return {
      Q: roundTo(1 - (missing * 0.025), 3),
      m: roundTo(1 - ((scores.mis ?? 0) * 0.025), 3),
      v: roundTo(1 - (((scores.spc ?? 0) + (scores.tim ?? 0)) * 0.025), 3),
      U: diffResult?.D ?? 0
    }
  }
}

export const MissJudgeSingleRopeTeam: JudgeType<IJRU2_0_0Score, IJRU2_0_0Result, IJRU2_0_0Events> = {
  ...MissJudgeSingleRopeIndividual,
  fields: [
    ...MissJudgeSingleRopeIndividual.fields.slice(0, 6),
    {
      name: 'Amount of different Interactions',
      fieldID: 'rqint',
      min: 0,
      max: 4
    },
    ...MissJudgeSingleRopeIndividual.fields.slice(6)
  ]
}

export const MissJudgeWheels: JudgeType<IJRU2_0_0Score, IJRU2_0_0Result, IJRU2_0_0Events> = {
  ...MissJudgeSingleRopeTeam
}

export const MissJudgeDoubleDutchSingle: JudgeType<IJRU2_0_0Score, IJRU2_0_0Result, IJRU2_0_0Events> = {
  ...MissJudgeSingleRopeIndividual,
  fields: [
    {
      name: 'Time Violations',
      fieldID: 'tim',
      min: 0
    },
    {
      name: 'Space Violations',
      fieldID: 'spc',
      min: 0
    },
    {
      name: 'Misses',
      fieldID: 'mis',
      min: 0
    },

    {
      name: 'Amount of different Gymnastics and Power Skills',
      fieldID: 'rqgyp',
      min: 0,
      max: 4
    },
    {
      name: 'Amount of different Turner Involvement Skills',
      fieldID: 'rqtis',
      min: 0,
      max: 4
    },

    ...DifficultyJudge.fields as InputField<IJRU2_0_0Score, IJRU2_0_0Events>[]
  ]
}

const DDRequiredFields = MissJudgeDoubleDutchSingle.fields.slice(0)
const rqgypIdx = DDRequiredFields.findIndex(field => field.fieldID === 'rqgyp')
DDRequiredFields.splice(rqgypIdx + 1, 0, {
  name: 'Amount of different Interactions',
  fieldID: 'rqint',
  min: 0,
  max: 4
})

export const MissJudgeDoubleDutchPair: JudgeType<IJRU2_0_0Score, IJRU2_0_0Result, IJRU2_0_0Events> = {
  ...MissJudgeDoubleDutchSingle,
  fields: DDRequiredFields
}

export const MissJudgeDoubleDutchTriad: JudgeType<IJRU2_0_0Score, IJRU2_0_0Result, IJRU2_0_0Events> = {
  ...MissJudgeDoubleDutchSingle,
  fields: DDRequiredFields
}

/* RESULT TABLES */
export const SpeedResultTableHeaders: ResultTableHeaders<IJRU2_0_0Events> = {
  headers: [{
    text: 'Score',
    value: 'R'
  }, {
    text: 'Rank',
    value: 'S',
    color: 'red'
  }]
}

export const FreestyleResultTableHeaders: ResultTableHeaders<IJRU2_0_0Events> = {
  headers: [
    {
      text: 'Diff',
      value: 'DFmt',
      color: 'grey'
    }, {
      text: 'Rep',
      value: 'UFmt',
      color: 'grey'
    }, {
      text: 'Pres',
      value: 'PFmt',
      color: 'grey'
    }, {
      text: 'Req. El',
      value: 'QFmt',
      color: 'grey'
    }, {
      text: 'Deduc',
      value: 'MFmt',
      color: 'grey'
    },

    {
      text: 'Score',
      value: 'R'
    }, {
      text: 'Rank',
      value: 'S',
      color: 'red'
    }]
}

export const OverallResultTableGroupsIndividual: ResultTableHeaderGroup<IJRU2_0_0Events>[][] = [
  [{
    text: 'Single Rope',
    value: 'sr',
    colspan: 6
  }, {
    text: 'Overall',
    value: 'oa',
    colspan: 3,
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
    colspan: 2
  }]
]

export const OverallResultTableHeadersIndividual: ResultTableHeader<IJRU2_0_0Events>[] = [
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
    text: 'Score',
    value: 'R',
    eventID: 'srif'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'srif',
    color: 'red'
  },

  {
    text: 'Normalized',
    value: 'B',
    eventID: 'overall'
  }, {
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

export const SingleRopeOverallResultTableGroupsTeam: ResultTableHeaderGroup<IJRU2_0_0Events>[][] = [
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
    text: 'Speed Relay',
    value: 'srsr',
    colspan: 2
  },
  {
    text: 'Pairs Double Unders',
    value: 'srdr',
    colspan: 2
  }, {
    text: 'Pair Freestyle',
    value: 'srpf',
    colspan: 2
  }, {
    text: 'Team Freestyle',
    value: 'srtf',
    colspan: 2
  }]
]

export const SingleRopeOverallResultTableHeadersTeam: ResultTableHeader<IJRU2_0_0Events>[] = [
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
    text: 'Score',
    value: 'R',
    eventID: 'srpf'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'srpf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    eventID: 'srtf'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'srtf',
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

export const DoubleDutchOverallResultTableGroupsTeam: ResultTableHeaderGroup<IJRU2_0_0Events>[][] = [
  [{
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
    value: 'ddsr',
    colspan: 2
  }, {
    text: 'Speed Spring',
    value: 'ddss',
    colspan: 2
  }, {
    text: 'Single Freestyle',
    value: 'ddsf',
    colspan: 2
  }, {
    text: 'Pair Freestyle',
    value: 'ddpf',
    colspan: 2
  }]
]

export const DoubleDutchOverallResultTableHeadersTeam: ResultTableHeader<IJRU2_0_0Events>[] = [
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
    text: 'Score',
    value: 'R',
    eventID: 'ddsf'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'ddsf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    eventID: 'ddpf'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'ddpf',
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

export const AllAroundResultTableGroupsTeam: ResultTableHeaderGroup<IJRU2_0_0Events>[][] = [
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
  },
  {
    text: 'Pairs Double Unders',
    value: 'srdr',
    colspan: 2
  }, {
    text: 'Pair Freestyle',
    value: 'srpf',
    colspan: 2
  }, {
    text: 'Team Freestyle',
    value: 'srtf',
    colspan: 2
  },

  {
    text: 'Speed Relay',
    value: 'ddsr',
    colspan: 2
  }, {
    text: 'Speed Spring',
    value: 'ddss',
    colspan: 2
  }, {
    text: 'Single Freestyle',
    value: 'ddsf',
    colspan: 2
  }, {
    text: 'Pair Freestyle',
    value: 'ddpf',
    colspan: 2
  }]
]

export const AllAroundResultTableHeadersTeam: ResultTableHeader<IJRU2_0_0Events>[] = [
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
    text: 'Score',
    value: 'R',
    eventID: 'srpf'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'srpf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    eventID: 'srtf'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'srtf',
    color: 'red'
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
    text: 'Score',
    value: 'R',
    eventID: 'ddsf'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'ddsf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    eventID: 'ddpf'
  }, {
    text: 'Rank',
    value: 'S',
    eventID: 'ddpf',
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

/* CALCULATIONS */
const FreestyleResult = function (eventID: IJRU2_0_0Events): Event<IJRU2_0_0Score, IJRU2_0_0Result, IJRU2_0_0Events, IJRU2_0_0Overalls>['result'] {
  return function (scores: { [judgeID: string]: IJRU2_0_0Score }, judges: [string, string][]) {
    let judgeResults: IJRU2_0_0Result[] = []
    let output: IJRU2_0_0Result = {}

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

    for (const scoreType of ['D', 'aF', 'aE', 'aM', 'm', 'v', 'Q', 'U'] as Array<keyof Omit<IJRU2_0_0Result, keyof ResultInfo>> as Array<'D' | 'aF' | 'aE' | 'aM'|  'm'|  'v'|  'Q'|  'U'>) { // what in the heck is this type...
      let scores = judgeResults.map(el => el[scoreType]).filter(el => typeof el === 'number') as number[]
      if (['m', 'v'].includes(scoreType)) output[scoreType] = roundTo(IJRU1_1_0average(scores), 4)
      else if (['aF', 'aE', 'aM'].includes(scoreType)) output[scoreType] = roundTo(IJRU1_1_0average(scores), 6)
      else output[scoreType] = roundTo(IJRU1_1_0average(scores), 2) // D, Q, U

      if (typeof output[scoreType] !== 'number' || isNaN(Number(output[scoreType]))) output[scoreType] = (['D', 'U'].includes(scoreType) ? 0 : 1)
    }

    output.M = roundTo(-(1 - (output.m ?? 0) - (output.v ?? 0)), 2) // the minus is because they're already prepped to 1- and that needs to be reversed
    // output.U = roundTo((1 - (output.r ?? 0)), 2)

    output.P = roundTo(1 + ((output.aE ?? 1) + (output.aF ?? 1) + (output.aM ?? 1)), 2)

    output.R = roundTo(((output.D ?? 0) - (output.U ?? 0)) * (output.P ?? 1) * output.M * (output.Q ?? 1), 2)
    output.R = output.R < 0 ? 0 : output.R

    // Format
    output.DFmt = `${output.D}`
    output.UFmt = `-${output.U}`
    output.PFmt = factorFormat(output.P)
    output.QFmt = factorFormat(output.Q as number)
    output.MFmt = factorFormat(output.M)

    return output
  }
}

export const FreestyleRank: Event<IJRU2_0_0Score, IJRU2_0_0Result, IJRU2_0_0Events, IJRU2_0_0Overalls>['rank'] = function (results: IJRU2_0_0Result[] = []): IJRU2_0_0Result[] {
  // results = results.filter(el => typeof el.Y === 'number')
  let tiePriority = ['R', 'M', 'Q', 'P', 'U', 'D'] as Array<keyof IJRU2_0_0Result>
  results.sort(function (a, b) {
    if (a.R !== b.R) return (b.R ?? 0) - (a.R ?? 0) // descending 100 wins over 50
    if (a.M !== b.M) return (b.M ?? 1) - (a.M ?? 1) // descending *1 wins over *.9
    if (a.Q !== b.Q) return (b.Q ?? 1) - (a.Q ?? 1) // descending *1 wins over *.9
    if (a.P !== b.P) return (b.P ?? 1) - (a.P ?? 1) // descending 1.35 wins over 0.95
    if (a.U !== b.U) return (a.U ?? 0) - (b.U ?? 0) // ascending 0 wins over 5
    if (a.D !== b.D) return (b.D ?? 0) - (a.D ?? 0) // descending 100 wins over 50
    return 0
  })

  const high = results.length > 0 ? results[0].R ?? 0 : 0
  const low = results.length > 1 ? results[results.length - 1].R ?? 0 : 0

  results = results.map((el, idx, arr) => ({
    ...el,
    S: arr.findIndex(score =>
      score.R === el.R &&
      score.M === el.M &&
      score.Q === el.Q &&
      score.P === el.P &&
      score.U === el.U &&
      score.D === el.D
    ) + 1,
    N: roundTo((((100 - 1) * ((el.R ?? 0) - low)) / ((high - low) !== 0 ? high - low : 1)) + 1, 2)
  }))

  // DEV SORT BY ID
  // results.sort((a, b) => Number(a.participant.substring(1, 4)) - Number(b.participant.substring(1, 4)))

  return results
}


/* CONFIG OBJECT */
const config: Ruleset<IJRU2_0_0Score, IJRU2_0_0Result, IJRU2_0_0Events, IJRU2_0_0Overalls> = {
  name: 'IJRU v2.0.0',
  rulesetID: 'IJRU2-0-0',
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
  },
  {
    eventID: 'srif',
    name: 'Single Rope Individual Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeSingleRopeIndividual, DifficultyJudge],
    result: FreestyleResult('srif'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders,
    rankMultiplier: 2
  },

  {
    eventID: 'srsr',
    name: 'Single Rope Speed Relay',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('srsr'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'srdr',
    name: 'Single Rope Pairs Double Unders',
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
  },
  {
    eventID: 'srpf',
    name: 'Single Rope Pair Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeSingleRopeTeam, DifficultyJudge],
    result: FreestyleResult('srpf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'srtf',
    name: 'Single Rope Team Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeSingleRopeTeam, DifficultyJudge],
    result: FreestyleResult('srtf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'ddsf',
    name: 'Double Dutch Single Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeDoubleDutchSingle, DifficultyJudge],
    result: FreestyleResult('ddsf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'ddpf',
    name: 'Double Dutch Pairs Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeDoubleDutchPair, DifficultyJudge],
    result: FreestyleResult('ddpf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'ddtf',
    name: 'Double Dutch Triad Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeDoubleDutchTriad, DifficultyJudge],
    result: FreestyleResult('ddpf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  },

  {
    eventID: 'whpf',
    name: 'Wheel Pair Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeWheels, DifficultyJudge],
    result: FreestyleResult('ddpf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }],

  overalls: [{
    overallID: 'isro',
    text: 'Individual Overall',
    type: 'individual',
    groups: OverallResultTableGroupsIndividual,
    headers: OverallResultTableHeadersIndividual,
    events: ['srss', 'srse', 'srif'],
    rank: OverallRank('isro')
  },

  {
    overallID: 'tsro',
    text: 'Team Single Rope Overall',
    type: 'team',
    groups: SingleRopeOverallResultTableGroupsTeam,
    headers: SingleRopeOverallResultTableHeadersTeam,
    events: ['srsr', 'srdr', 'srpf', 'srtf'],
    rank: OverallRank('tsro')
  },
  {
    overallID: 'tddo',
    text: 'Team Double Dutch Overall',
    type: 'team',
    groups: DoubleDutchOverallResultTableGroupsTeam,
    headers: DoubleDutchOverallResultTableHeadersTeam,
    events: ['ddsr', 'ddss', 'ddsf', 'ddpf'],
    rank: OverallRank('tddo')
  },
  {
    overallID: 'tcaa',
    text: 'Team All-Around',
    type: 'team',
    groups: AllAroundResultTableGroupsTeam,
    headers: AllAroundResultTableHeadersTeam,
    events: ['srsr', 'srdr', 'srpf', 'srtf', 'ddsr', 'ddss', 'ddsf', 'ddpf'],
    rank: OverallRank('tcaa')
  }]
}

export default config
