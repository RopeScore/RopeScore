/* eslint-env mocha */
import * as mod from './svgf-rh@2020'
import assert from 'node:assert'
import { tScsh } from '../../test/helpets'

describe('svgf-rh@2020', () => {
  describe('L', () => {
    for (const [level, points] of [
      [0, 0],
      [0.5, 0.5],
      [1, 1],
      [2, 1.5],
      [3, 2],
      [4, 2.5],
      [5, 3]
    ]) {
      it(`should calculate correct score for L(${level})`, () => {
        assert.strictEqual(mod.L(level), points)
      })
    }
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
        mod.speedHeadJudge('e.svgf.sp.dd.ddsr.4.4x45').calculateScoresheet(tScsh(tally, 'Shj', 'e.ijru.sp.sr.srsr.4.4x30')),
        { a: 10, m: 40 }
      )
    })
  })

  describe('difficultyJudge', () => {
    it('Should return a score', () => {
      const tally = { 'diffL0.5': 9, diffL1: 8, diffL2: 7, diffL3: 6, diffL4: 5, diffL5: 4 }
      assert.deepStrictEqual(
        mod.difficultyJudge('e.ijru.fs.sr.srif.1.75').calculateScoresheet(tScsh(tally, 'D', 'e.ijru.fs.sr.srif.1.75')),
        { D: 59.5 }
      )
    })
  })

  describe('presentationJudge', () => {
    it('Should return a score for a single rope event', () => {
      const tally = { musicOnBeat: 5, usingMusic: 7, movement: 4, formExecution: 9, impression: 6, miss: 1 }
      assert.deepStrictEqual(
        mod.presentationJudge('e.ijru.fs.sr.srif.1.75').calculateScoresheet(tScsh(tally, 'P', 'e.ijru.fs.sr.srif.1.75')),
        { P: 32 }
      )
    })

    it('Should return a score for a double dutch event', () => {
      const tally = { musicOnBeat: 5, interactions: 2, movement: 4, formExecution: 9, impression: 6, miss: 1 }
      assert.deepStrictEqual(
        mod.presentationJudge('e.ijru.fs.dd.ddsf.3.75').calculateScoresheet(tScsh(tally, 'P', 'e.ijru.fs.dd.ddsf.3.75')),
        { P: 27 }
      )
    })
  })
})
