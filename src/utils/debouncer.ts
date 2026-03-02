// @awa-component: DIFF-Debouncer
// @awa-impl: DIFF-7_AC-10

export class Debouncer {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly delayMs: number) {}

  trigger(callback: () => void): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      callback();
    }, this.delayMs);
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
