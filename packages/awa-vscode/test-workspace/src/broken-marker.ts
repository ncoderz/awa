// @awa-component: EX-Formatter
// @awa-impl: EX-99_AC-1

// This file has an intentionally broken marker (EX-99_AC-1 doesn't exist)
// to test that the LSP shows a diagnostic warning.

export function brokenFunction(): void {
  console.log('This has a bad traceability marker');
}
