import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('lottie-web/build/player/lottie_light', () => ({ default: { loadAnimation: ({ container }: { container: Element }) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  container.append(svg)
  return { play() {}, setSpeed() {}, goToAndStop() {}, destroy() { svg.remove() } }
} } }))
