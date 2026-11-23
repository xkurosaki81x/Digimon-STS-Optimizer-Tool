# Digimon STS Optimizer v1.6.2 — Test Report

**Date:** 2026-11-23  
**Base:** v1.6.1 standalone test build  
**Branch:** `test/v1.6.2-persistence-ap-readiness`  
**Final application commit:** `91c331bc7971c8f48df322e26d8eff31a01a59d9`

## 1. Static validation

- Parsed all **21 executable inline JavaScript blocks** in the 1.27 MB HTML: **21/21 passed**.
- Embedded evolution graph JSON was excluded from executable-script parsing.
- No JavaScript syntax errors were found.

## 2. Functional logic simulation

Tests used representative roster, evolution graph and inventory fixtures, including normal and Jogress-only paths.

| Scenario | Result |
|---|---|
| Talent Awakening Booster DX on an owned earlier form with a normal path to Venusmon | Passed — safe early recipient identified |
| Augment Chip matching a future SPI evolution gate | Passed — early-use candidate identified |
| Friendship/Bond item on a normal evolution route | Passed — early-use candidate identified |
| Courage Point / EXP item before final target is owned | Passed — held because persistence is unconfirmed |
| Jogress-only route | Passed — early-use recommendation blocked |
| Core target personality mapped to its Bond branch | Passed |
| Current owned core-route roster and recommended personality considered | Passed |
| Digivolution of Bond with 50 AP and in-game availability confirmed | Passed — 40 AP node cost shown as affordable; prerequisite cost noted as additional |
| Branch gate at 44/46 | Passed — shortfall shown |
| Blank branch count | Passed — shown as Unknown, not zero |
| Recommendation Readiness categories | Passed — Essential, Important, Optional and Auto-calculated sections rendered |
| Permanent-item persistence reference | Passed — source/evidence panel rendered |
| Field Guide Browser default state | Passed — collapsed by default in DOM simulation |
| Field Guide Browser content and open/closed preference | Passed — content preserved and toggle state persisted |

## 3. Migration and data preservation review

The v1.6.2 layer adds only:
- `state.uiV162.fieldGuideOpen`
- `state.agentSkillsV162.prerequisiteStatus`
- `state.optimizerVersionV162`

The existing v1.6.1 values are not reset by this layer:
- `state.owned`
- `state.permanentItems.obtained / used / recipient / recipients`
- `state.agentSkillsV161.learnedCount`
- `state.agentSkillsV161.digivolutionSkills`
- `state.ap`, `state.rank`, checkpoint and edition settings

The v1.6.0 → v1.6.1 → v1.6.2 path was reviewed for additive compatibility and exercised with representative legacy-shaped state in the logic harness. This is a simulated migration, not a test against the user's actual save. Keep a separate JSON backup before any real import.

## 4. Important limitations

- Functional checks used representative fixtures and a mocked DOM; this is not a full interactive Chromium test against the complete app.
- The AP planner deliberately avoids a 208-node manual checklist. It uses the existing five branch counts and four Digivolution of Bond confirmations, plus one availability selector for the current next target.
- Exact prerequisite paths for every individual Agent Skill node are not fully encoded. The planner asks the user to confirm whether the current recommended node is Available / Locked / Acquired in-game; it does not invent prerequisite unlock status.
- The 40 AP Digivolution of Bond node cost is shown separately from prerequisite costs.
- Persistence is source-documented, not independently tested on the user's Switch. Normal Digivolution / De-Digivolution rules are distinguished from unverified DNA/Jogress and mode-change cases.
- EXP/Courage Point early use is conservatively blocked until carry-over is confirmed.

## 5. Repository safety

- Updated only `test/v1.6.2-persistence-ap-readiness`.
- Production `main` remained at commit `96894870937cddf5641d4d7e5fc778e93908aba4`.
- Private save repository remained at commit `4f2c1db844ec6a65a1692bcd2ed780ca76c4ead8`.
- No live save data was edited.
