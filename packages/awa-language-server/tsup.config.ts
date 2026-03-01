import { defineConfig } from 'tsup';

export default defineConfig({
  // Server process entry — spawned by VS Code extension or other LSP clients
  entry: { server: 'src/server.ts', entry: 'src/entry.ts' },
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  shims: true,
  external: ['vscode-languageserver', 'vscode-languageserver-textdocument'],
});
