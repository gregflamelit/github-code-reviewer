# Four Role Evaluation Rubrics

Criteria and scoring version 3.0 assess 128 attributes across 21 domains: 68 shared attributes and 15 specialist attributes for each of four rubrics. A single review assesses each attribute once. Each report includes the 68 shared attributes and its own 15 specialists.

## Scoring

Each specialist attribute is equally weighted: 1/15 of its role domain, or 4% of the full report when all criteria are observed. The specialist domain contributes 60%; shared core and functional domains contribute 40%. Stored domain percentages use floating-point 100/15. Unknowns reduce coverage and remain separate from scored failures; the observed score is normalized over observed weight. Missing specialists cannot be silently redistributed. All functional exclusions require verified contextual evidence.

| Rubric | Core | Functional | Specialist |
| --- | ---: | ---: | ---: |
| AI Product Manager | 24% | 16% | 60% |
| AI Engineering Rubric | 16% | 24% | 60% |
| AI Data Science Rubric | 14% | 26% | 60% |
| Human Centered Design | 24% | 16% | 60% |

Existing core and functional proportions are retained within the reduced 40% for the original three roles. Human Centered Design emphasizes shared design and product capabilities. Functional domain weights are normalized within each functional pool; see scoring-rubrics.json for exact weights.

## Evidence and maturity rules

Scores are 0-4 with exact verified excerpts. Score 0 requires demonstrated failure; 2 is functional but incomplete; 3 requires robust implementation; 4 requires validated effectiveness. Unknown is not zero. Documentation, issue claims, approvals, and test source do not establish executed behavior or measured outcomes. An overall band requires at least 80% weighted coverage and at least 75% coverage in each core and role-critical domain. A high overall score cannot conceal weak required domains. Weights remain defaults pending calibration.

## Historical reports and upgrades

Saved reports retain their captured catalog and scores. Criteria 1.0/scoring 1.1 and criteria/scoring 2.0 are archived under rubric-versions/. Retrying uses the saved snapshot. Upgrade creates a new review using the same evidence and reuses assessments only when criterion semantics match; weight-only changes do not require repeating compatible assessments. New specialist attributes are assessed, and scoring 3.0 produces four reports. Fresh evidence requires a separate re-evaluation.

## Complete skills and scoring anchors

### C1 Solutions Architecture

#### C1.1 Requirements and constraints

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Architecture addresses stated users, data, scale, cost, latency, and risk constraints that matter to the project
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: README scope; linked requirement issues; docs/requirements; architecture decision records; implementation matching the stated constraints

#### C1.2 Boundaries and contracts

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Components have clear responsibilities; dependencies and interfaces support the intended changes
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: src modules; package boundaries; API schemas; dependency manifests; architecture diagrams reconciled with imports and calls

#### C1.3 Failure and data flow design

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Important failure paths, consistency needs, and trust boundaries have explicit handling
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Sequence diagrams; queue consumers; transaction boundaries; timeout and recovery code; failure tests

#### C1.4 Tradeoffs and evolution

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Choices are proportionate and alternatives, cost implications, and likely changes are addressed
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: docs/adr; PR rationale; benchmarks; migration plans; dependency replacement or refactoring history

### C2 Human Centered Design

#### C2.1 User and task understanding

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Identifies intended users, their goals, and meaningful workflow constraints
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Personas grounded in research; user stories; problem issues; interview summaries; CLI task examples

#### C2.2 Interaction and feedback

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Main journeys provide clear navigation or commands, useful status, and actionable errors
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: UI components; command help; validation messages; loading, empty, and error states; journey tests

#### C2.3 Accessibility and inclusion

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Supports relevant keyboard, semantic, visual, language, and assistive interaction needs
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Semantic markup; labels and focus handling; accessible components; accessibility test reports; manual test notes

#### C2.4 Recovery and user control

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Users can understand consequential actions, correct mistakes, and recover from relevant failures
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Confirmation and undo flows; preserved input; cancellation; AI citations or uncertainty where relevant; recovery tests

### C3 Product Management

#### C3.1 Problem and value

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Clearly defines the user problem, intended outcome, and meaningful constraints
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: README problem statement; product brief; issue descriptions; documented user feedback

#### C3.2 Prioritization and scope

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Scope addresses the main user outcome and handles dependencies and exclusions coherently
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Milestones; roadmap; issue priorities with rationale; deliberately deferred features; coherent release contents

