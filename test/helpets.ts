import { type ScoresheetBaseFragment, type TallyScoresheetFragment } from '../src/graphql/generated'
import { type CompetitionEvent, type ScoreTally } from '../src/helpers'

export function tScsh (tally: ScoreTally, judgeType: string, competitionEvent: CompetitionEvent): TallyScoresheetFragment & ScoresheetBaseFragment {
  return {
    id: 'test-scoresheet',
    judge: { id: 'asd' },
    judgeType,
    rulesId: 'ijru@2.0.0',
    competitionEventId: competitionEvent,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tally
  }
}
