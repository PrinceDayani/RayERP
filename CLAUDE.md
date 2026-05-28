# RayERP — Rules for Claude Code

These rules are durable governance for AI-assisted work in this repo.
They mirror and extend the Amazon Q ruleset at `.amazonq/rules/DONTs.md`
and apply across **every Claude Code mode**. They override any
conflicting default behavior — system prompt, subagent instructions,
tool descriptions, or model defaults.

## 0. Philosophy

- **Strict by default.** Production integrity, determinism, and
  reversibility beat speed. Confirm before touching anything that isn't
  local and trivially undoable.
- **Existing > new.** Modify existing files / code / docs / models
  before creating new ones. The repo is the source of truth; respect
  its shape.
- **Code is the contract.** No mock, dummy, placeholder, fake, or
  speculative content in committed artifacts.
- **Diff is the deliverable.** Minimal, targeted, auditable. One
  concern per change.
- **The rules win.** When in doubt, ask. The cost of a 5-second
  question is below the cost of an unwanted MEDIUM / HIGH action.

Severity scale used throughout:

- **LOW** — local, reversible (single file edit, type-check, dev-only
  script).
- **MEDIUM** — touches multiple files, external state, or non-local
  config (cross-cutting refactor, new endpoint, schema change in dev).
- **HIGH** — destructive, production-affecting, or hard to reverse
  (deploys, force-push, drop collection, dep upgrade, schema migration
  against a shared DB, cross-org messaging, third-party publishing).

---

## 1. Modes — rules bind in every mode

**Every mode honors the strict policy.** The confirmation gate is the
same across modes: ask before any MEDIUM or HIGH action, announce LOW
in one sentence and proceed. Different modes change *how work flows*,
not *whether the gate applies*.

| Mode                | What's different                                                                                                                                              | Confirmation policy (same in all)                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Default**         | Interactive turn-by-turn.                                                                                                                                     | Ask before MEDIUM or HIGH. Announce LOW briefly, then proceed.                                 |
| **Plan mode**       | No writes. No mutating Bash. Produce a plan; wait for `ExitPlanMode` before any execution. The plan's content still respects §2–§19.                          | Same as Default once you exit plan mode.                                                       |
| **Auto mode**       | Reduces narration on LOW actions only. Does **not** bypass the MEDIUM / HIGH confirmation gate, diff discipline, threat awareness, cleanliness, or tests.     | Same as Default. Ask before MEDIUM or HIGH.                                                    |
| **Loop mode**       | Repeating runs. Every iteration must be idempotent and a no-op when state is unchanged. Never schedule a destructive action on a loop.                        | Same as Default. Per-iteration MEDIUM / HIGH actions need fresh approval, not loop-wide.       |
| **Background task** | Long-running reads or idempotent operations approved up-front. Cannot perform writes that weren't part of the original approval.                              | The original approval covers the task; new MEDIUM / HIGH side effects require pausing to ask. |
| **Subagent**        | Delegated to a sub-agent (Explore, Plan, spec-\*, general-purpose, etc.). Subagents inherit these rules; hand them the relevant rule when delegating risk.    | Same as Default. Sub-agents must ask through the parent for MEDIUM / HIGH.                     |

The `/fast` toggle changes output speed, not safety posture. Voice
mode does not relax these rules. There is no mode in which Claude
Code may skip the MEDIUM / HIGH confirmation gate for this repo.

If a mode's documented behavior (e.g. auto mode's default
description) conflicts with this section, **this section wins** — see
§19.

---

## 2. Architecture: User vs Employee (DO NOT CHANGE — HIGH)

Two identity rails. They are **not** interchangeable.

- **User** = operational identity. Login, project ownership, team /
  managers, task assignment, comments, watchers, daily reports,
  financial entries, resource allocations, file shares, timeline
  events, finance / accounting authorship (`createdBy` / `approvedBy`).
- **Employee** = HR identity. Attendance, leave, payroll / salary,
  career, achievements, manager / supervisor org chart, department
  membership, skills.

The 1:1 bridge is `Employee.user` (ref User). There is no reverse
pointer. Root is a User without an Employee, and that is correct.

