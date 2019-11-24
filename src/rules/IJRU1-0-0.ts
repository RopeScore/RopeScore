import { roundTo } from '@/common'
import { Ruleset, Judge, ResultTableHeader, ResultTableHeaders, ResultTableHeaderGroup, InputField } from './score.worker'

import {
  SpeedJudge as FISACSpeedJudge,
  SpeedHeadJudgeMasters as FISACSpeedHeadJudgeMasters,
  SpeedHeadJudgeRelays as FISACSpeedHeadJudgeRelays
} from './FISAC1718'

const average = (scores: number[]): number => {
  // sort ascending
  scores.sort(function (a, b) {
    return a - b
  })

  if (scores.length >= 4) {
    scores.pop()
    scores.shift()

    let score = scores.reduce((a, b) => a + b)
    return score / scores.length
  } else if (scores.length === 3) {
    let diff: number
    let output: number
    for (let i = 1; i < scores.length; i++) {
      let cdiff = Math.abs(scores[i] - scores[i - 1])
      if (typeof diff === 'undefined' || cdiff <= diff) {
        diff = cdiff
        output = roundTo((scores[i] + scores[i - 1]) / 2, 4)
      }
    }
    return output
  } else if (scores.length === 2) {
    let score = scores.reduce((a, b) => a + b)
    return score / scores.length
  } else {
    return scores[0]
  }
}

interface DifficultyField extends InputField {
  level: number
}

interface DifficultyJudge extends Judge {
  fields: DifficultyField[]
}

/* SPEED */
export const SpeedJudge: Judge = {
  ...FISACSpeedJudge,
  result: scores => ({
    a: scores.s as number
  })
}

export const SpeedHeadJudgeMasters: Judge = {
  ...FISACSpeedHeadJudgeMasters,
  result: scores => ({
    a: scores.s as number,
    m: ((scores.fStart as number || 0) + (scores.fSwitch as number || 0)) * 10
  })
}

export const SpeedHeadJudgeRelays: Judge = {
  ...FISACSpeedHeadJudgeRelays,
  result: SpeedHeadJudgeMasters.result
}

/* PRESENTATION */
export const AthletePresentationJudge: Judge = {
  name: 'Athlete Presentation',
  id: 'Pa',
  fields: [
    {
      name: 'Misses',
      id: 'mis',
      min: 0
    },

    {
      name: 'Form and Execution +',
      id: 'pafep',
      min: 0,
      step: 1
    },
    {
      name: 'Form and Execution ✓',
      id: 'pafec',
      min: 0,
      step: 1
    },
    {
      name: 'Form and Execution -',
      id: 'pafem',
      min: 0,
      step: 1
    }
  ],
  result: scores => {
    let top = (scores.pafep || 0) - (scores.pafem || 0)
    let bottom = (scores.pafep || 0) + (scores.pafec || 0) + (scores.pafem || 0)
    let avg = top / (bottom || 1)

    let P = 1 + (avg * 0.35)
    return {
      m: roundTo(1 - ((scores.mis || 0) * 0.05), 2),
      P: roundTo(P, 2)
    }
  }
}

export const RoutinePresentationJudge: Judge = {
  name: 'Routine Presentation',
  id: 'Pr',
  fields: [
    {
      name: 'Entertainment +',
      id: 'prenp',
      min: 0,
      step: 1
    },
    {
      name: 'Entertainment ✓',
      id: 'prenc',
      min: 0,
      step: 1
    },
    {
      name: 'Entertainment -',
      id: 'prenm',
      min: 0,
      step: 1
    },

    {
      name: 'Musicality +',
      id: 'prmup',
      min: 0,
      step: 1
    },
    {
      name: 'Musicality ✓',
      id: 'prmuc',
      min: 0,
      step: 1
    },
    {
      name: 'Musicality -',
      id: 'prmum',
      min: 0,
      step: 1
    }
  ],
  result: scores => {
    let enTop = (scores.prenp || 0) - (scores.prenm || 0)
    let enBottom = (scores.prenp || 0) + (scores.prenc || 0) + (scores.prenm || 0)

    let muTop = (scores.prmup || 0) - (scores.prmum || 0)
    let muBottom = (scores.prmup || 0) + (scores.prmuc || 0) + (scores.prmum || 0)

    let top = (enTop || 0) + (muTop || 0)
    let bottom = (enBottom || 0) + (muBottom || 0)

    let avg = top / (bottom || 1)

    let P = 1 + (avg * 0.35)
    return {
      P: roundTo(P, 2)
    }
  }
}

