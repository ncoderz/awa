// @zen-component: Logger
// @zen-test: P7

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Logger } from "../logger.js";

describe("Logger", () => {
  let logger: Logger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new Logger();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("info", () => {
    it("should log informational messages to stdout", () => {
      logger.info("Test message");
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), "Test message");
    });
  });

  describe("success", () => {
    it("should log success messages with green styling", () => {
      logger.success("Operation completed");
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), "Operation completed");
    });
  });

  describe("warn", () => {
    it("should log warning messages with yellow styling", () => {
      logger.warn("Warning message");
      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.anything(), "Warning message");
    });
  });

  describe("error", () => {
    it("should log error messages to stderr with red styling", () => {
      logger.error("Error occurred");
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.anything(), "Error occurred");
    });
  });

  describe("fileAction", () => {
    it("should log created file actions", () => {
      logger.fileAction({ type: "create", outputPath: "test.md" });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });

    it("should log skipped file actions", () => {
      logger.fileAction({ type: "skip-user", outputPath: "existing.md" });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
    });

    it("should log overwritten file actions", () => {
      logger.fileAction({ type: "overwrite", outputPath: "replaced.md" });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
    });

    it("should log empty file actions", () => {
      logger.fileAction({ type: "skip-empty", outputPath: "blank.md" });
      expect(consoleLogSpy).toHaveBeenCalledOnce();
    });
  });

  describe("summary", () => {
    it("should display counts for all action types", () => {
      const result = {
        created: 5,
        skippedUser: 2,
        overwritten: 1,
        skippedEmpty: 3,
      };

      logger.summary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.map((call) => call.join(" ")).join("\n");
      expect(output).toContain("5");
      expect(output).toContain("2");
      expect(output).toContain("1");
      expect(output).toContain("3");
    });

    it("should handle zero counts gracefully", () => {
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
});
