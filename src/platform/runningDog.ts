import lottie from 'lottie-web/build/player/lottie_light'
import corgi from '../assets/corgi-running.json'
import type { Intensity } from '../domain/types'

const speedByEffort: Record<Intensity, number> = {
  recovery: 1,
  easy: 0.8,
  strong: 2.2,
  max: 3.4,
}
const gaitTransitionMs = 650

function dogData(walking: boolean) {
  const data = structuredClone(corgi)
  const layers = data.assets.flatMap(asset => asset.layers ?? [])
  const head = layers.find(layer => layer.nm === 'dau Outlines')
  if (head) {
    for (const shape of head.shapes ?? []) {
      if (shape.nm === 'Group 1') Object.assign(shape, { cl: 'corgi-eye' })
      if (shape.nm === 'Group 11') Object.assign(shape, { cl: 'corgi-brow' })
    }
  }
  const tongue = layers.find(layer => layer.nm === 'luoi Outlines')
  if (tongue) Object.assign(tongue, { cl: 'corgi-tongue' })
  if (!walking) return data

  // Four offset footfalls and a level torso replace the airborne gallop.
  const walkRotations: Record<string, number[]> = {
    'chan truoc 1 Outlines': [-82, -68, -54, -68, -82],
    'chan truoc 2 Outlines': [-74, -88, -102, -88, -74],
    'chan sau 1 Outlines': [66, 52, 66, 80, 66],
    'chan sau 2 Outlines': [60, 74, 60, 46, 60],
    'ban chan truoc 1 Outlines': [6, 0, -6, 0, 6],
    'ban chan truoc 2 Outlines': [-6, 0, 6, 0, -6],
    'tai truoc Outlines': [0, 3, 0, -3, 0],
    'tai sau Outlines': [0, 2, 0, -2, 0],
    'duoi Outlines': [-10, -4, -10, -16, -10],
    'co Outlines': [0, 1, 0, -1, 0],
  }
  for (const layer of layers) {
    const rotations = walkRotations[layer.nm]
    if (rotations) layer.ks.r = {
      a: 1, ix: 10, k: rotations.map((rotation, index) => ({
        t: index * 15, s: [rotation], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] },
      })),
    }
    if (layer.nm === 'than Outlines') {
      layer.ks.r = { a: 0, k: 0, ix: 10 }
      layer.ks.p = { a: 0, k: [548.051, 629.358, 0], ix: 2 }
    }
  }
  const shadow = data.layers.find(layer => layer.nm === 'Shape Layer 1')
  if (shadow) {
    shadow.ks.o = { a: 0, k: 25, ix: 11 }
    shadow.ks.s = { a: 0, k: [89, 100, 100], ix: 6 }
  }
  return data
}

function addExpressions(container: HTMLElement) {
  const eye = container.querySelector('.corgi-eye')
  if (!eye) return
  const ns = 'http://www.w3.org/2000/svg'
  const focused = document.createElementNS(ns, 'path')
  focused.setAttribute('class', 'corgi-eye-focused')
  focused.setAttribute('d', 'M-16 2 Q0 -5 17 -1')
  const wide = document.createElementNS(ns, 'g')
  wide.setAttribute('class', 'corgi-eye-wide')
  const pupil = document.createElementNS(ns, 'ellipse')
  pupil.setAttribute('rx', '11')
  pupil.setAttribute('ry', '14')
  const highlight = document.createElementNS(ns, 'circle')
  highlight.setAttribute('cx', '-3')
  highlight.setAttribute('cy', '-5')
  highlight.setAttribute('r', '3')
  wide.append(pupil, highlight)
  eye.append(focused, wide)
}

export function mountRunningDog(container: HTMLElement, initialEffort: Intensity, reduced: boolean) {
  const players = [false, true].map(walking => {
    const host = document.createElement('div')
    host.className = walking ? 'corgi-gait-walk' : 'corgi-gait-run'
    container.append(host)
    const player = lottie.loadAnimation({ container: host, renderer: 'svg', loop: true, autoplay: false, animationData: dogData(walking) })
    player.addEventListener('DOMLoaded', () => addExpressions(host))
    return { player, walking }
  })
  let speed = speedByEffort[initialEffort]
  let frameRequest = 0
  container.dataset.gait = initialEffort === 'recovery' ? 'walk' : 'run'
  for (const { player, walking } of players) {
    player.setSpeed(walking ? speedByEffort.recovery : speed)
    if (reduced) player.goToAndStop(0, true)
    else if (walking === (initialEffort === 'recovery')) player.play()
  }

  return {
    setEffort(effort: Intensity, reduceMotion: boolean) {
      cancelAnimationFrame(frameRequest)
      const walking = effort === 'recovery'
      container.dataset.gait = walking ? 'walk' : 'run'
      if (reduceMotion) {
        for (const { player } of players) player.goToAndStop(0, true)
        return
      }
      for (const { player } of players) player.play()
      const from = speed
      const to = speedByEffort[effort]
      const start = performance.now()
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / gaitTransitionMs)
        const eased = progress * progress * (3 - 2 * progress)
        speed = from + (to - from) * eased
        for (const { player, walking: isWalk } of players) {
          player.setSpeed(isWalk ? speedByEffort.recovery : speed)
          if (progress === 1 && isWalk !== walking) player.pause()
        }
        if (progress < 1) frameRequest = requestAnimationFrame(step)
      }
      frameRequest = requestAnimationFrame(step)
    },
    destroy() {
      cancelAnimationFrame(frameRequest)
      for (const { player } of players) player.destroy()
      container.replaceChildren()
    },
  }
}
