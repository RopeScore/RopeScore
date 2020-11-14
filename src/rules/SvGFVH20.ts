import { Ruleset, JudgeType, ScoreInfo } from '.'

import {
  SvGFVH18Events,
  SvGFVH18Overalls,
  SvGFVH18Result,
  SpeedJudge,
  ObligaJudge,
  PresentationJudge,
  SpeedResult,
  SpeedRank,
  UtmaningsRank,
  FreestyleResult,
  FreestyleRank,
  OverallRank,
  SpeedResultTableHeaders,
  UtmaningsResultTableHeaders,
  FreestyleResultTableHeaders,
  IndividualOverallTableHeaders,
  SingleRopeTeamOverallTableHeaders,
  DoubleDutchTeamOverallTableHeaders
} from './SvGFVH18'

export interface SvGFVH20Score extends ScoreInfo<SvGFVH18Events> {
  s?: number

  oa?: number

  l05?: number
  l1?: number
  l2?: number
  l3?: number
  l4?: number
  l5?: number

  p?: number
}

export const DifficultyJudge: JudgeType<SvGFVH20Score, SvGFVH18Result, SvGFVH18Events> = {
  name: 'Svårighet',
  judgeTypeID: 'd',
  fields: [
    {
      name: 'Level 0.5',
      fieldID: 'l05',
    },
    ...Array(5).fill(undefined).map((el, idx) => ({
      name: `Level ${idx + 1}`,
      fieldID: `l${idx + 1}` as 'l1' | 'l2' | 'l3' | 'l4' | 'l5'
    }))],
  result: scores => ({
    D: ((scores.l05 || 0) * 0.5) +
      (scores.l1 || 0) +
      ((scores.l2 || 0) * 1.5) +
      ((scores.l3 || 0) * 2) +
      ((scores.l4 || 0) * 2.5) +
      ((scores.l5 || 0) * 3)
  })
}

const config: Ruleset<SvGFVH20Score, SvGFVH18Result, SvGFVH18Events, SvGFVH18Overalls> = {
  name: 'SvGF Vikingahoppet (2020)',
  rulesetID: 'SvGFVH20',
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
