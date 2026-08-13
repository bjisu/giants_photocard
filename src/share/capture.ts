import type { Card } from '../types';
import { RARITY } from '../config';

const W = 750;
const H = 1050;

const FRAME: Record<string, string> = {
  normal: '#c8d3e2',
  rare: '#4f8ef7',
  epic: '#b06bf7',
  legendary: '#f6c453',
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

  // 사진 영역
  const photoRect = { x: 34, y: 34, w: W - 68, h: H * 0.66 };
  const img = await loadImage(card.image);
  ctx.save();
  roundRect(ctx, photoRect.x, photoRect.y, photoRect.w, photoRect.h, 28);
  ctx.clip();
  if (img) {
    // cover 방식으로 채우기
    const scale = Math.max(photoRect.w / img.width, photoRect.h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, photoRect.x + (photoRect.w - dw) / 2, photoRect.y + (photoRect.h - dh) / 2, dw, dh);
  } else {
    // 플레이스홀더
    const pg = ctx.createLinearGradient(0, photoRect.y, 0, photoRect.y + photoRect.h);
    pg.addColorStop(0, '#143263');
    pg.addColorStop(1, '#0c2347');
    ctx.fillStyle = pg;
    ctx.fillRect(photoRect.x, photoRect.y, photoRect.w, photoRect.h);
    ctx.fillStyle = 'rgba(234,241,251,.9)';
    ctx.font = 'bold 220px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const mark = card.number >= 0 ? `${card.number}` : card.player.slice(0, 1);
    ctx.fillText(mark, W / 2, photoRect.y + photoRect.h / 2);
  }
  // 사진 하단 그라디언트
  const fade = ctx.createLinearGradient(0, photoRect.y + photoRect.h - 200, 0, photoRect.y + photoRect.h);
  fade.addColorStop(0, 'rgba(8,24,49,0)');
  fade.addColorStop(1, 'rgba(8,24,49,.85)');
  ctx.fillStyle = fade;
  ctx.fillRect(photoRect.x, photoRect.y + photoRect.h - 200, photoRect.w, 200);
  ctx.restore();

  // 텍스트
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const infoY = photoRect.y + photoRect.h + 74;

  // 희귀도 뱃지
  ctx.fillStyle = frame;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(RARITY.label[card.rarity], 60, infoY - 8);

  // 보직/포지션
  ctx.fillStyle = 'rgba(157,177,207,.95)';
  ctx.font = '600 26px sans-serif';
  ctx.fillText(card.role ?? card.position, 60, infoY + 34);

  // 이름 + 등번호
  ctx.font = 'italic 900 54px sans-serif';
  ctx.fillStyle = '#e11d3f';
  const numText = card.number >= 0 ? `#${card.number} ` : '';
  ctx.fillText(numText, 60, infoY + 100);
  const numWidth = ctx.measureText(numText).width;
  ctx.fillStyle = '#eaf1fb';
  ctx.font = '800 54px sans-serif';
  ctx.fillText(card.player, 60 + numWidth, infoY + 100);

  // 푸터
  ctx.fillStyle = 'rgba(157,177,207,.8)';
  ctx.font = '600 22px sans-serif';
  ctx.fillText('BUSAN · LOTTE GIANTS · 2026', 60, H - 52);
  ctx.textAlign = 'right';
  ctx.font = 'italic 900 30px sans-serif';
  ctx.fillStyle = '#e11d3f';
  ctx.fillText('Giants', W - 60, H - 52);
  ctx.textAlign = 'left';

  // 희귀도 프레임
  ctx.lineWidth = 12;
  ctx.strokeStyle = frame;
  roundRect(ctx, 12, 12, W - 24, H - 24, 40);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  roundRect(ctx, 26, 26, W - 52, H - 52, 32);
  ctx.stroke();

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
