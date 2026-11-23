# Digimon STS Optimizer v1.6.2 — Test Report

**Date:** 2026-11-23  
**Base:** v1.6.1 standalone test build  
**Branch:** `test/v1.6.2-persistence-ap-readiness`  
**Candidate commit:** `da4c663783707830328f65d3f293fcc69d6f090a`

## 1. Static validation

- Parsed all 21 executable inline JavaScript blocks with a JavaScript syntax parser: **21/21 passed**.
- The embedded evolution graph JSON was not treated as executable JavaScript.
- No syntax errors were found in the v1.6.2 enhancement script.

## 2. Logic simulation

| Scenario | Result |
|---|---|
| Talent Awakening Booster DX on an owned earlier form with a normal path to Venusmon | Passed — early-use candidate identified |
| Augment Chip matching a future SPI evolution gate | Passed — early-use candidate identified |
| Friendship/Bond item on a normal evolution route | Passed — early-use candidate identified |
| Courage Point / EXP item before final target is owned | Passed — held because persistence is unconfirmed |
| Jogress-only route | Passed — early-use recommendation blocked |
| Stat gate on a core route | Passed — matching Bond branch prioritized |
| Digivolution of Bond with 50 AP and in-game availability confirmed | Passed — 40 AP node cost shown as affordable; prerequisite cost noted as additional |
| Branch gate at 44/46 | Passed — shortfall shown |
| Blank branch count | Passed — shown as Unknown, not zero |
| Recommendation Readiness categories | Passed — Essential, Optional and Auto-calculated sections rendered |
| Permanent-item persistence reference | Passed — source/evidence panel rendered |
| Field Guide Browser default state | Passed — collapsed by default in DOM simulation |
| Field Guide Browser content and open/closed preference | Passed — content preserved and toggle state persisted |

## 3. Migration and data preservation review

The v1.6.2 migration is additive. It adds:
- `state.uiV162.fieldGuideOpen`
- `state.agentSkillsV162.prerequisiteStatus`
- `state.optimizerVersionV162`

The existing v1.6.1 fields are not reset by this layer:
- `state.owned`
- `state.permanentItems.obtained / used / recipient / recipients`
- `state.agentSkillsV161.learnedCount`
- `state.agentSkillsV161.digivolutionSkills`
- `state.ap`, `state.rank`, checkpoint and edition settings

The v1.6.0 → v1.6.1 → v1.6.2 path was reviewed for additive compatibility and exercised with representative legacy-shaped state in the logic harness. This is a simulated migration, not a test against the user's actual save. Keep a separate JSON backup before any real import.

## 4. Important limitations

- The UI/logic simulations use representative graph and roster fixtures; they are not a full interactive Chromium test against the complete 1.27 MB app.
- The AP planner intentionally does not require marking all 208 skill nodes. Exact per-node prerequisite chains are not fully encoded in this build. The user confirms whether the single recommended node is Available / Locked / Acquired in-game.
- The 40 AP Digivolution of Bond node cost is shown separately from any prerequisite costs.
- Persistence is source-documented, not independently tested on the user's Switch. Normal Digivolution / De-Digivolution rules are distinguished from unverified DNA/Jogress and mode-change cases.
- EXP/Courage Point early use is conservatively blocked until carry-over is confirmed.

## 5. Repository safety

- Updated only the development branch `test/v1.6.2-persistence-ap-readiness`.
- Production `main` remained at commit `96894870937cddf5641d4d7e5fc778e93908aba4`.
- Private save repository remained at commit `4f2c1db844ec6a65a1692bcd2ed780ca76c4ead8`.
- No live save data was edited.
