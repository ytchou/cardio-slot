export function createWorkoutSeed() {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] ?? 0
}

