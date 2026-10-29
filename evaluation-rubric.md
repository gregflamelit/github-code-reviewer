# GitHub AI Enhanced Worker Evaluation Rubric

Shared criterion policy and historical baseline: criteria 1.0. The current app uses criteria 2.0 and scoring 2.0. See [the current scoring specification](docs/scoring-rubrics.md) for the 36 additional specialist criteria, updated weights, weighted coverage, and versioning rules. The historical domain weights and equally weighted criterion examples below describe the original 68 criteria.

Initial weights and thresholds are product defaults to calibrate against expert reviews; they are not validated predictors of job performance.

This rubric evaluates how well work demonstrates the ability to turn a user problem into a useful, reliable solution with AI assistance. Reports distinguish repository quality, attributable contributor evidence, and capabilities requiring a work sample. The primary output is a capability profile with evidence and uncertainty.

## Assessment scope

Record repository URL, immutable commit SHA, evaluation date, project purpose and stage, intended users, selected role profile, rubric version, evaluator version, and inspection scope before scoring.

Use three assessment modes:

| Mode | What it establishes | Limits |
| --- | --- | --- |
| Repository inspection | Implemented structure, tests, documented decisions, changes, and review discussions | Source inspection does not prove runtime behavior or individual understanding |
| Isolated execution | Build reproducibility and observed behavior under specified scenarios | Passing a finite test suite does not prove all behavior |
| Contributor work sample | Explanation, judgment, debugging, and AI collaboration on attributable work | Conclusions apply to the observed task and conditions |

A repository-only report must be labeled as such. Do not present repository-level scores as an individual's proficiency. Do not estimate AI authorship from code style. Do not infer personality, intelligence, motivation, or unrelated personal characteristics.

## Scoring model

### Maturity scale

Score each criterion with an integer from 0 to 4. Unknown and not applicable are separate states with a null score.

| Score | Anchor | Required basis |
| --- | --- | --- |
| 0 | Demonstrated failure or required behavior demonstrably absent | An applicable requirement plus direct evidence of failure or a documented, sufficiently complete inspection showing its absence |
| 1 | Fragile implementation | Partial behavior exists, with material defects, incomplete integration, or reliance on manual intervention |
| 2 | Functional implementation | The main scenario works or is credibly implemented; important relevant edge cases or validation remain incomplete |
| 3 | Robust implementation | Meets the criterion's level 3 requirements below, including meaningful treatment of relevant failures |
| 4 | Justified and validated implementation | Meets level 3 and demonstrates measured effectiveness, explicit tradeoffs, or improvement through feedback |
| Unknown | Insufficient evidence | Evidence is missing, inaccessible, ambiguous, contradictory without resolution, or outside the inspected scope |
| Not applicable | No relevant requirement in this assessment | Reviewer records a contextual reason and the evidence supporting exclusion |

Absence of a named file is not proof that a capability is absent. A missing test directory can justify searching other locations; it does not independently justify a zero. If the entire relevant scope is inspected and a required control is absent, zero can be justified for that repository criterion.

Higher scores require all lower-level behaviors that remain relevant. Do not demand enterprise infrastructure from a small prototype. Appropriate simplicity can earn 4.

### Weights

Core capabilities contribute 60 points in total. All four are assessed; evidence can remain unknown.

| ID | Core capability | Overall weight |
| --- | --- | --- |
| C1 | Solutions Architecture | 15% |
| C2 | Human Centered Design | 15% |
| C3 | Product Management | 15% |
| C4 | AI Collaboration and Verification | 15% |

Functional skills contribute 40 points. The following weights sum to 100% within that functional pool when every skill applies.