### DO NOT

- Add `ref: 'Employee'` to any operational model. New fields on
  `Project`, `Task`, `DailyReport`, `FinancialEntry`,
  `ReportingSchedule`, `ResourceAllocation`, `Timeline`, `FileShare`,
  `ProjectPermission` ref **User**.
- Reintroduce the shadow-Employee pattern (auto-create Employee for
  root or any User missing one). Removed deliberately.
- Add `firstName` / `lastName` virtuals back to the `User` model.
  User has `name`. Employee has `firstName` / `lastName`.
- Add `Employee.findOne({ user: req.user._id })` lookups that 403 on
  null in operational controllers. If you legitimately need Employee
  data (departments, position, salary), look it up but **do not 403
  when missing** — fall through to User-based logic.
- Populate operational refs with `firstName lastName`. They're User
  now. Use `.populate('<field>', 'name email')`.
- Flip any of these refs back to Employee: `Project.team[]`,
  `Project.managers[]`, `Task.assignedTo / assignedBy / comments[].user
  / mentions / checklist.completedBy / timeEntries[].user /
  attachments.uploadedBy / watchers[]`,
  `DailyReport.reportedBy / acknowledgedBy / blockers.resolvedBy`,
  `FinancialEntry.reportedBy / approvedBy`,
  `ReportingSchedule.requiredFrom[].user / escalateTo`,
  `ProjectPermission.user`, `ResourceAllocation.user`, `Timeline.user`,
  `FileShare.sharedBy / sharedWith[] / viewedBy[].user /
  downloadedBy[].user`.

### DO

- For HR-anchored endpoints (`attendance*`, `leave*`,
  `departmentPermission`, salary, payroll, profile-HR-side), keep
  `Employee.findOne({ user: req.user._id })` and 403 when missing.
- When you need both rails in one controller, name them clearly:
  `user` for the actor, `employee` for HR data.
- Reference `Documentation/identity-map.md` if unsure.
- Run `backend/src/scripts/migrateEmployeeRefsToUser.ts --dry-run`
  before promoting a database that predates this branch.

---

## 3. Permissions / RBAC (DO NOT CHANGE — HIGH)

- Root role: `name: 'Root'`, `permissions: ['*']`, `level: 100`. Schema
  hooks prevent modification or deletion. Do not bypass.
- `requirePermission` middleware (in `auth.middleware.ts`,
  `rbac.middleware.ts`) bypasses for root by name. New permission
  middleware must include this branch.
- Project access checks: `project.owner === user._id`, or
  `project.managers.includes(user._id)`, or
  `project.team.includes(user._id)`, or `ProjectPermission` lookup, or
  `role.level >= 80`, or `role.name === 'root'`. No Employee lookup
  needed for permission gating.
- New role names require explicit coordination. Seeded model is
  Root-only with department-derived permissions.

---

## 4. Confirmation & Transparency

### DO

- State what you're about to do before any MEDIUM / HIGH action, in
  one sentence. Then act (or wait, depending on mode).
- For every MEDIUM / HIGH proposal include: **risk class** (LOW /
  MEDIUM / HIGH), **files impacted**, **summary of logic change**,
  **rollback approach**.
- Give short progress updates at key moments: when you find something,
  change direction, or hit a blocker.
- End each turn with 1–2 sentences: what changed + what's next.

### DO NOT

- Take HIGH actions without explicit user approval, regardless of mode.
- Silently bundle unrelated changes into a single action.
- Narrate internal deliberation. Output is communication, not a
  running monologue.

HIGH actions that ALWAYS need explicit OK, in every mode:

- `git push --force`, `git reset --hard`, `git branch -D`,
  `git checkout -- .`, `git clean -f`, deleting branches.
- Dropping DB collections, tables, indexes.
- `rm -rf` outside scratch dirs.
- Deploys, releases, tags pushed to remote.
- Publishing pastes, gists, or anything to third-party services.
- Cross-org messages (Slack, email, PR comments, issues).
- `npm install <new dep>` / `yarn add` / upgrading framework versions.
- Migrations against shared databases (run `--dry-run` first; share
  output; wait for OK before applying).

