// @zen-component: GEN-ConflictResolver
// @zen-test: P7, P8

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConflictItem } from '../../types/index.js';
import { ConflictResolver } from '../resolver.js';

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  multiselect: vi.fn(),
  isCancel: vi.fn(),
}));

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;
  let mockMultiselect: ReturnType<typeof vi.fn>;
  let mockIsCancel: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    resolver = new ConflictResolver();
    const { multiselect, isCancel } = await import('@clack/prompts');
    mockMultiselect = multiselect as unknown as ReturnType<typeof vi.fn>;
    mockIsCancel = isCancel as unknown as ReturnType<typeof vi.fn>;
    mockMultiselect.mockReset();
    mockIsCancel.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveBatch', () => {
    const conflicts: ConflictItem[] = [
      {
        outputPath: '/path/to/file1.md',
        sourcePath: '/templates/file1.md',
        newContent: 'new content 1',
        existingContent: 'old content 1',
      },
      {
        outputPath: '/path/to/file2.md',
        sourcePath: '/templates/file2.md',
        newContent: 'new content 2',
        existingContent: 'old content 2',
      },
    ];

    it('should return all overwrite in force mode without prompting (P8)', async () => {
      const resolution = await resolver.resolveBatch(conflicts, true, false);

      expect(resolution.overwrite).toEqual(['/path/to/file1.md', '/path/to/file2.md']);
      expect(resolution.skip).toEqual([]);
      expect(mockMultiselect).not.toHaveBeenCalled();
    });

    it('should return all skip in dry-run mode without prompting (P7)', async () => {
      const resolution = await resolver.resolveBatch(conflicts, false, true);

      expect(resolution.overwrite).toEqual([]);
      expect(resolution.skip).toEqual(['/path/to/file1.md', '/path/to/file2.md']);
      expect(mockMultiselect).not.toHaveBeenCalled();
    });

    it('should skip files with identical content without prompting', async () => {
      const conflictsWithIdentical: ConflictItem[] = [
        {
          outputPath: '/path/to/file1.md',
          sourcePath: '/templates/file1.md',
          newContent: 'same content',
          existingContent: 'same content',
        },
        {
          outputPath: '/path/to/file2.md',
          sourcePath: '/templates/file2.md',
          newContent: 'different',
          existingContent: 'old',
        },
      ];

      mockMultiselect.mockResolvedValue(['/path/to/file2.md']);
      mockIsCancel.mockReturnValue(false);

      const resolution = await resolver.resolveBatch(conflictsWithIdentical, false, false);

      expect(resolution.overwrite).toEqual(['/path/to/file2.md']);
      expect(resolution.skip).toEqual(['/path/to/file1.md']);
      expect(mockMultiselect).toHaveBeenCalledOnce();
      expect(mockMultiselect).toHaveBeenCalledWith({
        message: 'The following files already exist. Select files to overwrite:',
        options: [{ value: '/path/to/file2.md', label: '/path/to/file2.md' }],
        initialValues: ['/path/to/file2.md'],
        required: false,
      });
    });

    it('should prompt user with multiselect when neither force nor dry-run is enabled', async () => {
      mockMultiselect.mockResolvedValue(['/path/to/file1.md']);
      mockIsCancel.mockReturnValue(false);

      const resolution = await resolver.resolveBatch(conflicts, false, false);

      expect(mockMultiselect).toHaveBeenCalledOnce();
      expect(mockMultiselect).toHaveBeenCalledWith({
        message: 'The following files already exist. Select files to overwrite:',
        options: [
          { value: '/path/to/file1.md', label: '/path/to/file1.md' },
          { value: '/path/to/file2.md', label: '/path/to/file2.md' },
        ],
        initialValues: ['/path/to/file1.md', '/path/to/file2.md'],
        required: false,
      });
      expect(resolution.overwrite).toEqual(['/path/to/file1.md']);
      expect(resolution.skip).toEqual(['/path/to/file2.md']);
    });

    it('should return user selections from prompt', async () => {
      mockMultiselect.mockResolvedValue([]);
      mockIsCancel.mockReturnValue(false);

      const resolution = await resolver.resolveBatch(conflicts, false, false);

      expect(resolution.overwrite).toEqual([]);
      expect(resolution.skip).toEqual(['/path/to/file1.md', '/path/to/file2.md']);
    });

    it('should exit process when user cancels prompt', async () => {
      mockMultiselect.mockResolvedValue(Symbol('CANCEL'));
      mockIsCancel.mockReturnValue(true);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(resolver.resolveBatch(conflicts, false, false)).rejects.toThrow(
        'process.exit called'
      );

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should prioritize dry-run over force (P7: immutability)', async () => {
      // When both dry-run and force are true, dry-run takes precedence
      const resolution = await resolver.resolveBatch(conflicts, true, true);

      expect(resolution.overwrite).toEqual([]);
      expect(resolution.skip).toEqual(['/path/to/file1.md', '/path/to/file2.md']);
      expect(mockMultiselect).not.toHaveBeenCalled();
    });

    it('should skip all when all files have identical content', async () => {
      const identicalConflicts: ConflictItem[] = [
        {
          outputPath: '/path/to/file1.md',
          sourcePath: '/templates/file1.md',
          newContent: 'same',
          existingContent: 'same',
        },
        {
          outputPath: '/path/to/file2.md',
          sourcePath: '/templates/file2.md',
          newContent: 'identical',
          existingContent: 'identical',
        },
      ];

      const resolution = await resolver.resolveBatch(identicalConflicts, false, false);

      expect(resolution.overwrite).toEqual([]);
      expect(resolution.skip).toEqual(['/path/to/file1.md', '/path/to/file2.md']);
      expect(mockMultiselect).not.toHaveBeenCalled();
    });
  });
});
