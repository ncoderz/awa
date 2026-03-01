// Implements PLAN-010 Phase 2: LSP Server Core + Phases 3-8

import {
  createConnection,
  DidChangeWatchedFilesNotification,
  FileChangeType,
  type InitializeResult,
  ProposedFeatures,
  type TextDocumentChangeEvent,
  TextDocumentSyncKind,
  TextDocuments,
} from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { provideCodeLens } from './providers/code-lens.js';
import { provideCompletion } from './providers/completion.js';
import { provideDefinition } from './providers/definition.js';
import { provideDiagnostics } from './providers/diagnostics.js';
import { provideHover, uriToPath } from './providers/hover.js';
import { prepareRename, provideRename } from './providers/rename.js';
import { buildLspSpecIndex, type LspSpecIndex, updateLspIndexForFile } from './spec-index.js';

// Create the LSP connection using stdio transport (spawned by VS Code extension)
const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let workspaceRoot: string | undefined;
let specIndex: LspSpecIndex | undefined;
let indexReady = false;

// ─────────────────────────────────────────
// Lifecycle handlers
// ─────────────────────────────────────────

connection.onInitialize((params) => {
  workspaceRoot =
    params.rootUri != null ? uriToPath(params.rootUri) : (params.rootPath ?? process.cwd());

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      hoverProvider: true,
      definitionProvider: true,
      completionProvider: {
        triggerCharacters: [' ', ':'],
      },
      codeLensProvider: {
        resolveProvider: false,
      },
      renameProvider: {
        prepareProvider: true,
      },
      workspace: {
        workspaceFolders: {
          supported: true,
          changeNotifications: true,
        },
      },
    },
    serverInfo: {
      name: 'awa-lsp',
      version: '0.1.0',
    },
  };

  return result;
});

connection.onInitialized(async () => {
  // Register for file watch notifications
  await connection.client.register(DidChangeWatchedFilesNotification.type, {
    watchers: [
      { globPattern: '**/.awa/specs/**/*.md' },
      { globPattern: '**/.awa/tasks/**/*.md' },
      { globPattern: '**/.awa/plans/**/*.md' },
      { globPattern: '**/*.{ts,js,tsx,jsx,py,go,rs,java}' },
    ],
  });

  // Register workspace folder change handler (only if client supports it)
  try {
    connection.workspace.onDidChangeWorkspaceFolders(async (event) => {
      if (event.added.length > 0 && !workspaceRoot) {
        const firstAdded = event.added[0];
        if (firstAdded) {
          workspaceRoot = uriToPath(firstAdded.uri);
          try {
            specIndex = await buildLspSpecIndex(workspaceRoot);
            indexReady = true;
            connection.sendNotification('awa/indexStatus', {
              ready: true,
              idCount: specIndex.ids.size,
            });
          } catch {
            // ignore
          }
        }
      }
    });
  } catch {
    // Client doesn't support workspace folder change events — that's fine
  }

  // Build the index in the background
  if (workspaceRoot) {
    connection.console.log(`awa LSP: indexing workspace at ${workspaceRoot}`);
    try {
      specIndex = await buildLspSpecIndex(workspaceRoot);
      indexReady = true;
      const idCount = specIndex.ids.size;
      connection.console.log(`awa LSP: indexed ${idCount} IDs`);
      // Notify client via custom method (status bar)
      connection.sendNotification('awa/indexStatus', {
        ready: true,
        idCount,
      });
    } catch (err) {
      connection.console.error(`awa LSP: indexing failed: ${String(err)}`);
      connection.sendNotification('awa/indexStatus', { ready: false, idCount: 0 });
    }
  }
});

// ─────────────────────────────────────────
// Document handlers — trigger diagnostics
// ─────────────────────────────────────────

function publishDiagnostics(doc: TextDocument): void {
  if (!indexReady || !specIndex) return;
  const diagnostics = provideDiagnostics(doc.uri, specIndex);
  connection.sendDiagnostics({ uri: doc.uri, diagnostics });
}

documents.onDidOpen((event: TextDocumentChangeEvent<TextDocument>) => {
  publishDiagnostics(event.document);
});

documents.onDidChangeContent((event: TextDocumentChangeEvent<TextDocument>) => {
  // Fire-and-forget incremental update, then re-publish diagnostics
  if (specIndex) {
    const filePath = uriToPath(event.document.uri);
    updateLspIndexForFile(filePath, specIndex)
      .then(() => publishDiagnostics(event.document))
      .catch(() => publishDiagnostics(event.document));
  } else {
    publishDiagnostics(event.document);
  }
});

documents.onDidClose((event: TextDocumentChangeEvent<TextDocument>) => {
  // Clear diagnostics when document is closed
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

// ─────────────────────────────────────────
// File watcher — re-index changed spec/code files
// ─────────────────────────────────────────

connection.onDidChangeWatchedFiles(async (params) => {
  if (!specIndex) return;

  for (const change of params.changes) {
    const filePath = uriToPath(change.uri);

    if (change.type === FileChangeType.Deleted) {
      // Remove all IDs from deleted spec file
      for (const [id, info] of specIndex.ids) {
        if (info.filePath === filePath) specIndex.ids.delete(id);
      }
      specIndex.markers.delete(filePath);
    } else {
      // Created or Changed — re-index the file
      await updateLspIndexForFile(filePath, specIndex).catch(() => {});

      // Re-publish diagnostics for open documents referencing this file
      for (const doc of documents.all()) {
        if (uriToPath(doc.uri) === filePath) {
          publishDiagnostics(doc);
        }
      }
    }
  }

  // Update status bar with new count
  connection.sendNotification('awa/indexStatus', {
    ready: true,
    idCount: specIndex.ids.size,
  });
});

// ─────────────────────────────────────────
// LSP feature handlers
// ─────────────────────────────────────────

connection.onHover((params) => {
  if (!indexReady || !specIndex) return null;
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;
  return provideHover(params.textDocument.uri, params.position, doc.getText(), specIndex);
});

connection.onDefinition((params) => {
  if (!indexReady || !specIndex) return null;
  return provideDefinition(params.textDocument.uri, params.position, specIndex);
});

connection.onCompletion((params) => {
  if (!indexReady || !specIndex) return [];
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];
  const lineText = doc.getText({
    start: { line: params.position.line, character: 0 },
    end: params.position,
  });
  return provideCompletion(params.position, lineText, specIndex);
});

connection.onCodeLens((params) => {
  if (!indexReady || !specIndex) return [];
  return provideCodeLens(params.textDocument.uri, specIndex);
});

connection.onPrepareRename((params) => {
  if (!indexReady || !specIndex) return null;
  return prepareRename(params.textDocument.uri, params.position, specIndex);
});

connection.onRenameRequest(async (params) => {
  if (!indexReady || !specIndex) return null;
  return provideRename(params, specIndex);
});

// ─────────────────────────────────────────
// Start
// ─────────────────────────────────────────

documents.listen(connection);
connection.listen();
