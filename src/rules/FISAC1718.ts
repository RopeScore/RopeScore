import { roundTo } from '@/common'
import { Ruleset, JudgeType, ResultTableHeader, ResultTableHeaders, ResultTableHeaderGroup, InputField, ScoreInfo, ResultInfo } from '.'

export type FISAC1718Events =
  // Ind
  'srss' | 'srse' | 'srtu' | 'srsf' |
  // Team SR
  'srsr' | 'srpf' | 'srtf' |
  // Team DD
  'ddsr' | 'ddsf' | 'ddpf'

export type FISAC1718Overalls = 'indoverall' | 'teamoverall'

interface PresentationJudge extends JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> {
  fields: WeightedInputField[]
}

export interface WeightedInputField extends InputField<FISAC1718Score, FISAC1718Events> {
  weight?: number
}

export interface FISAC1718Score extends ScoreInfo<FISAC1718Events> {
  // speed
  s?: number
  fStart?: number
  fSwitch?: number

  // misses
  mim?: number
  mam?: number
  spc?: number
  tim?: number
  few?: number

  // Presentation
  mob?: number
  uom?: number
  mov?: number
  fbe?: number
  ori?: number
  imp?: number

  // Required Elements
  mul?: number
  gym?: number
  pow?: number
  spd?: number
  rel?: number
  wra?: number
  pai?: number
  tis?: number
  swi?: number
  nae?: number
  aer?: number
  jis?: number

  // Diff
  l2?: number
  l3?: number
  l4?: number
  l5?: number
  l6?: number
}

export interface FISAC1718Result extends ResultInfo {
  T?: number
  W?: number
  PreY?: number
  Y?: number

  T1?: number
  T2?: number
  T3?: number
  T4?: number
  T5?: number
  Diff?: number
  Crea?: number
  PreA?: number
  A?: number

  deduc?: number

  DRank?: number
  CRank?: number
  RSum?: number
  multipliedRank?: number
  score?: number
}

export const SpeedJudge: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Speed',
  judgeTypeID: 's',
  fields: [{
    name: 'Score',
    fieldID: 's',
    min: 0,
    step: 1
  }],
  result: scores => ({
    T: scores.s
  })
}

export const SpeedHeadJudgeMasters: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Speed Head Judge',
  judgeTypeID: 'shj',
  fields: [
    ...SpeedJudge.fields,
    {
      name: 'False Start',
      fieldID: 'fStart',
      min: 0,
      max: 1,
      step: 1
    }
  ],
  result: scores => ({
    T: scores.s,
    W: ((scores.fSwitch ?? 0) + (scores.fStart ?? 0)) * 5
  })
}

export const SpeedHeadJudgeRelays: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Speed Head Judge',
  judgeTypeID: 'shj',
  fields: [
    ...SpeedHeadJudgeMasters.fields,
    {
      name: 'False Switches',
      fieldID: 'fSwitch',
      min: 0,
      max: 3,
      step: 1
    }
  ],
  result: SpeedHeadJudgeMasters.result
}

export const PresentationJudge: PresentationJudge = {
  name: 'Presentation',
  judgeTypeID: 'a',
  fields: [{
    name: 'Minor Misses',
    fieldID: 'mim',
    min: 0
  },
  {
    name: 'Major Misses',
    fieldID: 'mam',
    min: 0
  },

  {
    name: 'Music on the Beat',
    fieldID: 'mob',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 0.5
  },
  {
    name: 'Using the Music',
    fieldID: 'uom',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 0.5
  },
  {
    name: 'Movement',
    fieldID: 'mov',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 0.5
  },
  {
    name: 'Form of Body & Execution',
    fieldID: 'fbe',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 1
  },
  {
    name: 'Originality',
    fieldID: 'ori',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 1
  },
  {
    name: 'Overall Impression & Entertainment Value',
    fieldID: 'imp',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 0.5
  }],
  result: function (scores) {
    if (!this) return
    return {
      T2: roundTo(this.fields
        .filter(field => field.fieldID !== 'mim' && field.fieldID !== 'mam')
        .map(field => (scores[field.fieldID] ?? 0) * (field.weight ?? 1))
        .reduce((a, b) => a + b) * 5, 4),
      T5: ((scores.mim ?? 0) * 12.5) + ((scores.mam ?? 0) * 25)
    }
  }
}