#### C3.3 Acceptance and success measures

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Important features have testable acceptance criteria and appropriate outcome measures
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Issue checklists; behavior specifications; acceptance tests; event schemas; metric definitions

#### C3.4 Feedback and iteration

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Changes respond to credible feedback or measured behavior and document the resulting decision
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Linked issues and PRs; release notes; experiment results; defect follow-up; changes tied to feedback

### C4 AI Collaboration and Verification

#### C4.1 Task decomposition and context

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): AI-assisted tasks have usable goals, constraints, interfaces, and completion checks
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Attributable task briefs; agent instructions; linked issue specifications; redacted session artifacts

#### C4.2 Review and technical ownership

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Contributor can explain material decisions and identifies or corrects unsuitable AI output
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Substantive PR review; corrective diffs with rationale; work-sample explanation and modification

#### C4.3 Independent verification

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Uses checks that can expose mistakes rather than accepting the AI's own claim of correctness
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Independently specified acceptance tests; regression cases; reproducible commands and outputs; code-to-requirement trace

#### C4.4 Safe and efficient delegation

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Delegates with appropriate permissions, data boundaries, checkpoints, and resource limits
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Tool permission configuration; approval rules; scoped workflows; documented budget limits; attributable execution traces

### F1 Software Development

#### F1.1 Correctness

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Implements required behavior and important boundary conditions
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Source logic; acceptance tests; bug fixes; reproducible examples

#### F1.2 Maintainability

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Responsibilities, naming, and abstractions make likely changes understandable
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Module structure; refactoring diffs; interfaces; substantive code review

#### F1.3 Error and resource handling

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Handles errors and manages connections, files, memory, and asynchronous work appropriately
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Error paths; cleanup; cancellation; concurrency controls; associated tests

#### F1.4 Dependencies and contracts

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Dependencies and types or schemas are intentional, compatible, and reproducible
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Lockfiles; dependency manifests; type checks; runtime validators; compatibility CI

### F2 API and Integration Design

#### F2.1 Contract clarity

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Inputs, outputs, errors, and compatibility are explicit
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: OpenAPI or equivalent; schemas; SDK types; contract tests

#### F2.2 Access boundaries

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Authentication and object-level authorization protect relevant operations
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Middleware; policy checks; tenant filters; negative access tests

#### F2.3 Resilience

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Relevant timeouts, rate limits, retries, and failure fallbacks are bounded
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Client configuration; backoff logic; retry limits; mocked outage tests

#### F2.4 Consistency and evolution

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Handles pagination, duplicate requests, partial results, and changes where relevant
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Idempotency keys; webhook deduplication; pagination tests; version or compatibility strategy

### F3 Database Design

#### F3.1 Schema and integrity

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Schema fits access patterns and protects required invariants
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: DDL; ORM models; foreign keys; unique and check constraints; schema tests

#### F3.2 Query design

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Important queries and indexes are appropriate to expected usage
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Query source; index migrations; explain plans; representative query tests

#### F3.3 Transactions and concurrency

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Multi-step writes preserve relevant invariants under concurrent access
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Transactions; isolation choices; locking or optimistic concurrency; race tests

#### F3.4 Lifecycle and recovery

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Schema changes, retention, and recovery match the project's needs
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Versioned migrations; upgrade tests; backup and restore procedures; deletion jobs

### F4 Data Engineering

#### F4.1 Ingestion contracts

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Validates schemas and handles missing, malformed, and changing inputs
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Ingestion code; data contracts; validation fixtures; schema evolution tests

#### F4.2 Repeatable processing

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Retries and reruns avoid corruption or unintended duplication
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Checkpoints; idempotent transforms; deduplication; backfill tests

#### F4.3 Quality and lineage

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Records source provenance and checks relevant quality properties
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Dataset metadata; lineage manifests; freshness and completeness checks

#### F4.4 Operations and scale

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Handles expected volume, scheduling, and failed records appropriately
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Pipeline definitions; partitioning; failure queues; resource settings; throughput results

### F5 Data Analytics

#### F5.1 Metric semantics

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Defines grain, population, time windows, denominators, and exclusions
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Metric catalog; semantic models; SQL comments; worked examples

#### F5.2 Analytical correctness

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Handles joins, nulls, time zones, aggregation, and filtering correctly
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: SQL or analysis code; reconciliation checks; golden datasets

