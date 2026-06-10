export type UpgradeId =
  | 'pulse'
  | 'lens'
  | 'reactor'
  | 'satellite'
  | 'collector'
  | 'station'
  | 'dyson'
  | 'singularity'

export interface Upgrade {
  id: UpgradeId
  name: string
  description: string
  icon: string
  kind: 'click' | 'auto'
  baseCost: number
  growth: number
  power: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  check: (state: GameState) => boolean
}

export interface GameState {
  version: 1
  energy: number
  totalEnergy: number
  runEnergy: number
  clicks: number
  stardust: number
  supernovas: number
  upgrades: Record<UpgradeId, number>
  achievements: string[]
  muted: boolean
  lastSavedAt: number
}
