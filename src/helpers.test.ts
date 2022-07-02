/* eslint-env mocha */
import { calculateTally, Mark } from './helpers'
import assert from 'assert'
import { MarkScoresheet, TallyScoresheet } from './graphql/generated'

describe('helpers', () => {
  describe('memberNames', () => {})
  describe('getAbbr', () => {})
  describe('leftFillNum', () => {})
  describe('roundToMultiple', () => {})
  describe('roundTo', () => {})
  describe('factorFormat', () => {})
  describe('calculateTally', () => {
    it('Should return tally for a TallyScoresheet', () => {
      const tally = { entPlus: 2, entMinus: 1 }
      assert.deepStrictEqual(calculateTally({ tally } as unknown as TallyScoresheet), tally)
    })

    it('Should return tally for MarkScoresheet', () => {
      const marks: Mark[] = [
        { sequence: 0, schema: 'formPlus', timestamp: 1 },
        { sequence: 1, schema: 'formCheck', timestamp: 15 },
        { sequence: 2, schema: 'formPlus', timestamp: 30 }
      ]
      const tally = {
        formPlus: 2,
        formCheck: 1
      }
      assert.deepStrictEqual(calculateTally({ marks } as unknown as MarkScoresheet), tally)
    })

    it('Should return tally for MarkScoresheet with undo marks', () => {
      const marks: Mark[] = [
        { sequence: 0, schema: 'formPlus', timestamp: 1 },
        { sequence: 1, schema: 'formCheck', timestamp: 15 },
        { sequence: 2, schema: 'formPlus', timestamp: 30 },
        { sequence: 3, schema: 'undo', timestamp: 45, target: 2 }
      ]
      const tally = {
        formPlus: 1,
        formCheck: 1
      }
      assert.deepStrictEqual(calculateTally({ marks } as unknown as MarkScoresheet), tally)
    })
  })
})