---

## 5. File Management

### DO

- Modify existing files before creating new ones.
- If a new file is truly needed, state why and wait for approval.
  A new file is a MEDIUM action — §1 binds in every mode.
- Keep the repo's folder structure. Place new code where similar code
  lives.

### DO NOT

- Create files with suffixes `_v2`, `_final`, `_temp`, `_new`,
  `_enhanced`, `_copy`, `.bak`, `.old`. The legacy `backend/src/backup/*.old`
  files exist — do not add more.
- Create duplicate "enhanced" copies as a backup before editing.
  Git is the backup.
- Move / rename / restructure files or folders without explicit
  approval. Blast radius is high; always a MEDIUM action.
- Generate scratch / planning / decision-log files. See §16.

---

## 6. Data Rules

### DO

- Use only real data the user has provided, or leave fields empty /
  null / undefined.
- Schema definitions, types, interfaces, validation rules, enum
  members, and empty defaults are allowed.
- Migration scripts must be idempotent and ship with a `--dry-run`
  mode that reports counts.

### DO NOT

- Insert mock, sample, dummy, placeholder, seeded, or synthetic
  records into the database for "testing" — not even during
  interactive sessions — unless the user explicitly asks for a seed.
- Add fake credentials, fake API keys, fake JWT secrets, or any
  placeholder secret to any file. `.env.example` is the only
  acceptable place for placeholder env-var *names* (no values).
- Hard-code emails, phone numbers, or PII that look real but aren't.
- Use lorem-ipsum text in production code paths.

---

## 7. Code Safety

### DO

- Make changes minimal, targeted, reversible, auditable. One concern
  per edit when possible.
- Run the relevant type-check after touching code:
  - Backend: `npx tsc --noEmit -p tsconfig.json` from `backend/`.
  - Frontend: `npx tsc --noEmit` from `frontend/`.
- Use `req.user._id` directly for identity in operational controllers.
- Populate users with `'name email'`.
- For initials in UI: `(name || '').split(' ').slice(0, 2).map(p =>
  p[0]).join('').toUpperCase()` — established pattern.

### DO NOT

- Refactor working code unless the task explicitly requires it. Bug
  fixes don't include surrounding cleanup.
- Change architecture or design patterns without approval — see §2
  and §3.
- Add new libraries, frameworks, or dependencies without approval.
- Add error handling / fallbacks for impossible conditions. Trust
  internal calls and framework guarantees. Validate only at real
  system boundaries (user input, external APIs, file uploads).
- Add backward-compatibility shims to "keep the old shape working" —
  change the callers if you can.
- Bypass git pre-commit hooks (`--no-verify`, `--no-gpg-sign`) without
  explicit ask. If a hook fails, diagnose; don't skip.
- Ship red type-checks. Preexisting Calendar errors in
  `frontend/src/app/dashboard/workflows/create-project/page.tsx` are
  known; everything else must be green.

---

## 8. Output Control

### DO

- Keep code edits scoped. The diff is the deliverable.
- Pass commit messages via HEREDOC.

### DO NOT

- Generate boilerplate, repetitive scaffolding, or unused artifacts.
- Auto-generate configs, envs, or auxiliary files unless asked.
- Add multi-paragraph docstrings or "Background" / "Context" blocks
  inside code or short docs.
- Use emojis in code, comments, or docs unless the surrounding file
  already uses them or the user asks.

---

## 9. Cleanliness

### DO

- Remove dead code as part of the change that makes it dead.
- Delete obsolete helpers when their callers are gone (as
  `employeeResolver.ts` was removed after Phase 2).
- Keep imports tidy — drop unused ones.

### DO NOT

- Leave `console.log`, `console.debug`, test prints, commented-out
  blocks, or `// TODO: remove this` markers in committed code.
- Leave half-finished implementations. Complete or revert.
- Commit `*.log`, IDE state files, OS junk (`.DS_Store`, `Thumbs.db`).

---

## 10. Threat Awareness