| ID | Functional skill | Weight within functional pool | Overall weight when all apply |
| --- | --- | --- | --- |
| F1 | Software Development | 14% | 5.6% |
| F2 | API and Integration Design | 7% | 2.8% |
| F3 | Database Design | 8% | 3.2% |
| F4 | Data Engineering | 6% | 2.4% |
| F5 | Data Analytics | 5% | 2.0% |
| F6 | Data Science | 5% | 2.0% |
| F7 | AI Implementation | 12% | 4.8% |
| F8 | RAG and Knowledge Base Design | 8% | 3.2% |
| F9 | Workflow Automation | 7% | 2.8% |
| F10 | Automated Testing | 9% | 3.6% |
| F11 | Automated Quality Assurance | 6% | 2.4% |
| F12 | Security and Privacy | 8% | 3.2% |
| F13 | Deployment and Operations | 5% | 2.0% |

Each domain has four criteria, each worth 25% of that domain. Declare functional applicability and any role-specific weights before scoring. Renormalize functional weights only across applicable skills. Unknown skills remain in the applicable weight denominator for coverage.

For an application or workflow, F1, F10, F11, and F12 normally apply. F13 applies to runnable deliverables, including a proportionate reproducible setup for a local tool. AI-specific functionality is applicable only where the product uses AI; using an AI coding assistant does not make RAG or model integration applicable.

### Aggregation and evidence coverage

Let each applicable criterion have a global fractional weight w, with all applicable weights summing to 1. Allocate 0.15 across each core domain's applicable criteria; allocate 0.40 across applicable functional domains and their applicable criteria. Redistribute an approved not-applicable criterion within its domain. If an entire core capability cannot be assessed, leave it unknown rather than redistributing its weight.

For scored criteria, let s be the score from 0 to 4.

- Evidence coverage = 100 × sum of w for scored criteria.
- Observed maturity = 100 × sum(w × s / 4) / sum(w for scored criteria).
- Uncertainty interval = [100 × sum(w × s / 4), lower endpoint + 100 × sum(w for unknown criteria)].

Compute the same figures within each domain and within core and functional pools. With no scored evidence, observed maturity is null. The uncertainty interval expresses possible scores for unknown criteria; it is not a statistical confidence interval.

Show coverage alongside every observed score. Do not multiply scores by confidence; that would conflate weak evidence with weak ability.

Do not issue an overall maturity band unless overall coverage is at least 80%, each core domain has at least 75% coverage, and each role-critical functional domain has at least 75% coverage. An overall score can otherwise be shown only as a provisional observed score.

| Observed score | Maturity band when coverage conditions pass |
| --- | --- |
| 0 to less than 25 | Major gaps demonstrated |
| 25 to less than 50 | Fragile |
| 50 to less than 75 | Functional |
| 75 to less than 90 | Robust |
| 90 to 100 | Well justified and validated |

An overall Robust or higher band additionally requires every core domain and role-critical functional domain to score at least 75. Otherwise label the profile Uneven and show domain results. These are maturity labels, not hiring recommendations.

## Core capability criteria

The requirements in each table describe score 3. Scores 0 to 2 follow the global anchors relative to these requirements. Score 4 adds the domain-specific validation described after each table. Suggested paths are examples; accept equivalent implementations and documents.

### C1 Solutions Architecture

| Criterion | Weight in domain | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| C1.1 Requirements and constraints | 25% | Architecture addresses stated users, data, scale, cost, latency, and risk constraints that matter to the project | README scope; linked requirement issues; docs/requirements; architecture decision records; implementation matching the stated constraints |
| C1.2 Boundaries and contracts | 25% | Components have clear responsibilities; dependencies and interfaces support the intended changes | src modules; package boundaries; API schemas; dependency manifests; architecture diagrams reconciled with imports and calls |
| C1.3 Failure and data flow design | 25% | Important failure paths, consistency needs, and trust boundaries have explicit handling | Sequence diagrams; queue consumers; transaction boundaries; timeout and recovery code; failure tests |
| C1.4 Tradeoffs and evolution | 25% | Choices are proportionate and alternatives, cost implications, and likely changes are addressed | docs/adr; PR rationale; benchmarks; migration plans; dependency replacement or refactoring history |

Level 2 example: the main workflow has understandable components, but dependency failure and data ownership are unclear. Level 4 example: a documented choice between a simple service and a queue-based design is supported by representative failure or load results. Elaborate architecture alone earns no bonus.

