/* eslint-env mocha */
import * as mod from './ijru@2.0.0'
import assert from 'assert'

import type { TallyScoresheet, ScoreTally } from '../store/schema'

function tScsh (tally: ScoreTally, judgeType: string): TallyScoresheet {
  return {
    id: 'test-scoresheet',
    judgeId: 1,
    entryId: 'test-entry',
    judgeType,
    tally
  }
}

describe('ijru@2.0.0', () => {
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
        mod.speedJudge('e.ijru.sp.sr.srss.1.30').calculateScoresheet(tScsh(tally, 'S')),
        { a: 10 }
      )
    })

    it('Should default to 0', () => {
      const tally = {}
      assert.deepStrictEqual(
        mod.speedJudge('e.ijru.sp.sr.srss.1.30').calculateScoresheet(tScsh(tally, 'S')),
        { a: 0 }
      )
    })
  })

  describe('speedHeadJudge', () => {
    it('Should return a score', () => {
      const tally = { step: 10, falseStart: 1 }
      assert.deepStrictEqual(
        mod.speedHeadJudge('e.ijru.sp.sr.srss.1.30').calculateScoresheet(tScsh(tally, 'Shj')),
        { a: 10, m: 10 }
      )
    })

    it('Should cap falseStarts', () => {
      const tally = { step: 10, falseStart: 2 }
      assert.deepStrictEqual(
        mod.speedHeadJudge('e.ijru.sp.sr.srss.1.30').calculateScoresheet(tScsh(tally, 'Shj')),
        { a: 10, m: 10 }
      )
    })

    it('Should ignore falseSwitches if event doesn\'t have them', () => {
      const tally = { step: 10, falseStart: 1, falseSwitch: 1 }
      assert.deepStrictEqual(
        mod.speedHeadJudge('e.ijru.sp.sr.srss.1.30').calculateScoresheet(tScsh(tally, 'Shj')),
        { a: 10, m: 10 }
      )
    })

    it('Should deduct falseSwitches', () => {
      const tally = { step: 10, falseStart: 1, falseSwitch: 1 }
      assert.deepStrictEqual(
        mod.speedHeadJudge('e.ijru.sp.sr.srsr.4.4x30').calculateScoresheet(tScsh(tally, 'Shj')),
        { a: 10, m: 20 }
      )
    })

    it('Should cap falseSwitches', () => {
      const tally = { step: 10, falseStart: 1, falseSwitch: 4 }
      assert.deepStrictEqual(
        mod.speedHeadJudge('e.ijru.sp.sr.srsr.4.4x30').calculateScoresheet(tScsh(tally, 'Shj')),
        { a: 10, m: 40 }
      )
    })
  })

  describe('routinePresentationJudge', () => {
    it('Should return a score', () => {
      const tally = { entertainmentPlus: 10, entertainmentCheck: 5, musicalityPlus: 1 }
      assert.deepStrictEqual(
        mod.routinePresentationJudge('e.ijru.fs.sr.srif.1.75').calculateScoresheet(tScsh(tally, 'Shj')),
        { aE: 0.1, aM: 0.15 }
      )
    })
  })

  describe('athletePresentationJudge', () => {
    it('Should return a score', () => {
      const tally = { formExecutionMinus: 5, miss: 1 }
      assert.deepStrictEqual(
        mod.athletePresentationJudge('e.ijru.fs.sr.srif.1.75').calculateScoresheet(tScsh(tally, 'Shj')),
        { aF: -0.3, m: 0.975 }
      )
    })
  })
})
