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
const WINDOW = { left: 0.18, right: 0.18, top: 0.235, bottom: 0.15 };
const INFO_BOTTOM: Record<string, number> = {
  normal: 0.19,
  rare: 0.192,
  epic: 0.2,
  legendary: 0.215,
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

  // 프레임 밖은 페이지 배경 그대로 (카드 박스 없음)
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.clip();

  // 프레임 투명창에 사진 배치
  const win = {
    x: cardX + cardW * WINDOW.left,
    y: cardY + cardH * WINDOW.top,
    w: cardW * (1 - WINDOW.left - WINDOW.right),
    h: cardH * (1 - WINDOW.top - WINDOW.bottom),
  };
  // 증명사진 배경 (화면과 동일한 라이트 그라디언트)
  const studio = ctx.createLinearGradient(0, win.y, 0, win.y + win.h);
  studio.addColorStop(0, '#eef1f6');
  studio.addColorStop(1, '#d6dde8');
  ctx.fillStyle = studio;
  ctx.fillRect(win.x, win.y, win.w, win.h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(win.x, win.y, win.w, win.h);
  ctx.clip();
  if (img) {
    // 바스트샷: cover + 중앙 정렬 (창 세로 채우고 좌우 크롭)
    const scale = Math.max(win.w / img.width, win.h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, win.x + (win.w - dw) / 2, win.y + (win.h - dh) / 2, dw, dh);
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

  // 번호·이름 가독성용 딤 처리 (화면과 동일한 그라디언트)
  const dimH = win.h * 0.42;
  const dim = ctx.createLinearGradient(0, win.y + win.h - dimH, 0, win.y + win.h);
  dim.addColorStop(0, 'rgba(7,16,32,0)');
  dim.addColorStop(0.42, 'rgba(7,16,32,0.45)');
  dim.addColorStop(1, 'rgba(7,16,32,0.82)');
  ctx.fillStyle = dim;
  ctx.fillRect(win.x, win.y + win.h - dimH, win.w, dimH);
  ctx.restore();

  // 번호·이름 (중앙 정렬)
  const infoBottomY = cardY + cardH * (1 - INFO_BOTTOM[card.rarity]);
  ctx.textBaseline = 'alphabetic';
  const numText = card.number >= 0 ? `NO.${card.number}` : '';
  ctx.font = 'italic 900 30px sans-serif';
  const numW = numText ? ctx.measureText(numText).width : 0;
  ctx.font = '800 36px sans-serif';
  const nameW = ctx.measureText(card.player).width;
  const gap = numText ? 12 : 0;
  const maxLineW = win.w * 0.78;
  ctx.textAlign = 'left';

  const drawLine = (num: string, name: string, base: number) => {
    ctx.font = 'italic 900 30px sans-serif';
    const nw = num ? ctx.measureText(num).width : 0;
    ctx.font = '800 36px sans-serif';
    const g = num ? 12 : 0;
    const w = nw + g + ctx.measureText(name).width;
    let tx = cardX + cardW / 2 - w / 2;
    if (num) {
      ctx.font = 'italic 900 30px sans-serif';
      ctx.fillStyle = '#ff6b83';
      ctx.fillText(num, tx, base);
      tx += nw + g;
    }
    ctx.font = '800 36px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, tx, base);
  };

  const tokens = card.player.split(' ');
  if (numW + gap + nameW > maxLineW && tokens.length > 1) {
    // 긴 이름은 2줄: 1줄 = NO.번호 + 첫 어절, 2줄 = 나머지
    drawLine(numText, tokens[0], infoBottomY - 42);
    drawLine('', tokens.slice(1).join(' '), infoBottomY);
  } else {
    drawLine(numText, card.player, infoBottomY);
  }
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