### C2 Human Centered Design

| Criterion | Weight in domain | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| C2.1 User and task understanding | 25% | Identifies intended users, their goals, and meaningful workflow constraints | Personas grounded in research; user stories; problem issues; interview summaries; CLI task examples |
| C2.2 Interaction and feedback | 25% | Main journeys provide clear navigation or commands, useful status, and actionable errors | UI components; command help; validation messages; loading, empty, and error states; journey tests |
| C2.3 Accessibility and inclusion | 25% | Supports relevant keyboard, semantic, visual, language, and assistive interaction needs | Semantic markup; labels and focus handling; accessible components; accessibility test reports; manual test notes |
| C2.4 Recovery and user control | 25% | Users can understand consequential actions, correct mistakes, and recover from relevant failures | Confirmation and undo flows; preserved input; cancellation; AI citations or uncertainty where relevant; recovery tests |

Level 2 example: a usable happy path exists but errors discard input or lack recovery. Level 4 requires evidence from representative usability or accessibility checks and resulting improvements. Attractive screenshots alone do not establish usability; automated accessibility scans alone do not establish conformance.

### C3 Product Management

| Criterion | Weight in domain | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| C3.1 Problem and value | 25% | Clearly defines the user problem, intended outcome, and meaningful constraints | README problem statement; product brief; issue descriptions; documented user feedback |
| C3.2 Prioritization and scope | 25% | Scope addresses the main user outcome and handles dependencies and exclusions coherently | Milestones; roadmap; issue priorities with rationale; deliberately deferred features; coherent release contents |
| C3.3 Acceptance and success measures | 25% | Important features have testable acceptance criteria and appropriate outcome measures | Issue checklists; behavior specifications; acceptance tests; event schemas; metric definitions |
| C3.4 Feedback and iteration | 25% | Changes respond to credible feedback or measured behavior and document the resulting decision | Linked issues and PRs; release notes; experiment results; defect follow-up; changes tied to feedback |

Level 2 example: the product purpose and feature scope are clear, but success measures and feedback are missing. Level 4 requires a traceable feedback-to-decision-to-change cycle with an assessed outcome. Instrumentation code establishes measurement capability, not actual customer value or adoption.

### C4 AI Collaboration and Verification

| Criterion | Weight in domain | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| C4.1 Task decomposition and context | 25% | AI-assisted tasks have usable goals, constraints, interfaces, and completion checks | Attributable task briefs; agent instructions; linked issue specifications; redacted session artifacts |
| C4.2 Review and technical ownership | 25% | Contributor can explain material decisions and identifies or corrects unsuitable AI output | Substantive PR review; corrective diffs with rationale; work-sample explanation and modification |
| C4.3 Independent verification | 25% | Uses checks that can expose mistakes rather than accepting the AI's own claim of correctness | Independently specified acceptance tests; regression cases; reproducible commands and outputs; code-to-requirement trace |
| C4.4 Safe and efficient delegation | 25% | Delegates with appropriate permissions, data boundaries, checkpoints, and resource limits | Tool permission configuration; approval rules; scoped workflows; documented budget limits; attributable execution traces |

Level 2 example: AI tasks and resulting code are documented with basic checks, but correction and ownership are not demonstrated. Level 4 requires an attributable cycle in which the contributor finds a consequential AI error, revises the approach, and validates the correction while explaining tradeoffs. A repository-only review often leaves C4 partially unknown. Do not assume AI was used because instructions or generated-looking code exist.

## Functional skill criteria

### F1 Software Development

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F1.1 Correctness | 25% | Implements required behavior and important boundary conditions | Source logic; acceptance tests; bug fixes; reproducible examples |
| F1.2 Maintainability | 25% | Responsibilities, naming, and abstractions make likely changes understandable | Module structure; refactoring diffs; interfaces; substantive code review |
| F1.3 Error and resource handling | 25% | Handles errors and manages connections, files, memory, and asynchronous work appropriately | Error paths; cleanup; cancellation; concurrency controls; associated tests |
| F1.4 Dependencies and contracts | 25% | Dependencies and types or schemas are intentional, compatible, and reproducible | Lockfiles; dependency manifests; type checks; runtime validators; compatibility CI |

