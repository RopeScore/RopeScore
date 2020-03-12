import { roundTo } from '@/common'
import { Ruleset, JudgeType, ResultTableHeader, ResultTableHeaders, ResultTableHeaderGroup, InputField, ScoreInfo, ResultInfo, Event } from './'

import {
  SpeedJudge as FISACSpeedJudge,
  SpeedHeadJudgeMasters as FISACSpeedHeadJudgeMasters,
  SpeedHeadJudgeRelays as FISACSpeedHeadJudgeRelays,
} from './FISAC1718'
import { SvGFRH20average } from './IJRU1-1-0'

export type SvGFRH20Events =
  // Ind
  'srss' | 'srse' | 'srtu' | 'srif' |
  // Team SR
  'srsr' | 'srdr' | 'srpf' | 'srtf' |
  // Team DD
  'ddsr' | 'ddss' | 'ddsf' | 'ddpf'

export type SvGFRH20Overalls = 'indoverall' | 'teamoverall'

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
  RSum?: number
  multipliedRank?: number
  score?: number
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
export const DifficultyJudge: DifficultyJudge = {
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
    let l = (l: number): number => l === 0.5 ? 0.5 : (0.5 * x) + 0.5

    let score = this.fields.map(field => (scores[field.fieldID] ?? 0) * l(field.level)).reduce((a, b) => a + b)

    return {
      D: roundTo(score, 2)
    }
  }
}

export const SpeedResultTableHeaders: ResultTableHeaders<SvGFRH20Events> = {
  headers: [{
    text: 'Score',
    value: 'R'
  }, {
    text: 'Rank',
    value: 'rank',
    color: 'red'
  }]
}

export const FreestyleResultTableHeaders: ResultTableHeaders<SvGFRH20Events> = {
  headers: [{
    text: 'Pres',
    value: 'P',
    color: 'grey'
  }, {
    text: 'Crea Rank',
    value: 'CRank',
    color: 'grey'
  }, {
    text: 'Diff',
    value: 'D',
    color: 'grey'
  }, {
    text: 'Diff Rank',
    value: 'DRank',
    color: 'grey'
  },

  {
    text: 'Score',
    value: 'R'
  }, {
    text: 'Rank Sum',
    value: 'RSum',
    color: 'green'
  }, {
    text: 'Rank',
    value: 'S',
    color: 'red'
  }]
}

export const SpeedResult = function (eventID: string): Event<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events, SvGFRH20Overalls>['result'] {
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
    output.a = SvGFRH20average(as)

    // Calc m
    let ms = judgeResults.map(el => el.m).filter(el => typeof el === 'number') as number[]
    output.m = SvGFRH20average(ms)

    output.R = roundTo((output.a ?? 0) - (output.m ?? 0), 2)

    return output
  }
}

export const SpeedRank: Event<SvGFRH20Score, SvGFRH20Result, SvGFRH20Events, SvGFRH20Overalls>['rank'] = function (results = []) {
  // results = results.filter(el => typeof el.Y === 'number')
  results.sort(function (a, b) {
    return (b.R ?? 0) - (a.R?? 0) // sort descending
  })

  results = results.map((el, _, arr) => ({
    ...el,
    S: arr.findIndex(obj => obj.R === el.R) + 1
  }))

  // DEV SORT BY ID
  // results.sort((a, b) => Number(a.participant.substring(1, 4) - Number(b.participant.substring(1, 4))))

  return results
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
    eventID: 'srif',
    name: 'Single Rope Master Freestyle',
    judges: [PresentationJudge, DifficultyJudgeMasters],
    result: FreestyleResult('srsf'),
    rank: FreestyleRank('srsf'),
    headers: FreestyleResultTableHeaders
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
    judges: [PresentationJudge, DifficultyJudgeSingleRopeTeams],
    result: FreestyleResult('srpf'),
    rank: FreestyleRank('srpf'),
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'srtf',
    name: 'Single Rope Team Freestyle',
    judges: [PresentationJudge, DifficultyJudgeSingleRopeTeams],
    result: FreestyleResult('srtf'),
    rank: FreestyleRank('srtf'),
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'ddsf',
    name: 'Double Dutch Single Freestyle',
    judges: [PresentationJudge, DifficultyJudgeDoubleDutchTeams],
    result: FreestyleResult('ddsf'),
    rank: FreestyleRank('ddsf'),
    headers: FreestyleResultTableHeaders
  }, {
    eventID: 'ddpf',
    name: 'Double Dutch Pair Freestyle',
    judges: [PresentationJudge, DifficultyJudgeDoubleDutchTeams],
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
    events: ['srss', 'srse', 'srif'],
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