#### F5.3 Communication

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Visualizations and explanations accurately answer the intended question
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Dashboard definitions; chart source; labels and units; interpretation notes

#### F5.4 Decision support

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Conclusions distinguish observations, uncertainty, and causal claims
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Analysis writeups; sensitivity checks; linked decisions; alternative explanations

### F6 Data Science

#### F6.1 Problem and baseline

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Uses an appropriate objective, metric, and meaningful baseline
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Experiment plan; baseline implementation; task rationale

#### F6.2 Experimental validity

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Splits and preprocessing prevent relevant leakage and support the use case
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Split code; time or group validation; preprocessing pipelines; leakage tests

#### F6.3 Reproducibility

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Data versions, environment, configuration, and experiments can be reconstructed
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Dataset manifests; environment locks; seeds where useful; experiment records

#### F6.4 Error and uncertainty analysis

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Analyzes important error slices, uncertainty, and generalization limits
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Holdout results; calibration checks; slice reports; model cards; drift checks where applicable

### F7 AI Implementation

#### F7.1 Model and task fit

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Model and prompting choices fit requirements with a simpler baseline considered
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Model configuration; prompt versions; comparison results; decision rationale

#### F7.2 Output and tool contracts

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Validates structured output and constrains tools before consequential use
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: JSON schemas; validators; tool allowlists; argument checks; malformed-output tests

#### F7.3 Behavioral evaluation

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Uses representative normal, edge, and adversarial cases with explicit grading
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Eval datasets; graders; expected outcomes; regression results; held-out cases

#### F7.4 Runtime control

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Controls latency, spending, failures, and sensitive logging
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Token or spend limits; bounded retries; fallback paths; redaction; telemetry tests

### F8 RAG and Knowledge Base Design

#### F8.1 Ingestion and freshness

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Preserves provenance and supports appropriate updates and deletions
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Parsers; chunking; document IDs; version metadata; reindex and deletion tests

#### F8.2 Retrieval quality

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Evaluates retrieval against relevant questions and reference evidence
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Query sets; relevance judgments; recall at k or ranking metrics; retrieval comparisons

#### F8.3 Grounded answers

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Supports answers with correct citations and handles insufficient evidence
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Citation mapping; answer evaluation; abstention cases; unsupported-claim checks

#### F8.4 Access and hostile content

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Enforces document permissions and treats retrieved instructions as untrusted
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Permission-aware retrieval; tenant tests; poisoning and prompt injection tests; deletion verification

### F9 Workflow Automation

#### F9.1 States and transitions

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Workflow states, triggers, dependencies, and completion criteria are explicit
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: State machine; workflow definitions; transition tests; event schemas

#### F9.2 Retry and duplication control

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Retries are bounded and duplicate events do not repeat consequential actions
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Idempotency storage; retry policy; deduplication; duplicate-event tests

#### F9.3 Human control and audit

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Consequential actions have suitable authorization, review, and traceability
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Approval steps; policy checks; audit records; cancellation and override flows

#### F9.4 Partial failure recovery

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Can resume, reconcile, or compensate after important failures
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Checkpoints; compensation handlers; replay tools; partial-failure tests

### F10 Automated Testing

#### F10.1 Risk-based coverage

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Tests cover important requirements at suitable unit, integration, and end-to-end levels
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Requirement-linked tests; critical journey specs; relevant edge cases

#### F10.2 Assertion strength

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Assertions can expose meaningful defects and verify outcomes beyond mocks
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Behavioral assertions; regression cases; mutation or seeded-defect results where useful

#### F10.3 Test realism

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Test doubles and fixtures preserve relevant contracts; important real boundaries are exercised
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Database integration tests; contract fixtures; realistic malformed input; boundary tests

#### F10.4 Reliability and reproducibility

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Tests run deterministically enough for their purpose with clear setup and isolation
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: CI execution; pinned test dependencies; isolated fixtures; flake fixes; reproducible commands

### F11 Automated Quality Assurance

#### F11.1 Repeatable release checks

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Required checks cover relevant quality risks and block or explicitly handle failure
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: CI definitions; status checks; release scripts; quality thresholds

#### F11.2 Breadth of quality checks

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Checks address applicable security, accessibility, performance, and AI risks
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Scanner configuration; accessibility runs; performance budgets; eval jobs

#### F11.3 Defect lifecycle

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Defects have reproducible reports, severity, correction, and verification
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Issue templates; linked fixes; regression tests; triage and release notes