/* REQUIRED ELEMENTS */
export const MissJudgeSingleRopeIndividual: Judge = {
  name: 'Misses',
  id: 'M',
  fields: [
    {
      name: 'Misses',
      id: 'mis',
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
      min: 0,
      max: 2
    },

    {
      name: 'Amount of different Multiples',
      id: 'rqmul',
      min: 0,
      max: 4
    },
    {
      name: 'Amount of different Gymnastics and Power Skills',
      id: 'rqgyp',
      min: 0,
      max: 4
    },
    {
      name: 'Amount of different Wraps and Releases',
      id: 'rqwrr',
      min: 0,
      max: 4
    }
  ],
  result: function (scores) {
    if (!this) return
    let rqFields: InputField[] = this.fields.filter(field => field.id !== 'mis' && field.id !== 'spc' && field.id !== 'tim')
    let max: number = rqFields.reduce((acc, curr) => (acc + (curr.max || 0)), 0)

    let score = rqFields.map(el => scores[el.id] || 0).reduce((a, b) => a + b)
    score = score > max ? max : score

    let missing = max - score

    let deduc = missing * 0.025

    return {
      Q: roundTo(1 - deduc, 3),
      m: roundTo(1 - ((scores.mis || 0) * 0.05), 2),
      v: roundTo(1 - (((scores.spc || 0) + (scores.tim || 0)) * 0.05), 2)
    }
  }
}

export const MissJudgeSingleRopeTeam: Judge = {
  ...MissJudgeSingleRopeIndividual,
  fields: [
    ...MissJudgeSingleRopeIndividual.fields,
    {
      name: 'Amount of different Interactions',
      id: 'rqint',
      min: 0,
      max: 4
    }
  ]
}

export const MissJudgeWheels: Judge = {
  ...MissJudgeSingleRopeTeam
}

export const MissJudgeDoubleDutchSingle: Judge = {
  ...MissJudgeSingleRopeIndividual,
  fields: [
    {
      name: 'Misses',
      id: 'mis',
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
    },

    {
      name: 'Amount of different Turner Involvement Skills',
      id: 'rqtis',
      min: 0,
      max: 4
    },
    {
      name: 'Amount of different Gymnastics and Power Skills',
      id: 'rqgyp',
      min: 0,
      max: 4
    },
    {
      name: 'Athletes who performed at least 4 skills',
      id: 'rqgyp',
      min: 0,
      max: 3
    }
  ]
}

export const MissJudgeDoubleDutchPair: Judge = {
  ...MissJudgeDoubleDutchSingle,
  fields: [
    MissJudgeDoubleDutchSingle.fields[0],
    MissJudgeDoubleDutchSingle.fields[1],
    MissJudgeDoubleDutchSingle.fields[2],
    MissJudgeDoubleDutchSingle.fields[3],
    MissJudgeDoubleDutchSingle.fields[4],
    {
      ...MissJudgeDoubleDutchSingle.fields[5],
      max: 4
    }
  ]
}

export const MissJudgeDoubleDutchTriad: Judge = {
  ...MissJudgeDoubleDutchSingle,
  fields: [
    MissJudgeDoubleDutchSingle.fields[0],
    MissJudgeDoubleDutchSingle.fields[1],
    MissJudgeDoubleDutchSingle.fields[2],
    MissJudgeDoubleDutchSingle.fields[3],
    MissJudgeDoubleDutchSingle.fields[4],
    {
      ...MissJudgeDoubleDutchSingle.fields[5],
      max: 5
    }
  ]
}

