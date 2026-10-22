export type Row = {
  feature: string
  stage: number
  lane: string
  kinds: string[]
  gate: string
  waitingHours: number | null
  slaHours: number
  isOverdue: boolean
  isCurrent: boolean
  isClosed: boolean
}

export type Board = {
  rows: Row[]
  branch: string
  isPaused: boolean
  isFrozen: boolean
  gateCommand: string
  retryCap: number
  promotable: string[]
  knowledgeIndex: string
}

export type Autopilot = {
  isOn: boolean
  attempts: number
  last: 'none' | 'green' | 'red' | 'stopped'
}

declare module 'claude-code' {
  interface PluginState {
    'ai-sdlc-autopilot': {
      board: Board | null
      isHidden: boolean
      autopilot: Autopilot
      notified: string[]
    }
  }
}
