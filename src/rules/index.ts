import IJRU_2_0_0 from './ijru@2.0.0'

import type { CompetitionEvent } from '../store/schema'

// export const rulesetIds = ['ijru@2.0.0', 'ijru@1.1.0', 'svgf-rh@2020', 'svgf-vh@2020', 'svgf-vh@2018', 'fisac@2017-2018'] as const
export type RulesetId = keyof typeof rulesets

export const rulesets = {
  'ijru@2.0.0': IJRU_2_0_0
}

export interface Ruleset {
  id: string
  name: string
  competitionEvents: Partial<Record<CompetitionEvent, CompetitionEventDefinition>>
}

export interface CompetitionEventDefinition {
  name: string
}
