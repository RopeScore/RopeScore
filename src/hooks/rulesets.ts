import { unref, watch, isRef, ref } from 'vue'
import { rulesets } from '../rules'

import type { MaybeRef } from '@vueuse/shared'
import type { RulesetId, Ruleset } from '../rules'

export function useRuleset (rulesetId: MaybeRef<RulesetId | undefined>) {
  const ruleset = ref<Ruleset>()
  const key = unref(rulesetId)
  if (key) ruleset.value = rulesets[key]

  if (isRef(rulesetId)) {
    watch(rulesetId, id => {
      if (!id) ruleset.value = undefined
      else ruleset.value = rulesets[id]
    })
  }

  return ruleset
}