Level 2: main behavior is implemented with limited boundary handling. Level 4: measured or observed maintenance problems are reduced through verified changes without unnecessary abstraction.

### F2 API and Integration Design

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F2.1 Contract clarity | 25% | Inputs, outputs, errors, and compatibility are explicit | OpenAPI or equivalent; schemas; SDK types; contract tests |
| F2.2 Access boundaries | 25% | Authentication and object-level authorization protect relevant operations | Middleware; policy checks; tenant filters; negative access tests |
| F2.3 Resilience | 25% | Relevant timeouts, rate limits, retries, and failure fallbacks are bounded | Client configuration; backoff logic; retry limits; mocked outage tests |
| F2.4 Consistency and evolution | 25% | Handles pagination, duplicate requests, partial results, and changes where relevant | Idempotency keys; webhook deduplication; pagination tests; version or compatibility strategy |

Level 2: a working integration covers normal responses. Level 4: representative outages, duplicate delivery, and compatibility changes are tested with observed results.

### F3 Database Design

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F3.1 Schema and integrity | 25% | Schema fits access patterns and protects required invariants | DDL; ORM models; foreign keys; unique and check constraints; schema tests |
| F3.2 Query design | 25% | Important queries and indexes are appropriate to expected usage | Query source; index migrations; explain plans; representative query tests |
| F3.3 Transactions and concurrency | 25% | Multi-step writes preserve relevant invariants under concurrent access | Transactions; isolation choices; locking or optimistic concurrency; race tests |
| F3.4 Lifecycle and recovery | 25% | Schema changes, retention, and recovery match the project's needs | Versioned migrations; upgrade tests; backup and restore procedures; deletion jobs |

Level 2: basic CRUD and schema exist, with incomplete integrity or migration handling. Level 4: realistic query, concurrency, migration, or recovery evidence validates key design choices.

### F4 Data Engineering

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F4.1 Ingestion contracts | 25% | Validates schemas and handles missing, malformed, and changing inputs | Ingestion code; data contracts; validation fixtures; schema evolution tests |
| F4.2 Repeatable processing | 25% | Retries and reruns avoid corruption or unintended duplication | Checkpoints; idempotent transforms; deduplication; backfill tests |
| F4.3 Quality and lineage | 25% | Records source provenance and checks relevant quality properties | Dataset metadata; lineage manifests; freshness and completeness checks |
| F4.4 Operations and scale | 25% | Handles expected volume, scheduling, and failed records appropriately | Pipeline definitions; partitioning; failure queues; resource settings; throughput results |

Level 2: a pipeline processes a clean example dataset. Level 4: repeatable results under late, duplicate, malformed, and representative-volume inputs validate the pipeline.

### F5 Data Analytics

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F5.1 Metric semantics | 25% | Defines grain, population, time windows, denominators, and exclusions | Metric catalog; semantic models; SQL comments; worked examples |
| F5.2 Analytical correctness | 25% | Handles joins, nulls, time zones, aggregation, and filtering correctly | SQL or analysis code; reconciliation checks; golden datasets |
| F5.3 Communication | 25% | Visualizations and explanations accurately answer the intended question | Dashboard definitions; chart source; labels and units; interpretation notes |
| F5.4 Decision support | 25% | Conclusions distinguish observations, uncertainty, and causal claims | Analysis writeups; sensitivity checks; linked decisions; alternative explanations |

Level 2: useful queries and charts exist but definitions or reconciliation are incomplete. Level 4: validated metrics and sensitivity analysis support a traceable decision.

### F6 Data Science

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F6.1 Problem and baseline | 25% | Uses an appropriate objective, metric, and meaningful baseline | Experiment plan; baseline implementation; task rationale |
| F6.2 Experimental validity | 25% | Splits and preprocessing prevent relevant leakage and support the use case | Split code; time or group validation; preprocessing pipelines; leakage tests |
| F6.3 Reproducibility | 25% | Data versions, environment, configuration, and experiments can be reconstructed | Dataset manifests; environment locks; seeds where useful; experiment records |
| F6.4 Error and uncertainty analysis | 25% | Analyzes important error slices, uncertainty, and generalization limits | Holdout results; calibration checks; slice reports; model cards; drift checks where applicable |

