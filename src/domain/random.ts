export function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(values: readonly T[], random: () => number): T {
  const value = values[Math.floor(random() * values.length)]
  if (value === undefined) throw new Error('Cannot choose from an empty collection')
  return value
}

export function randomInteger(min: number, max: number, random: () => number) {
  return min + Math.floor(random() * (max - min + 1))
}

