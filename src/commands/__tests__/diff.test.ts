// @zen-component: DiffCommand
// @zen-test: P15

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { DiffResult } from "../../types/index.js";

// Mock dependencies BEFORE importing the module under test
vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
}));

vi.mock("../../core/config.js");
vi.mock("../../core/differ.js");
vi.mock("../../core/template-resolver.js");
vi.mock("../../utils/fs.js");
vi.mock("../../utils/logger.js");

import { configLoader } from "../../core/config.js";
import { diffEngine } from "../../core/differ.js";
import { templateResolver } from "../../core/template-resolver.js";
import { pathExists } from "../../utils/fs.js";
import { logger } from "../../utils/logger.js";
import { diffCommand } from "../diff.js";

// Spy on process.exit to prevent it from actually exiting during tests
const processExitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
  throw new Error(`process.exit: ${code}`);
}) as never);

describe("diffCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mocks
    vi.mocked(configLoader.load).mockResolvedValue({
      outputPath: "./output",
      features: [],
      refresh: false,
    });
    vi.mocked(configLoader.merge).mockReturnValue({
      template: "./templates/zen",
      output: "./output",
      features: [],
      refresh: false,
    });
    vi.mocked(pathExists).mockResolvedValue(true);
    vi.mocked(templateResolver.resolve).mockResolvedValue({
      localPath: "./templates/zen",
      source: "local",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // @zen-test: P15
  // VALIDATES: DIFF-5 AC-5.1
  test("should return exit code 0 when files are identical", async () => {
    const mockResult: DiffResult = {
      files: [{ relativePath: "file.txt", status: "identical" }],
      identical: 1,
      modified: 0,
      newFiles: 0,
      extraFiles: 0,
      hasDifferences: false,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);

    const exitCode = await diffCommand({
      target: "./target",
      template: "./templates/zen",
      features: [],
      config: undefined,
      refresh: false,
      output: undefined,
    });

    expect(exitCode).toBe(0);
    expect(logger.diffSummary).toHaveBeenCalledWith(mockResult);
  });

  // @zen-test: P15
  // VALIDATES: DIFF-5 AC-5.2
  test("should return exit code 1 when files have differences", async () => {
    const mockResult: DiffResult = {
      files: [
        {
          relativePath: "file.txt",
          status: "modified",
          unifiedDiff: "--- file.txt\n+++ file.txt\n@@ -1,1 +1,1 @@\n-old\n+new\n",
        },
      ],
      identical: 0,
      modified: 1,
      newFiles: 0,
      extraFiles: 0,
      hasDifferences: true,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);

    const exitCode = await diffCommand({
      target: "./target",
      template: "./templates/zen",
      features: [],
      config: undefined,
      refresh: false,
      output: undefined,
    });

    expect(exitCode).toBe(1);
    expect(logger.diffLine).toHaveBeenCalled();
  });

  // @zen-test: P15
  // VALIDATES: DIFF-5 AC-5.3
  test("should return exit code 2 on error", async () => {
    vi.mocked(pathExists).mockResolvedValue(false);

    try {
      await diffCommand({
        target: "./non-existent",
        template: "./templates/zen",
        features: [],
        config: undefined,
        refresh: false,
        output: undefined,
      });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("process.exit: 2");
    }

    expect(logger.error).toHaveBeenCalled();
  });

  // VALIDATES: DIFF-4 AC-4.3
  test("should display unified diff with colored output", async () => {
    const mockResult: DiffResult = {
      files: [
        {
          relativePath: "file.txt",
          status: "modified",
          unifiedDiff: "--- file.txt\n+++ file.txt\n@@ -1,2 +1,2 @@\n line 1\n-old line\n+new line\n",
        },
      ],
      identical: 0,
      modified: 1,
      newFiles: 0,
      extraFiles: 0,
      hasDifferences: true,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);

    await diffCommand({
      target: "./target",
      template: "./templates/zen",
      features: [],
      config: undefined,
      refresh: false,
      output: undefined,
    });

    // Verify that diffLine was called with appropriate line types
    const calls = vi.mocked(logger.diffLine).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    // Check that addition and removal lines were detected
    const hasRemoval = calls.some((call) => call[0].includes("-old line") && call[1] === "remove");
    const hasAddition = calls.some((call) => call[0].includes("+new line") && call[1] === "add");
    expect(hasRemoval).toBe(true);
    expect(hasAddition).toBe(true);
  });

  // VALIDATES: DIFF-7 AC-7.1, DIFF-7 AC-7.2
  test("should resolve template from config if not provided", async () => {
    const mockResult: DiffResult = {
      files: [],
      identical: 0,
      modified: 0,
      newFiles: 0,
      extraFiles: 0,
      hasDifferences: false,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);

    await diffCommand({
      target: "./target",
      template: undefined,
      features: [],
      config: undefined,
      refresh: false,
      output: undefined,
    });

    expect(templateResolver.resolve).toHaveBeenCalled();
  });

  // VALIDATES: DIFF-7 AC-7.3
  test("should use features from options", async () => {
    const mockResult: DiffResult = {
      files: [],
      identical: 0,
      modified: 0,
      newFiles: 0,
      extraFiles: 0,
      hasDifferences: false,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);
    vi.mocked(configLoader.merge).mockReturnValue({
      template: "./templates/zen",
      output: "./output",
      features: ["feature1", "feature2"],
      refresh: false,
    });

    await diffCommand({
      target: "./target",
      template: "./templates/zen",
      features: ["feature1", "feature2"],
      config: undefined,
      refresh: false,
      output: undefined,
    });

    expect(diffEngine.diff).toHaveBeenCalledWith(
      expect.objectContaining({
        features: ["feature1", "feature2"],
      })
    );
  });

  // VALIDATES: DIFF-4 AC-4.1, DIFF-4 AC-4.2
  test("should display diffs for new and extra files", async () => {
    const mockResult: DiffResult = {
      files: [
        { relativePath: "new-file.txt", status: "new" },
        { relativePath: "extra-file.txt", status: "extra" },
      ],
      identical: 0,
      modified: 0,
      newFiles: 1,
      extraFiles: 1,
      hasDifferences: true,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);

    await diffCommand({
      target: "./target",
      template: "./templates/zen",
      features: [],
      config: undefined,
      refresh: false,
      output: undefined,
    });

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("new-file.txt"));
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("extra-file.txt"));
  });
});
