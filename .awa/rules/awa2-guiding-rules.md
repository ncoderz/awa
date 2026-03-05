# awa2 Guiding Rules

## Intent

`awa2` prioritizes minimal, high-signal prompt context. The workflow favors compact prompt definitions where behavior is encoded in formal structures rather than long prose.

## Rules

0. awa2 is NOT based in any way on awa - do not compare it against awa unless requested.
1. Prompts use Gherkin and PEG grammars inside fenced code blocks.
2. Prompts remain as succinct as possible; core logic should live in Gherkin and PEG blocks.
3. Skills are not used in `awa2`.
4. Prompts are the primary control surface ("prompts are king").
5. Hooks exist as an internal prompt concept only, not as hard hooks provided by the AI coding engine.

## Authoring Notes

- Prefer precise, executable-style prompt definitions over narrative instructions.
- Keep non-grammar prose brief and only where necessary for safety or constraints.
- If a rule can be represented in Gherkin or PEG, represent it there.
