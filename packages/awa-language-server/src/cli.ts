// Implements PLAN-010: awa lsp command entry point

/**
 * The `awa lsp` command starts the Language Server Protocol server, which
 * enables IDE integration features (hover, go-to-definition, diagnostics,
 * autocomplete, code lens) in editors that support LSP.
 *
 * Usage: awa lsp --stdio
 * The VS Code extension spawns this command as a child process.
 */
export async function runLspServer(): Promise<void> {
  // Dynamically import the LSP server to avoid loading vscode-languageserver
  // unless the lsp command is explicitly invoked. This keeps startup time fast
  // for all other awa commands.
  const { startServer } = await import('./entry.js');
  await startServer();
}
