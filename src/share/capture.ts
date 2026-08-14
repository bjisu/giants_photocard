import type { Card } from '../types';
import { RARITY } from '../config';
import { FRAME_IMAGES } from '../ui/cardView';

const W = 750;
const H = 1050;

const FRAME: Record<string, string> = {
  normal: '#c8d3e2',
  rare: '#4f8ef7',
  epic: '#b06bf7',
  legendary: '#f6c453',
};

/* 화면 카드와 동일한 프레임 투명창 배치 비율 (card.css 참고) */
const WINDOW = { left: 0.18, right: 0.18, top: 0.235, bottom: 0.155 };
const INFO_BOTTOM: Record<string, number> = {
  normal: 0.17,
  rare: 0.173,
  epic: 0.181,
  legendary: 0.195,
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 결과 카드 → PNG Blob (카드 + 희귀도 프레임 + 텍스트 + 워터마크 합성) */
export async function captureCard(card: Card): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const frame = FRAME[card.rarity];

  // 배경
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a1f3d');
  bg.addColorStop(1, '#081831');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 카드 영역 (5:7, 화면 카드와 동일 구성)
  const cardW = 620;
  const cardH = cardW * 1.4;
  const cardX = (W - cardW) / 2;
  const cardY = 44;

  const [img, frameImg] = await Promise.all([loadImage(card.image), loadImage(FRAME_IMAGES[card.rarity])]);

  // 카드 바탕
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.clip();
  const cbg = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
  cbg.addColorStop(0, '#0c1b36');
  cbg.addColorStop(1, '#081426');
  ctx.fillStyle = cbg;
  ctx.fillRect(cardX, cardY, cardW, cardH);

  // 프레임 투명창에 사진 배치
  const win = {
    x: cardX + cardW * WINDOW.left,
    y: cardY + cardH * WINDOW.top,
    w: cardW * (1 - WINDOW.left - WINDOW.right),
    h: cardH * (1 - WINDOW.top - WINDOW.bottom),
  };
  if (img) {
    const scale = Math.max(win.w / img.width, win.h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, win.x + (win.w - dw) / 2, win.y, dw, dh);
  } else {
    const pg = ctx.createLinearGradient(0, win.y, 0, win.y + win.h);
    pg.addColorStop(0, '#143263');
    pg.addColorStop(1, '#0c2347');
    ctx.fillStyle = pg;
    ctx.fillRect(win.x, win.y, win.w, win.h);
    ctx.fillStyle = 'rgba(234,241,251,.9)';
    ctx.font = 'bold 150px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const mark = card.number >= 0 ? `${card.number}` : card.player.slice(0, 1);
    ctx.fillText(mark, win.x + win.w / 2, win.y + win.h / 2);
  }

  // 창 하단 이름 영역 그라디언트
  const infoBottomY = cardY + cardH * (1 - INFO_BOTTOM[card.rarity]);
  const fade = ctx.createLinearGradient(0, infoBottomY - 150, 0, infoBottomY);
  fade.addColorStop(0, 'rgba(5,15,34,0)');
  fade.addColorStop(0.42, 'rgba(5,15,34,.88)');
  fade.addColorStop(1, 'rgba(5,15,34,.96)');
  ctx.fillStyle = fade;
  ctx.fillRect(win.x, infoBottomY - 150, win.w, 150);

  // 보직 뱃지 + 이름 (창 안쪽)
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  // 다이아 프레임 창(좌 22.4%)이 가장 좁으므로 전 등급 공통 24.5% 지점에서 시작
  const textX = cardX + cardW * 0.245;
  const roleText = card.role ?? card.position;
  ctx.font = '800 19px sans-serif';
  const roleW = ctx.measureText(roleText).width;
  ctx.fillStyle = '#e11d3f';
  roundRect(ctx, textX, infoBottomY - 92, roleW + 24, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText(roleText, textX + 12, infoBottomY - 69);

  ctx.font = 'italic 900 44px sans-serif';
  ctx.fillStyle = '#e11d3f';
  const numText = card.number >= 0 ? `#${card.number} ` : '';
  ctx.fillText(numText, textX, infoBottomY - 18);
  const numWidth = ctx.measureText(numText).width;
  ctx.fillStyle = '#eaf1fb';
  ctx.font = '800 44px sans-serif';
  ctx.fillText(card.player, textX + numWidth, infoBottomY - 18);
  ctx.restore();

  // 희귀도 프레임 아트웍 합성
  if (frameImg) {
    ctx.drawImage(frameImg, cardX, cardY, cardW, cardH);
  }

  // 카드 아래: 희귀도 라벨
  ctx.textAlign = 'center';
  ctx.fillStyle = frame;
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(RARITY.label[card.rarity], W / 2, cardY + cardH + 66);

  // 푸터
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(157,177,207,.8)';
  ctx.font = '600 22px sans-serif';
  ctx.fillText('BUSAN · LOTTE GIANTS · 2026', 60, H - 40);
  ctx.textAlign = 'right';
  ctx.font = 'italic 900 30px sans-serif';
  ctx.fillStyle = '#e11d3f';
  ctx.fillText('Giants', W - 60, H - 40);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
