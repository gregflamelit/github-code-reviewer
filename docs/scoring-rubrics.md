# Three Role Evaluation Rubrics

Criteria version 2.0 and scoring version 2.0 assess 104 criteria across 20 domains: the original 68 criteria plus 36 explicit specialist criteria. One review assesses all criteria once and produces AI Product Manager, AI Engineering Rubric, and AI Data Science Rubric reports.

## Updated scoring

Each role allocates 30% to its own required specialist domain. The previous role weights are scaled by 70%, preserving their relative emphasis in the other 70%. Product Manager has 42% core and 28% functional weight; Engineering has 28% core and 42% functional; Data Science has 24.5% core and 45.5% functional. All three have 30% specialist weight.

| Capability or skill | AI Product Manager | AI Engineering Rubric | AI Data Science Rubric |
| --- | --- | --- | --- |
| Solutions Architecture | 10.5% | 14% | 7% |
| Human Centered Design | 10.5% | 3.5% | 3.5% |
| Product Management | 10.5% | 3.5% | 7% |
| AI Collaboration and Verification | 10.5% | 7% | 7% |
| Software Development | 3.92% | 8.4% | 3.64% |
| API and Integration Design | 1.96% | 4.2% | 0.91% |
| Database Design | 2.24% | 4.2% | 2.275% |
| Data Engineering | 1.68% | 2.1% | 6.825% |
| Data Analytics | 1.4% | 0% | 6.825% |
| Data Science | 1.4% | 0% | 11.375% |
| AI Implementation | 3.36% | 4.2% | 5.46% |
| RAG and Knowledge Base Design | 2.24% | 2.1% | 2.275% |
| Workflow Automation | 1.96% | 2.94% | 0.91% |
| Automated Testing | 2.52% | 5.04% | 2.275% |
| Automated Quality Assurance | 1.68% | 2.52% | 0.91% |
| Security and Privacy | 2.24% | 4.2% | 1.365% |
| Deployment and Operations | 1.4% | 2.1% | 0.455% |
| Product Outcomes Discovery and Adoption | 30% | 0% | 0% |
| Engineering Reliability and Change Safety | 0% | 30% | 0% |
| Statistical Validity and Scientific Reliability | 0% | 0% | 30% |
| Total | 100% | 100% | 100% |

The table assumes all functional skills apply. Not-applicable functional domains redistribute weight only within that role's functional pool. Unknown criteria retain their weight. Specialist pools stay reserved even when an entire specialist domain is not applicable; they cannot disappear into the shared score.

## Criterion weights and calculations

The original domains retain four equally weighted criteria. Each specialist domain contains 12 criteria: its first eight criteria each receive 10% of that domain, and its last four each receive 5%. Thus a 10% specialist criterion contributes 3% overall and a 5% criterion contributes 1.5% overall.

Within a partially applicable domain, normalize criterion weights across applicable criteria. Domain coverage is the observed applicable weight divided by all applicable weight. Domain maturity is the weighted mean of observed scores divided by four and multiplied by 100. Missing scores remain unknown; observed failure requires direct evidence. A plan alone cannot establish measured outcomes or executed validation.

For global criterion weight w and maturity score s from 0 to 4:

- Evidence coverage = 100 times the sum of observed criterion weights.
- Observed maturity = 100 times sum(w times s / 4) divided by observed weight.
- Lower endpoint = 100 times sum(w times s / 4).
- Upper endpoint = lower endpoint plus 100 times all unobserved weight.

Bounds describe unobserved evidence, not statistical confidence. An entirely inapplicable required specialist domain retains its reserved 30% as unestablished evidence and blocks a maturity band. Unrelated specialist domains have zero influence on the other roles and do not appear in those reports.

## Required evidence

Every role requires at least 80% overall weighted coverage, at least 75% weighted coverage in every core domain, and at least 75% in its required domains:

| Role | Required functional and specialist domains |
| --- | --- |
| AI Product Manager | Software Development, Automated Testing, Security and Privacy, Product Outcomes Discovery and Adoption |
| AI Engineering Rubric | Software Development, Automated Testing, Security and Privacy, Deployment and Operations, Engineering Reliability and Change Safety |
| AI Data Science Rubric | Data Engineering, Data Analytics, Data Science, Statistical Validity and Scientific Reliability |

A required domain marked not applicable blocks a band. Robust or higher maturity additionally requires every core and required domain to score at least 75; otherwise the report is Uneven. Weights and thresholds are proposed defaults pending expert calibration.