export const RequiredElementJudgeSingleRopeMasters: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Required Elements',
  judgeTypeID: 'b',
  fields: [{
    name: 'Minor Misses',
    fieldID: 'mim',
    min: 0
  },
  {
    name: 'Major Misses',
    fieldID: 'mam',
    min: 0
  },

  {
    name: 'Amount of separate sets of at least 4 multiples',
    fieldID: 'mul',
    max: 3,
    min: 0
  },
  {
    name: 'Amount of different Gymnastics',
    fieldID: 'gym',
    max: 3,
    min: 0
  },
  {
    name: 'Amount of different Power Skills',
    fieldID: 'pow',
    max: 3,
    min: 0
  },
  {
    name: 'Amount of different Speed Dances',
    fieldID: 'spd',
    max: 3,
    min: 0
  },
  {
    name: 'Amount of different Releases',
    fieldID: 'rel',
    max: 3,
    min: 0
  },
  {
    name: 'Amount of different Wraps',
    fieldID: 'wra',
    max: 3,
    min: 0
  }],
  result: function (scores) {
    if (!this) return
    let rqFields = this.fields.filter(field => field.fieldID !== 'mim' && field.fieldID !== 'mam')
    let max = (rqFields.length * 2) + 2
    let fac = 50 / max

    let score = rqFields.map(field => scores[field.fieldID] ?? 0).reduce((a, b) => a + b)
    score = score > max ? max : score
    if (typeof scores.pai !== 'undefined' && scores.pai < 2) score -= -Number(scores.pai) + 2

    return {
      T3: roundTo(score * fac, 4),
      T5: ((scores.mim ?? 0) * 12.5) + ((scores.mam ?? 0) * 25)
    }
  }
}

export const RequiredElementJudgeSingleRopeTeams: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Required Elements',
  judgeTypeID: 'b',
  fields: [
    ...RequiredElementJudgeSingleRopeMasters.fields,
    {
      name: ' Amount of separate Pairs Interactions',
      fieldID: 'pai',
      max: 3,
      min: 0
    }
  ],
  result: RequiredElementJudgeSingleRopeMasters.result
}

export const RequiredElementJudgeDoubleDutchSingle: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Required Elements',
  judgeTypeID: 'b',
  fields: [{
    name: 'Minor Misses',
    fieldID: 'mim',
    min: 0
  },
  {
    name: 'Major Misses',
    fieldID: 'mam',
    min: 0
  },

  {
    name: 'Amount of different Turner Involvement Skills',
    fieldID: 'tis',
    max: 8,
    min: 0
  },
  {
    name: 'Amount of different Turner / Jumper Switches',
    fieldID: 'swi',
    max: 5,
    min: 0
  },
  {
    name: 'Amount of Gymnastics that are NOT aerials',
    fieldID: 'nae',
    max: 2,
    min: 0
  },
  {
    name: 'Amount of Gymnastics that are aerials',
    fieldID: 'aer',
    max: 3,
    min: 0
  },
  {
    name: 'Speed Dances',
    fieldID: 'spd',
    max: 2,
    min: 0
  },
  {
    name: 'Release',
    fieldID: 'rel',
    max: 1,
    min: 0
  }],
  result: function (scores) {
    if (!this) return
    let rqFields = this.fields.filter(field => field.fieldID !== 'mim' && field.fieldID !== 'mam')
    let max = 16
    let fac = 50 / 16

    // add all scores to scpre, except turner involement skills.
    // in double dutch releases are worth 2 pts
    let score = rqFields.map(field => field.fieldID !== 'tis' ? (scores[field.fieldID] ?? 0) * (field.fieldID === 'rel' ? 2 : 1) : 0).reduce((a, b) => a + b)
    /* aerials + not aereals = gymnastics which is max 3 */
    if ((scores.nae ?? 0) + (scores.aer ?? 0) > 3) score -= ((scores.nae ?? 0) + (scores.aer ?? 0)) - 3
    /* Max without turner involvement skills is 10 */
    score = score > max - 6 ? max - 6 : score
    /* add turner involvement skills */
    score += scores.tis ?? 0
    /* round to max */
    score = score > max ? max : score

    return {
      T3: roundTo(score * fac, 4),
      T5: ((scores.mim ?? 0) * 12.5) + ((scores.mam ?? 0) * 25)
    }
  }
}

