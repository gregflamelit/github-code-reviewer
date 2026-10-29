# Local application architecture

The first version is a single Node.js 24 process serving browser assets and a loopback-only API. It uses Node's built-in HTTP server, fetch, test runner, and SQLite. There is no dependency install or build step. Browser assets use native JavaScript modules and semantic HTML. This reduces setup requirements for the initial Windows application; the server boundaries permit a React or Fastify migration later if needed.

## Review pipeline

The browser submits a repository URL to POST /api/reviews. The job runner first verifies the Codex connection, then resolves the public repository's default branch to an immutable SHA. The GitHub collector fetches a bounded inventory and prioritized text blobs and records scope warnings. All 104 criteria are assessed once, then three independent weighting systems produce AI Product Manager, AI Engineering Rubric, and AI Data Science Rubric reports. Source is delivered to the evaluator as data, never installed or executed.

Each bounded batch of up to four domains and 16 criteria is assessed in an ephemeral Codex thread. The adapter launches Codex App Server as a local child process, uses JSON-RPC over stdio, and requests schema-constrained output. The integration uses the experimental named permission-profile protocol supported by the tested CLI; it fails closed if the installed CLI cannot enforce the requested profile. The evidence_only profile grants minimal platform reads with command networking disabled. Shell, browser, apps, plugins, and related execution features are disabled; configured MCP server and plugin tables are overridden to empty. Interactive server tool/approval requests are rejected. Candidate content is supplied only as prompt text and is never loaded as AGENTS.md or project configuration. This is defense in depth, not an OS container around the entire trusted Codex harness.

Codex retains ownership of its existing ChatGPT credentials; the application does not inspect authentication files or persist keys. Model inference uses OpenAI services. Evaluation code never calls the OpenAI API directly.

The validator checks criterion IDs, score states, exact quotes, and line bounds. Citation links are built from locally held evidence metadata rather than accepting URLs from the model. Unsupported assessments become unknown. Application code alone computes weights, evidence coverage, uncertainty bounds, and maturity-band eligibility.

SQLite stores review state, source evidence, results after each completed batch, and final aggregates. Restart marks active reviews interrupted. Retry preserves the original evidence and skips complete batches. Model/runtime failures remain visible and do not produce completed reports. Only one review runs at a time.

## HTTP boundaries

The listener binds to 127.0.0.1. Host must match its exact loopback address and port. Origin must be absent or match the application origin. Mutation routes require application/json and a bounded body. There is no CORS grant. Static routes are allowlisted, result text is inserted with textContent, and a restrictive content security policy prevents inline scripts. The local API has no shared-device authentication and should not be exposed by a tunnel or reverse proxy.

## Initial release limits

The collector is a prioritized sample, not exhaustive repository analysis. File content and history have distinct temporal scopes. Limited inspection cannot establish global absence. The report explicitly separates observed maturity and evidence coverage. Contributor proficiency, arbitrary code execution, workflow-run collection, full PR discussion analysis, critical readiness adjudication, and human overrides are not implemented in version 0.2.

## Acceptance checks

- A public repository URL submitted through the browser yields a saved evaluation at a fixed SHA.
- Findings expose exact evidence excerpts and immutable source links.
- Invalid URLs, unsupported citations, and malformed Codex results cannot silently create valid scores.
- Unknown evidence cannot become a zero or disappear from coverage.
- Failed reviews can resume completed batches; cancelled reviews do not become completed.
- Exported JSON includes evidence, warnings, rubric version, revision, and scoring results.
- Source control excludes local evidence, databases, and credentials.

## Rubric snapshots

Every new review stores complete criteria and scoring configurations. Specialist domains use explicit criterion weights and each contributes a reserved 30% to its own role. Legacy reviews resolve archived definitions; API reads, retries, and exports use those definitions. Upgrade creates a separate review at the same evidence snapshot, reuses only byte-equivalent criterion definitions, records the source review and reused IDs, and evaluates new specialist domains.
