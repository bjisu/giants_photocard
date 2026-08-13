import { RARITY } from './config';
import type { Card, DrawResult, Rarity } from './types';

export interface DrawEngine {
  draw(ctx: { goodsId?: string; season?: string; pool: Card[] }): Promise<DrawResult>;
}

function uuid(): string {
  if ('randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxx-4xxx-yxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** weight 합이 100이 아니어도 정규화해서 티어를 뽑는다 */
export function pickTierByWeight(weights: Record<Rarity, number>): Rarity {
  const entries = RARITY.order.map((r) => [r, Math.max(0, weights[r] ?? 0)] as const);
  const total = entries.reduce((a, [, w]) => a + w, 0) || 1;
  let roll = Math.random() * total;
  for (const [rarity, w] of entries) {
    roll -= w;
    if (roll < 0) return rarity;
  }
  return 'normal';
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 결과와 겹치지 않는 서로 다른 미끼 n장 */
function pickDecoys(pool: Card[], result: Card, n: number): Card[] {
  const others = shuffle(pool.filter((c) => c.id !== result.id));
  return others.slice(0, n);
}

/**
 * 콘텐츠(로컬) 구현.
 * 서버 연동 시 serverDrawEngine(POST /api/v1/draw)을 추가하고
 * main.ts에서 주입만 교체하면 된다.
 */
export const localDrawEngine: DrawEngine = {
  async draw({ pool }) {
    const tier = pickTierByWeight(RARITY.weights);
    const inTier = pool.filter((c) => c.rarity === tier);
    const result = pickRandom(inTier.length ? inTier : pool);
    const decoys = pickDecoys(pool, result, 2);
    const shown = shuffle([result, ...decoys]);
    return { drawId: uuid(), result, shown, rarity: result.rarity };
  },
};