export const RequiredElementJudgeDoubleDutchPair: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Required Elements',
  judgeTypeID: 'b',
  fields: [
    ...RequiredElementJudgeDoubleDutchSingle.fields,
    {
      name: 'Amount of Jumper Interactions',
      fieldID: 'jis',
      max: 2,
      min: 0
    }
  ],
  result: RequiredElementJudgeDoubleDutchSingle.result
}

const lMaxes = {
  l2: 10,
  l3: 20,
  l4: 30
}

const diffResult = function (l: Function) {
  return function (this: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events>, scores: Omit<FISAC1718Score, keyof ScoreInfo<FISAC1718Events>>) {
    console.log(scores)
    let output: { T1: number } = { T1: 0 }
    let fields = this.fields
    let levScores: { [fieldID: string]: number } = {}

    for (let i = fields.length - 1; i >= 0; i--) {
      const levID = fields[i].fieldID
      if (typeof levScores[levID] === 'undefined') levScores[levID] = 0

      levScores[levID] += (scores[levID] ?? 0) * l(Number(levID.substring(1)))

      if (Object.prototype.hasOwnProperty.call(lMaxes, levID)) {
        const partLevID = levID as keyof typeof lMaxes
        if (levScores[levID] > lMaxes[partLevID]) {
          if (i > 0) levScores[fields[i - 1].fieldID] = levScores[partLevID] - lMaxes[partLevID]
          levScores[partLevID] = lMaxes[partLevID]
        }
      }
    }

    output.T1 = roundTo(Object.keys(levScores).map(el => levScores[el]).reduce((a, b) => a + b) * 2.5, 4)

    return output
  }
}

export const DifficultyJudgeMasters: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Difficulty',
  judgeTypeID: 'd',
  fields: Array(5).fill(undefined).map((el, idx) => ({
    name: `Level ${idx + 2}`,
    fieldID: `l${idx + 2}`  as 'l2' | 'l3' | 'l4' | 'l5' | 'l6'
  })),
  result: diffResult((lev: number): number => (3 / (Math.pow(1.5, (6 - lev)))))
}

export const DifficultyJudgeSingleRopeTeams: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Difficulty',
  judgeTypeID: 'd',
  fields: Array(5).fill(undefined).map((el, idx) => ({
    name: `Level ${idx + 2}`,
    fieldID: `l${idx + 2}` as 'l2' | 'l3' | 'l4' | 'l5' | 'l6'
  })),
  result: diffResult((lev: number): number => (3.5 / (Math.pow(1.5, (5 - lev)))))
}

export const DifficultyJudgeDoubleDutchTeams: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Difficulty',
  judgeTypeID: 'd',
  fields: Array(4).fill(undefined).map((el, idx) => ({
    name: `Level ${idx + 2}`,
    fieldID: `l${idx + 2}` as 'l2' | 'l3' | 'l4' | 'l5'
  })),
  result: diffResult((lev: number): number => (3 / (Math.pow(1.5, (5 - lev)))))
}