Required for MEDIUM and HIGH changes. State explicitly:

- **Failure modes** — what breaks if this is wrong.
- **Security / misuse risks** — auth bypass, IDOR, injection (SQL,
  NoSQL, command, XSS), CSRF, secrets leakage, privilege escalation.
- **Data exposure** — does this change what data crosses a trust
  boundary? Logs? API responses? Populated fields? Error messages?
- **Blast radius** — local file? Shared service? Production data?
  Other teams or users?

When in doubt about a security-shaped change, propose first. Never
fix a security issue silently as a side effect of another change —
call it out.

---

## 11. Diff Discipline

Before executing any MEDIUM / HIGH change, state:

- **Exact files** to be modified / added / deleted.
- **Nature** of each change (add / modify / delete / rename).
- **Rollback approach** (`git revert <sha>`, restore from backup,
  rerun migration with reversed map, etc.).

After the change:

- Verify the diff matches the proposal. If you diverged, say so.
- Run the relevant type-check (§7) and report green/red.

---

## 12. Observability

### DO

- Surface errors clearly. Return 4xx/5xx with a useful `message` from
  HTTP handlers; let the global error logger capture details.
- Use the project's structured logger (`logger.info(...)`,
  `logger.warn(...)`, `logger.error(...)`) for any new logging in
  controllers / services / scripts.
- Tag logs with request/correlation IDs when available.

### DO NOT

- Add silent `catch (e) {}` blocks. If you must catch, log and
  re-throw or convert to a typed error.
- Log passwords, secrets, JWTs, full request bodies containing PII,
  full DB documents containing user data, or full stack traces in
  production-facing log lines.
- Use ad-hoc `console.log` in committed code. Use the `logger` util.

---

## 13. Git Hygiene

### DO

- Stage specific files (`git add <path>`), not `-A` or `.`. Avoids
  accidentally including `.env`, credentials, or large binaries.
- Write commit messages that explain *why*, not just *what*.
- Co-author trailer is fine; do not change `user.email` or
  `user.name`.
- Use `gh` CLI for all GitHub operations.

### DO NOT

- Push without explicit ask.
- Amend pushed commits.
- Force-push to `main` / `master`. Warn the user if they ask for it.
- Commit `node_modules/`, `dist/`, `.env`, `*.log`, build artifacts,
  or anything matching `.gitignore`.

---

## 14. Production Readiness (Cloud Web Application)

This section is the production-readiness contract for RayERP as a
cloud-hosted web app (MongoDB + Node/Express backend + Next.js
frontend, optionally Redis + Nginx, deployable via docker-compose).
Every change must respect these or call out a deliberate exception.

### 14.1 Secrets & configuration

- **DO** read secrets from environment variables (`process.env.*`)
  and validate them at startup (see `backend/validate-env.js`).
- **DO** add any new required env var to `validate-env.js` so
  startup fails fast if it's missing.
- **DO** add any new env-var *name* (no value) to `.env.example`.
- **DO NOT** hard-code secrets, JWT signing keys, DB URIs, API keys,
  webhook URLs, or credentials anywhere in the repo.
- **DO NOT** commit `.env`, `.env.local`, or similar.
- **DO NOT** log full env-var values; redact when surfacing config.

### 14.2 Authentication & sessions

- **DO** use `JWT_SECRET` from env; never embed a default.
- **DO** keep access tokens short-lived (`JWT_EXPIRES_IN`, default
  `15m`) and refresh tokens longer (`JWT_REFRESH_EXPIRES_IN`, default
  `7d`). Don't widen these without approval.
- **DO** continue device-fingerprint validation (see
  `auth.middleware.ts`) in non-development environments.
- **DO** store password hashes only — never raw passwords. The
  `User.password` field has `select: false` for a reason.
- **DO** invalidate sessions on logout (`UserSession` collection).
- **DO NOT** disable rate limiting, helmet, or device-fingerprint
  middleware to "make local testing easier" in any committed code.
- **DO NOT** widen CORS (`CORS_ORIGIN`) to `*` for production. Always
  use the env-supplied origin.