## Worked specialist example

If all shared criteria score 4 and Engineering specialist criteria score 1, Engineering scores 77.5: 70 shared points plus 7.5 specialist points. Its band is Uneven because the specialist domain scores only 25. The other two roles remain at 100 if their own specialist criteria score 4.

If all shared criteria score 4 but a role's specialist evidence is unknown, observed maturity is 100 with 70% coverage and bounds of 70 to 100. No maturity band is issued. A plausible general score cannot substitute for specialist evidence.

## Version preservation and upgrades

New reviews snapshot both complete criteria and scoring configurations. Each prompt, report, and export identifies the pinned versions. Retry continues under the original snapshot. Pre-2.0 reviews use archived criteria 1.0 and scoring 1.1; their stored scores remain unchanged.

Evaluate latest rubric creates a separate review at the same captured commit and evidence. It reuses earlier assessments only where criterion definitions are exactly unchanged, records reuse provenance, and evaluates the new specialist criteria. The previous review is never overwritten. Start a fresh review to collect newer or broader evidence. Scores from different versions should not be compared without considering the changed criteria and weights.

## Specialist scoring anchors

All criteria use the common scale: 0 demonstrated failure; 1 fragile attempt; 2 functional main approach; 3 robust; 4 validated. Unknown and not applicable have null scores. The following criteria provide explicit anchors and evidence sources.

## Product Outcomes Discovery and Adoption

### R1.1 Outcome definitions

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Connects user problems to explicit outcome metrics with a population, baseline, target, and decision rule.
- **4 Validated:** Outcome-linked changes are followed by measured results with relevant confounders disclosed.
- **GitHub evidence:** Metric definitions; product briefs; analytics event contracts; baseline reports.

### R1.2 Outcome validation

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Separates shipped features from demonstrated user or business outcomes and checks whether changes met their stated goal.
- **4 Validated:** Repeated iterations show validated improvements and documented decisions when a hypothesis fails.
- **GitHub evidence:** Experiment reports; feedback-linked PRs; before-and-after analyses; acceptance results.

### R1.3 Unit economics

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Models relevant inference, infrastructure, support, and human-review costs against expected usage and value.
- **4 Validated:** Representative usage validates sensitivity to volume, failure, and model choice with measured tradeoffs.
- **GitHub evidence:** Cost models; token budgets; operating-cost benchmarks; pricing assumptions.

### R1.4 Value and prioritization

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Prioritizes alternatives using user value, effort, risk, dependencies, and explicit scope boundaries.
- **4 Validated:** Observed results inform subsequent prioritization and demonstrate adjustment of an unsuccessful choice.
- **GitHub evidence:** Prioritized issues; roadmap rationale; scope exclusions; release decisions.

### R1.5 Research design

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Uses a research question, appropriate participant or user context, and a repeatable protocol instead of unsupported personas.
- **4 Validated:** Research triangulates independent sources and documents limitations and changes caused by findings.
- **GitHub evidence:** Research plans; interview guides; anonymized findings; participant context.

### R1.6 Experiment validity

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Defines a hypothesis, success and guardrail metrics, comparison method, and stopping or decision rules appropriate to the project.
- **4 Validated:** Experiment results support a justified decision and address material bias or uncertainty.
- **GitHub evidence:** Experiment plans; split assignment code; guardrail definitions; decision records.

### R1.7 Alternatives and usability

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Compares relevant solution alternatives and validates critical journeys for the intended users, including failure recovery.
- **4 Validated:** Representative user evidence demonstrates improvement over an alternative with remaining limitations recorded.
- **GitHub evidence:** Prototype comparisons; usability tasks; accessibility notes; tested design iterations.

### R1.8 Feedback traceability

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Traces credible feedback through a product decision, acceptance criteria, implementation, and verification.
- **4 Validated:** A complete feedback-to-outcome cycle shows what improved and what did not.
- **GitHub evidence:** Linked issues and PRs; acceptance tests; release notes; feedback summaries.

### R1.9 Adoption and onboarding

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Defines and supports activation steps, required setup, user understanding, and relevant adoption measures.
- **4 Validated:** Representative onboarding evidence validates a reduction in friction or successful activation.
- **GitHub evidence:** Onboarding flows; activation metric definitions; setup tests; abandonment fixes.

### R1.10 Workflow and change management

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Fits the product into real task sequences with appropriate human handoffs, role responsibilities, and rollout plans.
- **4 Validated:** Observed workflow use validates handoffs and documents correction of adoption or coordination failures.
- **GitHub evidence:** User journeys; integration plans; handoff contracts; rollout documentation.