export const HeadJudgeSingleRope: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Head Judge',
  judgeTypeID: 'hj',
  fields: [{
    name: 'Minor Misses',
    fieldID: 'mim',
    min: 0
  },
  {
    name: 'Major Misses',
    fieldID: 'mam',
    min: 0
  },

  {
    name: 'Space Violations',
    fieldID: 'spc',
    min: 0
  },
  {
    name: 'Time Violations',
    fieldID: 'tim',
    min: 0
  }],
  result: function (scores) {
    return {
      T5: ((scores.mim ?? 0) * 12.5) + ((scores.mam ?? 0) * 25),
      deduc: ((scores.spc ?? 0) * 12.5) + ((scores.tim ?? 0) * 25) + ((scores.few?? 0) * 25)
    }
  }
}

export const HeadJudgeDoubleDutchSingle: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Head Judge',
  judgeTypeID: 'hj',
  fields: [
    ...HeadJudgeSingleRope.fields,
    {
      name: 'Less than 3 skills',
      fieldID: 'few',
      min: 0,
      max: 3
    }
  ],
  result: HeadJudgeSingleRope.result
}

export const HeadJudgeDoubleDutchPair: JudgeType<FISAC1718Score, FISAC1718Result, FISAC1718Events> = {
  name: 'Head Judge',
  judgeTypeID: 'hj',
  fields: [
    ...HeadJudgeSingleRope.fields,
    {
      name: 'Less than 3 skills',
      fieldID: 'few',
      min: 0,
      max: 4
    }
  ],
  result: HeadJudgeSingleRope.result
}

export const SpeedResultTableHeaders: ResultTableHeaders<FISAC1718Events> = {
  headers: [{
    text: 'Score',
    value: 'PreY'
  }, {
    text: 'Rank',
    value: 'rank',
    color: 'red'
  }]
}

export const FreestyleResultTableHeaders: ResultTableHeaders<FISAC1718Events> = {
  headers: [{
    text: 'Req El',
    value: 'T3',
    color: 'grey'
  }, {
    text: 'Pres',
    value: 'T2',
    color: 'grey'
  }, {
    text: 'Diff',
    value: 'T1',
    color: 'grey'
  }, {
    text: 'Deduc',
    value: 'T5',
    color: 'grey'
  }, {
    text: 'Crea - Deduc/2',
    value: 'Crea',
    color: 'grey'
  }, {
    text: 'Crea Rank',
    value: 'CRank',
    color: 'grey'
  }, {
    text: 'Diff - Deduc/2',
    value: 'Diff',
    color: 'grey'
  }, {
    text: 'Diff Rank',
    value: 'DRank',
    color: 'grey'
  },

  {
    text: 'Score',
    value: 'A'
  }, {
    text: 'Rank Sum',
    value: 'RSum',
    color: 'green'
  }, {
    text: 'Rank',
    value: 'rank',
    color: 'red'
  }]
}

export const OverallResultTableGroupsIndividual: ResultTableHeaderGroup<FISAC1718Events>[][] = [
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
    text: 'Master Freestyle',
    value: 'srsf',
    colspan: 2
  }]
]

export const OverallResultTableHeadersIndividual: ResultTableHeader<FISAC1718Events | 'overall'>[] = [
  {
    text: 'Score',
    value: 'Y',
    eventID: 'srss'
  }, {
    text: 'Rank',
    value: 'rank',
    eventID: 'srss',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'Y',
    eventID: 'srse'
  }, {
    text: 'Rank',
    value: 'rank',
    eventID: 'srse',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'A',
    eventID: 'srsf'
  }, {
    text: 'Rank',
    value: 'multipliedRank',
    eventID: 'srsf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'score',
    eventID: 'overall'
  }, {
    text: 'Rank Sum',
    value: 'RSum',
    color: 'green',
    eventID: 'overall'
  }, {
    text: 'Rank',
    value: 'rank',
    eventID: 'overall',
    color: 'red'
  }
]