#### F11.4 Traceable release evidence

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Results correspond to the evaluated revision and release artifact
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Workflow run SHA; artifact digest; release manifest; explicit overrides and rationale

### F12 Security and Privacy

#### F12.1 Identity and authorization

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Relevant authentication and per-object or tenant access are enforced
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Policy code; endpoint checks; negative access tests; scoped service credentials

#### F12.2 Input and execution boundaries

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Untrusted input cannot cross relevant query, rendering, execution, or AI tool boundaries unchecked
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Parameterized queries; sanitization; sandbox controls; injection tests

#### F12.3 Secrets and dependencies

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Credentials are kept out of committed code and dependency risks are managed
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Secret scanning results; environment templates; dependency scans; update fixes; lockfiles

#### F12.4 Data lifecycle

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Collection, storage, logs, retention, and deletion protect relevant sensitive data
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Redaction; retention settings; deletion tests; encryption configuration; threat model

### F13 Deployment and Operations

#### F13.1 Reproducible setup

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): A clean environment can run the intended deliverable with documented configuration
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: README commands; container or environment files; dependency locks; setup smoke test

#### F13.2 Delivery and rollback

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Release and recovery are appropriate to the deployment model
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: CI/CD; infrastructure definitions; staged release procedure; rollback or reinstall checks

#### F13.3 Observability

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Relevant health, errors, latency, and costs can be diagnosed without leaking data
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Structured logs; metrics; trace IDs; health checks; alert configuration

#### F13.4 Recovery and capacity

- Functional (2): Applicable implementation is functional but incomplete.
- Robust (3): Important outages and expected workload are addressed proportionately
- Validated (4): Relevant independent validation demonstrates effectiveness.
- GitHub evidence: Runbooks; restore or restart tests; load results; capacity and spend limits

### R1 Product Outcomes Discovery and Adoption

#### R1.1 Outcome definitions

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Connects user problems to explicit outcome metrics with a population, baseline, target, and decision rule.
- Validated (4): Outcome-linked changes are followed by measured results with relevant confounders disclosed.
- GitHub evidence: Metric definitions; product briefs; analytics event contracts; baseline reports

#### R1.2 Outcome validation

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Separates shipped features from demonstrated user or business outcomes and checks whether changes met their stated goal.
- Validated (4): Repeated iterations show validated improvements and documented decisions when a hypothesis fails.
- GitHub evidence: Experiment reports; feedback-linked PRs; before-and-after analyses; acceptance results

#### R1.3 Unit economics

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Models relevant inference, infrastructure, support, and human-review costs against expected usage and value.
- Validated (4): Representative usage validates sensitivity to volume, failure, and model choice with measured tradeoffs.
- GitHub evidence: Cost models; token budgets; operating-cost benchmarks; pricing assumptions

#### R1.4 Value and prioritization

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Prioritizes alternatives using user value, effort, risk, dependencies, and explicit scope boundaries.
- Validated (4): Observed results inform subsequent prioritization and demonstrate adjustment of an unsuccessful choice.
- GitHub evidence: Prioritized issues; roadmap rationale; scope exclusions; release decisions

#### R1.5 Research design

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Uses a research question, appropriate participant or user context, and a repeatable protocol instead of unsupported personas.
- Validated (4): Research triangulates independent sources and documents limitations and changes caused by findings.
- GitHub evidence: Research plans; interview guides; anonymized findings; participant context

#### R1.6 Experiment validity

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Defines a hypothesis, success and guardrail metrics, comparison method, and stopping or decision rules appropriate to the project.
- Validated (4): Experiment results support a justified decision and address material bias or uncertainty.
- GitHub evidence: Experiment plans; split assignment code; guardrail definitions; decision records

#### R1.7 Alternatives and usability

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Compares relevant solution alternatives and validates critical journeys for the intended users, including failure recovery.
- Validated (4): Representative user evidence demonstrates improvement over an alternative with remaining limitations recorded.
- GitHub evidence: Prototype comparisons; usability tasks; accessibility notes; tested design iterations

#### R1.8 Feedback traceability

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Traces credible feedback through a product decision, acceptance criteria, implementation, and verification.
- Validated (4): A complete feedback-to-outcome cycle shows what improved and what did not.
- GitHub evidence: Linked issues and PRs; acceptance tests; release notes; feedback summaries

