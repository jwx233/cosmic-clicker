import { describe, expect, it } from 'vitest'
import { OFFLINE_CAP_MS, OFFLINE_RATE, SUPERNOVA_THRESHOLD, getAutoPower } from './config'
import { createInitialState, getOfflineEarnings, getSupernovaReward, getUpgradeCost, parseSave } from './game'

describe('cosmic clicker economy', () => {
  it('increases upgrade prices by level', () => {
    expect(getUpgradeCost('pulse', 0)).toBe(15)
    expect(getUpgradeCost('pulse', 2)).toBeGreaterThan(getUpgradeCost('pulse', 1))
  })

  it('calculates automatic power with stardust multiplier', () => {
    const state = createInitialState()
    state.upgrades.reactor = 2
    state.stardust = 4
    expect(getAutoPower(state)).toBe(8)
  })

  it('only awards supernova rewards after threshold', () => {
    expect(getSupernovaReward(SUPERNOVA_THRESHOLD - 1)).toBe(0)
    expect(getSupernovaReward(SUPERNOVA_THRESHOLD)).toBe(1)
    expect(getSupernovaReward(SUPERNOVA_THRESHOLD * 4)).toBe(2)
  })

  it('caps offline earnings at eight hours and applies half rate', () => {
    const now = 10_000_000_000
    const state = createInitialState(now - OFFLINE_CAP_MS * 2)
    state.upgrades.reactor = 1
    expect(getOfflineEarnings(state, now)).toBe(2 * (OFFLINE_CAP_MS / 1000) * OFFLINE_RATE)
  })

  it('falls back for corrupt saves and restores valid saves', () => {
    expect(parseSave('{broken', 123).lastSavedAt).toBe(123)
    const state = createInitialState(50)
    state.energy = 99
    expect(parseSave(JSON.stringify(state), 100).energy).toBe(99)
  })
})
