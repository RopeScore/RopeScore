// import { roundTo } from '@/common'
// import { Ruleset, Judge, ResultTableHeader, ResultTableHeaders, ResultTableHeaderGroup, InputField } from './'

// import {
//   SpeedJudge,
//   SpeedHeadJudgeMasters,
//   SpeedHeadJudgeRelays,
//   SpeedResult,
//   SpeedRank,
//   SpeedResultTableHeaders
// } from './FISAC1718'

// interface PresentationJudge extends Judge {
//   fields: WeightedInputField[]
// }

// export interface WeightedInputField extends InputField {
//   weight?: number
// }

// const config: Ruleset = {
//   name: 'SvGF Rikshoppet 2017-2018',
//   id: 'SvGFRH1718',
//   events: [{
//     id: 'srss',
//     name: 'Single Rope Speed Sprint',
//     judges: [SpeedJudge, SpeedHeadJudgeMasters],
//     result: SpeedResult('srss'),
//     rank: SpeedRank,
//     headers: SpeedResultTableHeaders,
//     scoreMultiplier: 5,
//     multipleEntry: true
//   }, {
//     id: 'srse',
//     name: 'Single Rope Speed Endurance',
//     judges: [SpeedJudge, SpeedHeadJudgeMasters],
//     result: SpeedResult('srse'),
//     rank: SpeedRank,
//     headers: SpeedResultTableHeaders,
//     multipleEntry: true
//   }, {
//     id: 'srtu',
//     name: 'Single Rope Triple Unders',
//     judges: [SpeedJudge, SpeedHeadJudgeMasters],
//     result: SpeedResult('srtu'),
//     rank: SpeedRank,
//     headers: SpeedResultTableHeaders,
//     multipleEntry: true
//   }, {
//     id: 'srsf',
//     name: 'Single Rope Master Freestyle',
//     judges: [PresentationJudge, DifficultyJudgeMasters, HeadJudgeSingleRope],
//     result: FreestyleResult('srsf'),
//     rank: FreestyleRank('srsf'),
//     headers: FreestyleResultTableHeaders,
//     scoreMultiplier: 2,
//     rankMultiplier: 2
//   }, {
//     id: 'srsr',
//     name: 'Single Rope Speed Relay',
//     judges: [SpeedJudge, SpeedHeadJudgeRelays],
//     result: SpeedResult('srsr'),
//     rank: SpeedRank,
//     headers: SpeedResultTableHeaders,
//     scoreMultiplier: 3,
//     multipleEntry: true
//   }, {
//     id: 'ddsr',
//     name: 'Double Dutch Speed Relay',
//     judges: [SpeedJudge, SpeedHeadJudgeRelays],
//     result: SpeedResult('ddsr'),
//     rank: SpeedRank,
//     headers: SpeedResultTableHeaders,
//     scoreMultiplier: 2,
//     multipleEntry: true
//   }, {
//     id: 'srpf',
//     name: 'Single Rope Pair Freestyle',
//     judges: [PresentationJudge, DifficultyJudgeSingleRopeTeams, HeadJudgeSingleRope],
//     result: FreestyleResult('srpf'),
//     rank: FreestyleRank('srpf'),
//     headers: FreestyleResultTableHeaders
//   }, {
//     id: 'srtf',
//     name: 'Single Rope Team Freestyle',
//     judges: [PresentationJudge, DifficultyJudgeSingleRopeTeams, HeadJudgeSingleRope],
//     result: FreestyleResult('srtf'),
//     rank: FreestyleRank('srtf'),
//     headers: FreestyleResultTableHeaders
//   }, {
//     id: 'ddsf',
//     name: 'Double Dutch Single Freestyle',
//     judges: [PresentationJudge, RequiredElementJudgeDoubleDutchSingle, DifficultyJudgeDoubleDutchTeams, HeadJudgeDoubleDutchSingle],
//     result: FreestyleResult('ddsf'),
//     rank: FreestyleRank('ddsf'),
//     headers: FreestyleResultTableHeaders
//   }, {
//     id: 'ddpf',
//     name: 'Double Dutch Pair Freestyle',
//     judges: [PresentationJudge, RequiredElementJudgeDoubleDutchPair, DifficultyJudgeDoubleDutchTeams, HeadJudgeDoubleDutchPair],
//     result: FreestyleResult('ddpf'),
//     rank: FreestyleRank('ddpf'),
//     headers: FreestyleResultTableHeaders
//   }],

//   overalls: [{
//     id: 'indoverall',
//     text: 'Overall',
//     type: 'individual',
//     groups: OverallResultTableGroupsIndividual,
//     headers: OverallResultTableHeadersIndividual,
//     events: ['srss', 'srse', 'srsf'],
//     rank: OverallRank('indoverall')
//   },
//   {
//     id: 'teamoverall',
//     text: 'Overall',
//     type: 'team',
//     groups: OverallResultTableGroupsTeam,
//     headers: OverallResultTableHeadersTeam,
//     events: ['srsr', 'ddsr', 'srpf', 'srtf', 'ddsf', 'ddpf'],
//     rank: OverallRank('teamoverall')
//   }]
// }

// export default config
