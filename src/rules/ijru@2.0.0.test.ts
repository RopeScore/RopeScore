/* eslint-env mocha */
import * as mod from './ijru@2.0.0'
import assert from 'assert'

import type { TallyScoresheet, ScoreTally, CompetitionEvent, Scoresheet } from '../store/schema'

function tScsh (tally: ScoreTally, judgeType: string, competitionEvent: CompetitionEvent): TallyScoresheet {
  return {
    id: 'test-scoresheet',
    judgeId: 1,
    entryId: 'test-entry',
    judgeType,
    competitionEvent,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tally
  }
}

describe('ijru@2.0.0', () => {
  describe('L', () => {
    for (const [level, points] of [
      [0, 0],
      [0.5, 0.13],
      [1, 0.18],
      [2, 0.32],
      [3, 0.58],
      [4, 1.05],
      [5, 1.89],
      [6, 3.40],
      [7, 6.12],
      [8, 11.02]
    ]) {
      it(`should calculate correct scores for L(${level})`, () => {
        assert.strictEqual(mod.L(level), points)
      })
    }
  })

  describe('ijruAverage', () => {
    it('Should return single number', () => {
      assert.strictEqual(mod.ijruAverage([1]), 1)
    })

    it('Should average two numbers', () => {
      assert.strictEqual(mod.ijruAverage([1, 3]), 2)
    })

    it('Should average the closest two of three numbers, when the lower two are closest', () => {
      assert.strictEqual(mod.ijruAverage([1, 10, 3]), 2)
    })

    it('Should average the closest two of three numbers, when the higher two are closest', () => {
      assert.strictEqual(mod.ijruAverage([1, 10, 8]), 9)
    })

    it('Should average all except highest and lowest for four numbers', () => {
      assert.strictEqual(mod.ijruAverage([119, 114, 111, 118]), 116)
    })

    it('Should average all except highest and lowest for five numbers', () => {
      assert.strictEqual(mod.ijruAverage([119, 114, 131, 111, 118]), 117)
    })
  })

  describe('speedJudge', () => {
    it('Should return a score', () => {
      const tally = { step: 10 }
      assert.deepStrictEqual(
        mod.speedJudge('e.ijru.sp.sr.srss.1.30').calculateScoresheet(tScsh(tally, 'S', 'e.ijru.sp.sr.srss.1.30')),
        { a: 10 }
      )
    })

    it('Should default to 0', () => {
      const tally = {}
      assert.deepStrictEqual(
        mod.speedJudge('e.ijru.sp.sr.srss.1.30').calculateScoresheet(tScsh(tally, 'S', 'e.ijru.sp.sr.srss.1.30')),
        { a: 0 }
      )
    })
  })

  describe('speedHeadJudge', () => {
    it('Should return a score', () => {
      const tally = { step: 10, falseStart: 1 }
      assert.deepStrictEqual(
        mod.speedHeadJudge('e.ijru.sp.sr.srss.1.30').calculateScoresheet(tScsh(tally, 'Shj', 'e.ijru.sp.sr.srss.1.30')),
        { a: 10, m: 10 }
      )
    })

    it('Should cap falseStarts', () => {
      const tally = { step: 10, falseStart: 2 }
      assert.deepStrictEqual(
        mod.speedHeadJudge('e.ijru.sp.sr.srss.1.30').calculateScoresheet(tScsh(tally, 'Shj', 'e.ijru.sp.sr.srss.1.30')),
        { a: 10, m: 10 }
      )
    })

    it('Should ignore falseSwitches if event doesn\'t have them', () => {
      const tally = { step: 10, falseStart: 1, falseSwitch: 1 }
      assert.deepStrictEqual(
        mod.speedHeadJudge('e.ijru.sp.sr.srss.1.30').calculateScoresheet(tScsh(tally, 'Shj', 'e.ijru.sp.sr.srss.1.30')),
        { a: 10, m: 10 }
      )
    })

    it('Should deduct falseSwitches', () => {
      const tally = { step: 10, falseStart: 1, falseSwitch: 1 }
      assert.deepStrictEqual(
        mod.speedHeadJudge('e.ijru.sp.sr.srsr.4.4x30').calculateScoresheet(tScsh(tally, 'Shj', 'e.ijru.sp.sr.srsr.4.4x30')),
        { a: 10, m: 20 }
      )
    })

    it('Should cap falseSwitches', () => {
      const tally = { step: 10, falseStart: 1, falseSwitch: 4 }
      assert.deepStrictEqual(
        mod.speedHeadJudge('e.ijru.sp.sr.srsr.4.4x30').calculateScoresheet(tScsh(tally, 'Shj', 'e.ijru.sp.sr.srsr.4.4x30')),
        { a: 10, m: 40 }
      )
    })
  })

  describe('routinePresentationJudge', () => {
    it('Should return a score', () => {
      const tally = { entertainmentPlus: 10, entertainmentCheck: 5, musicalityPlus: 1 }
      assert.deepStrictEqual(
        mod.routinePresentationJudge('e.ijru.fs.sr.srif.1.75').calculateScoresheet(tScsh(tally, 'Shj', 'e.ijru.fs.sr.srif.1.75')),
        { aE: 0.1, aM: 0.15 }
      )
    })
  })

  describe('athletePresentationJudge', () => {
    it('Should return a score', () => {
      const tally = { formExecutionMinus: 5, miss: 1 }
      assert.deepStrictEqual(
        mod.athletePresentationJudge('e.ijru.fs.sr.srif.1.75').calculateScoresheet(tScsh(tally, 'Shj', 'e.ijru.fs.sr.srif.1.75')),
        { aF: -0.3, m: 0.975 }
      )
    })
  })

  describe('requiredElementsJudge', () => {})

  describe('difficultyJudge', () => {
    it('Should return a score', () => {
      const tally = { 'diffL0.5': 9, diffL1: 8, diffL2: 7, diffL3: 6, diffL4: 5, diffL5: 4, diffL6: 3, diffL7: 2, diffL8: 1 }
      assert.deepStrictEqual(
        mod.difficultyJudge('e.ijru.fs.sr.srif.1.75').calculateScoresheet(tScsh(tally, 'D', 'e.ijru.fs.sr.srif.1.75')),
        { D: 54.60 }
      )
    })
  })

  describe('calculateSpeedEntry', () => {
    it('Should return a score', () => {
      const scoresheets = [
        tScsh({ step: 10 }, 'S', 'e.ijru.sp.sr.srss.1.30'),
        tScsh({ step: 10, falseStart: 1 }, 'Shj', 'e.ijru.sp.sr.srss.1.30'),
        tScsh({ step: 12 }, 'S', 'e.ijru.sp.sr.srss.1.30')
      ]
      assert.deepStrictEqual(mod.calculateSpeedEntry('e.ijru.sp.sr.srss.1.30')(scoresheets), {
        raw: {
          a: 10,
          m: 10,
          R: 0
        },
        formatted: {
          a: '10',
          m: '10',
          R: '0'
        }
      })
    })

    it('Should pick the latest scoresheet for a judge', () => {
      const scoresheets: Scoresheet[] = [
        {
          id: 'aaa',
          judgeId: 1,
          entryId: 'a',
          judgeType: 'S',
          competitionEvent: 'e.ijru.sp.sr.srss.1.30',
          createdAt: 10,
          updatedAt: 20,
          tally: { step: 10 }
        },
        {
          id: 'bbb',
          judgeId: 1,
          entryId: 'a',
          judgeType: 'S',
          competitionEvent: 'e.ijru.sp.sr.srss.1.30',
          createdAt: 5,
          updatedAt: 30,
          tally: { step: 5 }
        }
      ]
      assert.deepStrictEqual(mod.calculateSpeedEntry('e.ijru.sp.sr.srss.1.30')(scoresheets), {
        raw: {
          a: 10,
          m: 0,
          R: 10
        },
        formatted: {
          a: '10',
          m: '0',
          R: '10'
        }
      })
    })
  })

  describe('calculateFreestyleEntry', () => {})
})
