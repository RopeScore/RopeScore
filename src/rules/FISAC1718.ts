const SpeedJudge = {
  name: 'Speed Judge',
  id: 's',
  fields: [{
    name: 'Score',
    symbol: 's',
    min: 0
  }],
  result: scores => ({
    T: scores.s as number
  })
}

const SpeedHeadJudgeMasters = {
  name: 'Speed Head Judge',
  id: 'shj',
  fields: [
    ...SpeedJudge.fields,
    {
      name: 'False Start',
      symbol: 'fStart',
      min: 0,
      max: 1
    }
  ],
  result: scores => ({
    T: scores.s as number,
    W: (scores.fStart as number) * 5
  })
}

const SpeedHeadJudgeRelays = {
  name: 'Speed Head Judge',
  id: 'shj',
  fields: [
    ...SpeedHeadJudgeMasters.fields,
    {
      name: 'False Switches',
      symbol: 'fSwitch',
      min: 0,
      max: 3
    }
  ],
  result: scores => ({
    T: scores.s as number,
    W: ((scores.fSwitch as number) + (scores.fStart as number)) * 5
  })
}

const SpeedResult = function (event: string, scores, judges) {
  let judgeResults = []
  let output = {}

  let eventObj = config.events.find(el => el.id === event)
  let eventJudges = eventObj.judges

  for (let judgeType in judges) {
    let resultFunction = eventJudges.find(el => el.judgeType === judgeType).result
    for (let judge of judges[judgeType]) {
      let idx = judgeResults.findIndex(el => el.judge === judge)
      if (idx < 0) {
        judgeResults.push({
          judge,
          ...resultFunction(scores[judge])
        })
      } else {
        judgeResults[idx] = {
          ...judgeResults[idx],
          ...resultFunction(scores[judge])
        }
      }
    }
  }
  console.log(judgeResults)

  // Calc T
  let Ts = judgeResults.map(el => el.T).filter(el => typeof el === 'number')
  Ts.sort(function (a, b) {
    return a - b
  })

  /* special case if there's only one score entered */
  if (Ts.length === 1) {
    output.T = Ts[0]
  } else {
    let diff: number
    for (let i = 1; i < Ts.length; i++) {
      let cdiff = Math.abs(Ts[i] - Ts[i - 1])
      if (typeof diff === 'undefined' || cdiff <= diff) {
        diff = cdiff
        output.T = (Ts[i] + Ts[i - 1]) / 2
      }
    }
  }
  console.log(Ts)

  // Calc W
  let Ws = judgeResults.map(el => el.W).filter(el => typeof el === 'number')
  Ws.sort(function (a, b) {
    return a - b
  })
  /* special case if there's only one score entered */
  if (Ws.length === 1) {
    output.W = Ws[0]
  } else {
    let diff: number
    for (let i = 1; i < Ws.length; i++) {
      let cdiff = Math.abs(Ws[i] - Ws[i - 1])
      if (typeof diff === 'undefined' || cdiff <= diff) {
        diff = cdiff
        output.W = (Ws[i] + Ws[i - 1]) / 2
      }
    }
  }

  output.PreY = (output.T as number || 0) - (output.W as number || 0)

  output.Y = output.PreY * (eventObj.mult as number || 1)

  return output
}

const config = {
  name: 'FISAC-IRSF 2017-2018',
  id: 'FISAC1718',
  events: [{
    id: 'srss',
    name: 'Single Rope Speed Sprint',
    judges: [SpeedJudge, SpeedHeadJudgeMasters],
    result: SpeedResult,
    mult: 5
  }, {
    id: 'srse',
    name: 'Single Rope Speed Endurance',
    judges: [SpeedJudge, SpeedHeadJudgeMasters],
    result: SpeedResult
  }, {
    id: 'srtu',
    name: 'Single Rope Triple Unders',
    judges: [SpeedJudge, SpeedHeadJudgeMasters],
    result: SpeedResult
  }, {
    id: 'srsf',
    name: 'Single Rope Master Freestyle',
    judges: []
  }]
}

// srsr: 3
// ddsr: 2

export default config
