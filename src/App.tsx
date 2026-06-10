import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { achievements, getAutoPower, getClickPower, getMultiplier, SUPERNOVA_THRESHOLD, upgrades } from './config'
import { createInitialState, getOfflineEarnings, getSupernovaReward, getUpgradeCost, parseSave, SAVE_KEY, saveState, unlockAchievements } from './game'
import { sounds } from './audio'
import type { GameState, UpgradeId } from './types'

type Toast = { id: number; text: string; icon: string }
type Spark = { id: number; x: number; y: number; value: number }

const compact = new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 })
const precise = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 })
const format = (value: number) => (value < 10_000 ? precise.format(value) : compact.format(value))

function App() {
  const loaded = useRef(false)
  const [state, setState] = useState<GameState>(() => {
    if (typeof localStorage === 'undefined') return createInitialState()
    return parseSave(localStorage.getItem(SAVE_KEY))
  })
  const [offlineGain, setOfflineGain] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [sparks, setSparks] = useState<Spark[]>([])
  const [showAchievements, setShowAchievements] = useState(false)
  const [confirm, setConfirm] = useState<'reset' | 'supernova' | null>(null)
  const toastId = useRef(0)

  const clickPower = useMemo(() => getClickPower(state), [state])
  const autoPower = useMemo(() => getAutoPower(state), [state])
  const reward = getSupernovaReward(state.runEnergy)
  const progress = Math.min(100, (state.runEnergy / SUPERNOVA_THRESHOLD) * 100)

  const notify = useCallback((text: string, icon = '✦') => {
    const id = ++toastId.current
    setToasts((items) => [...items, { id, text, icon }])
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3200)
  }, [])

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    const gain = getOfflineEarnings(state)
    if (gain >= 1) {
      setOfflineGain(gain)
      setState((current) => ({ ...current, energy: current.energy + gain, totalEnergy: current.totalEnergy + gain, runEnergy: current.runEnergy + gain }))
    }
  }, [state])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((current) => {
        const gain = getAutoPower(current) / 10
        if (gain <= 0) return current
        return { ...current, energy: current.energy + gain, totalEnergy: current.totalEnergy + gain, runEnergy: current.runEnergy + gain }
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const previous = new Set(state.achievements)
    const next = unlockAchievements(state)
    const newlyUnlocked = next.filter((id) => !previous.has(id))
    if (newlyUnlocked.length) {
      setState((current) => ({ ...current, achievements: next }))
      newlyUnlocked.forEach((id) => {
        const achievement = achievements.find((item) => item.id === id)!
        notify(`解锁成就：${achievement.name}`, achievement.icon)
      })
    }
  }, [state, notify])

  useEffect(() => {
    const timer = window.setInterval(() => saveState(state), 5000)
    const onHidden = () => document.hidden && saveState(state)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [state])

  const clickCore = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const spark = { id: Date.now() + Math.random(), x: event.clientX - rect.left, y: event.clientY - rect.top, value: clickPower }
    setSparks((items) => [...items.slice(-10), spark])
    window.setTimeout(() => setSparks((items) => items.filter((item) => item.id !== spark.id)), 850)
    setState((current) => ({
      ...current,
      energy: current.energy + getClickPower(current),
      totalEnergy: current.totalEnergy + getClickPower(current),
      runEnergy: current.runEnergy + getClickPower(current),
      clicks: current.clicks + 1,
    }))
    if (!state.muted) sounds.click()
    if (navigator.vibrate) navigator.vibrate(10)
  }

  const buyUpgrade = (id: UpgradeId) => {
    const cost = getUpgradeCost(id, state.upgrades[id])
    if (state.energy < cost) return
    setState((current) => ({
      ...current,
      energy: current.energy - cost,
      upgrades: { ...current.upgrades, [id]: current.upgrades[id] + 1 },
    }))
    if (!state.muted) sounds.buy()
  }

  const doSupernova = () => {
    const earned = getSupernovaReward(state.runEnergy)
    if (!earned) return
    const fresh = createInitialState()
    setState({
      ...fresh,
      totalEnergy: state.totalEnergy,
      clicks: state.clicks,
      stardust: state.stardust + earned,
      supernovas: state.supernovas + 1,
      achievements: state.achievements,
      muted: state.muted,
    })
    setConfirm(null)
    notify(`超新星爆发！获得 ${earned} 星尘`, '✺')
    if (!state.muted) sounds.supernova()
  }

  const doReset = () => {
    const fresh = createInitialState()
    setState({ ...fresh, muted: state.muted })
    localStorage.removeItem(SAVE_KEY)
    setConfirm(null)
    notify('星球充能站已重置', '↻')
  }

  return (
    <div className="app-shell">
      <div className="stars stars-a" />
      <div className="stars stars-b" />
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <div><strong>星球充能站</strong><small>COSMIC ENERGY LAB</small></div>
        </div>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setShowAchievements(true)} aria-label="查看成就">🏆 <span>{state.achievements.length}/10</span></button>
          <button className="icon-button" onClick={() => setState((s) => ({ ...s, muted: !s.muted }))} aria-label={state.muted ? '开启声音' : '静音'}>
            {state.muted ? '◱' : '◉'}
          </button>
          <button className="icon-button danger" onClick={() => setConfirm('reset')} aria-label="重置存档">↻</button>
        </div>
      </header>

      <main className="game-layout">
        <section className="core-panel">
          <div className="resource-card">
            <span>当前能量</span>
            <strong>{format(state.energy)}</strong>
            <div className="rate-row"><span>每次点击 +{format(clickPower)}</span><span>每秒 +{format(autoPower)}</span></div>
          </div>

          <div className="core-stage">
            <div className="orbit orbit-one"><i /><i /><i /></div>
            <div className="orbit orbit-two"><i /><i /></div>
            <button className="energy-core" onPointerDown={clickCore} aria-label="点击能量核心">
              <span className="core-glow" />
              <span className="core-center">✦</span>
              {sparks.map((spark) => <span className="spark-number" key={spark.id} style={{ left: spark.x, top: spark.y }}>+{format(spark.value)}</span>)}
            </button>
            <p>点击核心注入能量</p>
          </div>

          <div className="supernova-card">
            <div className="supernova-title">
              <div><span>超新星进度</span><strong>{format(state.runEnergy)} / {format(SUPERNOVA_THRESHOLD)}</strong></div>
              <span className="stardust">✺ {state.stardust} 星尘</span>
            </div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            <div className="supernova-footer">
              <small>永久倍率 ×{getMultiplier(state.stardust).toFixed(2)}</small>
              <button disabled={!reward} onClick={() => setConfirm('supernova')}>{reward ? `引爆并获得 ${reward} 星尘` : '继续积蓄能量'}</button>
            </div>
          </div>
          <div className="mini-stats"><span>历史能量 <b>{format(state.totalEnergy)}</b></span><span>核心触碰 <b>{format(state.clicks)}</b></span><span>超新星 <b>{state.supernovas}</b></span></div>
        </section>

        <aside className="upgrade-panel">
          <div className="panel-heading"><div><span>轨道实验室</span><h2>系统升级</h2></div><span className="live-dot">运行中</span></div>
          <div className="upgrade-list">
            {upgrades.map((upgrade) => {
              const level = state.upgrades[upgrade.id]
              const cost = getUpgradeCost(upgrade.id, level)
              const affordable = state.energy >= cost
              return (
                <button className="upgrade-card" key={upgrade.id} disabled={!affordable} onClick={() => buyUpgrade(upgrade.id)}>
                  <span className={`upgrade-icon ${upgrade.kind}`}>{upgrade.icon}</span>
                  <span className="upgrade-info"><strong>{upgrade.name}</strong><small>{upgrade.description}</small><em>+{format(upgrade.power * getMultiplier(state.stardust))} {upgrade.kind === 'click' ? '点击' : '能量/秒'}</em></span>
                  <span className="upgrade-buy"><b>Lv.{level}</b><strong>✦ {format(cost)}</strong></span>
                </button>
              )
            })}
          </div>
        </aside>
      </main>

      <div className="toast-stack">{toasts.map((toast) => <div className="toast" key={toast.id}><span>{toast.icon}</span>{toast.text}</div>)}</div>

      {offlineGain > 0 && <div className="modal-backdrop"><div className="modal"><span className="modal-icon">☄</span><h2>欢迎返回，指挥官</h2><p>离线期间，充能站为你收集了</p><strong className="modal-value">+{format(offlineGain)} 能量</strong><button onClick={() => setOfflineGain(0)}>收下能量</button></div></div>}
      {showAchievements && <div className="modal-backdrop" onClick={() => setShowAchievements(false)}><div className="modal achievements-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowAchievements(false)}>×</button><h2>星际成就</h2><div className="achievement-grid">{achievements.map((achievement) => { const unlocked = state.achievements.includes(achievement.id); return <div className={`achievement ${unlocked ? 'unlocked' : ''}`} key={achievement.id}><span>{achievement.icon}</span><div><strong>{achievement.name}</strong><small>{achievement.description}</small></div></div> })}</div></div></div>}
      {confirm && <div className="modal-backdrop"><div className="modal"><span className="modal-icon">{confirm === 'reset' ? '↻' : '✺'}</span><h2>{confirm === 'reset' ? '重置整个星系？' : '引爆超新星？'}</h2><p>{confirm === 'reset' ? '所有进度、星尘和成就都会永久清除。' : `普通升级将归零，你会获得 ${reward} 星尘和永久倍率。`}</p><div className="modal-actions"><button className="secondary" onClick={() => setConfirm(null)}>取消</button><button onClick={confirm === 'reset' ? doReset : doSupernova}>确认{confirm === 'reset' ? '重置' : '引爆'}</button></div></div></div>}
    </div>
  )
}

export default App
