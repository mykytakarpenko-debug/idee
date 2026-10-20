/**
 * Generatore pseudo-casuale deterministico (mulberry32).
 * Stesso seme → stessi dati demo, utile per test e screenshot ripetibili.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    /** Intero in [min, max] inclusi. */
    int(min: number, max: number) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    chance(probability: number) {
      return next() < probability;
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(next() * items.length)] as T;
    },
    /** Sceglie in base ai pesi: [[valore, peso], …]. */
    weighted<T>(entries: readonly (readonly [T, number])[]): T {
      const total = entries.reduce((acc, [, weight]) => acc + weight, 0);
      let roll = next() * total;
      for (const [value, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return value;
      }
      return entries[entries.length - 1]![0];
    },
  };
}

export type Random = ReturnType<typeof createRandom>;