### R1.11 Support and recovery

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Provides actionable support guidance, escalation, recovery, and feedback paths for important user failures.
- **4 Validated:** Support or failure evidence validates faster recovery and feeds improvements back into the product.
- **GitHub evidence:** Help content; support runbooks; issue templates; recovery flows; incident follow-up.

### R1.12 Responsible product decisions

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Makes consequential AI behavior understandable and provides proportionate user control, privacy boundaries, and escalation.
- **4 Validated:** User or adversarial evaluations validate the controls and document unresolved tradeoffs.
- **GitHub evidence:** AI disclosure and uncertainty UI; consent or retention design; override flows; risk decisions.

## Engineering Reliability and Change Safety

### R2.1 Concurrency invariants

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Identifies shared-state invariants and enforces them under concurrent operations where concurrency is relevant.
- **4 Validated:** Representative concurrent execution validates invariants and exposes regression cases.
- **GitHub evidence:** Transaction and locking code; optimistic concurrency; race tests; invariant specifications.

### R2.2 Idempotency and duplicate delivery

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Prevents repeated consequential effects during retries or duplicate events using durable appropriate deduplication.
- **4 Validated:** Duplicate and interrupted-delivery exercises validate durable behavior across restarts.
- **GitHub evidence:** Idempotency keys; unique constraints; replay tests; webhook consumers.

### R2.3 Ordering and consistency

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Defines relevant ordering, stale-read, conflict, and consistency behavior across components or writes.
- **4 Validated:** Out-of-order and conflicting operations are tested and support the documented consistency choice.
- **GitHub evidence:** Ordering contracts; version checks; consistency ADRs; conflict tests.

### R2.4 Partial failure and compensation

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Handles important partial successes through reconciliation, compensation, checkpointing, or safely repeatable recovery.
- **4 Validated:** Fault injection or recorded incidents validate recovery without corrupting state or duplicating actions.
- **GitHub evidence:** Compensation handlers; checkpoints; dead-letter handling; reconciliation tests.

### R2.5 Reliability objectives

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Defines proportionate availability, latency, correctness, or recovery objectives tied to user-impacting workflows.
- **4 Validated:** Representative operational or exercise results demonstrate objectives and justify tradeoffs.
- **GitHub evidence:** Service objectives; performance budgets; health checks; recovery targets.

### R2.6 Representative load testing

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Uses realistic workloads, data volumes, concurrency, and acceptance thresholds for important performance assumptions.
- **4 Validated:** Repeated measurements identify bottlenecks and validate a documented improvement.
- **GitHub evidence:** Load scripts; workload models; benchmark environments; threshold checks.

### R2.7 Observability and diagnosis

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Provides actionable structured logs, correlation, relevant metrics, and failure signals without exposing sensitive data.
- **4 Validated:** A representative failure is detected and diagnosed using those signals with demonstrated remediation.
- **GitHub evidence:** Trace propagation; log redaction; metric definitions; alert rules; diagnostic tests.

### R2.8 Recovery and rollback verification

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Defines and verifies proportionate restore, restart, migration recovery, or rollback procedures.
- **4 Validated:** Exercises or incidents demonstrate recovery within stated objectives and update procedures.
- **GitHub evidence:** Runbooks; restore drills; rollback tests; restart checks; migration recovery.

### R2.9 Dependency provenance

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Controls relevant dependency sources, versions, integrity, and vulnerability response.
- **4 Validated:** Traceable remediation and verification demonstrate that a real dependency risk was resolved.
- **GitHub evidence:** Lockfiles; integrity checks; dependency scans; update PRs; provenance records.

### R2.10 Reproducible artifacts

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Can reconstruct the delivered artifact from a specified revision and controlled build inputs.
- **4 Validated:** Independent clean builds or equivalent reproducibility checks substantiate the artifact provenance.
- **GitHub evidence:** Build locks; artifact digests; version manifests; reproducible build checks.

### R2.11 Migration and compatibility safety

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Protects relevant stored data and consumers during schema, API, dependency, or configuration changes.
- **4 Validated:** Representative upgrade and rollback or forward-recovery tests validate compatibility and data integrity.
- **GitHub evidence:** Expand-contract migrations; upgrade fixtures; API contract tests; deprecation plans.

