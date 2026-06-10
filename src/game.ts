import { OFFLINE_CAP_MS, OFFLINE_RATE, SUPERNOVA_THRESHOLD, achievements, getAutoPower, upgrades } from './config'
import type { GameState, UpgradeId } from './types'

export const SAVE_KEY = 'cosmic-clicker-save'

export function createInitialState(now = Date.now()): GameState {
  return {
    version: 1,
    energy: 0,
    totalEnergy: 0,
    runEnergy: 0,
    clicks: 0,
    stardust: 0,
    supernovas: 0,
    upgrades: { pulse: 0, lens: 0, reactor: 0, satellite: 0, collector: 0, station: 0, dyson: 0, singularity: 0 },
    achievements: [],
    muted: false,
    lastSavedAt: now,
  }
}

export function getUpgradeCost(id: UpgradeId, level: number) {
  const upgrade = upgrades.find((item) => item.id === id)!
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.growth, level))
}

export function getSupernovaReward(runEnergy: number) {
  return runEnergy < SUPERNOVA_THRESHOLD ? 0 : Math.max(1, Math.floor(Math.sqrt(runEnergy / SUPERNOVA_THRESHOLD)))
}

export function getOfflineEarnings(state: GameState, now = Date.now()) {
  const elapsed = Math.min(Math.max(0, now - state.lastSavedAt), OFFLINE_CAP_MS)
  return getAutoPower(state) * (elapsed / 1000) * OFFLINE_RATE
}

export function unlockAchievements(state: GameState) {
  const unlocked = new Set(state.achievements)
  achievements.forEach((achievement) => {
    if (achievement.check(state)) unlocked.add(achievement.id)
  })
  return [...unlocked]
}

export function parseSave(raw: string | null, now = Date.now()): GameState {
  if (!raw) return createInitialState(now)
  try {
    const candidate = JSON.parse(raw) as Partial<GameState>
    if (candidate.version !== 1 || typeof candidate.energy !== 'number' || !candidate.upgrades) return createInitialState(now)
    const base = createInitialState(now)
    return {
      ...base,
      ...candidate,
      upgrades: { ...base.upgrades, ...candidate.upgrades },
      achievements: Array.isArray(candidate.achievements) ? candidate.achievements : [],
      lastSavedAt: typeof candidate.lastSavedAt === 'number' ? candidate.lastSavedAt : now,
    }
  } catch {
    return createInitialState(now)
  }
}

export function saveState(state: GameState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() }))
}
