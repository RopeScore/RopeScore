import type { TallyScoresheet, ScoreTally, CompetitionEvent } from '../src/store/schema'

export function tScsh (tally: ScoreTally, judgeType: string, competitionEvent: CompetitionEvent): TallyScoresheet {
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
