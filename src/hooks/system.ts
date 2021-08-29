import { useLocalStorage } from '@vueuse/core'

export interface SystemSettings {
  computerName: string
  rsApiToken?: string
}

const system = useLocalStorage<SystemSettings>('rs-system', { computerName: '' })

export function useSystem () {
  return system
}
