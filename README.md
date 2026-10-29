# GitHub Code Reviewer

A local application that evaluates public GitHub repositories with your signed-in Codex CLI and 104 criteria (68 shared plus 36 specialist). One assessment produces three independently weighted reports: **AI Product Manager**, **AI Engineering Rubric**, and **AI Data Science Rubric**. Reports include scores, evidence coverage, exact quoted citations, missing evidence, and follow-up validation tasks.

## Run locally

Requires Node.js 24 or later, GitHub internet access, and an installed Codex CLI signed in with ChatGPT. No npm dependencies or separate API key are required. Normal Codex account access and usage limits apply.

The integration is verified against Codex CLI 0.164.0-alpha.11.1 and uses the experimental named permission-profile API. Older clients may need an update. Unsupported profiles fail explicitly rather than falling back to broader access.

On Windows, from PowerShell:

```powershell
.\start.ps1
```

The launcher can discover the Node and Codex runtimes bundled with the Codex desktop app. If script execution is disabled by your policy, run Node directly instead of changing your execution policy:

```powershell
node server.mjs
```

Open **http://127.0.0.1:4317**, paste a public repository URL such as https://github.com/octocat/Hello-World, and click **Evaluate repository**. All three reports are created automatically, including the specialist criteria. If Codex is not signed in, run `codex login` in your terminal first. Leave the server running while reviewing; use Ctrl+C to stop it.

The interface, evidence, and database are local. Selected public repository excerpts are sent through Codex to OpenAI for model inference. This is not an offline model.

## Configuration

| Environment variable | Purpose |
| --- | --- |
| PORT | Local server port, default 4317 |
| CODEX_BIN | Absolute path to the Codex executable when it is not on PATH |
| CODEX_MODEL | Optional supported model identifier; otherwise the app discovers and selects Codex's advertised default model |
| GITHUB_TOKEN | Optional GitHub token for higher API rate limits; public repositories work without one |
| REVIEWER_DATA_DIR | Data directory, default .local under the launch directory |

Credentials are never stored by this application. Codex manages its existing ChatGPT sign-in. Set environment variables in your terminal; this application does not load .env files.

## What happens during a review

1. The local Node server starts Codex App Server over stdio and verifies authentication.
2. The collector resolves the default branch to an immutable commit SHA using GitHub's API. Source files come from pinned raw-file URLs and are checked against their Git blob SHA-1 digests, reducing API usage across multiple reviews.
3. Codex evaluates bounded batches of up to four rubric domains and 16 criteria against that evidence and returns schema-constrained JSON.
4. Local validation rejects invalid criterion states, duplicate IDs, and out-of-scope criteria. Unsupported scores and exclusions become unknown. Citations must contain an exact quote at a valid range in a collected evidence item.
5. Application code independently calculates weighted maturity, coverage, unknown-score bounds, and role-specific band eligibility for all three rubrics. Codex does not calculate the final scores. Switch report cards to inspect each rubric or export all three together.
6. SQLite saves evidence, per-batch results, progress, and reports. Failed or interrupted reviews can resume using the captured evidence and completed batches. Retry does not fetch a newer commit; start a new review to refresh evidence.

Only one review runs at a time. Cancel stops the Codex process. Each Codex batch has an eight-minute timeout. The app records incomplete work as cancelled, failed, or interrupted, never as a successful evaluation.

Only one application process can own a data directory. A process lock prevents another instance from changing active review state. To run an independent second instance, use both a different PORT and a different REVIEWER_DATA_DIR. Stale locks from terminated processes are recovered automatically.

## Scope and interpretation

- The first version evaluates repository artifacts, not individual workers. Contributor attribution and work samples are future work.
- At most 36 prioritized text files are sampled, each limited to 14,000 characters, within a total evidence budget of 180,000 characters. Collection warnings and per-file truncation are supplied to the evaluator. Large files, generated assets, dependency directories, and unsupported binary formats are skipped.
- A file inventory and up to four recent PR summaries supplement source excerpts. PR history can postdate the evaluated commit and is labeled accordingly. Issues, PR diffs, review comments, workflow run results, and repository settings are not collected yet.
- Repository source is not installed, built, or executed. Test files demonstrate test design; they do not establish that tests passed.
- Candidate repository files are never written as executable files or loaded as Codex configuration. Evidence is delivered as untrusted text. The Codex process uses a dedicated worker directory, read-only sandbox, disabled shell/apps/browser/plugin features, no configured MCP servers, and rejects interactive tool and approval requests.
- Criteria version 2.0 and scoring version 2.0 are proposed defaults pending expert calibration. Unknown evidence has no score. Not-applicable criteria require contextual supporting evidence. Low coverage or an unobserved role-critical skill suppresses that role's maturity band. Full weights and role requirements are in [the three-rubric specification](docs/scoring-rubrics.md).
- Citation validation establishes existence and exact text, not semantic truth. Findings still require critical review. Verified critical readiness gates and human overrides are not automated in this release; domain findings must be inspected before decisions.

## Historical reports and upgrades

New reviews pin complete criteria and scoring snapshots. Retry uses the saved version. Existing criteria 1.0 / scoring 1.1 reports retain their original results. **Evaluate latest rubric** creates a separate review using the same captured evidence and unchanged compatible assessments, then evaluates the new specialist criteria. Use a new repository review to collect fresh evidence.

## Storage and source control

The ignored `.local/reviews.sqlite` database contains collected public source excerpts and reports. Never commit it or Codex authentication files. The application binds only to 127.0.0.1, checks Host and Origin, rejects cross-origin mutations, and does not expose the Codex process directly to browsers.

## Development

```powershell
node --test
node --check server.mjs
```

Tests cover scoring and coverage gates, exact citation validation, repository URL boundaries, bounded collection, persistence and interrupted reviews, local HTTP protection, and Codex protocol behavior with a deterministic fake process. Live smoke verification is separate and uses the real signed-in Codex installation.

Key files: `server.mjs`, `src/github.mjs`, `src/codex.mjs`, `src/rubric.mjs`, `src/jobs.mjs`, `src/store.mjs`, and `public/`. All 104 criteria are in `evaluation-rubric.json`; current role weights are in `scoring-rubrics.json`. The authoritative version 2.0 policy and all specialist anchors are in `docs/scoring-rubrics.md`. Shared historical anchors remain in `evaluation-rubric.md`, and archived JSON definitions are under `rubric-versions/`.

Official integration reference: [Codex App Server](https://learn.chatgpt.com/docs/app-server).