export const OverallResultTableGroupsTeam: ResultTableHeaderGroup<FISAC1718Events>[][] = [
  [{
    text: 'Single Rope',
    value: 'sr',
    colspan: 6
  }, {
    text: 'Double Dutch',
    value: 'dd',
    colspan: 6
  }, {
    text: 'Overall',
    value: 'oa',
    colspan: 3,
    rowspan: 2
  }],

  [{
    text: 'Speed Relay',
    value: 'srsr',
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
    text: 'Single Freestyle',
    value: 'ddsf',
    colspan: 2
  }, {
    text: 'Pair Freestyle',
    value: 'ddpf',
    colspan: 2
  }]
]

export const OverallResultTableHeadersTeam: ResultTableHeader<FISAC1718Events | 'overall'>[] = [
  {
    text: 'Score',
    value: 'Y',
    eventID: 'srsr'
  }, {
    text: 'Rank',
    value: 'rank',
    eventID: 'srsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'A',
    eventID: 'srpf'
  }, {
    text: 'Rank',
    value: 'rank',
    eventID: 'srpf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'A',
    eventID: 'srtf'
  }, {
    text: 'Rank',
    value: 'rank',
    eventID: 'srtf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'Y',
    eventID: 'ddsr'
  }, {
    text: 'Rank',
    value: 'rank',
    eventID: 'ddsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'A',
    eventID: 'ddsf'
  }, {
    text: 'Rank',
    value: 'rank',
    eventID: 'ddsf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'A',
    eventID: 'ddpf'
  }, {
    text: 'Rank',
    value: 'rank',
    eventID: 'ddpf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'score',
    eventID: 'overall'
  }, {
    text: 'Rank Sum',
    value: 'RSum',
    color: 'green',
    eventID: 'overall'
  }, {
    text: 'Rank',
    value: 'rank',
    eventID: 'overall',
    color: 'red'
  }
]