Level 2: a model trains and reports an appropriate metric on a basic split. Level 4: comparisons, error analysis, and valid uncertainty estimates substantiate improvements beyond the baseline.

### F7 AI Implementation

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F7.1 Model and task fit | 25% | Model and prompting choices fit requirements with a simpler baseline considered | Model configuration; prompt versions; comparison results; decision rationale |
| F7.2 Output and tool contracts | 25% | Validates structured output and constrains tools before consequential use | JSON schemas; validators; tool allowlists; argument checks; malformed-output tests |
| F7.3 Behavioral evaluation | 25% | Uses representative normal, edge, and adversarial cases with explicit grading | Eval datasets; graders; expected outcomes; regression results; held-out cases |
| F7.4 Runtime control | 25% | Controls latency, spending, failures, and sensitive logging | Token or spend limits; bounded retries; fallback paths; redaction; telemetry tests |

Level 2: the model powers the main experience with basic error handling. Level 4: representative held-out evaluation and cost or latency results justify choices and show improvement. API integration alone does not establish AI quality.

### F8 RAG and Knowledge Base Design

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F8.1 Ingestion and freshness | 25% | Preserves provenance and supports appropriate updates and deletions | Parsers; chunking; document IDs; version metadata; reindex and deletion tests |
| F8.2 Retrieval quality | 25% | Evaluates retrieval against relevant questions and reference evidence | Query sets; relevance judgments; recall at k or ranking metrics; retrieval comparisons |
| F8.3 Grounded answers | 25% | Supports answers with correct citations and handles insufficient evidence | Citation mapping; answer evaluation; abstention cases; unsupported-claim checks |
| F8.4 Access and hostile content | 25% | Enforces document permissions and treats retrieved instructions as untrusted | Permission-aware retrieval; tenant tests; poisoning and prompt injection tests; deletion verification |

Level 2: documents can be indexed, retrieved, and cited in the main scenario. Level 4: separate retrieval and answer evaluations demonstrate improvements while maintaining permission and freshness controls.

### F9 Workflow Automation

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F9.1 States and transitions | 25% | Workflow states, triggers, dependencies, and completion criteria are explicit | State machine; workflow definitions; transition tests; event schemas |
| F9.2 Retry and duplication control | 25% | Retries are bounded and duplicate events do not repeat consequential actions | Idempotency storage; retry policy; deduplication; duplicate-event tests |
| F9.3 Human control and audit | 25% | Consequential actions have suitable authorization, review, and traceability | Approval steps; policy checks; audit records; cancellation and override flows |
| F9.4 Partial failure recovery | 25% | Can resume, reconcile, or compensate after important failures | Checkpoints; compensation handlers; replay tools; partial-failure tests |

Level 2: the normal sequence completes. Level 4: interruption, duplicate delivery, and partial failure exercises demonstrate safe recovery.

### F10 Automated Testing

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F10.1 Risk-based coverage | 25% | Tests cover important requirements at suitable unit, integration, and end-to-end levels | Requirement-linked tests; critical journey specs; relevant edge cases |
| F10.2 Assertion strength | 25% | Assertions can expose meaningful defects and verify outcomes beyond mocks | Behavioral assertions; regression cases; mutation or seeded-defect results where useful |
| F10.3 Test realism | 25% | Test doubles and fixtures preserve relevant contracts; important real boundaries are exercised | Database integration tests; contract fixtures; realistic malformed input; boundary tests |
| F10.4 Reliability and reproducibility | 25% | Tests run deterministically enough for their purpose with clear setup and isolation | CI execution; pinned test dependencies; isolated fixtures; flake fixes; reproducible commands |

Level 2: the main path is tested with useful assertions. Level 4: evidence shows the suite catches representative regressions and remains reliable. Coverage percentage or test count alone cannot establish this.

