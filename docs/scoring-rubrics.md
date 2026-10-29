# Three Role Evaluation Rubrics

One review collects one evidence snapshot and assesses all 68 shared criteria once. Three deterministic scoring passes produce separate reports named AI Product Manager, AI Engineering Rubric, and AI Data Science Rubric. This separates evidence assessment from role emphasis and avoids three contradictory judgments about the same code.

Criteria version 1.0 defines the shared evidence anchors. Scoring version 1.1 defines role weights and required domains in scoring-rubrics.json. Weights are initial defaults pending calibration against expert judgments.

## Default overall weights

These percentages assume every functional domain applies. Not-applicable functional domains are excluded and their weight is redistributed proportionately within that role's functional pool. Unknown domains retain their weight in coverage. Core weights remain fixed.

| Capability or skill | AI Product Manager | AI Engineering Rubric | AI Data Science Rubric |
| --- | --- | --- | --- |
| Solutions Architecture | 15% | 20% | 10% |
| Human Centered Design | 15% | 5% | 5% |
| Product Management | 15% | 5% | 10% |
| AI Collaboration and Verification | 15% | 10% | 10% |
| Software Development | 5.6% | 12% | 5.2% |
| API and Integration Design | 2.8% | 6% | 1.3% |
| Database Design | 3.2% | 6% | 3.25% |
| Data Engineering | 2.4% | 3% | 9.75% |
| Data Analytics | 2% | 0% | 9.75% |
| Data Science | 2% | 0% | 16.25% |
| AI Implementation | 4.8% | 6% | 7.8% |
| RAG and Knowledge Base Design | 3.2% | 3% | 3.25% |
| Workflow Automation | 2.8% | 4.2% | 1.3% |
| Automated Testing | 3.6% | 7.2% | 3.25% |
| Automated Quality Assurance | 2.4% | 3.6% | 1.3% |
| Security and Privacy | 3.2% | 6% | 1.95% |
| Deployment and Operations | 2% | 3% | 0.65% |
| Total | 100% | 100% | 100% |

AI Product Manager preserves the original rubric: four core capabilities at 15% each, with 40% for functional skills. Human Centered Design and Product Management together contribute 30%, compared with 10% in Engineering and 15% in Data Science.

Engineering assigns 40% to core capabilities and 60% to functional skills. Architecture has the largest single weight. Software correctness, integration, database integrity, tests, and security carry substantial weight. Analytics and Data Science remain assessed for the shared review but have zero weight in Engineering.

Data Science assigns 35% to core capabilities and 65% to functional skills. Data Science, Data Engineering, and Data Analytics together contribute 35.75% overall before applicability normalization. AI Implementation contributes another 7.8%.

## Independent calculations

For each role, allocate its core weights across the four criteria in each core domain. Allocate its functional pool across applicable functional domains using that role's relative weights, then across applicable criteria in each domain.

For each weighted criterion, use maturity score s from 0 to 4 and global fractional weight w.

- Observed maturity = 100 times sum(w times s / 4) divided by the sum of weights with observed scores.
- Evidence coverage = 100 times the sum of weights with observed scores.
- Lower endpoint = 100 times sum(w times s / 4).
- Upper endpoint = lower endpoint plus 100 times the weight of unknown criteria.

All four values are calculated separately for each report. Bounds describe unobserved evidence, not statistical uncertainty. A zero-weight criterion cannot change that role's score, coverage, or bounds. Its evidence remains visible.

Reports reuse the same criterion findings and citations. They are independently weighted reports, not independent model experiments. Do not average the three scores into a worker ranking.

## Required evidence and reporting gates

Every report requires at least 80% overall evidence coverage and at least 75% coverage in every core domain before receiving an overall maturity band. The same 75% threshold applies to the following role-critical functional domains.

| Rubric | Role-critical functional domains |
| --- | --- |
| AI Product Manager | Software Development, Automated Testing, Security and Privacy |
| AI Engineering Rubric | Software Development, Automated Testing, Security and Privacy, Deployment and Operations |
| AI Data Science Rubric | Data Engineering, Data Analytics, Data Science |

A required skill marked not applicable prevents that role from receiving a maturity band. For example, a stateless utility may earn an observed Data Science score based on the few applicable skills, but it cannot establish Data Science maturity without demonstrating scientific work. The report lists that role's evidence blockers explicitly.

An overall score of at least 75 cannot receive a Robust or higher band unless every core and role-critical domain also scores at least 75. Otherwise the profile is Uneven. Unsupported or inaccessible evidence remains unknown.

## Example of different role scores

Suppose every criterion scores 4 except Data Engineering, Data Analytics, and Data Science, which each score 1. Every criterion is applicable and observed.

| Rubric | Observed maturity | Coverage |
| --- | --- | --- |
| AI Product Manager | 95.2 | 100% |
| AI Engineering Rubric | 97.75 | 100% |
| AI Data Science Rubric | 73.19 | 100% |

This synthetic example demonstrates the weighting calculations, not an assessment of a real contributor. A second example with unknown Data Science evidence leaves Engineering unchanged because F6 has zero Engineering weight; Data Science coverage falls and its maturity band is withheld.

## Additional attributes to deepen

Reweighting makes a useful first version, but specialist conclusions need more detailed evidence anchors. The current app retains the published 68 criteria. The following are recommended refinements for a future criteria version, not additional silently scored requirements.

| Role | Recommended deeper checks | Repository evidence to seek |
| --- | --- | --- |
| AI Product Manager | Outcome validation and unit economics | Valid metric definitions, baseline comparisons, operating-cost assumptions, outcome-linked changes |
| AI Product Manager | Discovery and experiment quality | Research protocols, participant context, alternatives considered, experiment decisions and follow-up |
| AI Product Manager | Adoption and workflow change | Onboarding iterations, real workflow integration, feedback-to-release trace, support and recovery design |
| AI Engineering | Concurrency and distributed consistency | Race tests, idempotency records, ordering and consistency decisions, partial-failure exercises |
| AI Engineering | Reliability and operability | Appropriate service objectives, realistic load tests, restore or rollback evidence, actionable traces |
| AI Engineering | Supply-chain and change safety | Dependency provenance, reproducible artifacts, controlled migrations, compatibility and release verification |
| AI Data Science | Statistical inference and experimental design | Power or sample-size justification where relevant, uncertainty estimates, multiple-comparison treatment, valid causal claims |
| AI Data Science | Leakage and generalization | Temporal or group-aware splits, holdout isolation, preprocessing boundaries, dataset and benchmark contamination checks |
| AI Data Science | Data and model reliability | Label quality, slice analysis, missing-data treatment, calibration, drift and monitoring where deployed |
| AI Data Science | Scientific reproducibility and decision usefulness | Dataset versions, reconstructable experiments, appropriate baselines, effect size, interpretation and resulting decisions |

Some of these already fit broadly within existing domains. Before expanding the criterion count, split only criteria where expert reviewers consistently need distinct scores. Version those changes and recalibrate; do not compare scores across changed criteria as if nothing changed.

## Application behavior

Every new review assesses all 17 domains and produces all three reports. Users switch between report cards to inspect role-specific scores, coverage, weights, and required evidence gaps. Export all reports produces the common evidence and all three aggregates. Export selected report produces the same shared evidence with only the selected role aggregate.

Older incomplete assessments can be completed against their saved commit and evidence without repeating completed domains. Their unassessed criteria remain unknown until evaluation finishes.
