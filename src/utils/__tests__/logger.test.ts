// @zen-component: Logger
// @zen-test: P7

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
    it('should log created file actions', () => {
      logger.fileAction({ type: 'create', outputPath: 'test.md' });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });

    it('should log skipped file actions', () => {
      logger.fileAction({ type: 'skip-user', outputPath: 'existing.md' });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
    });

    it('should log overwritten file actions', () => {
      logger.fileAction({ type: 'overwrite', outputPath: 'replaced.md' });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
    });

    it('should log empty file actions', () => {
      logger.fileAction({ type: 'skip-empty', outputPath: 'blank.md' });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
    });
  });

  describe('summary', () => {
    it('should display counts for all action types', () => {
      const result = {
        created: 5,
        skippedUser: 2,
        overwritten: 1,
        skippedEmpty: 3,
      };

      logger.summary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('5');
      expect(output).toContain('2');
      expect(output).toContain('1');
      expect(output).toContain('3');
    });

    it('should handle zero counts gracefully', () => {
      const result = {
        created: 0,
        skippedUser: 0,
        overwritten: 0,
        skippedEmpty: 0,
      };

      logger.summary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('diffLine', () => {
    // @zen-test: P15
    // VALIDATES: DIFF-4 AC-4.3
    it('should log addition lines in green', () => {
      logger.diffLine('+added line', 'add');
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      // Verify the output contains green styling (chalk green)
      const callArg = consoleLogSpy.mock.calls[0][0];
      expect(callArg).toContain('+added line');
    });

    // @zen-test: P15
    // VALIDATES: DIFF-4 AC-4.3
    it('should log removal lines in red', () => {
      logger.diffLine('-removed line', 'remove');
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      // Verify the output contains red styling (chalk red)
      const callArg = consoleLogSpy.mock.calls[0][0];
      expect(callArg).toContain('-removed line');
    });

    // @zen-test: P15
    // VALIDATES: DIFF-4 AC-4.3
    it('should log context lines in dim style', () => {
      logger.diffLine(' context line', 'context');
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      // Verify the output contains dim styling (chalk dim)
      const callArg = consoleLogSpy.mock.calls[0][0];
      expect(callArg).toContain(' context line');
    });
  });

  describe('diffSummary', () => {
    // @zen-test: P15
    // VALIDATES: DIFF-4 AC-4.4
    it('should display success message when no differences', () => {
      const result = {
        files: [],
        identical: 3,
        modified: 0,
        newFiles: 0,
        extraFiles: 0,
        binaryDiffers: 0,
        hasDifferences: false,
      };

      logger.diffSummary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = callArgs.join(' ').toLowerCase();
      expect(output).toContain('files compared');
      expect(output).toContain('identical');
      expect(output).toContain('no differences');
    });

    // @zen-test: P15
    // VALIDATES: DIFF-4 AC-4.5
    it('should display counts for each file status', () => {
      const result = {
        files: [],
        identical: 2,
        modified: 1,
        newFiles: 1,
        extraFiles: 1,
        binaryDiffers: 0,
        hasDifferences: true,
      };

      logger.diffSummary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = callArgs.join(' ');
      expect(output).toContain('2');
      expect(output).toContain('1');
    });

    // @zen-test: P15
    // VALIDATES: DIFF-4 AC-4.5
    it('should display summary with all categories', () => {
      const result = {
        files: [],
        identical: 5,
        modified: 3,
        newFiles: 2,
        extraFiles: 1,
        binaryDiffers: 0,
        hasDifferences: true,
      };

      logger.diffSummary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
      // Verify summary includes all relevant information
      const callArgs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = callArgs.join(' ').toLowerCase();
      expect(output).toContain('5');
      expect(output).toContain('3');
      expect(output).toContain('2');
      expect(output).toContain('1');
    });
  });
});