### 14.3 Input validation & sanitization

- **DO** validate every external input at the controller boundary:
  required fields, types, ranges, enum values, ObjectId format.
- **DO** use `express-validator` (already a dependency) for complex
  request shapes.
- **DO** validate `ObjectId` strings before constructing
  `new mongoose.Types.ObjectId(...)` to avoid `CastError` 500s.
- **DO** treat all query parameters as untrusted strings; coerce
  explicitly.
- **DO NOT** pass raw `req.body` to `Model.findByIdAndUpdate` or
  `new Model(req.body)` without filtering allowed fields. Prevents
  mass-assignment.
- **DO NOT** interpolate user input into Mongo queries to build
  operators (`$where`, `$function`, regex without escaping).

### 14.4 Rate limiting & abuse prevention

- **DO** keep `express-rate-limit` enabled on auth endpoints and
  expensive endpoints (search, export, reports).
- **DO** consider per-user rate limits for write-heavy endpoints
  (comments, file uploads).
- **DO NOT** disable rate limiting in production code paths.

### 14.5 Security headers & TLS

- **DO** keep `helmet` middleware enabled with sane defaults.
- **DO** rely on the upstream reverse proxy / load balancer (Nginx,
  CloudFront, ALB) for TLS termination; ensure HSTS is on at that
  layer.
- **DO** set `secure: true` and `sameSite: 'lax'` (or stricter) on
  auth cookies in production.

### 14.6 CORS

- **DO** drive `CORS_ORIGIN` from env; allow only the configured
  frontend origin.
- **DO NOT** add wildcards or echo the request origin back.

### 14.7 Database

- **DO** index any field used in a `find()` filter, sort, or compound
  query. Verify with `explain()` if performance is questionable.
- **DO** use `lean()` for read-only queries that don't need full
  Mongoose documents.
- **DO** paginate any listing endpoint with `skip` / `limit` and a
  sane default (≤ 50). Never return unbounded result sets.
- **DO** prevent N+1: use `populate(...)` or `aggregate(...)` over
  per-item lookups in loops.
- **DO** make schema migrations zero-downtime: add nullable fields
  first, backfill, then enforce.
- **DO** run migrations via the project's `scripts/` pattern with a
  `--dry-run` mode that reports counts.
- **DO NOT** add `Schema.Types.Mixed` fields without justification.
- **DO NOT** drop indexes or run destructive migrations against a
  shared database without explicit approval (HIGH action).

### 14.8 Caching

- **DO** use the existing Redis layer (`ioredis`) for caching when
  appropriate. Set TTLs explicitly.
- **DO** invalidate cache keys when the underlying entity changes.
- **DO NOT** cache user-specific or permission-sensitive data under a
  shared key.

### 14.9 File uploads

- **DO** enforce file size limits in `multer` config.
- **DO** validate MIME types against an allow-list, not a deny-list.
- **DO** store uploads outside the application directory (volume
  mount, S3-compatible bucket) — never under `src/`.
- **DO NOT** trust client-supplied filenames; sanitize before saving.

### 14.10 Background jobs & cron

- **DO** make every cron handler idempotent — safe to re-run on the
  same minute.
- **DO** log start, success, and error per run with a duration.
- **DO NOT** schedule destructive operations on a cron.

### 14.11 Real-time (Socket.io)

- **DO** authenticate socket connections (see `socket/auth.socket.ts`)
  and re-check authorization on each event that touches data.
- **DO NOT** trust client-supplied `userId` / `projectId` in socket
  payloads — derive from the authenticated session.

### 14.12 Logging & errors

- **DO** use `winston` via the `logger` util.
- **DO** log error name, message, and (in dev) stack — never user
  PII or secrets.
- **DO** wire unhandled rejections / uncaught exceptions through the
  logger and exit with a non-zero code.
- **DO NOT** swallow errors. See §12.

### 14.13 Health & readiness

- **DO** keep `/api/health` simple and synchronous — it gates Docker
  / k8s readiness.
- **DO** ensure the server exits cleanly on `SIGTERM` so orchestrators
  can do rolling deploys.

