# Table/Grid Refactor Notes — 2025-10-02

## Callback Wiring vs `@this` Context
- **Option A — callbacks/explicit params (current pagination modules):**
  - Keep helpers pure, pass `DOM`, `debugLogger`, `registerPageStartCallback`, etc.
  - Pros: explicit contracts, easier to unit-test, adapters can mix/match implementations.
  - Cons: noisy signatures, must update all call sites when adding a dependency.
- **Option B — rely on `@this {Node}` (legacy modules):**
  - Helpers assume Node context (access `_DOM`, `_debug` directly).
  - Pros: concise signatures, matches existing modules.
  - Cons: hidden dependencies, harder to reuse outside Node, complicates testing.
- **Probable direction:** move legacy helpers toward Option A so Table/Grid share one explicit adapter style. Need to plan staged migration (ensure Node exposes the required hooks, update docs/tests).

## TODO
- [ ] Decide migration strategy (keep Option A or consolidate back to `@this`). Document decision in main refactor plan.
- [ ] If Option A chosen, create task list for porting legacy pagination helpers to explicit parameters.
- [ ] Review existing docs (`PLAN_TABLE_REFACTOR.md`) and align terminology once decision made.