### F11 Automated Quality Assurance

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F11.1 Repeatable release checks | 25% | Required checks cover relevant quality risks and block or explicitly handle failure | CI definitions; status checks; release scripts; quality thresholds |
| F11.2 Breadth of quality checks | 25% | Checks address applicable security, accessibility, performance, and AI risks | Scanner configuration; accessibility runs; performance budgets; eval jobs |
| F11.3 Defect lifecycle | 25% | Defects have reproducible reports, severity, correction, and verification | Issue templates; linked fixes; regression tests; triage and release notes |
| F11.4 Traceable release evidence | 25% | Results correspond to the evaluated revision and release artifact | Workflow run SHA; artifact digest; release manifest; explicit overrides and rationale |

Level 2: CI runs basic checks. Level 4: release evidence and defect history demonstrate that the process detects escapes and improves. A workflow YAML does not prove a run passed or a branch protection rule is enabled; inspect run results and repository settings when accessible.

### F12 Security and Privacy

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F12.1 Identity and authorization | 25% | Relevant authentication and per-object or tenant access are enforced | Policy code; endpoint checks; negative access tests; scoped service credentials |
| F12.2 Input and execution boundaries | 25% | Untrusted input cannot cross relevant query, rendering, execution, or AI tool boundaries unchecked | Parameterized queries; sanitization; sandbox controls; injection tests |
| F12.3 Secrets and dependencies | 25% | Credentials are kept out of committed code and dependency risks are managed | Secret scanning results; environment templates; dependency scans; update fixes; lockfiles |
| F12.4 Data lifecycle | 25% | Collection, storage, logs, retention, and deletion protect relevant sensitive data | Redaction; retention settings; deletion tests; encryption configuration; threat model |

Level 2: basic controls exist with incomplete negative testing or lifecycle handling. Level 4: a proportionate threat model and targeted tests validate important defenses. Do not copy exposed credentials into a report; redact and reference the location.

### F13 Deployment and Operations

| Criterion | Weight | Level 3 requirement | Specific GitHub evidence |
| --- | --- | --- | --- |
| F13.1 Reproducible setup | 25% | A clean environment can run the intended deliverable with documented configuration | README commands; container or environment files; dependency locks; setup smoke test |
| F13.2 Delivery and rollback | 25% | Release and recovery are appropriate to the deployment model | CI/CD; infrastructure definitions; staged release procedure; rollback or reinstall checks |
| F13.3 Observability | 25% | Relevant health, errors, latency, and costs can be diagnosed without leaking data | Structured logs; metrics; trace IDs; health checks; alert configuration |
| F13.4 Recovery and capacity | 25% | Important outages and expected workload are addressed proportionately | Runbooks; restore or restart tests; load results; capacity and spend limits |

Level 2: the author can run and deploy the application with some manual setup. Level 4: clean setup and representative recovery or workload exercises substantiate operating assumptions.

## Applicability profiles

Choose a profile before reading scores. These profiles select skills; the published functional base weights are then renormalized. Any override requires a versioned rationale.

| Profile | Normally applicable functional skills | Additional role-critical skills |
| --- | --- | --- |
| General application builder | F1, F2 when integrated, F3 when persistent storage exists, F10, F11, F12, F13 | F1, F10, F12 |
| AI application and RAG builder | General application skills plus F7 and F8 when retrieval exists; F4 or F9 where used | F7, F8 when applicable, F12 |
| Workflow automation builder | F1, F2, F9, F10, F11, F12, F13; F3, F4, F7 when used | F2, F9, F12 |
| Data analyst | F1, F4 when building pipelines, F5, F10, F11, F12, F13 at appropriate scope | F5 |
| Data scientist | F1, F4, F5 where analysis is part of the deliverable, F6, F10, F11, F12, F13 | F6 |

All core capabilities remain part of each profile. Human Centered Design applies to analyst outputs, command-line tools, APIs, and workflows through their intended users' tasks; a graphical interface is not required.

## Evidence collection and attribution