### R2.12 Release enforcement

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Connects required quality checks to the released revision, handles overrides explicitly, and supports safe rollout.
- **4 Validated:** Release or failure evidence demonstrates enforcement, traceability, and a verified correction.
- **GitHub evidence:** CI results at SHA; required-check settings; release manifests; staged rollout rules.

## Statistical Validity and Scientific Reliability

### R3.1 Statistical question and estimand

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Defines the scientific question, target population, unit of analysis, and quantity being estimated or predicted.
- **4 Validated:** Independent checks show the analysis answers the stated question with clearly bounded interpretation.
- **GitHub evidence:** Study plans; dataset documentation; analysis specifications; outcome definitions.

### R3.2 Sampling and power

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Justifies sampling or sample size and addresses relevant selection bias, representativeness, and power limits.
- **4 Validated:** Sensitivity or replication evidence demonstrates which conclusions remain stable under sampling limits.
- **GitHub evidence:** Sampling code; sample-size calculations; cohort definitions; power or sensitivity analyses.

### R3.3 Uncertainty and effect size

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Reports appropriate effect sizes and uncertainty estimates with assumptions and meaningful practical interpretation.
- **4 Validated:** Coverage, simulation, replication, or sensitivity analysis validates uncertainty estimates and practical significance.
- **GitHub evidence:** Confidence or credible intervals; bootstrap code; effect-size reports; uncertainty checks.

### R3.4 Multiple testing and causal validity

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Addresses relevant repeated testing and separates association from causal conclusions using defensible identification assumptions.
- **4 Validated:** Robustness checks or valid experiments support conclusions and explicitly address alternative explanations.
- **GitHub evidence:** Multiplicity corrections; preregistered plans; experiment assignment; causal assumptions; negative controls.

### R3.5 Temporal and group leakage

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Uses splits and validation matching deployment, preserving relevant temporal, person, entity, and group boundaries.
- **4 Validated:** Adversarial overlap and temporal checks validate boundaries and demonstrate realistic generalization.
- **GitHub evidence:** Time or grouped split code; overlap assertions; train-test manifests; leakage regression cases.

### R3.6 Preprocessing and holdout isolation

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Fits transformations and selection on training data only and preserves independent held-out evaluation.
- **4 Validated:** Independent reproduction or leakage tests verify selection and preprocessing never contaminate evaluation.
- **GitHub evidence:** Train-only pipeline fitting; nested validation; holdout access controls; split-specific fixtures.

### R3.7 Dataset and benchmark contamination

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Tracks provenance and checks relevant duplicate, source, label, or benchmark overlap that could inflate measured performance.
- **4 Validated:** Contamination controls are validated and results are reassessed on a demonstrably independent set.
- **GitHub evidence:** Dataset hashes; deduplication; overlap reports; benchmark provenance; contamination checks.

### R3.8 Label missingness and slice quality

Weight within the specialist domain: 10%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Examines label reliability, missing-data handling, and errors across scientifically or operationally relevant slices.
- **4 Validated:** Sensitivity to labels, missingness, and important slices is quantified and informs a verified correction.
- **GitHub evidence:** Annotation agreement; missingness analyses; imputation pipelines; slice evaluation reports.

### R3.9 Calibration and decision thresholds

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Where predictions drive decisions, validates calibration and chooses thresholds using relevant costs and error tradeoffs.
- **4 Validated:** Held-out or prospective evidence validates calibration and threshold usefulness under stated conditions.
- **GitHub evidence:** Reliability diagrams; proper scoring rules; threshold analyses; decision-cost definitions.

### R3.10 Drift and model monitoring

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Where deployed or repeatedly applied, monitors meaningful data or concept changes and defines response criteria.
- **4 Validated:** Simulated or observed shifts trigger the intended response and validate monitored signals.
- **GitHub evidence:** Drift metrics; baseline distributions; monitoring tests; retraining and escalation rules.

### R3.11 Scientific reproducibility

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Reconstructs data versions, environment, preprocessing, experiment configuration, and reported results.
- **4 Validated:** An independent clean rerun reproduces material conclusions within documented tolerances.
- **GitHub evidence:** Dataset manifests; environment locks; experiment configs; reproducible notebooks or scripts.

### R3.12 Baselines and decision usefulness

Weight within the specialist domain: 5%.

- **2 Functional:** The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- **3 Robust:** Compares suitable simple baselines and explains how model or analytical improvements affect a real decision.
- **4 Validated:** Held-out improvements and their decision impact are validated with limitations and unsuccessful alternatives disclosed.
- **GitHub evidence:** Baseline code; ablations; effect and cost comparisons; decision records; limitation reports.