#### R1.9 Adoption and onboarding

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Defines and supports activation steps, required setup, user understanding, and relevant adoption measures.
- Validated (4): Representative onboarding evidence validates a reduction in friction or successful activation.
- GitHub evidence: Onboarding flows; activation metric definitions; setup tests; abandonment fixes

#### R1.10 Workflow and change management

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Fits the product into real task sequences with appropriate human handoffs, role responsibilities, and rollout plans.
- Validated (4): Observed workflow use validates handoffs and documents correction of adoption or coordination failures.
- GitHub evidence: User journeys; integration plans; handoff contracts; rollout documentation

#### R1.11 Support and recovery

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Provides actionable support guidance, escalation, recovery, and feedback paths for important user failures.
- Validated (4): Support or failure evidence validates faster recovery and feeds improvements back into the product.
- GitHub evidence: Help content; support runbooks; issue templates; recovery flows; incident follow-up

#### R1.12 Responsible product decisions

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Makes consequential AI behavior understandable and provides proportionate user control, privacy boundaries, and escalation.
- Validated (4): User or adversarial evaluations validate the controls and document unresolved tradeoffs.
- GitHub evidence: AI disclosure and uncertainty UI; consent or retention design; override flows; risk decisions

#### R1.13 Stakeholder alignment and decision rights

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Documents stakeholder needs, conflicting constraints, decision owners, and an actionable escalation process.
- Validated (4): Decision records and follow-up outcomes demonstrate effective resolution of material stakeholder conflicts.
- GitHub evidence: Stakeholder maps; decision records; issue discussions; scope approvals

#### R1.14 Roadmap and dependency management

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Sequences outcomes and milestones against explicit dependencies, risks, capacity, and learning needs.
- Validated (4): Delivery and feedback records show roadmap adjustments based on measured progress and dependency changes.
- GitHub evidence: Roadmaps; milestones; dependency issues; release retrospectives

#### R1.15 Product instrumentation and metric integrity

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Implements outcome-linked events and metrics with clear definitions, collection boundaries, and quality checks.
- Validated (4): Reconciled event data and decision records demonstrate trustworthy measurement and meaningful product decisions.
- GitHub evidence: Event schemas; analytics tests; tracking plans; metric reconciliation reports

### R2 Engineering Reliability and Change Safety

#### R2.1 Concurrency invariants

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Identifies shared-state invariants and enforces them under concurrent operations where concurrency is relevant.
- Validated (4): Representative concurrent execution validates invariants and exposes regression cases.
- GitHub evidence: Transaction and locking code; optimistic concurrency; race tests; invariant specifications

#### R2.2 Idempotency and duplicate delivery

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Prevents repeated consequential effects during retries or duplicate events using durable appropriate deduplication.
- Validated (4): Duplicate and interrupted-delivery exercises validate durable behavior across restarts.
- GitHub evidence: Idempotency keys; unique constraints; replay tests; webhook consumers

#### R2.3 Ordering and consistency

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Defines relevant ordering, stale-read, conflict, and consistency behavior across components or writes.
- Validated (4): Out-of-order and conflicting operations are tested and support the documented consistency choice.
- GitHub evidence: Ordering contracts; version checks; consistency ADRs; conflict tests

#### R2.4 Partial failure and compensation

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Handles important partial successes through reconciliation, compensation, checkpointing, or safely repeatable recovery.
- Validated (4): Fault injection or recorded incidents validate recovery without corrupting state or duplicating actions.
- GitHub evidence: Compensation handlers; checkpoints; dead-letter handling; reconciliation tests

#### R2.5 Reliability objectives

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Defines proportionate availability, latency, correctness, or recovery objectives tied to user-impacting workflows.
- Validated (4): Representative operational or exercise results demonstrate objectives and justify tradeoffs.
- GitHub evidence: Service objectives; performance budgets; health checks; recovery targets

#### R2.6 Representative load testing

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Uses realistic workloads, data volumes, concurrency, and acceptance thresholds for important performance assumptions.
- Validated (4): Repeated measurements identify bottlenecks and validate a documented improvement.
- GitHub evidence: Load scripts; workload models; benchmark environments; threshold checks

#### R2.7 Observability and diagnosis

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Provides actionable structured logs, correlation, relevant metrics, and failure signals without exposing sensitive data.
- Validated (4): A representative failure is detected and diagnosed using those signals with demonstrated remediation.
- GitHub evidence: Trace propagation; log redaction; metric definitions; alert rules; diagnostic tests

