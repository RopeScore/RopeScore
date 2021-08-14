import { isTeam } from './store/schema'

import type { Participant } from './store/schema'

export function memberNames (participant?: Participant): string {
  if (!isTeam(participant)) return ''
  return participant.members?.map(psn => psn.name + (psn.ijruId ? ` (${psn.ijruId})` : '')).join(', ') ?? ''
}
