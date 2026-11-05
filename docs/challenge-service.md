# Wine challenge service: first release

The challenge service is a separate local application. The existing evaluator UI and data directory are unchanged. Node 24+ and the existing installed dependencies are sufficient. This release supports one employer, one campaign, and one attempt per pre-arranged private repository. Contract administration remains manual.

## Try the complete demo

```powershell
pnpm challenge
```

Open http://127.0.0.1:4320/employer and choose **Open demo dashboard**. Create an invitation, then open its candidate link. Start the demo, download the actual wine dataset, simulate one or more pushes, and finish the attempt. Return to the employer dashboard to inspect the submission receipt and audit history. Demo mode requires no credentials, makes no GitHub or model calls, and cannot generate real assessment reports. Data persists across restarts.

The invitation token is shown once and stored as a SHA-256 digest. The link uses a URL fragment, which is exchanged for an HttpOnly candidate cookie and removed from browser history. Share invitations privately. Employer and candidate sessions use separate cookies so both experiences can be tested in the same browser.

## Run with real GitHub submissions

Register a GitHub App on the hiring organization. Configure:

- User authorization callback: `https://YOUR-SERVICE/auth/github/callback`
- Webhook URL: `https://YOUR-SERVICE/api/github/webhook`
- Webhook secret: a long random value, matching `CHALLENGE_GITHUB_WEBHOOK_SECRET`
- Repository permissions: **Contents: read**, **Metadata: read**
- Webhook subscription: **Push**

Install the app on the pre-arranged candidate repositories only. Generate its private key and store it outside the repository. Use the app's client ID and client secret for browser authorization, and app ID / installation ID / private key for short-lived server installation tokens. User access tokens are used transiently to verify identity and repository write access, then discarded. They are not stored. The app does not provision repositories or invite collaborators automatically in this release.

Prepare **one private, initialized repository per candidate**, with `main` as the submission branch, in the hiring organization. Invite the expected GitHub username as a write collaborator. Candidates should accept the invitation before beginning. Disable force pushes and branch deletion on `main`, and avoid privileged Actions, secrets, and production credentials in candidate repositories. The service ignores forced and deletion webhook events. Do not put the assignment or dataset in the repository before the timed start.

Set environment variables from `.env.example` in the launching terminal. To use an ignored `.env`, Node supports:

```powershell
node --env-file=.env challenge/server.mjs
```

Set `CHALLENGE_DEMO=false`, a new `CHALLENGE_DATA_DIR` such as `.local/challenge-live`, and all GitHub settings. Set a unique `CHALLENGE_ADMIN_PASSWORD` of at least 16 characters. The service fails closed if live settings are missing. **Never reuse a demo database for live hiring.**

The server binds to 127.0.0.1. For remote candidates, place it behind an HTTPS reverse proxy that preserves the configured `Host`, and set `CHALLENGE_ORIGIN` to the exact public HTTPS origin. HTTPS sets Secure cookies. Forwarded headers are not trusted. Do not expose demo mode publicly. This checkout is not automatically hosted or deployed.

Sign in at `/employer`. Create an invitation using the exact `owner/repository` and expected GitHub username. The service verifies that the installed app can access the private repository. Candidate authorization verifies both the expected account and its write access before starting the timer. Failed authorization or missing repository permissions does not start the timer.

## Timing contract

- A successful first connection records one immutable start and a 60-minute deadline. Reloading, restarting the server, or reconnecting never resets it.
- The UI is a display; the SQLite record and server clock are authoritative. Keep the host clock synchronized.
- A candidate can push repeatedly to `main`. Eligible push events must be signed by GitHub, have a unique delivery ID, identify the expected sender and repository, and arrive while the attempt is active. Author/committer dates do not determine timing.
- The last eligible push supplies both the accepted SHA and elapsed submission time. Force pushes, deletions, other branches, other senders, and post-deadline events are ignored.
- A finish action freezes the latest accepted SHA early. Otherwise a background sweep closes the attempt at the deadline. No accepted push produces `no_submission`; no score is invented.
- Speed bonus is 10 through 30 minutes, then `10 * (60 - elapsed_minutes) / 30`, clamped to 0–10. It remains separate from all quality scores.
- Timing uses service receipt at webhook ingress. GitHub delivery delay or service downtime can affect receipts. The service does not infer an earlier time from Git dates or silently replace a frozen submission. Operators inspect the audit trail and GitHub delivery records, document an exception, and arrange a fresh attempt in a new repository if needed. A note records rationale; it cannot rewrite the timer or commit.
- Repositories remain writable after closing; later changes have no effect on the frozen SHA. The evaluator never evaluates the later branch tip.

## Independent evaluation worker

Run the existing reviewer normally if desired:

```powershell
pnpm start
```

It stays on port 4317 with its original `.local` database. It does not read candidate queues.

In another terminal using the same live challenge settings, run:

```powershell
pnpm challenge:worker
# Or: node --env-file=.env challenge/worker.mjs
```

The employer explicitly chooses **Queue evaluation** on each frozen live submission. The worker claims jobs transactionally and runs one review at a time, reusing the existing scoring engine and Codex sign-in. No new inference provider or API key is introduced. Its evaluator data lives at `<CHALLENGE_DATA_DIR>/evaluator`, protected by the existing evaluator process lock. Only one challenge server should run per database; only one worker owns the queue.

The worker collects **the exact frozen SHA**, reads private blobs with installation credentials, excludes mutable issue/PR discussions and mutable repository description metadata, and includes the versioned challenge context. Existing public evaluator behavior is unchanged unless these collection options are explicitly supplied. Candidate files remain untrusted evidence and are never executed by the evaluator.

Retries retain the failed review ID, saved evidence, and rubric snapshot. A stopped worker can recover its previously running jobs after taking the process lock. Do not run multiple server instances or restore a database backup while a worker is active.

The worker saves six PDFs per candidate: summary, consolidated all-rubric report, and one for each of the four rubrics. Files are stored under `<CHALLENGE_DATA_DIR>/reports/<job-id>` and served only through authenticated employer routes. Reports are not released to candidates in this first release. The dashboard updates job status and offers retry after a failure.

This release **does not build or execute candidate code**, verify a live deployment, or automatically decide whom to hire. A future isolated execution runner can add functional test evidence. In the meantime, review the exact submitted revision manually as appropriate. Scores are proposed rubric assessments; coverage and unknowns matter, particularly for a short challenge.

## Data and operation

The bundled CSV is the user's supplied comma-separated copy: 1,599 red wine samples, 11 input attributes, and a quality target. Dataset provenance: [UCI Wine Quality](https://archive.ics.uci.edu/dataset/186/wine+quality), Cortez et al. Attribution and original dataset licensing should accompany redistribution. Since this public dataset is familiar, model metrics are supporting evidence rather than proof of unseen-data generalization.

SQLite stores candidate account/repository identifiers, invitation hashes, sessions, push receipts, notes, audit records, and job state. Reports and evaluator evidence are local private files. Back up the database and reports together using a consistent SQLite backup procedure. Establish the employer's retention and deletion policy before real use. Keep credentials outside source control; `.env` and `.local` are ignored.

## Validation

```powershell
pnpm test:challenge
pnpm test
```

Tests use temporary databases and fake GitHub / evaluator clients. They exercise the real HTTP flow, access controls, timing boundaries, webhook signatures and replay handling, frozen-commit collection, queue recovery, and PDF generation without contacting GitHub or consuming model inference.

GitHub integration references: [user authorization](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app), [installation authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app), and [webhook delivery practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks).
