import { unref, watch, isRef, ref } from 'vue'

import { importPreconfiguredCompetitionEvent, importPreconfiguredOverall, importRuleset } from '../import-helpers'

import type { MaybeRef } from '@vueuse/core'
import { RSUnsupported, type CompetitionEvent, type Overall, type Ruleset } from '@ropescore/rulesets'

export function useRuleset (rulesetId: MaybeRef<string | undefined>) {
  const ruleset = ref<Ruleset>()
  const key = unref(rulesetId)
  if (key != null) {
    importRuleset(key)
      .then(r => { ruleset.value = r })
      .catch(err => {
        console.error(err)
      })
  }

  if (isRef(rulesetId)) {
    watch(rulesetId, id => {
      if (id == null) ruleset.value = undefined
      else {
        importRuleset(id)
          .then(r => { ruleset.value = r })
          .catch(err => {
            console.error(err)
          })
      }
    })
  }

  return ruleset
}

export function useCompetitionEvent (competitionEventId: MaybeRef<string | undefined>) {
  const competitionEvent = ref<CompetitionEvent>()

  const key = unref(competitionEventId)
  if (key != null) {
    importPreconfiguredCompetitionEvent(key)
      .then(ce => { competitionEvent.value = ce })
      .catch(err => {
        console.error(err)
      })
  }

  if (isRef(competitionEventId)) {
    watch(competitionEventId, id => {
      if (id == null) competitionEvent.value = undefined
      else {
        importPreconfiguredCompetitionEvent(id)
          .then(ce => { competitionEvent.value = ce })
          .catch(err => {
            console.error(err)
          })
      }
    })
  }

  return competitionEvent
}

export function useOverall (competitionEventId: MaybeRef<string | undefined>) {
  const overall = ref<Overall>()

  const key = unref(competitionEventId)
  if (key != null) {
    importPreconfiguredOverall(key)
      .then(ce => { overall.value = ce })
      .catch(err => {
        console.error(err)
      })
  }

  if (isRef(competitionEventId)) {
    watch(competitionEventId, id => {
      if (id == null) overall.value = undefined
      else {
        importPreconfiguredOverall(id)
          .then(ce => { overall.value = ce })
          .catch(err => {
            console.error(err)
          })
      }
    })
  }

  return overall
}

export function useCompetitionEventOrOverall (competitionEventId: MaybeRef<string | undefined>) {
  const model = ref<Overall | CompetitionEvent>()

  async function loadModel (key: string) {
    try {
      model.value = await importPreconfiguredOverall(key)
      return
    } catch (err) {
      if (!(err instanceof RSUnsupported)) throw err
    }
    model.value = await importPreconfiguredCompetitionEvent(key)
  }

  const key = unref(competitionEventId)
  if (key != null) {
    loadModel(key)
      .catch(err => {
        console.error(err)
      })
  }

  if (isRef(competitionEventId)) {
    watch(competitionEventId, id => {
      if (id == null) model.value = undefined
      else {
        loadModel(id)
          .catch(err => {
            console.error(err)
          })
      }
    })
  }

  return model
}
