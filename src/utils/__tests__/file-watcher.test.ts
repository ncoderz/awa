import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('node:fs', () => {
  return {
    watch: vi.fn((_dir: string, _opts: unknown, callback: () => void) => {
      const watcher = {
        close: vi.fn(),
        _callback: callback,
      };
      return watcher;
    }),
  };
});

import { watch } from 'node:fs';
import { FileWatcher } from '../file-watcher.js';

// Helper to get the callback passed to fs.watch
function getWatchCallback(): () => void {
  const calls = vi.mocked(watch).mock.calls;
  // The callback is the third argument in the overload we use: watch(dir, opts, callback)
  return (calls[0] as unknown[])[2] as () => void;
}

describe('FileWatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should start watching directory with recursive option', () => {
    const onChange = vi.fn();
    const watcher = new FileWatcher({
      directory: '/test/dir',
      onChange,
    });

    watcher.start();
    expect(watch).toHaveBeenCalledWith('/test/dir', { recursive: true }, expect.any(Function));

    watcher.stop();
  });

  test('should stop watching and cancel pending debounce', () => {
    const onChange = vi.fn();
    const watcher = new FileWatcher({
      directory: '/test/dir',
      onChange,
    });

    watcher.start();
    const fsWatcher = vi.mocked(watch).mock.results[0]!.value as {
      close: ReturnType<typeof vi.fn>;
    };

    watcher.stop();
    expect(fsWatcher.close).toHaveBeenCalled();
  });

  test('should use custom debounce delay', () => {
    const onChange = vi.fn();
    const watcher = new FileWatcher({
      directory: '/test/dir',
      debounceMs: 500,
      onChange,
    });

    watcher.start();

    // Trigger a change via the fs.watch callback
    const callback = getWatchCallback();
    callback();

    // Not called yet at 300ms (default would have fired)
    vi.advanceTimersByTime(300);
    expect(onChange).not.toHaveBeenCalled();

    // Called at 500ms
    vi.advanceTimersByTime(200);
    expect(onChange).toHaveBeenCalledOnce();

    watcher.stop();
  });

  test('should debounce rapid file changes', () => {
    const onChange = vi.fn();
    const watcher = new FileWatcher({
      directory: '/test/dir',
      debounceMs: 300,
      onChange,
    });

    watcher.start();
    const callback = getWatchCallback();

    // Simulate rapid changes
    callback();
    vi.advanceTimersByTime(100);
    callback();
    vi.advanceTimersByTime(100);
    callback();
    vi.advanceTimersByTime(300);

    expect(onChange).toHaveBeenCalledOnce();

    watcher.stop();
  });
});