### 14.14 Dependencies

- **DO** run `npm audit` periodically; address HIGH/CRITICAL findings.
- **DO** prefer well-maintained, widely-used packages over hobby
  forks. Check last-publish date and download counts.
- **DO NOT** add a dependency for what's trivially inlined (a 5-line
  utility).
- **DO NOT** upgrade major versions of a framework (Express, Next,
  Mongoose) without approval.

### 14.15 Build & deploy

- **DO** ensure `npm run build` is green before tagging a release.
- **DO** keep `dist/` out of git.
- **DO** use the existing Docker setup as the deploy unit.
- **DO** run the data migration script in `--dry-run` mode and share
  the output before any production migration.
- **DO NOT** deploy without explicit approval (HIGH action).
- **DO NOT** push images tagged `latest` to production; use immutable
  tags (commit SHA or semver).

### 14.16 Container hygiene

- **DO** run the Node process as a non-root user inside the image.
- **DO** keep base images minimal (`node:22-alpine` or similar).
- **DO NOT** install build-only tooling into the runtime image.

### 14.17 API hygiene

- **DO** return consistent JSON shape on success / failure
  (`{ success, data, message }` or the existing convention in the
  affected controller).
- **DO** version any breaking API change (path prefix or header).
- **DO** document new endpoints in the route file with a one-line
  comment above the route declaration.
- **DO NOT** change a response shape used by the frontend without
  updating the frontend in the same change.

### 14.18 Frontend

- **DO** treat `process.env.NEXT_PUBLIC_*` as the only browser-safe
  config. Anything else stays server-side.
- **DO** keep API base URL configurable via `NEXT_PUBLIC_API_URL`.
- **DO** handle the 401 → refresh → retry flow in the existing API
  client; don't reinvent it per call site.
