import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Debouncer } from '../debouncer.js';

describe('Debouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should call callback after delay', () => {
    const callback = vi.fn();
    const debouncer = new Debouncer(300);

    debouncer.trigger(callback);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledOnce();
  });

  test('should debounce rapid triggers', () => {
    const callback = vi.fn();
    const debouncer = new Debouncer(300);

    debouncer.trigger(callback);
    vi.advanceTimersByTime(100);

    debouncer.trigger(callback);
    vi.advanceTimersByTime(100);

    debouncer.trigger(callback);
    vi.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledOnce();
  });

  test('should cancel pending callback', () => {
    const callback = vi.fn();
    const debouncer = new Debouncer(300);

    debouncer.trigger(callback);
    debouncer.cancel();

    vi.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();
  });

  test('should allow new triggers after cancel', () => {
    const callback = vi.fn();
    const debouncer = new Debouncer(300);

    debouncer.trigger(callback);
    debouncer.cancel();

    debouncer.trigger(callback);
    vi.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledOnce();
  });

  test('cancel should be safe when no pending timer', () => {
    const debouncer = new Debouncer(300);
    expect(() => debouncer.cancel()).not.toThrow();
  });

  test('should use configurable delay', () => {
    const callback = vi.fn();
    const debouncer = new Debouncer(500);

    debouncer.trigger(callback);
    vi.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledOnce();
  });
});
