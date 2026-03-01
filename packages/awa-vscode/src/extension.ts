// Implements PLAN-010 Phase 7: VS Code Extension

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ExtensionContext, StatusBarItem } from 'vscode';
import { commands, StatusBarAlignment, window, workspace } from 'vscode';
import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;
let statusBarItem: StatusBarItem | undefined;

// ─────────────────────────────────────────
// Extension activation
// ─────────────────────────────────────────

export async function activate(context: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration('awa');
  const lspEnabled = config.get<boolean>('lsp.enable', true);

  if (!lspEnabled) {
    return;
  }

  const workspaceFolder = workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return;
  }

  const workspaceRoot = workspaceFolder.uri.fsPath;

  // Check if this workspace has .awa/ directory
  const awaDir = path.join(workspaceRoot, '.awa');
  if (!fs.existsSync(awaDir)) {
    // Not an awa workspace — do not activate
    return;
  }

  // ── Status bar item ──────────────────────────────────────────────────────
  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(sync~spin) awa: indexing…';
  statusBarItem.tooltip = 'awa spec index status';
  statusBarItem.command = 'awa.rebuildIndex';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // ── Find LSP server module ───────────────────────────────────────────────
  const serverModule = resolveServerModule(config.get<string>('lsp.serverPath', ''), workspaceRoot);
  if (!serverModule) {
    statusBarItem.text = '$(error) awa: server not found';
    statusBarItem.tooltip =
      'Could not find awa LSP server. Install @ncoderz/awa-language-server in your project or set awa.lsp.serverPath.';
    return;
  }

  // ── LSP server + client options ──────────────────────────────────────────
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.stdio,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.stdio,
      options: { execArgv: ['--nolazy', '--inspect=6009'] },
    },
  };

  const clientOptions: LanguageClientOptions = {
    // Activate for all supported source file languages
    documentSelector: [
      { scheme: 'file', language: 'typescript' },
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'typescriptreact' },
      { scheme: 'file', language: 'javascriptreact' },
      { scheme: 'file', language: 'python' },
      { scheme: 'file', language: 'go' },
      { scheme: 'file', language: 'rust' },
      { scheme: 'file', language: 'java' },
      { scheme: 'file', language: 'markdown' },
    ],
    synchronize: {
      fileEvents: [
        workspace.createFileSystemWatcher('**/.awa/**/*.md'),
        workspace.createFileSystemWatcher('**/.awa/**/*.tsp'),
        workspace.createFileSystemWatcher('**/*.{ts,js,tsx,jsx,py,go,rs,java}'),
      ],
    },
    workspaceFolder,
  };

  client = new LanguageClient('awa-lsp', 'awa Language Server', serverOptions, clientOptions);

  // ── Listen for custom index status notifications ────────────────────────
  client.onNotification('awa/indexStatus', (params: { ready: boolean; idCount: number }) => {
    if (statusBarItem) {
      if (params.ready) {
        statusBarItem.text = `$(check) awa: ${params.idCount} IDs`;
        statusBarItem.tooltip = `awa spec index: ${params.idCount} IDs indexed. Click to rebuild.`;
      } else {
        statusBarItem.text = '$(warning) awa: no specs';
        statusBarItem.tooltip = 'awa: no .awa/specs found in this workspace.';
      }
    }
  });

  // ── Register commands ────────────────────────────────────────────────────
  context.subscriptions.push(
    commands.registerCommand('awa.trace', async (id?: string) => {
      if (!id) {
        id = await window.showInputBox({
          prompt: 'Enter traceability ID (e.g. DIFF-1_AC-1)',
          placeHolder: 'DIFF-1_AC-1',
        });
      }
      if (id) {
        // Open terminal and run awa trace
        const terminal = window.createTerminal('awa trace');
        terminal.sendText(`awa trace ${id} --content`);
        terminal.show();
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand('awa.rebuildIndex', async () => {
      if (statusBarItem) {
        statusBarItem.text = '$(sync~spin) awa: rebuilding…';
      }
      // Stop and restart the client to trigger a full re-index
      await client?.stop();
      await client?.start();
    })
  );

  // ── Start the language client ────────────────────────────────────────────
  await client.start();
  context.subscriptions.push(client);
}

export async function deactivate(): Promise<void> {
  if (client) {
    await client.stop();
  }
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/**
 * Locate the awa LSP server module. Checks (in order):
 * 1. Explicit config override
 * 2. Locally installed @ncoderz/awa in workspace node_modules
 * 3. Not found → returns null
 */
function resolveServerModule(configPath: string, workspaceRoot: string): string | null {
  // 1. Explicit config override
  if (configPath?.trim()) {
    const resolved = path.isAbsolute(configPath)
      ? configPath
      : path.join(workspaceRoot, configPath);
    if (fs.existsSync(resolved)) return resolved;
  }

  // 2. Local node_modules — @ncoderz/awa-language-server
  const localServer = path.join(
    workspaceRoot,
    'node_modules',
    '@ncoderz',
    'awa-language-server',
    'dist',
    'server.js'
  );
  if (fs.existsSync(localServer)) return localServer;

  return null;
}
