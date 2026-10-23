# Preview quiz investigation — 23 October 2026

## Serving revision and read-only evidence

The reported URL is `https://career-9i8s48dhs-boy-c267.vercel.app/#start`.
Vercel identifies it as Preview deployment `dpl_6KbWbphLuwQBWCAM6T8q2kvvGGx6`,
branch `codex/reflect-learning-roadmap`, commit
`e313d7a990e79a713a0ee712e4d0c1db292dc247`. It contains the previous fix that
requires only the existing `202610210002` frontend marker. An old deployment
or browser cache does not explain the failure of its read-only API probes.

| Read-only endpoint | Reported Preview | Existing Production (`career-app-ten.vercel.app`) |
| --- | --- | --- |
| `/api/health` | 503 `SCHEMA_NOT_READY` | 200, database reachable |
| `/api/quiz` | 503 `SCHEMA_NOT_READY` | 200, 20 questions |
| `/api/courses` | 503 `SCHEMA_NOT_READY` | 200, 12 courses |

The quiz and course GET handlers do **not** call the migration-marker guard.
They read existing tables through `active()`. Their failures show that removing
another marker check cannot repair this Preview's underlying read path.

Vercel's environment metadata lists `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` as Production-only. The integration's differently
named variables include Preview, but the server code does not use those names.
These are different configuration scopes; no secret values were read or printed.

The public error maps multiple PostgREST errors to the same setup message.
It does not reveal which object is missing or establish the connected database's
identity. In particular, metadata alone does not explain why the Preview returns
`SCHEMA_NOT_READY` rather than `NOT_CONFIGURED`; the effective runtime
configuration still needs verification. Existing runtime-log queries returned
no entries. Do not treat this as proof that a particular migration is absent.

## Next action and boundaries

Configure matching server database settings for the intended Preview database,
then create a **new Preview deployment** of the exact feature revision. Existing
deployment URLs are immutable and will retain their old environment settings.
Verify the new deployment with the read-only health, quiz, and course probes
before testing starts.

The earlier plan required an isolated Preview database, and the owner reported
that one was not set up. Sharing the existing Production database requires an
explicit change to that constraint: future Preview quiz starts would write
records to Production. Do not silently copy Production credentials to Preview.
Do not migrate, seed, reset, or clean up the hosted database for this investigation.

The owner subsequently authorized this Preview branch to use the existing
Production database, accepting that future Preview attempts would save records
there. No schema changes or Production deployment changes were authorized.

Vercel rejected an attempt to retain the Production target while adding the
Preview branch: `Environment Variables with gitBranch can only be used with
target=preview`. The existing sensitive values cannot be read back. Therefore
the existing variables cannot safely be moved to the branch target: doing so
would remove them from future Production deployments. Completing branch-only
configuration needs separately entered Preview variables. Reusing the saved
variables for all Preview deployments requires broader authorization.

No configuration changes, deployments, hosted test writes, migrations, or schema
changes have been made. The local `.env.local` connection failed DNS resolution
and does not establish anything about the deployed database.
