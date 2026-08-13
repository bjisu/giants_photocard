import type { Card, Manifest, Rarity } from './types';

/**
 * cards.json 로드.
 * - URL 파라미터 ?s=시즌 이 있으면 해당 시즌만 필터(§1.3)
 * - 로드 실패/카드 부족 시에도 플레이스홀더 카드로 데모가 되도록 채운다
 */
export async function loadManifest(): Promise<Manifest> {
  let manifest: Manifest = { season: '2026', backImage: '', cards: [] };
  try {
    const res = await fetch('data/cards.json', { cache: 'no-cache' });
    if (res.ok) manifest = (await res.json()) as Manifest;
    else console.warn('[cards] cards.json 로드 실패 — 플레이스홀더로 진행');
  } catch (e) {
    console.warn('[cards] cards.json 로드 실패 — 플레이스홀더로 진행', e);
  }

  const params = new URLSearchParams(location.search);
  const season = params.get('s');
  if (season && manifest.season && season !== manifest.season) {
    console.warn(`[cards] 요청 시즌(${season}) ≠ 매니페스트 시즌(${manifest.season}) — 전체 사용`);
  }
  const goodsId = params.get('g');
  if (goodsId) console.info(`[nfc] goods=${goodsId}`); // 로그용 (§1.3)

  // 3장 미만이어도 데모가 되도록 플레이스홀더로 채움 (§2.3)
  const fillers: Rarity[] = ['normal', 'rare', 'epic'];
  let i = 0;
  while (manifest.cards.length < 3) {
    manifest.cards.push({
      id: `placeholder-${i}`,
      player: `자이언츠 ${i + 1}`,
      number: i + 1,
      position: 'OF',
      rarity: fillers[i % fillers.length],
      image: '',
    } as Card);
    i++;
  }
  return manifest;
}

/** 뽑힌 3장 + 뒷면 이미지를 미리 로드 */
export function preloadImages(urls: (string | undefined)[]): void {
  for (const u of urls) {
    if (!u) continue;
    const img = new Image();
    img.src = u;
  }
}
