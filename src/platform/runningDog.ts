import lottie from 'lottie-web/build/player/lottie_light'
import corgi from '../assets/corgi-running.json'
import type { Intensity } from '../domain/types'

const speedByEffort: Record<Intensity, number> = {
  recovery: 0.55,
  easy: 0.8,
  strong: 1.45,
  max: 2.05,
}

export function mountRunningDog(container: HTMLElement, initialEffort: Intensity, reduced: boolean) {
  const animation = lottie.loadAnimation({ container, renderer: 'svg', loop: true, autoplay: !reduced, animationData: structuredClone(corgi) })
  let speed = speedByEffort[initialEffort]
  let frameRequest = 0
  animation.setSpeed(speed)
  if (reduced) animation.goToAndStop(15, true)

  return {
    setEffort(effort: Intensity, reduceMotion: boolean) {
      cancelAnimationFrame(frameRequest)
      if (reduceMotion) {
        animation.goToAndStop(15, true)
        return
      }
      animation.play()
      const from = speed
      const to = speedByEffort[effort]
      const start = performance.now()
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / 650)
        const eased = progress * progress * (3 - 2 * progress)
        speed = from + (to - from) * eased
        animation.setSpeed(speed)
        if (progress < 1) frameRequest = requestAnimationFrame(step)
      }
      frameRequest = requestAnimationFrame(step)
    },
    destroy() {
      cancelAnimationFrame(frameRequest)
      animation.destroy()
    },
  }
}