#### R2.8 Recovery and rollback verification

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Defines and verifies proportionate restore, restart, migration recovery, or rollback procedures.
- Validated (4): Exercises or incidents demonstrate recovery within stated objectives and update procedures.
- GitHub evidence: Runbooks; restore drills; rollback tests; restart checks; migration recovery

#### R2.9 Dependency provenance

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Controls relevant dependency sources, versions, integrity, and vulnerability response.
- Validated (4): Traceable remediation and verification demonstrate that a real dependency risk was resolved.
- GitHub evidence: Lockfiles; integrity checks; dependency scans; update PRs; provenance records

#### R2.10 Reproducible artifacts

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Can reconstruct the delivered artifact from a specified revision and controlled build inputs.
- Validated (4): Independent clean builds or equivalent reproducibility checks substantiate the artifact provenance.
- GitHub evidence: Build locks; artifact digests; version manifests; reproducible build checks

#### R2.11 Migration and compatibility safety

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Protects relevant stored data and consumers during schema, API, dependency, or configuration changes.
- Validated (4): Representative upgrade and rollback or forward-recovery tests validate compatibility and data integrity.
- GitHub evidence: Expand-contract migrations; upgrade fixtures; API contract tests; deprecation plans

#### R2.12 Release enforcement

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Connects required quality checks to the released revision, handles overrides explicitly, and supports safe rollout.
- Validated (4): Release or failure evidence demonstrates enforcement, traceability, and a verified correction.
- GitHub evidence: CI results at SHA; required-check settings; release manifests; staged rollout rules

#### R2.13 Performance profiling and resource efficiency

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Profiles representative workloads and addresses measured CPU, memory, I/O, or inference-cost bottlenecks within explicit budgets.
- Validated (4): Repeatable before-and-after benchmarks demonstrate sustained efficiency without correctness or reliability regressions.
- GitHub evidence: Profiling traces; benchmark scripts; resource budgets; performance regression checks

#### R2.14 Threat modeling and abuse resistance

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Identifies trust boundaries and plausible abuse cases and implements proportionate defenses and negative tests.
- Validated (4): Adversarial testing and remediation evidence validate defenses against the documented threats.
- GitHub evidence: Threat models; abuse-case tests; security reviews; remediation commits

#### R2.15 Architecture decision validation

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Records architecture alternatives, assumptions, constraints, and validation plans for consequential decisions.
- Validated (4): Experiments or operational evidence validate tradeoffs and show revisions when assumptions fail.
- GitHub evidence: Architecture decision records; prototypes; tradeoff benchmarks; operational postmortems

### R3 Statistical Validity and Scientific Reliability

#### R3.1 Statistical question and estimand

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Defines the scientific question, target population, unit of analysis, and quantity being estimated or predicted.
- Validated (4): Independent checks show the analysis answers the stated question with clearly bounded interpretation.
- GitHub evidence: Study plans; dataset documentation; analysis specifications; outcome definitions

#### R3.2 Sampling and power

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Justifies sampling or sample size and addresses relevant selection bias, representativeness, and power limits.
- Validated (4): Sensitivity or replication evidence demonstrates which conclusions remain stable under sampling limits.
- GitHub evidence: Sampling code; sample-size calculations; cohort definitions; power or sensitivity analyses

#### R3.3 Uncertainty and effect size

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Reports appropriate effect sizes and uncertainty estimates with assumptions and meaningful practical interpretation.
- Validated (4): Coverage, simulation, replication, or sensitivity analysis validates uncertainty estimates and practical significance.
- GitHub evidence: Confidence or credible intervals; bootstrap code; effect-size reports; uncertainty checks

#### R3.4 Multiple testing and causal validity

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Addresses relevant repeated testing and separates association from causal conclusions using defensible identification assumptions.
- Validated (4): Robustness checks or valid experiments support conclusions and explicitly address alternative explanations.
- GitHub evidence: Multiplicity corrections; preregistered plans; experiment assignment; causal assumptions; negative controls

#### R3.5 Temporal and group leakage

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Uses splits and validation matching deployment, preserving relevant temporal, person, entity, and group boundaries.
- Validated (4): Adversarial overlap and temporal checks validate boundaries and demonstrate realistic generalization.
- GitHub evidence: Time or grouped split code; overlap assertions; train-test manifests; leakage regression cases

