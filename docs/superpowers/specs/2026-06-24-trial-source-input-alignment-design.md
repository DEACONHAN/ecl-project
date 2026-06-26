# Trial Source Input Alignment Design

## Objective

Use the trial center as the first integration point for the engine-layer redesign. Operators will manually enter the source-data tables defined in the technical document, run trial calculation, inspect engine outputs, and only after validation connect the same mapping to formal batch data sources.

## Scope

In scope:

- Replace the trial center's current internal `AssetInput` form with source-data table entry.
- Keep the current trial center layout pattern: scheme/date controls, preset data, editable rows, run button, result area.
- Add backend trial DTOs that represent source-data rows instead of internal engine fields.
- Add a trial assembly layer that maps source-data rows into `JobContext`, `CustomerContext`, `AssetInput`, repayment schedules, facilities, collateral pools, ratings, and historical stage inputs.
- Update parameter-layer DTOs/entities/API/page fields needed by the engine redesign.
- Keep parameter pages' existing interaction model. Only add/remove/rename fields and table columns required by the confirmed technical design.
- Update result display so each asset shows risk group, stage, PD scenarios, EAD breakdown, LGD pool result, ECL details, overlay, final ECL, and exceptions.

Out of scope for this phase:

- Formal batch data-source ingestion.
- Large UI redesigns.
- Reworking parameter page navigation, page layout, or interaction model beyond field-level changes.
- Implementing UI designs described in the technical document. The current codebase UI is authoritative.

## Source Tables Entered In Trial Center

The trial request will contain these logical tables:

| Table | Trial usage |
| --- | --- |
| Loan source table | Primary asset rows. Drives risk grouping, stage, PD maturity, EAD on-balance fields, and asset-level result rows. |
| Facility source table | Facility limits, available amounts, revolving flag, maturity dates, and `collateral_pool_id`. |
| Repayment schedule table | Future cash-flow periods for on-balance EAD with repayment plan. |
| Collateral detail table | Collateral items under each `collateral_pool_code`, used for LGD pool net-value aggregation. |
| Customer rating table | Current/prior internal and external ratings and rating agencies. |
| Historical stage table | Trial-only input to simulate prior measurement stage lookup by asset and batch date. |

## Backend Data Flow

1. `TrialCalculationReq` receives source table rows.
2. A new trial assembler validates relational keys and maps rows into engine context.
3. The dispatcher runs engines in the existing sequence.
4. Results are mapped into `TrialCalculationResp` and `AssetResult`.
5. The result view shows asset-level outputs and expandable engine-step details.

Mapping rules follow the current technical document decisions:

- Risk grouping uses loan `id`, `segment`, `product_type`, `industry_cn`, and `guarantee_type`.
- `collateral_type` comes from loan `guarantee_type`.
- `industry_code` uses loan `industry_cn`.
- Stage uses `is_npl`, `normal_consecutive_days`, `other_risk_info`, customer ratings, rating agencies, and historical `last_stage`.
- PD rating source is selected by `group_id` and parameter rules.
- EAD uses repayment schedule when present, otherwise on-balance balance/interest; off-balance uses facility unused amount allocated by facility loan amount share.
- LGD calculates by collateral pool and assigns pool-level LGD back to assets in that pool.

## Frontend Trial Center

The page keeps its current structure and styling approach:

- Keep page header, quick presets, trial conditions panel, run button, result panel.
- Replace per-asset collapsible internal fields with table-oriented editable sections.
- Use compact editable tables or grouped row editors inside tabs/collapsible panels, matching existing Ant Design usage.
- Preserve multi-asset trial behavior.
- Presets should populate coherent source-table rows rather than internal fields.

Result display changes:

- Summary table remains for multi-asset results.
- Expandable detail rows continue to use `TrialStep` sections.
- PD step shows scenario rows.
- EAD step shows on-balance, off-balance, total EAD, and calculation method.
- LGD step shows collateral pool ID, pool EAD, collateral net value, covered/uncovered EAD, and pool LGD.
- ECL step shows per-scenario ECL details and weighted ECL.
- Overlay step shows selected rule, adjustment amount, and final ECL.

## Parameter Layer UI

Parameter pages must follow the current implemented pages, not the obsolete page design in the technical document.

Required field-level adaptations:

- Risk group detail removes `customerType` and `regionCode`; keeps business line/segment, product type, industry code, collateral type.
- Stage CRR drop rules add `ratingSystem` and `ratingAgency`.
- PD curve adds `ratingSystem` and `ratingAgency`.
- Scheme settings expose `lgdFloor`.
- LGD collateral discount/depreciation pages remain in the existing interaction style and only ensure required fields are present.
- CCF page keeps existing interaction style and ensures commitment days are visible/editable.

## Error Handling

Trial assembly should not silently invent missing relationship data. It should produce clear asset-level exceptions for:

- Missing required loan row fields.
- Loan referencing a missing facility when EAD requires facility data.
- Missing or invalid maturity date for PD.
- Missing PD curve for any required scenario.
- Missing customer rating needed by the selected PD rating system.
- Collateral pool referenced by a facility but missing collateral rows, when LGD needs pool calculation.

Warnings are acceptable where the technical design explicitly allows fallback, such as LGD uncovered default path.

## Testing

Use test-first changes for engine behavior and mapping behavior.

Backend tests:

- Trial assembler maps source rows to `AssetInput` and related context correctly.
- Risk grouping matches only confirmed dimensions and treats only parameter blanks as wildcards.
- Stage uses `is_npl`, rating agency-aware downgrade rules, observation days, and no Stage3-to-Stage1 direct rollback.
- PD selects rating source by group and uses `ratingSystem + ratingAgency`.
- EAD covers repayment-plan, no-repayment-plan, and off-balance allocation paths.
- LGD covers collateral pool net value, covered/uncovered split, and pool LGD assignment.
- ECL uses PD scenario details and weights in ECL layer.
- Overlay handles effective dates, priority tie-break, and FIXED with zero EAD.

Frontend checks:

- TypeScript build passes.
- Trial page can submit source-table-shaped data.
- Result page renders single-asset and multi-asset responses without layout breakage.

## Implementation Order

1. Add/adjust backend DTOs for trial source tables and frontend TypeScript types.
2. Add trial assembler and tests.
3. Update trial center page to edit source tables and submit the new request shape.
4. Update parameter entities/DTOs/pages for confirmed field changes with minimal UI interaction changes.
5. Update engines one by one with tests.
6. Update result mapping and frontend result display.
7. Run backend unit tests and frontend build.
