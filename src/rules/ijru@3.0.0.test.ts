/* eslint-env mocha */
import * as mod from './ijru@3.0.0'
import assert from 'node:assert'
import { tScsh } from '../../test/helpets'
import { MarkScoresheetFragment, ScoresheetBaseFragment, TallyScoresheetFragment } from '../graphql/generated'

describe('ijru@3.0.0', () => {
  describe('L', () => {
    for (const [level, points] of [
      [0, 0],
      [0.5, 0.12],
      [1, 0.15],
      [2, 0.23],
      [3, 0.34],
      [4, 0.51],
      [5, 0.76],
      [6, 1.14],
      [7, 1.71],
      [8, 2.56]
    ]) {
      it(`should calculate correct score for L(${level})`, () => {
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
        mod.routinePresentationJudge('e.ijru.fs.sr.srif.1.75').calculateScoresheet(tScsh(tally, 'Pr', 'e.ijru.fs.sr.srif.1.75')),
        { aE: 0.3, aM: 0.45 }
      )
    })
  })

  describe('athletePresentationJudge', () => {
    it('Should return a score', () => {
      const tally = { formExecutionMinus: 5, miss: 1 }
      assert.deepStrictEqual(
        mod.athletePresentationJudge('e.ijru.fs.sr.srif.1.75').calculateScoresheet(tScsh(tally, 'Pa', 'e.ijru.fs.sr.srif.1.75')),
        { aF: -0.9, m: 0.975 }
      )
    })
  })

  describe('requiredElementsJudge', () => {})

  describe('difficultyJudge', () => {
    it('Should return a score', () => {
      const tally = { 'diffL0.5': 9, diffL1: 8, diffL2: 7, diffL3: 6, diffL4: 5, diffL5: 4, diffL6: 3, diffL7: 2, diffL8: 1 }
      assert.deepStrictEqual(
        mod.difficultyJudge('e.ijru.fs.sr.srif.1.75').calculateScoresheet(tScsh(tally, 'D', 'e.ijru.fs.sr.srif.1.75')),
        { D: 20.92 }
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
      assert.deepStrictEqual(mod.calculateSpeedEntry('e.ijru.sp.sr.srss.1.30')({ entryId: 'asd', participantId: 'fgh' }, scoresheets), {
        competitionEvent: 'e.ijru.sp.sr.srss.1.30',
        entryId: 'asd',
        participantId: 'fgh',
        result: {
          a: 10,
          m: 10,
          R: 0,

          withinThree: 1
        }
      })
    })

    it('Should pick the latest scoresheet for a judge', () => {
      const scoresheets: Array<ScoresheetBaseFragment & (TallyScoresheetFragment | MarkScoresheetFragment)> = [
        {
          id: 'aaa',
          judgeType: 'S',
          rulesId: 'ijru@2.0.0',
          judge: { id: 'asd' },
          competitionEventId: 'e.ijru.sp.sr.srss.1.30',
          createdAt: 10,
          updatedAt: 20,
          tally: { step: 10 }
        },
        {
          id: 'bbb',
          judgeType: 'S',
          rulesId: 'ijru@2.0.0',
          judge: { id: 'asd' },
          competitionEventId: 'e.ijru.sp.sr.srss.1.30',
          createdAt: 5,
          updatedAt: 30,
          tally: { step: 5 }
        }
      ]
      assert.deepStrictEqual(mod.calculateSpeedEntry('e.ijru.sp.sr.srss.1.30')({ entryId: 'asdawe', participantId: 'äasdwq' }, scoresheets), {
        competitionEvent: 'e.ijru.sp.sr.srss.1.30',
        entryId: 'asdawe',
        participantId: 'äasdwq',
        result: {
          a: 10,
          m: 0,
          R: 10,
          withinThree: 0
        }
      })
    })
  })

  describe('calculateFreestyleEntry', () => {})
})
