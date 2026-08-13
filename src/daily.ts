import { CONFIG } from './config';
import type { Card, DrawResult, Manifest } from './types';

const KEY = 'giants.photocard.daily.v1';

interface DailyRecord {
  date: string; // KST 기준 YYYY-MM-DD
  drawId: string;
  cardId: string;
}

/** ?dev=1 로 접속하면 일일 제한을 우회 (개발/시연용) */
export function isDevBypass(): boolean {
  return new URLSearchParams(location.search).get('dev') === '1';
}

function kstParts(now = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: CONFIG.RESET_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) p[part.type] = part.value;
  return p;
}

export function todayKey(): string {
  const p = kstParts();
  return `${p.year}-${p.month}-${p.day}`;
}

/** 다음 KST 자정까지 남은 ms */
export function msUntilReset(): number {
  const p = kstParts();
  const h = Number(p.hour) % 24;
  const m = Number(p.minute);
  const s = Number(p.second);
  return ((23 - h) * 3600 + (59 - m) * 60 + (60 - s)) * 1000;
}

export function getTodayDraw(manifest: Manifest): DrawResult | null {
  if (!CONFIG.DAILY_LIMIT || isDevBypass()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as DailyRecord;
    if (rec.date !== todayKey()) return null;
    const card = manifest.cards.find((c: Card) => c.id === rec.cardId);
    if (!card) return null;
    return { drawId: rec.drawId, result: card, shown: [card], rarity: card.rarity };
  } catch {
    return null;
  }
}

export function saveTodayDraw(draw: DrawResult): void {
  try {
    const rec: DailyRecord = { date: todayKey(), drawId: draw.drawId, cardId: draw.result.id };
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {
    /* 프라이빗 모드 등 저장 불가 시 무시 — 흐름을 멈추지 않는다 */
  }
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