#### R3.6 Preprocessing and holdout isolation

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Fits transformations and selection on training data only and preserves independent held-out evaluation.
- Validated (4): Independent reproduction or leakage tests verify selection and preprocessing never contaminate evaluation.
- GitHub evidence: Train-only pipeline fitting; nested validation; holdout access controls; split-specific fixtures

#### R3.7 Dataset and benchmark contamination

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Tracks provenance and checks relevant duplicate, source, label, or benchmark overlap that could inflate measured performance.
- Validated (4): Contamination controls are validated and results are reassessed on a demonstrably independent set.
- GitHub evidence: Dataset hashes; deduplication; overlap reports; benchmark provenance; contamination checks

#### R3.8 Label missingness and slice quality

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Examines label reliability, missing-data handling, and errors across scientifically or operationally relevant slices.
- Validated (4): Sensitivity to labels, missingness, and important slices is quantified and informs a verified correction.
- GitHub evidence: Annotation agreement; missingness analyses; imputation pipelines; slice evaluation reports

#### R3.9 Calibration and decision thresholds

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Where predictions drive decisions, validates calibration and chooses thresholds using relevant costs and error tradeoffs.
- Validated (4): Held-out or prospective evidence validates calibration and threshold usefulness under stated conditions.
- GitHub evidence: Reliability diagrams; proper scoring rules; threshold analyses; decision-cost definitions

#### R3.10 Drift and model monitoring

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Where deployed or repeatedly applied, monitors meaningful data or concept changes and defines response criteria.
- Validated (4): Simulated or observed shifts trigger the intended response and validate monitored signals.
- GitHub evidence: Drift metrics; baseline distributions; monitoring tests; retraining and escalation rules

#### R3.11 Scientific reproducibility

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Reconstructs data versions, environment, preprocessing, experiment configuration, and reported results.
- Validated (4): An independent clean rerun reproduces material conclusions within documented tolerances.
- GitHub evidence: Dataset manifests; environment locks; experiment configs; reproducible notebooks or scripts

#### R3.12 Baselines and decision usefulness

- Functional (2): The main approach is documented or implemented, but material validation, assumptions, or relevant edge cases remain incomplete.
- Robust (3): Compares suitable simple baselines and explains how model or analytical improvements affect a real decision.
- Validated (4): Held-out improvements and their decision impact are validated with limitations and unsuccessful alternatives disclosed.
- GitHub evidence: Baseline code; ablations; effect and cost comparisons; decision records; limitation reports

#### R3.13 Missing data and selection mechanisms

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Analyzes missingness and selection mechanisms and applies justified handling with clearly bounded assumptions.
- Validated (4): Sensitivity studies or independent checks show conclusions remain defensible under plausible missingness and selection mechanisms.
- GitHub evidence: Missingness audits; imputation pipelines; selection analyses; sensitivity reports

#### R3.14 Sensitivity and robustness analysis

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Tests conclusions against plausible modeling, preprocessing, parameter, and subgroup alternatives.
- Validated (4): Prespecified robustness checks or independent replication demonstrate stable conclusions and disclose material failures.
- GitHub evidence: Robustness notebooks; alternative specifications; subgroup checks; replication results

#### R3.15 Interpretability and responsible use

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Explains relevant model behavior, limitations, affected groups, and appropriate use boundaries with diagnostic evidence.
- Validated (4): Independent explanation checks, subgroup analyses, and downstream decision reviews validate responsible interpretation.
- GitHub evidence: Model cards; explanation diagnostics; fairness analyses; decision-impact reviews

### R4 Human Centered Design Practice

#### R4.1 Research planning and recruitment

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Defines research questions, intended users, recruitment criteria, methods, and ethical handling proportionate to uncertainty.
- Validated (4): Completed research with justified participants and documented limitations answers the stated questions.
- GitHub evidence: Research plans; recruitment criteria; anonymized participant summaries; research retrospectives

#### R4.2 Contextual inquiry and workflow mapping

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Maps real user tasks, environments, constraints, dependencies, and failure journeys using contextual evidence.
- Validated (4): Representative observations and follow-up checks validate workflow assumptions and consequential design changes.
- GitHub evidence: Contextual study notes; journey maps; service blueprints; workflow requirements

