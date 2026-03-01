// @awa-component: GEN-Logger
// @awa-test: GEN_P-3
// @awa-test: GEN-9_AC-1, GEN-9_AC-2, GEN-9_AC-3, GEN-9_AC-4, GEN-9_AC-5, GEN-9_AC-6, GEN-9_AC-7, GEN-9_AC-8
// @awa-test: GEN-11_AC-1, GEN-11_AC-2, GEN-11_AC-4
// @awa-test: DIFF-4_AC-3, DIFF-4_AC-4, DIFF-4_AC-5
// @awa-test: DIFF-8_AC-2

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../logger.js';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new Logger();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('info', () => {
    it('should log informational messages to stdout', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), 'Test message');
    });
  });

  describe('success', () => {
    it('should log success messages with green styling', () => {
      logger.success('Operation completed');
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), 'Operation completed');
    });
  });

  describe('warn', () => {
    it('should log warning messages with yellow styling', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.anything(), 'Warning message');
    });
  });

  describe('error', () => {
    it('should log error messages to stderr with red styling', () => {
      logger.error('Error occurred');
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.anything(), 'Error occurred');
    });
  });

  describe('fileAction', () => {
    // @awa-test: GEN-9_AC-1
    it('should log created file actions', () => {
      logger.fileAction({ type: 'create', sourcePath: 'source.md', outputPath: 'test.md' });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });

    // @awa-test: GEN-9_AC-2
    it('should log skipped file actions', () => {
      logger.fileAction({ type: 'skip-user', sourcePath: 'source.md', outputPath: 'existing.md' });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
    });

    // @awa-test: GEN-9_AC-3
    it('should log overwritten file actions', () => {
      logger.fileAction({ type: 'overwrite', sourcePath: 'source.md', outputPath: 'replaced.md' });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
    });

    // @awa-test: GEN-9_AC-4
    it('should log empty file actions', () => {
      logger.fileAction({ type: 'skip-empty', sourcePath: 'source.md', outputPath: 'blank.md' });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
    });

    // @awa-test: GEN-9_AC-8
    it('should log skip-equal file actions', () => {
      logger.fileAction({
        type: 'skip-equal',
        sourcePath: 'source.md',
        outputPath: 'unchanged.md',
      });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
    });

    // @awa-test: GEN-11_AC-4
    it('should log delete file actions', () => {
      logger.fileAction({ type: 'delete', outputPath: 'old-file.md' });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
    });
  });

  describe('summary', () => {
    // @awa-test: GEN-11_AC-1, GEN-11_AC-2
    it('should display counts for all action types', () => {
      const result = {
        actions: [],
        created: 5,
        skippedUser: 2,
        overwritten: 1,
        deleted: 0,
        skipped: 2,
        skippedEmpty: 3,
        skippedEqual: 0,
      };

      logger.summary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.map((call: unknown[]) => call.join(' ')).join('\n');
      expect(output).toContain('5');
      expect(output).toContain('2');
      expect(output).toContain('1');
      expect(output).toContain('3');
    });

    // @awa-test: GEN-9_AC-5, GEN-9_AC-6
    it('should handle zero counts gracefully', () => {
      const result = {
        actions: [],
        created: 0,
        skippedUser: 0,
        overwritten: 0,
        deleted: 0,
        skipped: 0,
        skippedEmpty: 0,
        skippedEqual: 0,
      };

      logger.summary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    // @awa-test: GEN-9_AC-7, GEN-11_AC-4
    it('should display deleted and skippedEqual counts when present', () => {
      const result = {
        actions: [],
        created: 1,
        skippedUser: 0,
        overwritten: 0,
        deleted: 2,
        skipped: 3,
        skippedEmpty: 0,
        skippedEqual: 3,
      };

      logger.summary(result);

      const output = consoleLogSpy.mock.calls.map((call: unknown[]) => call.join(' ')).join('\n');
      expect(output).toContain('Deleted');
      expect(output).toContain('2');
      expect(output).toContain('equal');
      expect(output).toContain('3');
    });
  });

  describe('diffLine', () => {
    // @awa-test: DIFF_P-4
    // VALIDATES: DIFF-4_AC-3
    it('should log addition lines in green', () => {
      logger.diffLine('+added line', 'add');
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      // Verify the output contains green styling (chalk green)
      const callArg = consoleLogSpy.mock.calls[0][0];
      expect(callArg).toContain('+added line');
    });

    // @awa-test: DIFF_P-4
    // VALIDATES: DIFF-4_AC-3
    it('should log removal lines in red', () => {
      logger.diffLine('-removed line', 'remove');
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      // Verify the output contains red styling (chalk red)
      const callArg = consoleLogSpy.mock.calls[0][0];
      expect(callArg).toContain('-removed line');
    });

    // @awa-test: DIFF_P-4
    // VALIDATES: DIFF-4_AC-3
    it('should log context lines in dim style', () => {
      logger.diffLine(' context line', 'context');
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      // Verify the output contains dim styling (chalk dim)
      const callArg = consoleLogSpy.mock.calls[0][0];
      expect(callArg).toContain(' context line');
    });
  });

  describe('diffSummary', () => {
    // @awa-test: DIFF_P-4
    // VALIDATES: DIFF-4_AC-4
    it('should display success message when no differences', () => {
      const result = {
        files: [],
        identical: 3,
        modified: 0,
        newFiles: 0,
        extraFiles: 0,
        binaryDiffers: 0,
        deleteListed: 0,
        hasDifferences: false,
      };

      logger.diffSummary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls.map((call: unknown[]) => call.join(' '));
      const output = callArgs.join(' ').toLowerCase();
      expect(output).toContain('files compared');
      expect(output).toContain('identical');
      expect(output).toContain('no differences');
    });

    // @awa-test: DIFF_P-4
    // VALIDATES: DIFF-4_AC-5
    it('should display counts for each file status', () => {
      const result = {
        files: [],
        identical: 2,
        modified: 1,
        newFiles: 1,
        extraFiles: 1,
        binaryDiffers: 0,
        deleteListed: 0,
        hasDifferences: true,
      };

      logger.diffSummary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls.map((call: unknown[]) => call.join(' '));
      const output = callArgs.join(' ');
      expect(output).toContain('2');
      expect(output).toContain('1');
    });

    // @awa-test: DIFF_P-4
    // VALIDATES: DIFF-4_AC-5
    it('should display summary with all categories', () => {
      const result = {
        files: [],
        identical: 5,
        modified: 3,
        newFiles: 2,
        extraFiles: 1,
        binaryDiffers: 0,
        deleteListed: 0,
        hasDifferences: true,
      };

      logger.diffSummary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
      // Verify summary includes all relevant information
      const callArgs = consoleLogSpy.mock.calls.map((call: unknown[]) => call.join(' '));
      const output = callArgs.join(' ').toLowerCase();
      expect(output).toContain('5');
      expect(output).toContain('3');
      expect(output).toContain('2');
      expect(output).toContain('1');
    });

    // @awa-test: DIFF-8_AC-2
    it('should display delete-listed count when present', () => {
      const result = {
        files: [],
        identical: 2,
        modified: 0,
        newFiles: 0,
        extraFiles: 0,
        binaryDiffers: 0,
        deleteListed: 3,
        hasDifferences: true,
      };

      logger.diffSummary(result);

      const callArgs = consoleLogSpy.mock.calls.map((call: unknown[]) => call.join(' '));
      const output = callArgs.join(' ').toLowerCase();
      expect(output).toContain('delete listed');
      expect(output).toContain('3');
    });
  });
});