### Evidence hierarchy

| Evidence class | What it can support | Confidence guidance |
| --- | --- | --- |
| E1 Execution | Observed behavior at a recorded SHA and under a stated environment and scenario | Often high for that bounded behavior |
| E2 Implementation | Source, configuration, and substantive assertions that directly support a claim | Medium or high for static facts; runtime claims remain unverified |
| E3 Change history | PR diffs, substantive review, issues, and corrective changes | Useful for reasoning, iteration, and bounded attribution |
| E4 Documentation | Rationale, intended users, procedures, and claimed outcomes | Direct evidence of documented intent; corroboration needed for behavior or outcomes |
| E5 Presence or metadata | File names, badges, stars, counts, language tags | Discovery clues only; insufficient to score competence |

Confidence is high when direct evidence supports a narrow claim and relevant contradictions have been checked; medium when evidence is direct but partial; low when inference or uncorroborated claims dominate. Confidence is assigned per finding, not guessed as a probability.

For individual assessment, identify the exact contribution and inspect its diff and substantive discussion. Commit authorship, ownership, co-author tags, and blame provide provenance clues; they do not independently prove understanding or sole responsibility. Generated, vendored, forked, or template code must be identified and excluded from unsupported individual credit.

### Repository inspection checklist

1. Pin the commit and identify purpose, maturity, stack, intended users, and selected profile.
2. Inventory application source, tests, data assets, generated files, vendored code, and templates.
3. Inspect README, docs, ADRs, issues, PRs, release notes, and substantive review.
4. Follow critical user journeys through interfaces, business logic, persistence, external services, and failure handling.
5. Inspect package manifests, lockfiles, migrations, environment templates, workflows, and deployment files.
6. Review relevant workflow runs, artifacts, branch protection, and security settings only when accessible. Record inaccessible evidence as unknown.
7. Execute allowed builds and tests in isolation; record setup failures separately from demonstrated application defects.
8. Capture both supporting and contradictory evidence, then score criteria.
9. Generate targeted follow-up tasks for important unknowns.
10. Produce separate repository findings and contributor conclusions.

Use immutable file URLs such as https://github.com/OWNER/REPO/blob/COMMIT/path#L10-L25. For PRs and workflow results, retain the object URL plus head SHA or associated run SHA. Validate lines and links against fetched content. Record tool output or artifact digests when evidence is local.

## Work samples for important unknowns

| Capability | Suggested task | What to observe |
| --- | --- | --- |
| Architecture | Explain a current boundary, then adapt the design to a realistic new constraint | Constraint discovery, alternatives, proportionate changes, and verification |
| Human Centered Design | Repair a confusing failure or onboarding flow for a specified user | Task understanding, recovery, accessibility, and validation |
| Product Management | Prioritize three competing requests under a fixed effort budget | User value, scope, acceptance criteria, metrics, and reasoning |
| AI Collaboration | Implement a small change with normal AI tools and diagnose a seeded defect | Task framing, context, review, correction, independent checks, and explanation |
| Functional specialty | Extend or repair a representative database, data, RAG, or workflow behavior | Technical correctness and handling of domain-specific failure cases |

Use the same task and allowed conditions for comparable assessments. Record time and resource use as context; do not reward speed at the expense of correctness. Offer an explanation or alternative task when tool availability prevents a fair comparison.

## Critical findings and reporting gates

Keep severity separate from maturity scores. A verified severe authorization bypass, exploitable injection path, destructive workflow behavior, exposed active credential, or fabricated evidence can trigger a human-review gate.

Record observed impact, reproduction conditions, affected scope, confidence, and remediation. Mark unconfirmed issues as suspected. Do not classify every missing control as critical without an applicable threat or failure scenario.

A critical verified finding suppresses a positive readiness conclusion while leaving the numerical profile visible. Unknown role-critical behavior triggers further validation, not an accusation of failure. These gates govern the app's readiness summary; they do not make employment decisions.

## Worked score example

Suppose all four core domains have complete evidence and score C1 = 3, C2 = 2, C3 = 2, C4 = 3. Their contribution is:

