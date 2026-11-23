# Digimon STS Optimizer v1.6.2 — Changelog

## Scope
A test-branch update based on the v1.6.1 standalone build. The production `main` branch and private save repository are not modified.

## Added

### Permanent-item persistence and early-use planning
- Added an item-effect persistence reference for Talent, cumulative-stat Augment Chips, Bond/Friendship items, EXP items, and evolution catalysts.
- Talent and cumulative-stat items may be recommended on an earlier owned form only when the evolution graph contains a complete normal-evolution path to the selected core target.
- Bond/Friendship items may be recommended early on a documented normal route because Bond carries through normal Digivolution and De-Digivolution.
- Jogress/DNA, mode-change, missing-edge, and other special transitions are treated as unverified; early use is not recommended across them.
- EXP/Courage Point items remain held for a final/stable form because EXP carry-over is not confirmed by the persistence references.
- Item recommendations are quantity-aware and do not mark a recipient as used automatically.
- Added a collapsible persistence reference with source links and evidence labels.

### Adaptive Agent Skill / AP priority panel
- Reuses the existing Agent Rank and remaining-AP value.
- Considers the selected checkpoint, core evolution targets, target base personalities, recorded stat gates, current owned core-route Digimon, and recommended roster personalities.
- Prioritizes recorded Bond branch-count gates, matching Digivolution of Bond branches, and relevant stat boosts.
- Uses the documented 40 AP node cost for Digivolution of Bond; prerequisite-node costs are additional.
- Keeps the existing five optional branch counts and four Digivolution of Bond confirmations.
- Adds one in-game prerequisite-status selector for the current next target (Not checked / Still locked / Available / Acquired).
- Deliberately avoids a 208-node manual checklist to keep data entry minimal.
- The optimizer does not claim an individual skill node is unlocked until the user confirms its availability in-game.

### Recommendation Readiness
- Adds a dashboard grouping inputs into Essential, Important, Optional / Minor, and Automatically Calculated.
- Highlights mission/checkpoint, actual Agent Rank, and owned Digimon species/level/location as essential.
- Highlights remaining AP, area access, inventory and permanent-item quantities as important.
- Explains that manual stats, Talent, Bond and personality entry is not required for general recommendations.
- Adds field tags to key mission, rank, AP and roster inputs.

### Field Guide Browser
- The Field Guide Browser is collapsible and collapsed by default.
- Its open/closed preference is saved locally.
- Search/filter state remains managed by the existing evolution graph.

## Compatibility and safety
- New state is additive under `state.uiV162` and `state.agentSkillsV162`.
- Existing roster, permanent-item quantities, recipient selections, Agent Skill branch counts, and Digivolution of Bond flags are preserved.
- No cloud-sync credentials or private save data are embedded in the build.
- This is a standalone test build; do not connect it to the live private save repository until local testing is complete.

## Known limitations
- The AP planner is a checkpoint-aware priority optimizer, not yet a complete node-by-node simulation of all 208 Agent Skills. It avoids false claims by asking for one current-node availability confirmation in-game.
- Exact prerequisite paths and full AP costs for every optional Body Boost / Perfection / Cross Art node are not inferred when not encoded.
- DNA/Jogress and mode-change persistence for permanent effects remains unverified and is handled conservatively.
- EXP carry-over through evolution is not assumed.