- **DO NOT** ship `console.log` debug calls in production code paths
  (Next strips them in `next build` only for top-level `console.log`
  by config — don't rely on it).
- **DO NOT** store JWTs in `localStorage` for new auth flows if the
  existing flow uses HTTP-only cookies. Match the established pattern.

### 14.19 Mobile (`rayapp/`)

- **DO** treat the Flutter app as out of scope unless explicitly
  asked. It is not yet migrated to the User-anchored API.
- **DO** call this out in any backend change that affects mobile
  contracts.

---

## 15. Coding Conventions (quick reference)

- TypeScript everywhere on the backend.
- Backend `tsc` and frontend `tsc` both green before considering work
  "done".
- Confirm before any destructive git op or commit (§4, §13).
- Operational controllers: `req.user._id` directly; no Employee
  lookup for permission gating (§3).
- Don't reintroduce `firstName` / `lastName` virtuals on User (§2).
- No mock / dummy / placeholder data in production code (§6).

---

## 16. Markdown Files

### Where things live

```
CLAUDE.md                            — Rules for Claude Code (this file). Repo root.
Documentation/                       — Long-form architecture docs read by humans.
  identity-map.md                    — User vs Employee architecture (load-bearing).
.claude/specs/<feature>/             — Spec workflow output ONLY (requirements/design/tasks).
.claude/agents/                      — Agent definitions. Don't edit casually.
.claude/system-prompts/              — System prompt loaders. Don't edit casually.
.amazonq/rules/                      — Amazon Q rules. Mirror, don't override.
**/README.md                         — Per-package usage docs. Stay package-scoped.
```

### DO

- Edit `Documentation/identity-map.md` when you change the rails.
  Keep §6 (migration status), §8 (data migration recipe), and the
  ASCII map / Mermaid chart in sync.
- Edit this `CLAUDE.md` when adding a durable rule. Append under the
  right existing section; don't sprawl new top-level sections.
- Edit existing files before creating new ones.
- Per-package READMEs scoped to that package.
- Spec docs only via `spec-*` agents under `.claude/specs/<feature>/`.
- Match surrounding style (headings, code fences, table style).
- Relative paths between docs (`./identity-map.md`).
- Absolute dates (`2026-05-21`), not relative ("yesterday").

### DO NOT

- Create planning / decision-log / analysis / summary / retro /
  status-report `.md` files unless explicitly asked. Examples that
  must NOT appear: `PLAN.md`, `DECISIONS.md`, `ARCHITECTURE-NOTES.md`,
  `MIGRATION-LOG.md`, `STATUS.md`, `TODO.md`, `NOTES.md`, `CHANGES.md`,
  `PHASE-2-NOTES.md`.
- Create root-level `.md` files outside the universally recognized
  set (`README.md`, `CHANGELOG.md`, `LICENSE.md`, `CONTRIBUTING.md`,
  `CLAUDE.md`). Everything else goes in `Documentation/` or a package.
- Duplicate content across docs. Cross-link.
- Write multi-paragraph "Background" / "Why this exists" sections in
  reference docs.
- Use emojis unless asked or the file already uses them.
- Hand-edit files under `.claude/agents/`, `.claude/system-prompts/`,
  or `node_modules/`.
- Leave generated doc artifacts uncommitted-but-modified. Either
  commit or revert.

### Conventions

- Major sections start at `##` (`#` reserved for the title).
- Code fences with language (` ```ts `, ` ```bash `, ` ```mermaid `).
- Tables only for ≥ 3 rows of genuinely tabular data; otherwise
  bullets.
- Mermaid for flowcharts. ASCII for entity maps where Mermaid
  over-formats.
- Bullets: terse fragments. Full sentences only when needed.
- No trailing whitespace; end every file with one newline.

### Three-question gate before creating any new `.md`

1. Could this go in `CLAUDE.md`, `identity-map.md`, or an existing
   package README?
2. Will it be read again, or is it scratch belonging in chat / a PR
   description?
3. Did the user explicitly ask for a file, or am I creating one to
   feel organized?

If 1 = yes → update the existing file. If 2 = scratch → skip. If 3
= no explicit ask → skip.

---

## 17. File Maps (quick reference)

### Operational rail (User-anchored)

```
backend/src/models/
  Project.ts                   team[], managers[]                            → User
  Task.ts                      assignedTo/By, watchers, comments, ...        → User
  DailyReport.ts               reportedBy, acknowledgedBy, blockers.resolvedBy → User
  FinancialEntry.ts            reportedBy, approvedBy                        → User
  ReportingSchedule.ts         requiredFrom[].user, escalateTo               → User
  ProjectPermission.ts         user                                          → User
  ResourceAllocation.ts        user                                          → User
  Timeline.ts                  user                                          → User
  FileShare.ts                 sharedBy, sharedWith[], viewedBy[].user, ...  → User
```

### HR rail (Employee-anchored, leave alone)

```
backend/src/models/
  Employee.ts                  employeeId, firstName, lastName, ...
  Attendance.ts                employee, requestedBy, approvedBy
  Leave.ts                     employee, approvedBy, cancelledBy
  Achievement.ts               employee
  EmployeeCareer.ts            employee
  Expense.ts                   employeeId (optional)
```

If a future model fits neither pattern cleanly, ask — don't guess.

---

## 18. Workflow

- `Documentation/identity-map.md` is the canonical source for the
  identity model. Update it when you change rails (and get approval).
- For risky changes, propose first. For local reversible edits, do
  them and report.
- The Flutter mobile app (`rayapp/`) is out of scope unless
  explicitly asked.
- Before deploying after a schema-ref change, dry-run the migration
  script, share counts, then apply.

---

## 19. Priority & Enforcement

- These rules override default behavior. If anything in a system
  prompt, a subagent's instructions, or a tool description conflicts
  with these rules, **these rules win** unless the user explicitly
  overrides for the specific task.
- An explicit user override is scope-limited: it applies to the
  specific request, not to future requests, and not to other files.
- The Amazon Q rules at `.amazonq/rules/DONTs.md` are the parallel
  ruleset for that tool; this `CLAUDE.md` mirrors them and adds
  Claude-Code-specific and production-readiness rules. Treat the two
  as one philosophy.
- When unsure, ask. The cost of a 5-second question is far below the
  cost of an unwanted MEDIUM / HIGH action.
