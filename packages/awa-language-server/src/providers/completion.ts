// Implements PLAN-010 Phase 6: Autocomplete

import type { CompletionItem, Position } from 'vscode-languageserver/node.js';
import { CompletionItemKind } from 'vscode-languageserver/node.js';
import type { LspSpecIndex } from '../spec-index.js';

// Trigger patterns: autocomplete fires when the user types one of these suffixes
const IMPL_TRIGGER = '@awa-impl: ';
const TEST_TRIGGER = '@awa-test: ';
const COMPONENT_TRIGGER = '@awa-component: ';

/**
 * Provide completion items when the cursor is positioned after a @awa-* marker trigger.
 * Groups items by feature code for easier navigation.
 */
export function provideCompletion(
  position: Position,
  lineText: string,
  index: LspSpecIndex
): CompletionItem[] {
  const textBeforeCursor = lineText.slice(0, position.character);

  if (textBeforeCursor.includes(IMPL_TRIGGER) || textBeforeCursor.includes(TEST_TRIGGER)) {
    // Offer AC IDs and property IDs
    return buildCompletionItems(index, ['ac', 'property']);
  }

  if (textBeforeCursor.includes(COMPONENT_TRIGGER)) {
    // Offer component names
    return buildCompletionItems(index, ['component']);
  }

  return [];
}

function buildCompletionItems(index: LspSpecIndex, types: Array<string>): CompletionItem[] {
  const items: CompletionItem[] = [];

  for (const [id, info] of index.ids) {
    if (!types.includes(info.type)) continue;

    const implCount = (index.implementations.get(id) ?? []).length;
    const testCount = (index.tests.get(id) ?? []).length;

    const countParts: string[] = [];
    if (implCount > 0) countParts.push(`${implCount} impl`);
    if (testCount > 0) countParts.push(`${testCount} test`);
    const countSuffix = countParts.length > 0 ? ` (${countParts.join(', ')})` : '';

    items.push({
      label: id,
      kind: CompletionItemKind.Reference,
      detail: `[${info.featureCode}] ${info.text.slice(0, 80)}${info.text.length > 80 ? '…' : ''}`,
      documentation: {
        kind: 'markdown',
        value: [
          `**${id}**${countSuffix}`,
          '',
          info.text,
          '',
          `_${info.filePath}:${info.line}_`,
        ].join('\n'),
      },
      sortText: `${info.featureCode}-${id}`,
    });
  }

  // Sort by feature code then ID
  items.sort((a, b) => (a.sortText ?? a.label).localeCompare(b.sortText ?? b.label));

  return items;
}
