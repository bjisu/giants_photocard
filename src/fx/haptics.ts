/** navigator.vibrate 래퍼 — 미지원 환경에서는 조용히 무시 */
export const haptics = {
  tap(): void {
    try {
      navigator.vibrate?.(8);
    } catch {
      /* noop */
    }
  },
  pattern(pattern: number[] | readonly number[]): void {
    try {
      navigator.vibrate?.([...pattern]);
    } catch {
      /* noop */
    }
  },
};
