export type Rarity = 'normal' | 'rare' | 'epic' | 'legendary';

export interface Card {
  id: string;
  player: string;
  /** 등번호. -1이면 배번 없음(일부 코치) */
  number: number;
  /** P / C / IF / OF / 코치 / 감독 */
  position: string;
  /** 보직 표기 (예: 수석코치, 타격(메인), PITCHER) */
  role?: string | null;
  rarity: Rarity;
  /** 상대경로. 로드 실패 시 플레이스홀더로 대체 */
  image: string;
  signed?: boolean;
}

export interface Manifest {
  season: string;
  backImage: string;
  cards: Card[];
}

export interface DrawResult {
  /** 클라 생성(uuid). 서버 연동 시 서버값으로 대체 */
  drawId: string;
  /** 확정 결과 */
  result: Card;
  /** 화면에 보여줄 3장 (result 포함, 셔플됨) */
  shown: Card[];
  rarity: Rarity;
}

export type Screen = 'SPLASH' | 'TEARING' | 'REVEAL_3' | 'RESULT';

export interface ScreenController {
  destroy(): void;
}

export interface AppContext {
  manifest: Manifest;
  /** 이번 세션에서 확정된 뽑기 결과 */
  draw: DrawResult | null;
  /** 오늘 이미 뽑아서 결과 재표시로 진입했는지 */
  returning: boolean;
  go(next: Screen): void;
}
