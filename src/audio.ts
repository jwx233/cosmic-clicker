let context: AudioContext | null = null

function tone(frequency: number, duration: number, volume: number, type: OscillatorType = 'sine') {
  context ??= new AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, context.currentTime)
  gain.gain.setValueAtTime(volume, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + duration)
}

export const sounds = {
  click: () => tone(520 + Math.random() * 100, 0.08, 0.035, 'sine'),
  buy: () => {
    tone(440, 0.15, 0.05, 'triangle')
    window.setTimeout(() => tone(680, 0.14, 0.04, 'triangle'), 65)
  },
  supernova: () => {
    tone(180, 0.6, 0.08, 'sawtooth')
    window.setTimeout(() => tone(720, 0.7, 0.06, 'sine'), 180)
  },
}