#### R4.3 Research synthesis and traceability

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Links observations to defensible insights, requirements, and design decisions while separating assumptions from evidence.
- Validated (4): Independent review and later validation confirm that decisions follow the evidence and address contradictory findings.
- GitHub evidence: Insight repositories; research-to-issue links; decision logs; synthesis reviews

#### R4.4 Inclusive participation and representation

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Identifies underserved user contexts and incorporates relevant language, ability, device, and access needs into research and design.
- Validated (4): Representative participation and disaggregated usability results demonstrate improvement across relevant user groups.
- GitHub evidence: Participant coverage matrices; inclusion plans; low-bandwidth designs; subgroup usability reports

#### R4.5 Information architecture and findability

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Organizes content, labels, navigation, and search around user mental models and task needs.
- Validated (4): Tree tests, findability studies, or navigation measurements validate successful information discovery.
- GitHub evidence: Content inventories; navigation structures; card sorts; tree-test results

#### R4.6 Interaction design and task flows

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Implements understandable task flows with consistent state, feedback, clear affordances, and proportionate user control.
- Validated (4): Representative task studies validate completion, state comprehension, and recovery across important paths.
- GitHub evidence: Flow diagrams; UI components; interaction specifications; task-completion studies

#### R4.7 Prototyping and iterative design

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Uses appropriately scoped prototypes to investigate risky assumptions and incorporates findings into successive designs.
- Validated (4): Documented comparisons show iterations resolving validated user problems and identify remaining limitations.
- GitHub evidence: Prototype links; design experiments; iteration histories; linked implementation changes

#### R4.8 Usability testing and task performance

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Defines representative tasks, success measures, study procedures, and actionable findings across ordinary and failure journeys.
- Validated (4): Repeat testing with representative users demonstrates meaningful improvements in task success, time, errors, or comprehension.
- GitHub evidence: Usability protocols; anonymized observations; task metrics; validation reports

#### R4.9 Accessibility implementation

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Implements appropriate semantics, names, contrast, focus order, alternatives, and input behavior for the supported interfaces.
- Validated (4): Automated and manual audits with remediation evidence validate accessibility across representative tasks and components.
- GitHub evidence: Semantic markup; accessible components; accessibility audits; remediation tests

#### R4.10 Assistive technology and keyboard validation

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Exercises keyboard-only and relevant assistive-technology journeys, including dynamic updates, focus recovery, and errors.
- Validated (4): Repeatable regression evidence and representative user checks demonstrate reliable assistive interactions.
- GitHub evidence: Keyboard test scripts; screen-reader notes; focus regression tests; assistive user studies

#### R4.11 Content design and comprehension

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Uses clear, consistent terminology and actionable content matched to user literacy, context, and consequential decisions.
- Validated (4): Comprehension studies and content iterations validate understanding, including errors and important limitations.
- GitHub evidence: Content guidelines; interface copy; readability reviews; comprehension test results

#### R4.12 Error prevention and recovery

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Prevents consequential mistakes and provides actionable errors, preserved work, safe cancellation, and proportionate undo or confirmation.
- Validated (4): Failure-journey studies and regression tests demonstrate successful recovery without avoidable data loss or user confusion.
- GitHub evidence: Validation rules; recovery flows; undo tests; error-journey usability reports

#### R4.13 Trust, transparency, and user control

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Communicates system state, AI limitations, consequential actions, and available human control without misleading certainty.
- Validated (4): Representative studies show users understand limitations, appropriately calibrate reliance, and can correct or override outcomes.
- GitHub evidence: AI disclosure designs; explanation interfaces; override flows; trust-calibration studies

#### R4.14 Privacy, consent, and ethical design

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Explains material data practices and implements understandable choices, proportionate consent, and accessible privacy controls.
- Validated (4): Usability reviews and privacy tests validate informed choices, revocation, deletion, and freedom from manipulative interaction patterns.
- GitHub evidence: Consent flows; privacy settings; deletion tests; ethical design reviews

#### R4.15 Design systems and implementation handoff

- Functional (2): A relevant approach or implementation is present, but important validation, assumptions, or failure cases remain incomplete.
- Robust (3): Maintains reusable components, states, content rules, and design-to-code acceptance criteria with accessible defaults.
- Validated (4): Component audits and shipped-flow validation demonstrate consistent implementation and successful design-engineering collaboration.
- GitHub evidence: Component libraries; design tokens; handoff specifications; visual and accessibility regressions
