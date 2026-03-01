// @awa-component: GEN-ConflictResolver
// @awa-test: GEN_P-3, GEN_P-4
// @awa-test: GEN-4_AC-1, GEN-4_AC-2
// @awa-test: GEN-5_AC-1, GEN-5_AC-2, GEN-5_AC-3, GEN-5_AC-4, GEN-5_AC-5, GEN-5_AC-6, GEN-5_AC-7
// @awa-test: GEN-6_AC-3
// @awa-test: GEN-10_AC-3
// @awa-test: CLI-5_AC-2, CLI-5_AC-3

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConflictItem } from '../../types/index.js';
import { ConflictResolver, DeleteResolver } from '../resolver.js';

// Mock @clack/prompts (used by ConflictResolver)
vi.mock('@clack/prompts', () => ({
  multiselect: vi.fn(),
  isCancel: vi.fn(),
}));

// Shared mock for deleteMultiselect's internal prompt() call
const { mockCorePrompt } = vi.hoisted(() => ({ mockCorePrompt: vi.fn() }));

// Mock @clack/core (used by DeleteResolver via deleteMultiselect)
// Uses a regular function constructor so `new MultiSelectPrompt()` works correctly
vi.mock('@clack/core', () => {
  class MultiSelectPrompt {
    prompt = () => mockCorePrompt();
  }
  return { MultiSelectPrompt };
});

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

    // @awa-test: GEN-4_AC-3, CLI-5_AC-2
    it('should return all overwrite in force mode without prompting (P8)', async () => {
      const resolution = await resolver.resolveBatch(conflicts, true, false);

      expect(resolution.overwrite).toEqual(['/path/to/file1.md', '/path/to/file2.md']);
      expect(resolution.skip).toEqual([]);
      expect(resolution.equal).toEqual([]);
      expect(mockMultiselect).not.toHaveBeenCalled();
    });

    // @awa-test: GEN-6_AC-3
    it('should return all skip in dry-run mode without prompting (P7)', async () => {
      const resolution = await resolver.resolveBatch(conflicts, false, true);

      expect(resolution.overwrite).toEqual([]);
      expect(resolution.skip).toEqual(['/path/to/file1.md', '/path/to/file2.md']);
      expect(resolution.equal).toEqual([]);
      expect(mockMultiselect).not.toHaveBeenCalled();
    });

    // @awa-test: GEN-5_AC-7
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
      expect(resolution.skip).toEqual([]);
      expect(resolution.equal).toEqual(['/path/to/file1.md']);
      expect(mockMultiselect).toHaveBeenCalledOnce();
      expect(mockMultiselect).toHaveBeenCalledWith({
        message: 'The following files already exist. Select files to overwrite:',
        options: [{ value: '/path/to/file2.md', label: '/path/to/file2.md' }],
        initialValues: ['/path/to/file2.md'],
        required: false,
      });
    });

    // @awa-test: GEN-4_AC-2, GEN-5_AC-1, GEN-5_AC-2, GEN-5_AC-5, GEN-5_AC-6, CLI-5_AC-3
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
      expect(resolution.equal).toEqual([]);
    });

    // @awa-test: GEN-5_AC-3, GEN-5_AC-4
    it('should return user selections from prompt', async () => {
      mockMultiselect.mockResolvedValue([]);
      mockIsCancel.mockReturnValue(false);

      const resolution = await resolver.resolveBatch(conflicts, false, false);

      expect(resolution.overwrite).toEqual([]);
      expect(resolution.skip).toEqual(['/path/to/file1.md', '/path/to/file2.md']);
      expect(resolution.equal).toEqual([]);
    });

    // @awa-test: GEN-10_AC-3
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
      expect(resolution.equal).toEqual([]);
      expect(mockMultiselect).not.toHaveBeenCalled();
    });

    // @awa-test: GEN-4_AC-1
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
      expect(resolution.skip).toEqual([]);
      expect(resolution.equal).toEqual(['/path/to/file1.md', '/path/to/file2.md']);
      expect(mockMultiselect).not.toHaveBeenCalled();
    });
  });
});

describe('DeleteResolver', () => {
  let resolver: DeleteResolver;
  let mockIsCancel: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    resolver = new DeleteResolver();
    mockCorePrompt.mockReset();
    const { isCancel } = await import('@clack/prompts');
    mockIsCancel = isCancel as unknown as ReturnType<typeof vi.fn>;
    mockIsCancel.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const candidates = ['/out/old1.md', '/out/old2.md'];

  it('should return all candidates in force mode without prompting', async () => {
    const result = await resolver.resolveDeletes(candidates, true, false);
    expect(result).toEqual(candidates);
    expect(mockCorePrompt).not.toHaveBeenCalled();
  });

  it('should return all candidates in dry-run mode without prompting', async () => {
    const result = await resolver.resolveDeletes(candidates, false, true);
    expect(result).toEqual(candidates);
    expect(mockCorePrompt).not.toHaveBeenCalled();
  });

  it('should return empty array for empty candidates', async () => {
    const result = await resolver.resolveDeletes([], false, false);
    expect(result).toEqual([]);
    expect(mockCorePrompt).not.toHaveBeenCalled();
  });

  it('should prompt user with delete multiselect when not force or dry-run', async () => {
    mockCorePrompt.mockResolvedValue(['/out/old1.md']);
    mockIsCancel.mockReturnValue(false);

    const result = await resolver.resolveDeletes(candidates, false, false);

    expect(mockCorePrompt).toHaveBeenCalledOnce();
    expect(result).toEqual(['/out/old1.md']);
  });

  it('should exit process when user cancels prompt', async () => {
    mockCorePrompt.mockResolvedValue(Symbol('CANCEL'));
    mockIsCancel.mockReturnValue(true);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    await expect(resolver.resolveDeletes(candidates, false, false)).rejects.toThrow(
      'process.exit called'
    );

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