/* DIFFICULTY */
export const DifficultyJudge: DifficultyJudge = {
  name: 'Difficulty',
  id: 'D',
  fields: [
    {
      name: 'Level 0.5',
      id: 'l05',
      min: 0,
      level: 0.5
    },
    ...Array(8).fill(undefined).map((el, idx) => ({
      name: `Level ${idx + 1}`,
      id: `l${idx + 1}`,
      level: idx + 1
    }))
  ],
  result: function (scores) {
    if (!this) return
    let l = (l: number): number => roundTo(0.1 * Math.pow(1.8, l), 2)

    let score = this.fields.map(el => (scores[el.id] || 0) * l(el.level)).reduce((a, b) => a + b)

    return {
      D: roundTo(score, 2)
    }
  }
}

/* RESULT TABLES */
export const SpeedResultTableHeaders: ResultTableHeaders = {
  headers: [{
    text: 'Score',
    value: 'R'
  }, {
    text: 'Rank',
    value: 'S',
    color: 'red'
  }]
}

export const FreestyleResultTableHeaders: ResultTableHeaders = {
  headers: [
    {
      text: 'Diff',
      value: 'D',
      color: 'grey'
    }, {
      text: 'Pres',
      value: 'P',
      color: 'grey'
    }, {
      text: 'Req. El',
      value: 'Q',
      color: 'grey'
    }, {
      text: 'Deduc',
      value: 'M',
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
    text: 'Individual Freestyle',
    value: 'srif',
    colspan: 2
  }]
]

export const OverallResultTableHeadersIndividual: ResultTableHeader[] = [
  {
    text: 'Score',
    value: 'R',
    event: 'srss'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'srss',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'srse'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'srse',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'srif'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'srif',
    color: 'red'
  },

  {
    text: 'Normalized',
    value: 'B',
    event: 'overall'
  }, {
    text: 'Rank Sum',
    value: 'T',
    color: 'green',
    event: 'overall'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'overall',
    color: 'red'
  }
]