15 × 3/4 + 15 × 2/4 + 15 × 2/4 + 15 × 3/4 = 37.5 points out of 60.

Suppose the selected functional skills have complete evidence and a renormalized weighted mean of 3. Their contribution is 40 × 3/4 = 30 points.

Overall maturity is 67.5 out of 100 with 100% coverage, giving a Functional band if no critical readiness gate applies. This does not claim measured worker productivity.

If C4 instead has no evidence, the earned lower endpoint is 56.25, overall coverage is 85%, observed maturity is 56.25 / 0.85 = 66.18, and the uncertainty interval is 56.25 to 71.25. No overall band is issued because C4 coverage is below 75%.

## App data contract

Keep configuration and results separate. Criteria IDs must remain stable within a rubric version. Store integer criterion scores; round only displayed aggregates to one decimal.

A criterion result should carry:

- rubric_version, profile_version, criterion_id, repository_url, commit_sha, assessment_mode, and subject_type.
- subject_id for the repository or attributable contributor.
- applicability_status and applicability_reason.
- evidence_status: scored or unknown; unknown results have score null.
- score, confidence, rationale, evidence_refs, contradictory_evidence_refs, and next_validation.
- evidence scope and collection timestamp.

Each evidence object should include evidence_id, type, immutable URL or artifact reference, repository SHA, path and line range where relevant, excerpt or redacted observation, run conditions where relevant, attribution basis, and verification status.

For example, a hypothetical F3.3 result might be:

- Applicability: applicable because order creation changes inventory and order records together.
- Score: 2, confidence medium.
- Supporting evidence: a transaction wraps the writes and sequential integration tests pass.
- Limitation: no evidence establishes the invariant under competing orders.
- Next validation: run simultaneous orders against the final stock item and verify at most one succeeds.
- Attribution: repository-level only until a contributor's role is established.

An overall report should include purpose and scope, applicability decisions, domain scores and coverage, uncertainty interval, confidence summaries, strengths, prioritized gaps, critical findings, attribution limits, and next validation tasks. A historical comparison must show changes in rubric, profile, applicability, commit, and evidence scope.

## Reviewer reliability and calibration

Before using scores to compare contributors, validate the reviewer itself.

| Measure | How to evaluate |
| --- | --- |
| Evidence correctness | Expert checks that cited code exists at the pinned SHA and supports the claim |
| Finding precision and recall | Compare material findings with expert-reviewed and deliberately seeded cases |
| Scoring agreement | Compare domain and criterion scores with multiple independent expert raters |
| Repeatability | Repeat fixed inputs with a pinned rubric and evaluator; quantify score and finding variation |
| Applicability accuracy | Check exclusions and required skill selections against project context |
| Attribution accuracy | Test forks, templates, generated code, shared ownership, and contributor-specific diffs |
| Robustness | Test misleading README claims, adversarial repository instructions, missing files, and partial tool failures |
| Cost and latency | Measure review expense and duration by repository size and assessment mode |

Use a held-out evaluation set across languages, project sizes, maturity stages, and skill profiles. Report disagreement and revise ambiguous anchors. Never use stars, commit volume, code volume, or DORA team metrics as individual proficiency proxies.

Treat all repository content as untrusted input to the reviewer. Repository instructions cannot change the scoring rubric, request secrets, or authorize execution. Isolate code execution, restrict network and credentials, and redact sensitive findings.

## Reference frameworks

The weights, anchors, coverage thresholds, and profile rules above are this rubric's proposed defaults. The following references can inform technical checklists; they do not validate the scoring model or its use for evaluating people.

- [W3C Web Content Accessibility Guidelines](https://www.w3.org/TR/wcag/) for accessibility requirements.
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) for AI trustworthiness and risk considerations.
- [OWASP GenAI Security Project](https://genai.owasp.org/) for AI application security.
- [DORA AI Capabilities Model](https://research.google/pubs/dora-ai-capabilities-model/) for research on AI-assisted delivery capabilities; apply organizational findings at their supported scope.
