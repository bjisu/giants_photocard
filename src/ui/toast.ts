let el: HTMLDivElement | null = null;
let timer = 0;

export function toast(message: string, ms = 2400): void {
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  window.clearTimeout(timer);
  timer = window.setTimeout(() => el?.classList.remove('show'), ms);
}
