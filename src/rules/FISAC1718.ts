import { roundTo } from '@/common'
import { Ruleset, Judge, ResultTableHeader, ResultTableHeaders, ResultTableHeaderGroup, InputField, ScoreInfo, Event } from './score.worker'

interface PresentationJudge extends Judge {
  fields: WeightedInputField[]
}

export interface WeightedInputField extends InputField {
  weight?: number
}

export interface FISACScore extends ScoreInfo {
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

export interface FISACResult {
  judgeID?: string

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
}

export const SpeedJudge: Judge = {
  name: 'Speed',
  id: 's',
  fields: [{
    name: 'Score',
    id: 's',
    min: 0,
    step: 1
  }],
  result: scores => ({
    T: scores.s as number
  })
}

export const SpeedHeadJudgeMasters: Judge = {
  name: 'Speed Head Judge',
  id: 'shj',
  fields: [
    ...SpeedJudge.fields,
    {
      name: 'False Start',
      id: 'fStart',
      min: 0,
      max: 1,
      step: 1
    }
  ],
  result: scores => ({
    T: scores.s as number,
    W: ((scores.fSwitch as number || 0) + (scores.fStart as number || 0)) * 5
  })
}

export const SpeedHeadJudgeRelays: Judge = {
  name: 'Speed Head Judge',
  id: 'shj',
  fields: [
    ...SpeedHeadJudgeMasters.fields,
    {
      name: 'False Switches',
      id: 'fSwitch',
      min: 0,
      max: 3,
      step: 1
    }
  ],
  result: SpeedHeadJudgeMasters.result
}

export const PresentationJudge: PresentationJudge = {
  name: 'Presentation',
  id: 'a',
  fields: [{
    name: 'Minor Misses',
    id: 'mim',
    min: 0
  },
  {
    name: 'Major Misses',
    id: 'mam',
    min: 0
  },

  {
    name: 'Music on the Beat',
    id: 'mob',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 0.5
  },
  {
    name: 'Using the Music',
    id: 'uom',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 0.5
  },
  {
    name: 'Movement',
    id: 'mov',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 0.5
  },
  {
    name: 'Form of Body & Execution',
    id: 'fbe',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 1
  },
  {
    name: 'Originality',
    id: 'ori',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 1
  },
  {
    name: 'Overall Impression & Entertainment Value',
    id: 'imp',
    min: 0,
    max: 10,
    step: 0.5,
    weight: 0.5
  }],
  result: function (scores) {
    if (!this) return
    return {
      T2: roundTo(this.fields
        .filter(field => field.id !== 'mim' && field.id !== 'mam')
        .map(field => (scores[field.id] || 0) * (field.weight || 1))
        .reduce((a, b) => a + b) * 5, 4),
      T5: ((scores.mim as number || 0) * 12.5) + ((scores.mam as number || 0) * 25)
    }
  }
}

export const RequiredElementJudgeSingleRopeMasters: Judge = {
  name: 'Required Elements',
  id: 'b',
  fields: [{
    name: 'Minor Misses',
    id: 'mim',
    min: 0
  },
  {
    name: 'Major Misses',
    id: 'mam',
    min: 0
  },

  {
    name: 'Amount of separate sets of at least 4 multiples',
    id: 'mul',
    max: 3,
    min: 0
  },
  {
    name: 'Amount of different Gymnastics',
    id: 'gym',
    max: 3,
    min: 0
  },
  {
    name: 'Amount of different Power Skills',
    id: 'pow',
    max: 3,
    min: 0
  },
  {
    name: 'Amount of different Speed Dances',
    id: 'spd',
    max: 3,
    min: 0
  },
  {
    name: 'Amount of different Releases',
    id: 'rel',
    max: 3,
    min: 0
  },
  {
    name: 'Amount of different Wraps',
    id: 'wra',
    max: 3,
    min: 0
  }],
  result: function (scores) {
    if (!this) return
    let rqFields = this.fields.filter(field => field.id !== 'mim' && field.id !== 'mam')
    let max = (rqFields.length * 2) + 2
    let fac = 50 / max

    let score = rqFields.map(el => scores[el.id] || 0).reduce((a, b) => a + b)
    score = score > max ? max : score
    if (typeof scores.pai !== 'undefined' && scores.pai < 2) score -= -Number(scores.pai) + 2

    return {
      T3: roundTo(score * fac, 4),
      T5: ((scores.mim as number || 0) * 12.5) + ((scores.mam as number || 0) * 25)
    }
  }
}

export const RequiredElementJudgeSingleRopeTeams: Judge = {
  name: 'Required Elements',
  id: 'b',
  fields: [
    ...RequiredElementJudgeSingleRopeMasters.fields,
    {
      name: ' Amount of separate Pairs Interactions',
      id: 'pai',
      max: 3,
      min: 0
    }
  ],
  result: RequiredElementJudgeSingleRopeMasters.result
}

export const RequiredElementJudgeDoubleDutchSingle: Judge = {
  name: 'Required Elements',
  id: 'b',
  fields: [{
    name: 'Minor Misses',
    id: 'mim',
    min: 0
  },
  {
    name: 'Major Misses',
    id: 'mam',
    min: 0
  },

  {
    name: 'Amount of different Turner Involvement Skills',
    id: 'tis',
    max: 8,
    min: 0
  },
  {
    name: 'Amount of different Turner / Jumper Switches',
    id: 'swi',
    max: 5,
    min: 0
  },
  {
    name: 'Amount of Gymnastics that are NOT aerials',
    id: 'nae',
    max: 2,
    min: 0
  },
  {
    name: 'Amount of Gymnastics that are aerials',
    id: 'aer',
    max: 3,
    min: 0
  },
  {
    name: 'Speed Dances',
    id: 'spd',
    max: 2,
    min: 0
  },
  {
    name: 'Release',
    id: 'rel',
    max: 1,
    min: 0
  }],
  result: function (scores) {
    if (!this) return
    let rqFields = this.fields.filter(field => field.id !== 'mim' && field.id !== 'mam')
    let max = 16
    let fac = 50 / 16

    // add all scores to scpre, except turner involement skills.
    // in double dutch releases are worth 2 pts
    let score = rqFields.map(el => el.id !== 'tis' ? (scores[el.id] || 0) * (el.id === 'rel' ? 2 : 1) : 0).reduce((a, b) => a + b)
    /* aerials + not aereals = gymnastics which is max 3 */
    if ((scores.nae || 0) + (scores.aer || 0) > 3) score -= ((scores.nae || 0) + (scores.aer || 0)) - 3
    /* Max without turner involvement skills is 10 */
    score = score > max - 6 ? max - 6 : score
    /* add turner involvement skills */
    score += scores.tis || 0
    /* round to max */
    score = score > max ? max : score

    return {
      T3: roundTo(score * fac, 4),
      T5: ((scores.mim as number || 0) * 12.5) + ((scores.mam as number || 0) * 25)
    }
  }
}

export const RequiredElementJudgeDoubleDutchPair: Judge = {
  name: 'Required Elements',
  id: 'b',
  fields: [
    ...RequiredElementJudgeDoubleDutchSingle.fields,
    {
      name: 'Amount of Jumper Interactions',
      id: 'jis',
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
  return function (scores: FISACScore) {
    console.log(scores)
    let output = {}
    let fields = this.fields
    let levScores = {}

    for (let i = fields.length - 1; i >= 0; i--) {
      if (typeof levScores[fields[i].id] === 'undefined') levScores[fields[i].id] = 0
      levScores[fields[i].id] += (scores[fields[i].id] || 0) * l(Number(fields[i].id.substring(1)))

      if (lMaxes[fields[i].id] && levScores[fields[i].id] > lMaxes[fields[i].id]) {
        if (i > 0) levScores[fields[i - 1].id] = levScores[fields[i].id] - lMaxes[fields[i].id]
        levScores[fields[i].id] = lMaxes[fields[i].id]
      }
    }

    output.T1 = roundTo(Object.keys(levScores).map(el => levScores[el]).reduce((a, b) => a + b) * 2.5, 4)

    return output
  }
}

export const DifficultyJudgeMasters: Judge = {
  name: 'Difficulty',
  id: 'd',
  fields: Array(5).fill(undefined).map((el, idx) => ({
    name: `Level ${idx + 2}`,
    id: `l${idx + 2}`
  })),
  result: diffResult((lev: number): number => (3 / (Math.pow(1.5, (6 - lev)))))
}

export const DifficultyJudgeSingleRopeTeams: Judge = {
  name: 'Difficulty',
  id: 'd',
  fields: Array(5).fill(undefined).map((el, idx) => ({
    name: `Level ${idx + 2}`,
    id: `l${idx + 2}`
  })),
  result: diffResult((lev: number): number => (3.5 / (Math.pow(1.5, (5 - lev)))))
}

export const DifficultyJudgeDoubleDutchTeams: Judge = {
  name: 'Difficulty',
  id: 'd',
  fields: Array(4).fill(undefined).map((el, idx) => ({
    name: `Level ${idx + 2}`,
    id: `l${idx + 2}`
  })),
  result: diffResult((lev: number): number => (3 / (Math.pow(1.5, (5 - lev)))))
}

export const HeadJudgeSingleRope: Judge = {
  name: 'Head Judge',
  id: 'hj',
  fields: [{
    name: 'Minor Misses',
    id: 'mim',
    min: 0
  },
  {
    name: 'Major Misses',
    id: 'mam',
    min: 0
  },

  {
    name: 'Space Violations',
    id: 'spc',
    min: 0
  },
  {
    name: 'Time Violations',
    id: 'tim',
    min: 0
  }],
  result: function (scores) {
    return {
      T5: ((scores.mim as number || 0) * 12.5) + ((scores.mam as number || 0) * 25),
      deduc: ((scores.spc as number || 0) * 12.5) + ((scores.tim as number || 0) * 25) + ((scores.few as number || 0) * 25)
    }
  }
}

export const HeadJudgeDoubleDutchSingle: Judge = {
  name: 'Head Judge',
  id: 'hj',
  fields: [
    ...HeadJudgeSingleRope.fields,
    {
      name: 'Less than 3 skills',
      id: 'few',
      min: 0,
      max: 3
    }
  ],
  result: HeadJudgeSingleRope.result
}

export const HeadJudgeDoubleDutchPair: Judge = {
  name: 'Head Judge',
  id: 'hj',
  fields: [
    ...HeadJudgeSingleRope.fields,
    {
      name: 'Less than 3 skills',
      id: 'few',
      min: 0,
      max: 4
    }
  ],
  result: HeadJudgeSingleRope.result
}

export const SpeedResultTableHeaders: ResultTableHeaders = {
  headers: [{
    text: 'Score',
    value: 'PreY'
  }, {
    text: 'Rank',
    value: 'rank',
    color: 'red'
  }]
}

export const FreestyleResultTableHeaders: ResultTableHeaders = {
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

export const OverallResultTableGroupsIndividual: ResultTableHeaderGroup[][] = [
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

export const OverallResultTableHeadersIndividual: ResultTableHeader[] = [
  {
    text: 'Score',
    value: 'Y',
    event: 'srss'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srss',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'Y',
    event: 'srse'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srse',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'A',
    event: 'srsf'
  }, {
    text: 'Rank',
    value: 'multipliedRank',
    event: 'srsf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'score',
    event: 'overall'
  }, {
    text: 'Rank Sum',
    value: 'RSum',
    color: 'green',
    event: 'overall'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'overall',
    color: 'red'
  }
]

export const OverallResultTableGroupsTeam: ResultTableHeaderGroup[][] = [
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

export const OverallResultTableHeadersTeam: ResultTableHeader[] = [
  {
    text: 'Score',
    value: 'Y',
    event: 'srsr'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'A',
    event: 'srpf'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srpf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'A',
    event: 'srtf'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srtf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'Y',
    event: 'ddsr'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'ddsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'A',
    event: 'ddsf'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'ddsf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'A',
    event: 'ddpf'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'ddpf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'score',
    event: 'overall'
  }, {
    text: 'Rank Sum',
    value: 'RSum',
    color: 'green',
    event: 'overall'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'overall',
    color: 'red'
  }
]

export const SpeedResult = function (event: string) {
  return function (scores: { [judgeID: string]: FISACScore }, judges: [string, string]) {
    let judgeResults: FISACResult[] = []
    let output: FISACResult = {}

    let eventObj = config.events.find(el => el.id === event)
    let eventJudgeTypes = eventObj!.judges

    for (let judge of judges) {
      let judgeID = judge[0]
      let judgeType = judge[1]

      let judgeObj = eventJudgeTypes!.find(el => el.id === judgeType)!
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
    let Ts: number[] = judgeResults.map((el: FISACResult): number | undefined => el.T).filter((el: number | undefined): boolean => typeof el === 'number')
    Ts.sort((a, b) => Number(a) - Number(b))

    /* special case if there's only one score entered */
    if (Ts.length === 1) {
      output.T = roundTo(Ts[0], 4)
    } else {
      let diff: number
      for (let i = 1; i < Ts.length; i++) {
        let cdiff = Math.abs(Ts[i] - Ts[i - 1])
        if (typeof diff === 'undefined' || cdiff <= diff) {
          diff = cdiff
          output.T = roundTo((Ts[i] + Ts[i - 1]) / 2, 4)
        }
      }
    }

    // Calc W
    let Ws: number[] = judgeResults.map((el: FISACResult): number | undefined => el.W).filter((el: number | undefined): boolean => typeof el === 'number')
    Ws.sort((a, b) => Number(a) - Number(b))
    /* special case if there's only one score entered */
    if (Ws.length === 1) {
      output.W = roundTo(Ws[0], 4)
    } else {
      let diff: number
      for (let i = 1; i < Ws.length; i++) {
        let cdiff = Math.abs(Ws[i] - Ws[i - 1])
        if (typeof diff === 'undefined' || cdiff <= diff) {
          diff = cdiff
          output.W = roundTo((Ws[i] + Ws[i - 1]) / 2, 4)
        }
      }
    }

    output.PreY = roundTo((output.T as number || 0) - (output.W as number || 0), 4)

    output.Y = roundTo(output.PreY * ((eventObj || {}).scoreMultiplier as number || 1), 4)

    return output
  }
}

export const FreestyleResult = function (event: string) {
  return function (scores: { [judgeID: string]: FISACScore }, judges: [string, string]) {
    let judgeResults: FISACResult[] = []
    let Ts: { [T: string]: number[] } = {}
    let output: FISACResult = {}

    let eventObj = config.events.find(el => el.id === event)
    let eventJudgeTypes = eventObj!.judges

    for (let judge of judges) {
      let judgeID = judge[0]
      let judgeType = judge[1]

      let judgeObj = eventJudgeTypes!.find(el => el.id === judgeType)!
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
      let write: string = 'T1'
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
      Ts[write] = judgeResults.map((el: FISACResult): number | undefined => el[write]).filter((el: number | undefined): boolean => typeof el === 'number')
      Ts[write].sort((a: number, b: number) => a - b)

      if (Ts[write].length === 1) {
        output[write] = Ts[write][0]
      } else {
        if (Ts[write].length > 3) {
          Ts[write].pop()
          Ts[write].shift()
        }

        output[write] = (Ts[write].reduce((a, b) => a + b, 0) / Ts[write].length) || 0
      }

      if (i === 5) {
        Ts.deduc = judgeResults.map(el => el['deduc']).filter(el => typeof el === 'number')
        Ts.deduc.sort(function (a, b) {
          return a - b
        })

        if (Ts.deduc.length === 1) {
          output[write] += Ts.deduc[0]
        } else if (Ts.deduc.length <= 3) {
          let diff: number
          for (let j = 1; j < Ts[write].length; j++) {
            let cdiff = Math.abs(Ts[write][j] - Ts[write][j - 1])
            if (typeof diff === 'undefined' || cdiff <= diff) {
              diff = cdiff
              output[write] += (Ts.deduc[j] + Ts.deduc[j - 1]) / 2
            }
          }
        } else {
          Ts.deduc.pop()
          Ts.deduc.shift()

          output[write] += (Ts.deduc.reduce((a, b) => a + b, 0) / Ts.deduc.length) || 0
        }
      }

      output[write] = roundTo(output[write], 4) || 0
    }

    output.Diff = roundTo((output.T1 || 0) - ((output.T5 || 0) / 2), 4)
    output.Crea = roundTo((output.T4 || 0) - ((output.T5 || 0) / 2), 4)
    output.PreA = roundTo((output.T1 || 0) + (output.T4 || 0) - (output.T5 || 0), 4)
    output.A = roundTo((output.PreA || 0) * ((eventObj || {}).scoreMultiplier || 1), 4)

    return output
  }
}

export const SpeedRank = function (results: any[] = []): any[] {
  // results = results.filter(el => typeof el.Y === 'number')
  results.sort(function (a, b) {
    return b.Y - a.Y // sort descending
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

export const FreestyleRank = function (event: string) {
  return function (results: any[] = []): any[] {
    const eventObj = config.events.find(el => el.id === event) || {}
    let CScores = results.map(el => el.Crea)
    let DScores = results.map(el => el.Diff)

    /* sort descending */
    CScores.sort(function (a, b) {
      return b - a // sort descending
    })
    DScores.sort(function (a, b) {
      return b - a // sort descending
    })

    results = results.map((el, idx, arr) => {
      let CRank = CScores.findIndex(score => score === el.Crea) + 1
      let DRank = DScores.findIndex(score => score === el.Diff) + 1
      Object.keys(el).forEach(score => {
        if (typeof el[score] !== 'number') return
        el[score] = roundTo(el[score], 2)
      })
      return {
        ...el,
        CRank,
        DRank,
        RSum: CRank + DRank
      }
    })

    /* sort ascending on rank but descending on score if ranksums are equal */
    results.sort(function (a, b) {
      if (a.RSum === b.RSum) {
        return b.A - a.A
      } else {
        return a.RSum - b.RSum
      }
    })

    results = results.map((el, idx, arr) => ({
      ...el,
      rank: idx + 1,
      multipliedRank: (idx + 1) * (eventObj.rankMultiplier || 1)
    }))

    // DEV SORT BY ID
    // results.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

    return results
  }
}

export const OverallRank = function (overall: string) {
  return function (results = {}) {
    let ranked = {
      overall: []
    }
    const overallObj = config.overalls.find(el => el.id === overall)
    let tiePriority = ['overall', 'srsf', 'ddpf', 'ddsf', 'srtf', 'srpf', 'srse', 'srss', 'ddsr', 'srsr']

    for (const event of overallObj.events) {
      const eventObj = config.events.find(el => el.id === event)
      ranked[event] = eventObj.rank(results[event])

      for (const scoreObj of ranked[event]) {
        let idx = ranked.overall.findIndex(el => el.participant === scoreObj.participant)

        if (idx >= 0) {
          if (typeof scoreObj.A === 'number') ranked.overall[idx].score = roundTo(ranked.overall[idx].score + scoreObj.A, 4)
          if (typeof scoreObj.Y === 'number') ranked.overall[idx].score = roundTo(ranked.overall[idx].score + scoreObj.Y, 4)
          ranked.overall[idx].RSum += scoreObj.multipliedRank
        } else {
          let score
          if (typeof scoreObj.A === 'number') score = roundTo(scoreObj.A, 4)
          if (typeof scoreObj.Y === 'number') score = roundTo(scoreObj.Y, 4)
          ranked.overall.push({
            participant: scoreObj.participant,
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
            let eventA = ranked[event].find(el => el.participant === a.participant)
            let eventB = ranked[event].find(el => el.participant === b.participant)
            let field = (typeof eventA.Y === 'number' ? 'Y' : 'A')
            if (eventB[field] !== eventA[field]) return eventB[field] - eventA[field]
          }
        }
      }
      return a.RSum - b.RSum
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

const config: Ruleset = {
  name: 'FISAC-IRSF 2017-2018',
  id: 'FISAC1718',
  events: [{
    id: 'srss',
    name: 'Single Rope Speed Sprint',
    judges: [SpeedJudge, SpeedHeadJudgeMasters],
    result: SpeedResult('srss'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    scoreMultiplier: 5,
    multipleEntry: true
  }, {
    id: 'srse',
    name: 'Single Rope Speed Endurance',
    judges: [SpeedJudge, SpeedHeadJudgeMasters],
    result: SpeedResult('srse'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    id: 'srtu',
    name: 'Single Rope Triple Unders',
    judges: [SpeedJudge, SpeedHeadJudgeMasters],
    result: SpeedResult('srtu'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    id: 'srsf',
    name: 'Single Rope Master Freestyle',
    judges: [PresentationJudge, RequiredElementJudgeSingleRopeMasters, DifficultyJudgeMasters, HeadJudgeSingleRope],
    result: FreestyleResult('srsf'),
    rank: FreestyleRank('srsf'),
    headers: FreestyleResultTableHeaders,
    scoreMultiplier: 2,
    rankMultiplier: 2
  }, {
    id: 'srsr',
    name: 'Single Rope Speed Relay',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('srsr'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    scoreMultiplier: 3,
    multipleEntry: true
  }, {
    id: 'ddsr',
    name: 'Double Dutch Speed Relay',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('ddsr'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    scoreMultiplier: 2,
    multipleEntry: true
  }, {
    id: 'srpf',
    name: 'Single Rope Pair Freestyle',
    judges: [PresentationJudge, RequiredElementJudgeSingleRopeTeams, DifficultyJudgeSingleRopeTeams, HeadJudgeSingleRope],
    result: FreestyleResult('srpf'),
    rank: FreestyleRank('srpf'),
    headers: FreestyleResultTableHeaders
  }, {
    id: 'srtf',
    name: 'Single Rope Team Freestyle',
    judges: [PresentationJudge, RequiredElementJudgeSingleRopeTeams, DifficultyJudgeSingleRopeTeams, HeadJudgeSingleRope],
    result: FreestyleResult('srtf'),
    rank: FreestyleRank('srtf'),
    headers: FreestyleResultTableHeaders
  }, {
    id: 'ddsf',
    name: 'Double Dutch Single Freestyle',
    judges: [PresentationJudge, RequiredElementJudgeDoubleDutchSingle, DifficultyJudgeDoubleDutchTeams, HeadJudgeDoubleDutchSingle],
    result: FreestyleResult('ddsf'),
    rank: FreestyleRank('ddsf'),
    headers: FreestyleResultTableHeaders
  }, {
    id: 'ddpf',
    name: 'Double Dutch Pair Freestyle',
    judges: [PresentationJudge, RequiredElementJudgeDoubleDutchPair, DifficultyJudgeDoubleDutchTeams, HeadJudgeDoubleDutchPair],
    result: FreestyleResult('ddpf'),
    rank: FreestyleRank('ddpf'),
    headers: FreestyleResultTableHeaders
  }],

  overalls: [{
    id: 'indoverall',
    text: 'Overall',
    type: 'individual',
    groups: OverallResultTableGroupsIndividual,
    headers: OverallResultTableHeadersIndividual,
    events: ['srss', 'srse', 'srsf'],
    rank: OverallRank('indoverall')
  },
  {
    id: 'teamoverall',
    text: 'Overall',
    type: 'team',
    groups: OverallResultTableGroupsTeam,
    headers: OverallResultTableHeadersTeam,
    events: ['srsr', 'ddsr', 'srpf', 'srtf', 'ddsf', 'ddpf'],
    rank: OverallRank('teamoverall')
  }]
}

export default config
