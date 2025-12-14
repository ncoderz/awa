// @zen-component: ArgumentParser
// @zen-impl: CLI-1 AC-1.1
// @zen-impl: CLI-1 AC-1.2
// @zen-impl: CLI-1 AC-1.3
// @zen-impl: CLI-2 AC-2.1
// @zen-impl: CLI-2 AC-2.3
// @zen-impl: CLI-3 AC-3.1
// @zen-impl: CLI-4 AC-4.1
// @zen-impl: CLI-4 AC-4.2
// @zen-impl: CLI-5 AC-5.1
// @zen-impl: CLI-6 AC-6.1
// @zen-impl: CLI-7 AC-7.1
// @zen-impl: CLI-8 AC-8.1
// @zen-impl: CLI-9 AC-9.1
// @zen-impl: CLI-9 AC-9.2
// @zen-impl: CLI-9 AC-9.3
// @zen-impl: CLI-10 AC-10.1
// @zen-impl: CLI-10 AC-10.2
// @zen-impl: CLI-11 AC-11.1
// @zen-impl: CLI-11 AC-11.2
// @zen-impl: CLI-11 AC-11.3
// @zen-impl: CFG-5 AC-5.2
// @zen-impl: GEN-10 AC-10.1
// @zen-impl: GEN-10 AC-10.2

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineCommand, runMain } from "citty";
import { diffCommand } from "../commands/diff.js";
import { generateCommand } from "../commands/generate.js";
import type { RawCliOptions } from "../types/index.js";

// Get package.json version
const currentFile = fileURLToPath(import.meta.url);
const projectRoot = join(dirname(currentFile), "..", "..");
const packageJsonPath = join(projectRoot, "package.json");

let version = "1.0.0";
try {
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
  version = packageJson.version;
} catch {
  // Use default if package.json not found
}

// @zen-impl: CLI-1 AC-1.1, CLI-1 AC-1.2, CLI-1 AC-1.3
const generateCmd = defineCommand({
  meta: {
    name: "generate",
    description: "Generate AI agent configuration files from templates",
  },
  args: {
    // @zen-impl: CLI-2 AC-2.1, CLI-2 AC-2.3
    output: {
      type: "string",
      description: "Output directory for generated files",
      alias: "o",
    },
    // @zen-impl: CLI-3 AC-3.1
    template: {
      type: "string",
      description: "Template source (local path or Git repository)",
      alias: "t",
    },
    // @zen-impl: CLI-4 AC-4.1, CLI-4 AC-4.2
    features: {
      type: "string",
      description: "Feature flags (can be specified multiple times)",
      alias: "f",
      // citty doesn't have built-in array support, we'll handle this manually
    },
    // @zen-impl: CLI-5 AC-5.1
    force: {
      type: "boolean",
      description: "Force overwrite existing files without prompting",
      default: false,
    },
    // @zen-impl: CLI-6 AC-6.1
    "dry-run": {
      type: "boolean",
      description: "Preview changes without modifying files",
      default: false,
    },
    // @zen-impl: CLI-7 AC-7.1
    config: {
      type: "string",
      description: "Path to configuration file",
      alias: "c",
    },
    // @zen-impl: CLI-8 AC-8.1
    refresh: {
      type: "boolean",
      description: "Force refresh of cached Git templates",
      default: false,
    },
  },
  async run({ args }) {
    // @zen-impl: CLI-11 AC-11.1, CLI-11 AC-11.2, CLI-11 AC-11.3
    // Parse features as array (handle multiple --features flags)
    let features: string[] = [];
    if (args.features) {
      if (Array.isArray(args.features)) {
        features = args.features;
      } else {
        features = [args.features];
      }
    }

    const cliOptions: RawCliOptions = {
      output: args.output,
      template: args.template,
      features,
      force: args.force,
      dryRun: args["dry-run"],
      config: args.config,
      refresh: args.refresh,
    };

    await generateCommand(cliOptions);
  },
});

// @zen-impl: DIFF-7 AC-7.1, DIFF-7 AC-7.2, DIFF-7 AC-7.3, DIFF-7 AC-7.4, DIFF-7 AC-7.5, DIFF-7 AC-7.6
const diffCmd = defineCommand({
  meta: {
    name: "diff",
    description: "Compare template output with existing target directory",
  },
  args: {
    // @zen-impl: DIFF-7 AC-7.1
    target: {
      type: "string",
      description: "Target directory to compare against (defaults to --output)",
      alias: "t",
    },
    // @zen-impl: DIFF-7 AC-7.2, DIFF-7 AC-7.3, DIFF-7 AC-7.4, DIFF-7 AC-7.5, DIFF-7 AC-7.6
    // Reuse shared options from generate command
    output: {
      type: "string",
      description: "Output directory (used if --target not specified)",
      alias: "o",
    },
    template: {
      type: "string",
      description: "Template source (local path or Git repository)",
      alias: "s",
    },
    features: {
      type: "string",
      description: "Feature flags (can be specified multiple times)",
      alias: "f",
    },
    config: {
      type: "string",
      description: "Path to configuration file",
      alias: "c",
    },
    refresh: {
      type: "boolean",
      description: "Force refresh of cached Git templates",
      default: false,
    },
  },
  async run({ args }) {
    // Parse features as array
    let features: string[] = [];
    if (args.features) {
      if (Array.isArray(args.features)) {
        features = args.features;
      } else {
        features = [args.features];
      }
    }

    const cliOptions: RawCliOptions = {
      target: args.target,
      output: args.output,
      template: args.template,
      features,
      config: args.config,
      refresh: args.refresh,
    };

    const exitCode = await diffCommand(cliOptions);
    process.exit(exitCode);
  },
});

// @zen-impl: CLI-1 AC-1.2, CLI-9 AC-9.1, CLI-9 AC-9.2, CLI-9 AC-9.3, CLI-10 AC-10.1, CLI-10 AC-10.2
const main = defineCommand({
  meta: {
    name: "zen",
    version,
    description: "Zen - tool for generating AI coding agent configuration files",
  },
  subCommands: {
    generate: generateCmd,
    diff: diffCmd,
  },
});

// @zen-impl: GEN-10 AC-10.1, GEN-10 AC-10.2
runMain(main);
