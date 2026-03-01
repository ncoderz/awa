// @awa-component: TRC-Formatter
// @awa-impl: TRC-4_AC-1, TRC-9_AC-1, TRC-10_AC-1

import type { TraceChain, TraceResult } from './types.js';

/**
 * Format trace result as a text location tree.
 */
export function formatTree(result: TraceResult): string {
  const lines: string[] = [];

  for (const chain of result.chains) {
    lines.push(...formatChainTree(chain));
    lines.push('');
  }

  for (const id of result.notFound) {
    lines.push(`✗ ${id}: not found`);
  }

  return lines.join('\n').trimEnd();
}

function formatChainTree(chain: TraceChain): string[] {
  const lines: string[] = [];
  const queryId = chain.queryId;

  // Header line — show AC description if available, otherwise just the ID
  lines.push(`${queryId}`);

  // Requirement (reverse)
  if (chain.requirement) {
    lines.push('');
    lines.push('  ▲ Requirement');
    const r = chain.requirement;
    lines.push(`  │  ${r.id} (${r.location.filePath}:${r.location.line})`);
  }

  // ACs
  if (chain.acs.length > 0) {
    lines.push('');
    lines.push('  ▼ Acceptance Criteria');
    for (const ac of chain.acs) {
      lines.push(`  │  ${ac.id} (${ac.location.filePath}:${ac.location.line})`);
    }
  }

  // Design components
  if (chain.designComponents.length > 0) {
    lines.push('');
    lines.push('  ▼ Design');
    for (const comp of chain.designComponents) {
      lines.push(`  │  ${comp.id} (${comp.location.filePath}:${comp.location.line})`);
    }
  }

  // Properties
  if (chain.properties.length > 0) {
    lines.push('');
    lines.push('  ▼ Properties');
    for (const prop of chain.properties) {
      lines.push(`  │  ${prop.id} (${prop.location.filePath}:${prop.location.line})`);
    }
  }

  // Implementations
  if (chain.implementations.length > 0) {
    lines.push('');
    lines.push('  ▼ Implementation');
    for (const impl of chain.implementations) {
      lines.push(
        `  │  ${impl.location.filePath}:${impl.location.line}  (@awa-${impl.type === 'implementation' ? 'impl' : 'component'}: ${impl.id})`
      );
    }
  }

  // Tests
  if (chain.tests.length > 0) {
    lines.push('');
    lines.push('  ▼ Tests');
    for (const t of chain.tests) {
      lines.push(`  │  ${t.location.filePath}:${t.location.line}  (@awa-test: ${t.id})`);
    }
  }

  return lines;
}

/**
 * Format trace result as a file path list.
 */
export function formatList(result: TraceResult): string {
  const paths = new Set<string>();

  for (const chain of result.chains) {
    if (chain.requirement) {
      paths.add(`${chain.requirement.location.filePath}:${chain.requirement.location.line}`);
    }
    for (const ac of chain.acs) {
      paths.add(`${ac.location.filePath}:${ac.location.line}`);
    }
    for (const comp of chain.designComponents) {
      paths.add(`${comp.location.filePath}:${comp.location.line}`);
    }
    for (const prop of chain.properties) {
      paths.add(`${prop.location.filePath}:${prop.location.line}`);
    }
    for (const impl of chain.implementations) {
      paths.add(`${impl.location.filePath}:${impl.location.line}`);
    }
    for (const t of chain.tests) {
      paths.add(`${t.location.filePath}:${t.location.line}`);
    }
  }

  return [...paths].join('\n');
}

/**
 * Format trace result as JSON (location mode — no content).
 */
export function formatJson(result: TraceResult): string {
  const output = {
    chains: result.chains.map((chain) => ({
      queryId: chain.queryId,
      requirement: chain.requirement
        ? {
            id: chain.requirement.id,
            filePath: chain.requirement.location.filePath,
            line: chain.requirement.location.line,
          }
        : null,
      acs: chain.acs.map((ac) => ({
        id: ac.id,
        filePath: ac.location.filePath,
        line: ac.location.line,
      })),
      designComponents: chain.designComponents.map((c) => ({
        id: c.id,
        filePath: c.location.filePath,
        line: c.location.line,
      })),
      implementations: chain.implementations.map((i) => ({
        id: i.id,
        filePath: i.location.filePath,
        line: i.location.line,
      })),
      tests: chain.tests.map((t) => ({
        id: t.id,
        filePath: t.location.filePath,
        line: t.location.line,
      })),
      properties: chain.properties.map((p) => ({
        id: p.id,
        filePath: p.location.filePath,
        line: p.location.line,
      })),
    })),
    notFound: result.notFound,
  };

  return JSON.stringify(output, null, 2);
}
