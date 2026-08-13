/** canvas 파티클/컨페티 — transform 기반, 저사양 시 자동 감소 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  shape: 'rect' | 'circle' | 'shard';
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let raf = 0;
let lastFrame = 0;
let degrade = false;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ensureCanvas(): void {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.id = 'fx-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  const resize = () => {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);
}

function loop(now: number): void {
  if (!ctx || !canvas) return;
  const dt = Math.min((now - lastFrame) / 16.7, 3);
  // 저사양 감지: 프레임이 계속 늘어지면 파티클 상한을 낮춘다
  if (now - lastFrame > 40 && particles.length > 60) degrade = true;
  lastFrame = now;

  ctx.clearRect(0, 0, innerWidth, innerHeight);
  particles = particles.filter((p) => p.life < p.maxLife);
  for (const p of particles) {
    p.life += dt;
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'shard') {
      ctx.fillRect(-p.size / 2, -p.size / 5, p.size, p.size / 2.5);
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
    }
    ctx.restore();
  }
  if (particles.length > 0) {
    raf = requestAnimationFrame(loop);
  } else {
    raf = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
}

function kick(): void {
  if (!raf) {
    lastFrame = performance.now();
    raf = requestAnimationFrame(loop);
  }
}

function add(count: number, make: () => Particle): void {
  if (reduceMotion()) count = Math.min(count, 6);
  if (degrade) count = Math.ceil(count / 2);
  ensureCanvas();
  for (let i = 0; i < count; i++) particles.push(make());
  kick();
}

/** 비닐 찢김 조각 — 탭 위치에서 튄다 */
export function spawnTearBits(x: number, y: number, count = 4): void {
  const colors = ['rgba(255,255,255,.92)', 'rgba(214,226,244,.9)', 'rgba(180,198,224,.85)'];
  add(count, () => ({
    x: x + (Math.random() - 0.5) * 30,
    y: y + (Math.random() - 0.5) * 30,
    vx: (Math.random() - 0.5) * 7,
    vy: -3 - Math.random() * 4,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    life: 0,
    maxLife: 30 + Math.random() * 16,
    size: 5 + Math.random() * 9,
    color: colors[Math.floor(Math.random() * colors.length)],
    gravity: 0.32,
    shape: 'shard',
  }));
}

/** 희귀도 연출용 버스트 (카드 주변) */
export function spawnBurst(x: number, y: number, count: number, colors: string[]): void {
  if (count <= 0) return;
  add(count, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 6;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.5,
      life: 0,
      maxLife: 40 + Math.random() * 30,
      size: 4 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity: 0.16,
      shape: Math.random() < 0.5 ? 'circle' : 'rect',
    };
  });
}

/** 레전더리 풀스크린 컨페티 */
export function confetti(): void {
  const colors = ['#f6c453', '#e11d3f', '#4f8ef7', '#ffffff', '#ffd98a'];
  add(110, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.4,
    vx: (Math.random() - 0.5) * 2.4,
    vy: 2 + Math.random() * 3.5,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.35,
    life: 0,
    maxLife: 130 + Math.random() * 80,
    size: 7 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    gravity: 0.045,
    shape: 'rect',
  }));
}

export function clearParticles(): void {
  particles = [];
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  if (ctx) ctx.clearRect(0, 0, innerWidth, innerHeight);
}
