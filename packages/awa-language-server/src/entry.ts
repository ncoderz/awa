// Entry point for the LSP server process — imported dynamically by `awa lsp`.

/**
 * Start the LSP server. Importing server.ts triggers all side effects
 * (createConnection, documents.listen, connection.listen) and the server
 * runs for the lifetime of the process.
 */
export async function startServer(): Promise<void> {
  // Dynamic import ensures vscode-languageserver is only loaded when needed
  await import('./server.js');
}