export const SingleRopeOverallResultTableGroupsTeam: ResultTableHeaderGroup[][] = [
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
    value: 'srpd',
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

export const SingleRopeOverallResultTableHeadersTeam: ResultTableHeader[] = [
  {
    text: 'Score',
    value: 'R',
    event: 'srsr'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'srsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'srpd'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'srpd',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'srpf'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'srpf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'srtf'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'srtf',
    color: 'red'
  },

  {
    text: 'Rank Sum',
    value: 'T',
    color: 'green',
    event: 'overall'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'overall',
    color: 'red'
  }
]

export const DoubleDutchOverallResultTableGroupsTeam: ResultTableHeaderGroup[][] = [
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

export const DoubleDutchOverallResultTableHeadersTeam: ResultTableHeader[] = [
  {
    text: 'Score',
    value: 'R',
    event: 'ddsr'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'ddsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'ddss'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'ddss',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'ddsf'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'ddsf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'ddpf'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'ddpf',
    color: 'red'
  },

  {
    text: 'Rank Sum',
    value: 'T',
    color: 'green',
    event: 'overall'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'overall',
    color: 'red'
  }
]

export const AllAroundResultTableGroupsTeam: ResultTableHeaderGroup[][] = [
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
    value: 'srpd',
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

export const AllAroundResultTableHeadersTeam: ResultTableHeader[] = [
  {
    text: 'Score',
    value: 'R',
    event: 'srsr'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'srsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'srpd'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'srpd',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'srpf'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'srpf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'srtf'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'srtf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'ddsr'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'ddsr',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'ddss'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'ddss',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'ddsf'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'ddsf',
    color: 'red'
  },

  {
    text: 'Score',
    value: 'R',
    event: 'ddpf'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'ddpf',
    color: 'red'
  },

  {
    text: 'Rank Sum',
    value: 'T',
    color: 'green',
    event: 'overall'
  }, {
    text: 'Rank',
    value: 'S',
    event: 'overall',
    color: 'red'
  }
]

export const SpeedResult = function (event: string) {
  return function (scores, judges: [string, string]) {
    let judgeResults = []
    let output = {}

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

    // Calc a
    let as = judgeResults.map(el => el.a).filter(el => typeof el === 'number')
    output.a = average(as)

    // Calc m
    let ms = judgeResults.map(el => el.m).filter(el => typeof el === 'number')
    output.m = average(ms)

    output.R = roundTo((output.a as number || 0) - (output.m as number || 0), 2)

    return output
  }
}

export const SpeedRank = function (results: any[] = []): any[] {
  // results = results.filter(el => typeof el.Y === 'number')
  results.sort(function (a, b) {
    return b.R - a.R // sort descending
  })

  let high = results.length > 0 ? results[0].R : 0
  let low = results.length > 0 ? results[results.length - 1].R : 0

  results = results.map((el, idx, arr) => ({
    ...el,
    S: arr.findIndex(obj => obj.R === el.R) + 1,
    N: roundTo((((100 - 1) * (el.R - low)) / (high - low)) + 1, 2)
  }))

  // DEV SORT BY ID
  // results.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

  return results
}

const FreestyleResult = function (event: string) {
  return function (scores, judges: [string, string]) {
    let judgeResults = []
    let output = {}

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

    for (let scoreType of ['D', 'P', 'm', 'v', 'Q']) {
      let scores = judgeResults.map(el => el[scoreType]).filter(el => typeof el === 'number')
      if (scoreType !== 'm' && scoreType !== ' v') output[scoreType] = roundTo(average(scores), 2)
      else output[scoreType] = average(scores)
      if (typeof output[scoreType] !== 'number') output[scoreType] = (scoreType === 'D' ? 0 : 1)
    }

    output.M = roundTo(-(1 - output.m - output.v), 2)

    output.R = roundTo(output.D * output.P * output.M * output.Q, 2)
    output.R = output.R < 0 ? 0 : output.R

    return output
  }
}

export const FreestyleRank = function (results: any[] = []): any[] {
  // results = results.filter(el => typeof el.Y === 'number')
  let tiePriority = ['M', 'D', 'P', 'R']
  results.sort(function (a, b) {
    if (a.R !== b.R) return b.R - a.R // descending 100 wins over 50
    if (a.M !== b.M) return b.M - a.M // descending *1 wins over *.9
    // if (a.R !== b.R) return b.R - a.R // descending *1 wins over *.9
    if (a.D !== b.D) return b.D - a.D // descending 100 wins over 50
    if (a.P !== b.P) return b.P - a.P // descending 1.35 wins over 0.95
    return 0
  })

  // TODO: handle that S in extreme cases can be equal
  let high = results.length > 0 ? results[0].R : 0
  let low = results.length > 0 ? results[results.length - 1].R : 0

  results = results.map((el, idx, arr) => ({
    ...el,
    S: idx + 1,
    N: roundTo((((100 - 1) * (el.R - low)) / (high - low)) + 1, 2)
  }))

  // DEV SORT BY ID
  // results.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

  return results
}

const OverallRank = function (overall: string) {
  return function (results = {}) {
    let ranked = {
      overall: []
    }
    const overallObj = config.overalls.find(el => el.id === overall)
    let tiePriority = ['overall', 'srif', 'ddpf', 'ddsf', 'srtf', 'srpf', 'srse', 'srss', 'ddsr', 'srsr']

    for (const event of overallObj.events) {
      const eventObj = config.events.find(el => el.id === event)
      ranked[event] = eventObj.rank(results[event])

      for (const scoreObj of ranked[event]) {
        let idx = ranked.overall.findIndex(el => el.participant === scoreObj.participant)
        console.log(scoreObj.N)

        if (idx >= 0) {
          ranked.overall[idx].R = roundTo(ranked.overall[idx].R + scoreObj.R, 4)
          ranked.overall[idx].T += scoreObj.S || 0
          ranked.overall[idx].B += scoreObj.N || 0
        } else {
          let R = roundTo(scoreObj.R, 4)
          ranked.overall.push({
            participant: scoreObj.participant,
            R,
            T: scoreObj.S || 0,
            B: scoreObj.N || 0
          })
        }
      }
    }

    console.log(ranked)

    ranked.overall.sort((a, b) => {
      if (a.T !== b.T) return a.T - b.T
      return b.B - a.B
    })
    ranked.overall = ranked.overall.map((el, idx, arr) => ({
      ...el,
      // S: arr.findIndex(obj => obj.T === el.T) + 1
      S: idx + 1
    }))

    // DEV SORT BY ID
    // ranked.overall.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

    return ranked
  }
}

const config: Ruleset = {
  name: 'IJRU v1.0.0',
  id: 'IJRU1-0-0',
  events: [{
    id: 'srss',
    name: 'Single Rope Speed Sprint',
    judges: [SpeedJudge, SpeedHeadJudgeMasters],
    result: SpeedResult('srss'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
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
  },
  {
    id: 'srif',
    name: 'Single Rope Individual Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeSingleRopeIndividual, DifficultyJudge],
    result: FreestyleResult('srif'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  },

  {
    id: 'srsr',
    name: 'Single Rope Speed Relay',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('srsr'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    id: 'srpd',
    name: 'Single Rope Pairs Double Unders',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('srpd'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    id: 'ddsr',
    name: 'Double Dutch Speed Relay',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('ddsr'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    id: 'ddss',
    name: 'Double Dutch Speed Sprint',
    judges: [SpeedJudge, SpeedHeadJudgeRelays],
    result: SpeedResult('ddss'),
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  },
  {
    id: 'srpf',
    name: 'Single Rope Pair Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeSingleRopeTeam, DifficultyJudge],
    result: FreestyleResult('srpf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    id: 'srtf',
    name: 'Single Rope Team Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeSingleRopeTeam, DifficultyJudge],
    result: FreestyleResult('srtf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    id: 'ddsf',
    name: 'Double Dutch Single Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeDoubleDutchSingle, DifficultyJudge],
    result: FreestyleResult('ddsf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    id: 'ddpf',
    name: 'Double Dutch Pairs Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeDoubleDutchPair, DifficultyJudge],
    result: FreestyleResult('ddpf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }, {
    id: 'ddtf',
    name: 'Double Dutch Triad Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeDoubleDutchTriad, DifficultyJudge],
    result: FreestyleResult('ddpf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  },

  {
    id: 'whpf',
    name: 'Wheel Pair Freestyle',
    judges: [AthletePresentationJudge, RoutinePresentationJudge, MissJudgeWheels, DifficultyJudge],
    result: FreestyleResult('ddpf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }],

  overalls: [{
    id: 'isro',
    text: 'Individual Overall',
    type: 'individual',
    groups: OverallResultTableGroupsIndividual,
    headers: OverallResultTableHeadersIndividual,
    events: ['srss', 'srse', 'srif'],
    rank: OverallRank('isro')
  },

  {
    id: 'tsro',
    text: 'Team Single Rope Overall',
    type: 'team',
    groups: SingleRopeOverallResultTableGroupsTeam,
    headers: SingleRopeOverallResultTableHeadersTeam,
    events: ['srsr', 'srpd', 'srpf', 'srtf'],
    rank: OverallRank('tsro')
  },
  {
    id: 'tddo',
    text: 'Team Double Dutch Overall',
    type: 'team',
    groups: DoubleDutchOverallResultTableGroupsTeam,
    headers: DoubleDutchOverallResultTableHeadersTeam,
    events: ['ddsr', 'ddss', 'ddsf', 'ddpf'],
    rank: OverallRank('tddo')
  },
  {
    id: 'taac',
    text: 'Team All-Around',
    type: 'team',
    groups: AllAroundResultTableGroupsTeam,
    headers: AllAroundResultTableHeadersTeam,
    events: ['srsr', 'srpd', 'srpf', 'srtf', 'ddsr', 'ddss', 'ddsf', 'ddpf'],
    rank: OverallRank('taac')
  }]
}

export default config
