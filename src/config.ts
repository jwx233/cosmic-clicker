import type { Achievement, Upgrade } from './types'

export const SUPERNOVA_THRESHOLD = 120_000
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000
export const OFFLINE_RATE = 0.5

export const upgrades: Upgrade[] = [
  { id: 'pulse', name: '脉冲增幅器', description: '强化每次触碰的能量脉冲', icon: '✦', kind: 'click', baseCost: 15, growth: 1.55, power: 1 },
  { id: 'lens', name: '量子透镜', description: '聚焦指尖释放的星光', icon: '◉', kind: 'click', baseCost: 120, growth: 1.62, power: 6 },
  { id: 'reactor', name: '微型反应堆', description: '持续产生基础能量', icon: '⬡', kind: 'auto', baseCost: 40, growth: 1.48, power: 2 },
  { id: 'satellite', name: '轨道卫星', description: '从高空收集宇宙射线', icon: '◇', kind: 'auto', baseCost: 280, growth: 1.52, power: 12 },
  { id: 'collector', name: '星尘采集器', description: '捕获漂浮的高能粒子', icon: '✧', kind: 'auto', baseCost: 1_500, growth: 1.57, power: 65 },
  { id: 'station', name: '深空充能站', description: '全天候向核心输送能源', icon: '▣', kind: 'auto', baseCost: 8_000, growth: 1.61, power: 320 },
  { id: 'dyson', name: '戴森光环', description: '截获恒星释放的光芒', icon: '◎', kind: 'auto', baseCost: 35_000, growth: 1.68, power: 1_500 },
  { id: 'singularity', name: '奇点引擎', description: '从时空褶皱提取能量', icon: '●', kind: 'auto', baseCost: 140_000, growth: 1.72, power: 7_000 },
]

export const achievements: Achievement[] = [
  { id: 'first-touch', name: '初次接触', description: '点击核心 1 次', icon: '✦', check: (s) => s.clicks >= 1 },
  { id: 'busy-hands', name: '指尖星火', description: '点击核心 100 次', icon: '☄', check: (s) => s.clicks >= 100 },
  { id: 'energy-1k', name: '稳定输出', description: '累计获得 1,000 能量', icon: '◌', check: (s) => s.totalEnergy >= 1_000 },
  { id: 'energy-100k', name: '光芒万丈', description: '累计获得 100,000 能量', icon: '☀', check: (s) => s.totalEnergy >= 100_000 },
  { id: 'energy-1m', name: '星河奔涌', description: '累计获得 1,000,000 能量', icon: '∞', check: (s) => s.totalEnergy >= 1_000_000 },
  { id: 'upgrade-5', name: '工程学徒', description: '任意升级达到 5 级', icon: '⌁', check: (s) => Object.values(s.upgrades).some((v) => v >= 5) },
  { id: 'upgrade-10', name: '轨道工程师', description: '任意升级达到 10 级', icon: '⌬', check: (s) => Object.values(s.upgrades).some((v) => v >= 10) },
  { id: 'all-systems', name: '全系统上线', description: '拥有全部八种升级', icon: '❖', check: (s) => Object.values(s.upgrades).every((v) => v >= 1) },
  { id: 'auto-1k', name: '永动星核', description: '每秒产能达到 1,000', icon: '↻', check: (s) => getAutoPower(s) >= 1_000 },
  { id: 'first-supernova', name: '再造星河', description: '完成首次超新星重启', icon: '✺', check: (s) => s.supernovas >= 1 },
]

export function getMultiplier(stardust: number) {
  return 1 + stardust * 0.25
}

export function getClickPower(state: GameStateLike) {
  const raw = 1 + upgrades.filter((u) => u.kind === 'click').reduce((sum, u) => sum + state.upgrades[u.id] * u.power, 0)
  return raw * getMultiplier(state.stardust)
}

export function getAutoPower(state: GameStateLike) {
  const raw = upgrades.filter((u) => u.kind === 'auto').reduce((sum, u) => sum + state.upgrades[u.id] * u.power, 0)
  return raw * getMultiplier(state.stardust)
}

type GameStateLike = Pick<import('./types').GameState, 'upgrades' | 'stardust'>
