import { roundTo, roundToMultiple } from '@/common'
import { Ruleset, JudgeType, ResultTableHeader, ResultTableHeaders, ResultTableHeaderGroup, InputField } from '.'

import {
  SpeedJudge as FISACSpeedJudge
} from './FISAC1718'

const PresMapped = [0, 0.5, 0.5, 1, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

export const SpeedJudge: JudgeType = {
  ...FISACSpeedJudge,
  result: scores => ({
    S: scores.s || 0
  })
}

export const ObligaJudge: JudgeType = {
  name: 'Obligatoriska',
  judgeTypeID: 'o',
  fields: [{
    name: 'Antal',
    fieldID: 'oa',
    min: 0,
    max: 5,
    step: 1
  }],
  result: scores => ({
    O: (scores.oa || 0) * 2
  })
}

export const DifficultyJudge: JudgeType = {
  name: 'Svårighet',
  judgeTypeID: 'd',
  fields: Array(5).fill(undefined).map((el, idx) => ({
    name: `Level ${idx + 1}`,
    fieldID: `l${idx + 1}`
  })),
  result: scores => ({
    D: (scores.l1 || 0) +
      ((scores.l2 || 0) * 1.5) +
      ((scores.l3 || 0) * 2) +
      ((scores.l4 || 0) * 2.5) +
      ((scores.l5 || 0) * 3)
  })
}

export const PresentationJudge: JudgeType = {
  name: 'Presentation',
  judgeTypeID: 'p',
  fields: [{
    name: 'Poäng',
    fieldID: 'p',
    min: 0,
    max: 12
  }],
  result: scores => ({
    P: scores.p || 0
  })
}

export const SpeedResult = function (scores, judges) {
  let judgeResults = []
  let output = {}

  let judgeObj = SpeedJudge
  let resultFunction = judgeObj.result

  for (let JudgeType of judges) {
    let judgeID = JudgeType[0]

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
  let Ss = judgeResults.map(el => el.S).filter(el => typeof el === 'number')
  Ss.sort(function (a, b) {
    return a - b
  })

  /* special case if there's only one score entered */
  if (Ss.length === 1) {
    output.S = roundTo(Ss[0], 4)
  } else {
    let diff: number
    for (let i = 1; i < Ss.length; i++) {
      let cdiff = Math.abs(Ss[i] - Ss[i - 1])
      if (typeof diff === 'undefined' || cdiff <= diff) {
        diff = cdiff
        output.S = roundTo((Ss[i] + Ss[i - 1]) / 2, 4)
      }
    }
  }

  return output
}

export const SpeedRank = function (results: any[] = []): any[] {
  // results = results.filter(el => typeof el.Y === 'number')
  results.sort(function (a, b) {
    return b.S - a.S // sort descending
  })

  results = results.map((el, idx, arr) => ({
    ...el,
    rank: arr.findIndex(obj => obj.S === el.S) + 1
  }))

  // DEV SORT BY ID
  // results.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

  // const topThreeIdx = results.map(el => el.rank < 4 ? el.rank : undefined).indexOf(undefined)
  // const topThree = results.slice(0, topThreeIdx === -1 ? results.length : topThreeIdx)
  // const rest = results.slice(topThreeIdx === -1 ? results.length : topThreeIdx).map(el => ({ ...el, rank: undefined })).sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

  // return [...topThree, ...rest]

  return results
}

export const UtmaningsRank = function (results: any[] = []): any[] {
  // results = results.filter(el => typeof el.Y === 'number')
  results.sort(function (a, b) {
    return a.S - b.S // sort ascending
  })

  results = results.map((el, idx, arr) => ({
    ...el,
    rank: arr.findIndex(obj => obj.S === el.S) + 1
  }))

  // DEV SORT BY ID
  // results.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

  return results
}

export const FreestyleResult = function (event: string) {
  return function (scores, judges) {
    let judgeResults = []
    let output = {}

    let eventObj = config.events.find(el => el.eventID === event)
    let eventJudgeTypes = eventObj!.judges

    for (let JudgeType of judges) {
      let judgeID = JudgeType[0]
      let judgeType = JudgeType[1]

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

    for (let result of ['O', 'P', 'D']) {
      // Calc T
      let Ts = judgeResults.map(el => el[result]).filter(el => typeof el === 'number')

      output[result] = roundTo(Ts.reduce((a, b) => a + b) / Ts.length, 1)
    }

    switch (true) {
      case output.D > 23:
        output.DM = 5
        break
      case output.D > 20:
        output.DM = 4.5
        break
      case output.D > 18:
        output.DM = 4
        break
      case output.D > 16:
        output.DM = 3.5
        break
      case output.D > 14:
        output.DM = 3
        break
      case output.D > 12:
        output.DM = 2.5
        break
      case output.D > 10:
        output.DM = 2
        break
      case output.D > 8:
        output.DM = 1.5
        break
      case output.D > 5:
        output.DM = 1
        break
      default:
        output.DM = 0.5
        break
    }

    output.PM = PresMapped[Math.round(output.P)]

    output.S = output.O + output.DM + output.PM

    return output
  }
}

export const FreestyleRank = function (results: any[] = []): any[] {
  // const eventObj = config.events.find(el => el.eventID === event) || {}

  // calc DRanks
  // results.sort((a, b) => a.D - b.D) // sort ascending
  // let high = (results[results.length - 1] || {}).D || 0
  // let low = (results[0] || {}).D || 0

  // results = results.map((obj, idx, arr) => ({
  //   ...obj,
  //   DRank: roundTo(roundToMultiple((((5 - 0.5) * (obj.D - low)) / (high - low)) + 0.5, 0.5), 1),
  //   S: roundTo(obj.PM + obj.O + roundToMultiple((((5 - 0.5) * (obj.D - low)) / (high - low)) + 0.5, 0.5), 1)
  // }))

  // rank on total score
  results.sort((a, b) => b.S - a.S) // sort descending
  results = results.map((obj, idx, arr) => ({
    ...obj,
    rank: arr.findIndex(el => el.S === obj.S) + 1
  }))

  // DEV SORT BY ID
  // results.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

  // const topThreeIdx = results.map(el => el.rank < 4 ? el.rank : undefined).indexOf(undefined)
  // const topThree = results.slice(0, topThreeIdx === -1 ? results.length : topThreeIdx)
  // const rest = results.slice(topThreeIdx === -1 ? results.length : topThreeIdx).map(el => ({ ...el, rank: undefined })).sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

  // return [...topThree, ...rest]

  return results
}

export const OverallRank = function (overall: string) {
  return function (results = {}) {
    let ranked = {
      overall: []
    }
    const overallObj = config.overalls.find(el => el.overallID === overall)

    for (const event of overallObj?.events || []) {
      const eventObj = config.events.find(el => el.eventID === event)
      ranked[event] = eventObj.rank(results[event])

      for (const scoreObj of ranked[event]) {
        let idx = ranked.overall.findIndex(el => el.participant === scoreObj.participant)

        if (idx >= 0) {
          ranked.overall[idx].RSum += scoreObj.rank
        } else {
          ranked.overall.push({
            participant: scoreObj.participant,
            RSum: scoreObj.rank
          })
        }
      }
    }

    console.log(ranked)

    ranked.overall.sort((a, b) => a.RSum - b.RSum)
    ranked.overall = ranked.overall.map((el, idx, arr) => ({
      ...el,
      rank: arr.findIndex(obj => obj.RSum === el.RSum) + 1
    }))

    // DEV SORT BY ID
    ranked.overall.sort((a, b) => Number(a.participantID.substring(1, 4) - Number(b.participantID.substring(1, 4))))

    return ranked
  }
}

export const SpeedResultTableHeaders: ResultTableHeaders = {
  headers: [{
    text: 'Steg',
    value: 'S'
  }, {
    text: 'Rank',
    value: 'rank',
    color: 'red'
  }]
}

export const UtmaningsResultTableHeaders: ResultTableHeaders = {
  headers: [{
    text: 'Sekunder',
    value: 'S'
  }, {
    text: 'Rank',
    value: 'rank',
    color: 'red'
  }]
}

export const FreestyleResultTableHeaders: ResultTableHeaders = {
  headers: [{
    text: 'Summa',
    value: 'S'
  }, {
    text: 'Rank',
    value: 'rank',
    color: 'red'
  }]
}

export const IndividualOverallTableHeaders: ResultTableHeaders = {
  groups: [
    [{
      text: 'Snabbhet 30s',
      value: 'srss',
      colspan: 2
    }, {
      text: 'Dubbelsnurrar',
      value: 'srdu',
      colspan: 2
    }, {
      text: 'Snabbhet 2min',
      value: 'srse',
      colspan: 2
    }, {
      text: 'Freestyle',
      value: 'srsf',
      colspan: 2
    }, {
      text: 'Total',
      value: 'overall',
      colspan: 2
    }]
  ],
  headers: [{
    text: 'Steg',
    value: 'S',
    event: 'srss'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srss',
    color: 'red'
  },

  {
    text: 'Antal',
    value: 'S',
    event: 'srdu'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srdu',
    color: 'red'
  },

  {
    text: 'Steg',
    value: 'S',
    event: 'srse'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srse',
    color: 'red'
  },

  {
    text: 'Poäng',
    value: 'S',
    event: 'srsf'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srsf',
    color: 'red'
  },

  {
    text: 'Rank Summa',
    value: 'RSum',
    event: 'overall',
    color: 'green'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'overall',
    color: 'red'
  }]
}

export const SingleRopeTeamOverallTableHeaders: ResultTableHeaders = {
  groups: [
    [{
      text: 'Snabbhet 4*30s',
      value: 'srsr',
      colspan: 2
    }, {
      text: 'Dubbelsnurrar 4*20s',
      value: 'srdr',
      colspan: 2
    }, {
      text: 'Freestyle',
      value: 'srtf',
      colspan: 2
    }, {
      text: 'Total',
      value: 'overall',
      colspan: 2
    }]
  ],
  headers: [{
    text: 'Steg',
    value: 'S',
    event: 'srsr'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srsr',
    color: 'red'
  },

  {
    text: 'Antal',
    value: 'S',
    event: 'srdr'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srdr',
    color: 'red'
  },

  {
    text: 'Poäng',
    value: 'S',
    event: 'srtf'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'srtf',
    color: 'red'
  },

  {
    text: 'Rank Summa',
    value: 'RSum',
    event: 'overall',
    color: 'green'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'overall',
    color: 'red'
  }]
}

export const DoubleDutchTeamOverallTableHeaders: ResultTableHeaders = {
  groups: [
    [{
      text: 'Snabbhet 2*45s',
      value: 'ddsr',
      colspan: 2
    }, {
      text: 'Utmaningen',
      value: 'ddut',
      colspan: 2
    }, {
      text: 'Freestyle',
      value: 'ddtf',
      colspan: 2
    }, {
      text: 'Total',
      value: 'overall',
      colspan: 2
    }]
  ],
  headers: [{
    text: 'Steg',
    value: 'S',
    event: 'ddsr'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'ddsr',
    color: 'red'
  },

  {
    text: 'Sekunder',
    value: 'S',
    event: 'ddut'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'ddut',
    color: 'red'
  },

  {
    text: 'Poäng',
    value: 'S',
    event: 'ddtf'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'ddtf',
    color: 'red'
  },

  {
    text: 'Rank Summa',
    value: 'RSum',
    event: 'overall',
    color: 'green'
  }, {
    text: 'Rank',
    value: 'rank',
    event: 'overall',
    color: 'red'
  }]
}

const config: Ruleset = {
  name: 'SvGF Vikingahoppet',
  rulesetID: 'SvGFVH18',
  versions: ['se'],
  events: [{
    eventID: 'srss',
    name: 'Snabbhet 30s',
    judges: [SpeedJudge],
    result: SpeedResult,
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'srdu',
    name: 'Dubbelsnurrar',
    judges: [SpeedJudge],
    result: SpeedResult,
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'srse',
    name: 'Snabbhet 2min',
    judges: [SpeedJudge],
    result: SpeedResult,
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'srsf',
    name: 'Individuell Freestyle',
    judges: [ObligaJudge, PresentationJudge, DifficultyJudge],
    result: FreestyleResult('srsf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  },

  {
    eventID: 'srsr',
    name: 'Snabbhet 4*30s',
    judges: [SpeedJudge],
    result: SpeedResult,
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'srdr',
    name: 'Dubbelsnurrar 4*20s',
    judges: [SpeedJudge],
    result: SpeedResult,
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'srtf',
    name: 'Freestyle Enkelrep Lag',
    judges: [ObligaJudge, PresentationJudge, DifficultyJudge],
    result: FreestyleResult('srtf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  },

  {
    eventID: 'ddsr',
    name: 'Snabbhet 2*45s',
    judges: [SpeedJudge],
    result: SpeedResult,
    rank: SpeedRank,
    headers: SpeedResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'ddut',
    name: 'Utmaningen',
    judges: [SpeedJudge],
    result: SpeedResult,
    rank: UtmaningsRank,
    headers: UtmaningsResultTableHeaders,
    multipleEntry: true
  }, {
    eventID: 'ddtf',
    name: 'Freestyle Dubbelrep Lag',
    judges: [ObligaJudge, PresentationJudge, DifficultyJudge],
    result: FreestyleResult('ddtf'),
    rank: FreestyleRank,
    headers: FreestyleResultTableHeaders
  }],

  overalls: [{
    overallID: 'indoverall',
    text: 'Total',
    type: 'individual',
    ...IndividualOverallTableHeaders,
    events: ['srss', 'srdu', 'srse', 'srsf'],
    rank: OverallRank('indoverall')
  }, {
    overallID: 'teamsroverall',
    text: 'Enkelrep - Total',
    type: 'team',
    ...SingleRopeTeamOverallTableHeaders,
    events: ['srsr', 'srdr', 'srtf'],
    rank: OverallRank('teamsroverall')
  }, {
    overallID: 'teamddoverall',
    text: 'Dubbelrep - Total',
    type: 'team',
    ...DoubleDutchTeamOverallTableHeaders,
    events: ['ddsr', 'ddut', 'ddtf'],
    rank: OverallRank('teamddoverall')
  }]
}

export default config
