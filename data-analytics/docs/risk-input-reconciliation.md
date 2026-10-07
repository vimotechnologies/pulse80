# Live risk inputs and historical reconciliation

Risk analytics read both `screening_results` and `screening_result_values`. Flexible numeric fields must belong to the screening service, use the configured canonical unit, and satisfy configured numeric bounds. Canonical values take precedence over legacy aliases and legacy columns. BMI is derived from recorded height and weight on the same screening if explicit BMI is absent.

Each participant is identified by organisation plus participant reference. The latest Completed value is selected independently for each supported indicator. This retains blood-pressure evidence when a later service records only glucose, while allowing a newer blood-pressure result to replace an older one. The highest existing threshold wins. The clinical thresholds remain unchanged. The metric remains all time; no clinical validity window has been defined.

The database blocks inserts or status transitions to Completed when no legacy or service-matching flexible result is saved. Unsupported services with valid recorded results can still be completed and remain Not Calculated in this quantitative metric. Existing Completed rows are preserved for historical reconciliation.

## Production audit, 7 October 2026

There are 204 Completed screenings across four organisations. All 204 lack legacy results, flexible values, outcomes and service IDs. There are ten Under Review screenings with flexible results, seven of which also contain supported legacy measurements. These pending screenings cannot supply measurements for unrelated historical participants. The user confirmed that the 204 historical screenings are real screenings.

Restoration requires original result records, matching organisation, participant code, screening date and service. Import only verified original values; resolve ambiguous or missing matches before writing. No clinical values, service identities or approvals should be inferred from counts, notes or another participant's screening. Supported measurements will contribute to risk automatically once saved against the correct existing Completed screening. Do not reclassify or delete historical screenings merely to remove Not Calculated.

## Validation

`pulse80-backend/test/risk-inputs.test.mjs` exercises a real isolated PostgreSQL engine: legacy and flexible measurements, completion safeguards, numeric units, service matching, BMI derivation, latest values across separate screenings, repeat measurement replacement, unsupported services, pending exclusion, category totals, pagination and tenant-scoped GraphQL. It is included in the backend test command.

The live migration is `20261007011508_connect_flexible_risk_inputs_and_require_results.sql`. The database change has been applied. The platform dashboard code remains subject to PR merge and deployment; signed-in production browser verification is outstanding.
