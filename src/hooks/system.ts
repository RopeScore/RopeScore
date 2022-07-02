import { useLocalStorage } from '@vueuse/core'

export interface SystemSettings {
  rsApiToken?: string
}

const system = useLocalStorage<SystemSettings>('rs-system', {})

export function useSystem () {
  return system
}
