import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

export interface SystemSettings {
  rsApiToken?: string
  oldApiToken?: string
}

const system = useLocalStorage<SystemSettings>('rs-system', {})

export function useSystem () {
  const oldSystemId = computed(() => {
    if (system.value.rsApiToken) {
      const token = JSON.parse(atob(system.value.rsApiToken.split('.')[1]))
      return token.sub
    } else if (system.value.oldApiToken) {
      const token = JSON.parse(atob(system.value.oldApiToken.split('.')[1]))
      return token.sub
    } else return undefined
  })
  return {
    settings: system,
    oldSystemId,
    migrate () {
      if (system.value.rsApiToken == null) return
      system.value.oldApiToken = system.value.rsApiToken
      system.value.rsApiToken = undefined
    }
  }
}
