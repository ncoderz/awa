// @awa-component: DIFF-FileWatcher

import { type FSWatcher, watch } from 'node:fs';
import { Debouncer } from './debouncer.js';

export interface FileWatcherOptions {
  directory: string;
  debounceMs?: number;
  onChange: () => void;
}

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private debouncer: Debouncer;
  private readonly directory: string;
  private readonly onChange: () => void;

  constructor(options: FileWatcherOptions) {
    this.directory = options.directory;
    this.debouncer = new Debouncer(options.debounceMs ?? 300);
    this.onChange = options.onChange;
  }

  start(): void {
    this.watcher = watch(this.directory, { recursive: true }, () => {
      this.debouncer.trigger(this.onChange);
    });
  }

  stop(): void {
    this.debouncer.cancel();
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
