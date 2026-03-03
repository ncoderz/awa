import { describe, expect, it } from 'vitest';
import type { SpecFile } from '../../check/types.js';
import {
  detectConflicts,
  planRenames,
  resolveFeatureName,
  updateHeading,
  validateMerge,
} from '../spec-mover.js';
import { MergeError } from '../types.js';

// --- Helpers ---

function makeSpecFile(filePath: string, code: string): SpecFile {
  return {
    filePath,
    code,
    requirementIds: [],
    acIds: [],
    propertyIds: [],
    componentNames: [],
    crossRefs: [],
  };
}

describe('resolveFeatureName', () => {
  it('extracts feature name from first REQ file', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-CLI-cli.md', 'CLI'),
      makeSpecFile('.awa/specs/DESIGN-CLI-cli.md', 'CLI'),
    ];
    expect(resolveFeatureName('CLI', specFiles)).toBe('cli');
  });

  it('returns undefined when no REQ file for code', () => {
    const specFiles: SpecFile[] = [makeSpecFile('.awa/specs/DESIGN-CLI-cli.md', 'CLI')];
    expect(resolveFeatureName('CLI', specFiles)).toBeUndefined();
  });
});

describe('planRenames', () => {
  it('renames files using the target feature name', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-CHK-check.md', 'CHK'),
      makeSpecFile('.awa/specs/DESIGN-CHK-check.md', 'CHK'),
      makeSpecFile('.awa/specs/FEAT-CHK-check.md', 'CHK'),
      makeSpecFile('.awa/tasks/TASK-CHK-check-001.md', 'CHK'),
      makeSpecFile('.awa/specs/EXAMPLE-CHK-check-001.md', 'CHK'),
      makeSpecFile('.awa/specs/REQ-CLI-cli.md', 'CLI'),
    ];

    const renames = planRenames('CHK', 'CLI', specFiles);

    expect(renames).toHaveLength(5);
    expect(renames).toEqual([
      { oldPath: '.awa/specs/REQ-CHK-check.md', newPath: '.awa/specs/REQ-CLI-cli.md' },
      { oldPath: '.awa/specs/DESIGN-CHK-check.md', newPath: '.awa/specs/DESIGN-CLI-cli.md' },
      { oldPath: '.awa/specs/FEAT-CHK-check.md', newPath: '.awa/specs/FEAT-CLI-cli.md' },
      { oldPath: '.awa/tasks/TASK-CHK-check-001.md', newPath: '.awa/tasks/TASK-CLI-cli-001.md' },
      {
        oldPath: '.awa/specs/EXAMPLE-CHK-check-001.md',
        newPath: '.awa/specs/EXAMPLE-CLI-cli-001.md',
      },
    ]);
  });

  it('preserves feature name when target has no REQ file', () => {
    const specFiles: SpecFile[] = [makeSpecFile('.awa/specs/REQ-CHK-check.md', 'CHK')];

    const renames = planRenames('CHK', 'CLI', specFiles);

    expect(renames).toHaveLength(1);
    expect(renames[0]?.newPath).toBe('.awa/specs/REQ-CLI-check.md');
  });

  it('does not rename files from other codes', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-CHK-check.md', 'CHK'),
      makeSpecFile('.awa/specs/REQ-CLI-cli.md', 'CLI'),
    ];

    const renames = planRenames('CHK', 'CLI', specFiles);

    expect(renames).toHaveLength(1);
    expect(renames[0]?.oldPath).toBe('.awa/specs/REQ-CHK-check.md');
    expect(renames[0]?.newPath).toBe('.awa/specs/REQ-CLI-cli.md');
  });

  it('does not rename PLAN files (no code prefix)', () => {
    const specFiles: SpecFile[] = [makeSpecFile('.awa/plans/PLAN-001-some-plan.md', '')];

    const renames = planRenames('CHK', 'CLI', specFiles);
    expect(renames).toHaveLength(0);
  });

  it('handles multiple TASK files using target feature name', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/tasks/TASK-CHK-check-001.md', 'CHK'),
      makeSpecFile('.awa/tasks/TASK-CHK-check-002.md', 'CHK'),
      makeSpecFile('.awa/tasks/TASK-CHK-check-003.md', 'CHK'),
      makeSpecFile('.awa/specs/REQ-CLI-cli.md', 'CLI'),
    ];

    const renames = planRenames('CHK', 'CLI', specFiles);
    expect(renames).toHaveLength(3);
    expect(renames[0]?.newPath).toBe('.awa/tasks/TASK-CLI-cli-001.md');
    expect(renames[1]?.newPath).toBe('.awa/tasks/TASK-CLI-cli-002.md');
    expect(renames[2]?.newPath).toBe('.awa/tasks/TASK-CLI-cli-003.md');
  });

  it('returns empty array when source has no spec files', () => {
    const specFiles: SpecFile[] = [makeSpecFile('.awa/specs/REQ-CLI-cli.md', 'CLI')];

    const renames = planRenames('CHK', 'CLI', specFiles);
    expect(renames).toHaveLength(0);
  });
});

describe('detectConflicts', () => {
  it('detects when target filename already exists', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-CHK-check.md', 'CHK'),
      makeSpecFile('.awa/specs/REQ-CLI-check.md', 'CLI'),
    ];

    const renames = [
      { oldPath: '.awa/specs/REQ-CHK-check.md', newPath: '.awa/specs/REQ-CLI-check.md' },
    ];

    const conflicts = detectConflicts(renames, specFiles);
    expect(conflicts).toEqual(['.awa/specs/REQ-CLI-check.md']);
  });

  it('returns empty when no conflicts', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-CHK-check.md', 'CHK'),
      makeSpecFile('.awa/specs/REQ-CLI-cli.md', 'CLI'),
    ];

    const renames = [
      { oldPath: '.awa/specs/REQ-CHK-check.md', newPath: '.awa/specs/REQ-CLI-check.md' },
    ];

    const conflicts = detectConflicts(renames, specFiles);
    expect(conflicts).toHaveLength(0);
  });
});

describe('updateHeading', () => {
  it('replaces source code in H1 heading', () => {
    const content = '# CHK Check Requirements\n\nSome body text with CHK-1.';
    const result = updateHeading(content, 'CHK', 'CLI');
    expect(result).toBe('# CLI Check Requirements\n\nSome body text with CHK-1.');
  });

  it('does not modify content below the heading', () => {
    const content = '# CHK Feature\n\n## CHK Details\n\nCHK-1 is important.';
    const result = updateHeading(content, 'CHK', 'CLI');
    // Only the H1 is updated
    expect(result.startsWith('# CLI Feature')).toBe(true);
    expect(result).toContain('## CHK Details');
  });

  it('returns content unchanged if no H1 heading', () => {
    const content = 'No heading here.\n\nJust text.';
    const result = updateHeading(content, 'CHK', 'CLI');
    expect(result).toBe(content);
  });
});

describe('validateMerge', () => {
  it('throws SELF_MERGE when source equals target', () => {
    expect(() => validateMerge('CHK', 'CHK')).toThrow(MergeError);
    try {
      validateMerge('CHK', 'CHK');
    } catch (e) {
      expect((e as MergeError).errorCode).toBe('SELF_MERGE');
    }
  });

  it('does not throw when source differs from target', () => {
    expect(() => validateMerge('CHK', 'CLI')).not.toThrow();
  });
});