export const SpeedResult = function (eventID: string) {
  return function (scores: { [judgeID: string]: FISAC1718Score }, judges: [string, string][]) {
    let judgeResults: FISAC1718Result[] = []
    let output: FISAC1718Result = {}

    let eventObj = config.events.find(el => el.eventID === eventID)
    let eventJudgeTypes = eventObj!.judges

    for (let judge of judges) {
      let judgeID = judge[0]
      let judgeType = judge[1]

      let judgeObj = eventJudgeTypes!.find(el => el.judgeTypeID === judgeType)!
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

    // Calc T
    let Ts: number[] = judgeResults.map((el: FISAC1718Result): number | undefined => el.T).filter((el: number | undefined): boolean => typeof el === 'number') as number[]
    Ts.sort((a, b) => Number(a) - Number(b))

    /* special case if there's only one score entered */
    if (Ts.length === 1) {
      output.T = roundTo(Ts[0], 4)
    } else {
      let diff: number | undefined
      for (let i = 1; i < Ts.length; i++) {
        let cdiff = Math.abs(Ts[i] - Ts[i - 1])
        if (typeof diff === 'undefined' || cdiff <= diff) {
          diff = cdiff
          output.T = roundTo((Ts[i] + Ts[i - 1]) / 2, 4)
        }
      }
    }

    // Calc W
    let Ws: number[] = judgeResults.map((el: FISAC1718Result): number | undefined => el.W).filter((el: number | undefined): boolean => typeof el === 'number') as number[]
    Ws.sort((a, b) => Number(a) - Number(b))
    /* special case if there's only one score entered */
    if (Ws.length === 1) {
      output.W = roundTo(Ws[0], 4)
    } else {
      let diff: number | undefined
      for (let i = 1; i < Ws.length; i++) {
        let cdiff = Math.abs(Ws[i] - Ws[i - 1])
        if (typeof diff === 'undefined' || cdiff <= diff) {
          diff = cdiff
          output.W = roundTo((Ws[i] + Ws[i - 1]) / 2, 4)
        }
      }
    }

    output.PreY = roundTo((output.T ?? 0) - (output.W ?? 0), 4)

    output.Y = roundTo(output.PreY * ((eventObj ?? {}).scoreMultiplier ?? 1), 4)

    return output
  }
}

export const FreestyleResult = function (eventID: string) {
  return function (scores: { [judgeID: string]: FISAC1718Score }, judges: [string, string][]) {
    let judgeResults: FISAC1718Result[] = []
    let Ts: { [T: string]: number[] } = {}
    let output: FISAC1718Result = {}

    let eventObj = config.events.find(el => el.eventID === eventID)
    let eventJudgeTypes = eventObj!.judges

    for (let judge of judges) {
      let judgeID = judge[0]
      let judgeType = judge[1]

      let judgeObj = eventJudgeTypes!.find(el => el.judgeTypeID === judgeType)!
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

    // Calc T's
    for (let i of [1, 2, 3, 4, 5]) {
      let write: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' = 'T1'
      if (i === 4) {
        if (typeof output.T3 === 'undefined') { output.T4 = output.T2; continue }
        if (typeof output.T2 === 'undefined') { output.T4 = output.T3; continue }
        output.T4 = output.T2 + output.T3
        continue
      }
      if (i === 1) write = 'T1'
      if (i === 2) write = 'T2'
      if (i === 3) write = 'T3'
      if (i === 4) write = 'T4'
      if (i === 5) write = 'T5'
      Ts[write] = judgeResults.map((el: FISAC1718Result): number | undefined => el[write]).filter((el: number | undefined): boolean => typeof el === 'number') as number[]
      Ts[write].sort((a: number, b: number) => a - b)

      if (Ts[write].length === 1) {
        output[write] = Ts[write][0]
      } else {
        if (Ts[write].length > 3) {
          Ts[write].pop()
          Ts[write].shift()
        }

        output[write] = (Ts[write].reduce((a, b) => a + b, 0) / Ts[write].length) ?? 0
      }

      if (i === 5) {
        Ts.deduc = judgeResults.map(el => el.deduc).filter(el => typeof el === 'number') as number[]
        Ts.deduc.sort(function (a, b) {
          return a - b
        })

        if (Ts.deduc.length === 1) {
          output[write] = (output[write] ?? 0) + Ts.deduc[0]
        } else if (Ts.deduc.length <= 3) {
          let diff: number | undefined
          for (let j = 1; j < Ts[write].length; j++) {
            let cdiff = Math.abs(Ts[write][j] - Ts[write][j - 1])
            if (typeof diff === 'undefined' || cdiff <= diff) {
              diff = cdiff
              output[write] = (output[write] ?? 0) + (Ts.deduc[j] + Ts.deduc[j - 1]) / 2
            }
          }
        } else {
          Ts.deduc.pop()
          Ts.deduc.shift()

          output[write] = (output[write] ?? 0) + (Ts.deduc.reduce((a, b) => a + b, 0) / Ts.deduc.length) ?? 0
        }
      }

      output[write] = roundTo(output[write] ?? 0, 4) ?? 0
    }

    output.Diff = roundTo((output.T1 ?? 0) - ((output.T5 ?? 0) / 2), 4)
    output.Crea = roundTo((output.T4 ?? 0) - ((output.T5 ?? 0) / 2), 4)
    output.PreA = roundTo((output.T1 ?? 0) + (output.T4 ?? 0) - (output.T5 ?? 0), 4)
    output.A = roundTo((output.PreA ?? 0) * ((eventObj ?? {}).scoreMultiplier ?? 1), 4)

    return output
  }
}

export const SpeedRank = function (results: FISAC1718Result[] = []): FISAC1718Result[] {
  // results = results.filter(el => typeof el.Y === 'number')
  results.sort(function (a, b) {
    return (b.Y ?? 0) - (a.Y ?? 0) // sort descending
  })

  results = results.map((el, idx, arr) => ({
    ...el,
    rank: arr.findIndex(obj => obj.Y === el.Y) + 1,
    multipliedRank: (arr.findIndex(obj => obj.Y === el.Y) + 1)
  }))

  // DEV SORT BY ID
  // results.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

  return results
}

export const FreestyleRank = function (eventID: FISAC1718Events) {
  return function (results: FISAC1718Result[] = []): FISAC1718Result[] {
    const eventObj = config.events.find(el => el.eventID === eventID)
    let CScores = results.map(el => el.Crea ?? -Infinity)
    let DScores = results.map(el => el.Diff ?? -Infinity)

    /* sort descending */
    CScores.sort(function (a, b) {
      return b - a // sort descending
    })
    DScores.sort(function (a, b) {
      return b - a // sort descending
    })

    results = results.map((result, idx, arr) => {
      let CRank = CScores.findIndex(score => score === result.Crea) + 1
      let DRank = DScores.findIndex(score => score === result.Diff) + 1;
      (Object.keys(result) as Array<keyof Omit<FISAC1718Result, keyof ScoreInfo<FISAC1718Events>>>).forEach(score => {
        if (typeof result[score] !== 'number') return
        result[score] = roundTo(result[score] ?? 0, 2)
      })
      return {
        ...result,
        CRank,
        DRank,
        RSum: CRank + DRank
      }
    })

    /* sort ascending on rank but descending on score if ranksums are equal */
    results.sort(function (a, b) {
      if (a.RSum === b.RSum) {
        return (b.A ?? 0) - (a.A ?? 0)
      } else {
        return (a.RSum ?? 0) - (b.RSum ?? 0)
      }
    })

    results = results.map((el, idx, arr) => ({
      ...el,
      rank: idx + 1,
      multipliedRank: (idx + 1) * (eventObj?.rankMultiplier ?? 1)
    }))

    // DEV SORT BY ID
    // results.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

    return results
  }
}

type eventResults = {
  [eventID in FISAC1718Events]?: FISAC1718Result[]
}

export const OverallRank = function (overallID: FISAC1718Overalls) {
  return function (results: eventResults = {}) {
    let ranked: { overall: FISAC1718Result[] } & eventResults = {
      overall: []
    }
    const overallObj = config.overalls.find(el => el.overallID === overallID)
    if (!overallObj) return
    let tiePriority: (FISAC1718Events | 'overall')[] = ['overall', 'srsf', 'ddpf', 'ddsf', 'srtf', 'srpf', 'srse', 'srss', 'ddsr', 'srsr']

    for (const event of overallObj.events) {
      const eventObj = config.events.find(el => el.eventID === event)
      if (!eventObj) continue
      ranked[event] = eventObj.rank(results[event]!)

      for (const scoreObj of ranked[event]!) {
        let idx = ranked.overall.findIndex(el => el.participantID === scoreObj.participantID)

        if (idx >= 0) {
          if (typeof scoreObj.A === 'number') ranked.overall[idx].score = roundTo((ranked.overall[idx].score ?? 0) + scoreObj.A, 4)
          if (typeof scoreObj.Y === 'number') ranked.overall[idx].score = roundTo((ranked.overall[idx].score ?? 0) + scoreObj.Y, 4)
          ranked.overall[idx].RSum = (ranked.overall[idx].RSum ?? 0) + (scoreObj.multipliedRank ?? 0)
        } else {
          let score
          if (typeof scoreObj.A === 'number') score = roundTo(scoreObj.A, 4)
          if (typeof scoreObj.Y === 'number') score = roundTo(scoreObj.Y, 4)
          ranked.overall.push({
            participantID: scoreObj.participantID,
            score,
            RSum: scoreObj.multipliedRank
          })
        }
      }
    }

    console.log(ranked)

    ranked.overall.sort((a, b) => {
      if (a.RSum === b.RSum) {
        /* resolve ties */
        for (let event of tiePriority) {
          if (ranked[event]) {
            let eventA = ranked[event]?.find(el => el.participantID === a.participantID)
            let eventB = ranked[event]?.find(el => el.participantID === b.participantID)
            let field: 'Y' | 'A' = (typeof eventA?.Y === 'number' ? 'Y' : 'A')
            if (eventB?.[field] ?? 0 !== eventA?.[field] ?? 0) return (eventB?.[field] ?? 0) - (eventA?.[field] ?? 0)
          }
        }
      }
      return (a.RSum ?? 0) - (b.RSum ?? 0)
    })
    ranked.overall = ranked.overall.map((el, idx, arr) => ({
      ...el,
      rank: idx + 1
    }))

    // DEV SORT BY ID
    // ranked.overall.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

    return ranked
  }
}

const config: Ruleset<FISAC1718Score, FISAC1718Result, FISAC1718Events, FISAC1718Overalls> = {
  name: 'FISAC-IRSF 2017-2018',
  rulesetID: 'FISAC1718',
  events: [{
    eventID: 'srss',
    name: 'Single Rope Speed Sprint',
    judges: [SpeedJudge, SpeedHeadJudgeMasters],
    result: SpeedResult('srss'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    scoreMultiplier: 5,
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
    eventID: 'srsf',
    name: 'Single Rope Master Freestyle',
    judges: [PresentationJudge, RequiredElementJudgeSingleRopeMasters, DifficultyJudgeMasters, HeadJudgeSingleRope],
    result: FreestyleResult('srsf'),
    rank: FreestyleRank('srsf'),
    headers: FreestyleResultTableHeaders,
    scoreMultiplier: 2,
    rankMultiplier: 2
  }, {
    eventID: 'srsr',
    name: 'Single Rope Speed Relay',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('srsr'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    scoreMultiplier: 3,
    multipleEntry: true
  }, {
    eventID: 'ddsr',
    name: 'Double Dutch Speed Relay',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('ddsr'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    scoreMultiplier: 2,
    multipleEntry: true
  }, {
    eventID: 'srpf',
    name: 'Single Rope Pair Freestyle',
    judges: [PresentationJudge, RequiredElementJudgeSingleRopeTeams, DifficultyJudgeSingleRopeTeams, HeadJudgeSingleRope],
    result: FreestyleResult('srpf'),
    rank: FreestyleRank('srpf'),
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'srtf',
    name: 'Single Rope Team Freestyle',
    judges: [PresentationJudge, RequiredElementJudgeSingleRopeTeams, DifficultyJudgeSingleRopeTeams, HeadJudgeSingleRope],
    result: FreestyleResult('srtf'),
    rank: FreestyleRank('srtf'),
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'ddsf',
    name: 'Double Dutch Single Freestyle',
    judges: [PresentationJudge, RequiredElementJudgeDoubleDutchSingle, DifficultyJudgeDoubleDutchTeams, HeadJudgeDoubleDutchSingle],
    result: FreestyleResult('ddsf'),
    rank: FreestyleRank('ddsf'),
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'ddpf',
    name: 'Double Dutch Pair Freestyle',
    judges: [PresentationJudge, RequiredElementJudgeDoubleDutchPair, DifficultyJudgeDoubleDutchTeams, HeadJudgeDoubleDutchPair],
    result: FreestyleResult('ddpf'),
    rank: FreestyleRank('ddpf'),
    headers: FreestyleResultTableHeaders
  }],

  overalls: [{
    overallID: 'indoverall',
    text: 'Overall',
    type: 'individual',
    groups: OverallResultTableGroupsIndividual,
    headers: OverallResultTableHeadersIndividual,
    events: ['srss', 'srse', 'srsf'],
    rank: OverallRank('indoverall')
  },
  {
    overallID: 'teamoverall',
    text: 'Overall',
    type: 'team',
    groups: OverallResultTableGroupsTeam,
    headers: OverallResultTableHeadersTeam,
    events: ['srsr', 'ddsr', 'srpf', 'srtf', 'ddsf', 'ddpf'],
    rank: OverallRank('teamoverall')
  }]
}

export default config
