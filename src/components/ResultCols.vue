<template>
  <td
    v-for="col of columns"
    :key="col.key"
  >
    {{ result ? col.formatter?.(result.result[col.key]) ?? result.result[col.key] : '' }}
  </td>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useCompetitionEvent } from '../hooks/rulesets'
import { filterLatestScoresheets, isTallyScoresheet } from '../helpers'

import type { PropType } from 'vue'
import { isMarkScoresheet, type JudgeResult, type ScoreTally, type TableHeader } from '@ropescore/rulesets'
import { type EntryBaseFragment, type MarkScoresheetFragment, type ScoresheetBaseFragment, type TallyScoresheetFragment } from '../graphql/generated'

const props = defineProps({
  columns: {
    type: Object as PropType<TableHeader[]>,
    required: true
  },
  participantId: {
    type: String,
    required: true
  },
  entry: {
    type: Object as PropType<EntryBaseFragment & { scoresheets: Array<ScoresheetBaseFragment & (TallyScoresheetFragment | MarkScoresheetFragment)> }>,
    required: true
  }
})

const entry = toRef(props, 'entry')
const cEvtId = computed(() => entry.value.competitionEventId)
const competitionEvent = useCompetitionEvent(cEvtId)

const result = computed(() => {
  if (!entry.value) return
  const scoresheets = filterLatestScoresheets(entry.value.scoresheets)
  // TODO: apply options
  const judges = competitionEvent.value?.judges.map(j => j({})) ?? []
  const judgeResults = scoresheets
    .map(scsh => {
      const judge = judges.find(j => j.id === scsh.judgeType)
      if (judge == null) return undefined

      const meta = {
        entryId: entry.value.id,
        participantId: props.participantId,
        competitionEvent: entry.value.competitionEventId,
        judgeTypeId: scsh.judgeType,
        judgeId: scsh.judge.id
      }

      const tallyScsh = isTallyScoresheet(scsh) ? { meta, tally: scsh.tally as ScoreTally } : judge.calculateTally({ meta, marks: isMarkScoresheet(scsh) ? scsh.marks : [] })

      return judge.calculateJudgeResult(tallyScsh)
    })
    .filter(r => r != null)
  return competitionEvent.value?.calculateEntry(
    {
      entryId: entry.value.id,
      participantId: props.participantId,
      competitionEvent: entry.value.competitionEventId
    },
    judgeResults,
    // TODO: apply options
    {}
  )
})
</script>
