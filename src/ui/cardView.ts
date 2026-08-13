import type { Card, Manifest } from '../types';
import { RARITY } from '../config';

/** 카드ID → 플레이스홀더에 쓸 짧은 표시(등번호 우선, 없으면 이름 첫 글자) */
function placeholderMark(card: Card): string {
  return card.number >= 0 ? `${card.number}` : card.player.slice(0, 1);
}

function positionLabel(card: Card): string {
  if (card.position === '감독') return 'MANAGER';
  if (card.position === '코치') return 'COACH';
  return card.position;
}

/**
 * 카드 앞면 DOM.
 * 이미지 로드 실패 시 플레이스홀더(이니셜/등번호)로 대체하고 콘솔 경고만 남긴다.
 */
export function buildCardFront(card: Card): HTMLElement {
  const el = document.createElement('div');
  el.className = `card card-front rarity-${card.rarity}`;
  el.innerHTML = `
    <div class="card-photo">
      <div class="ph" aria-hidden="true">
        <span class="ph-mark">${placeholderMark(card)}</span>
        <span class="ph-name">${card.player}</span>
      </div>
    </div>
    <div class="card-topbar"><span class="brand">Giants</span><span class="year">2026</span></div>
    <div class="card-info">
      <span class="pos-badge">${card.role ?? positionLabel(card)}</span>
      <div class="name-line">
        ${card.number >= 0 ? `<span class="num">#${card.number}</span>` : ''}
        <span class="name">${card.player}</span>
      </div>
      <div class="card-footer"><span>BUSAN · LOTTE GIANTS</span><span class="brand-sm">Giants</span></div>
    </div>
    <i class="shine" aria-hidden="true"></i>
  `;
  const photo = el.querySelector('.card-photo') as HTMLElement;
  const img = new Image();
  img.alt = `${card.player} 포토카드`;
  img.draggable = false;
  img.onload = () => {
    photo.querySelector('.ph')?.remove();
    photo.appendChild(img);
  };
  img.onerror = () => {
    console.warn(`[cards] 이미지 로드 실패 → 플레이스홀더 사용: ${card.image}`);
  };
  img.src = card.image;
  return el;
}

/** 카드 뒷면 DOM — backImage 없거나 실패 시 CSS 렌더 폴백 */
export function buildCardBack(manifest: Manifest): HTMLElement {
  const el = document.createElement('div');
  el.className = 'card card-back';
  el.innerHTML = `
    <div class="back-css" aria-hidden="true">
      <div class="back-ring"><span>G</span></div>
      <div class="back-title">GIANTS</div>
      <div class="back-sub">PHOTO CARD · ${manifest.season}</div>
    </div>
    <i class="shine" aria-hidden="true"></i>
  `;
  if (manifest.backImage) {
    const img = new Image();
    img.alt = '';
    img.draggable = false;
    img.className = 'back-img';
    img.onload = () => el.prepend(img);
    img.src = manifest.backImage;
  }
  return el;
}

export function rarityBadgeText(card: Card): string {
  return RARITY.label[card.rarity];
}
