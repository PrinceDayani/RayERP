# Dependency Security — Known Advisories & Deferred Remediation

Record of `npm audit` findings that are deliberately **not** auto-fixed,
with the reasoning and the upgrade path for later. Update this file when a
deferred item is resolved or a new advisory is accepted.

Last reviewed: 2026-05-30.

## Remediated (2026-05-30)

Applied via non-breaking `npm audit fix` plus one vetted breaking upgrade.
Both `tsc` and the production build are green after these changes.

- Backend: `axios`, `jspdf`, `lodash`, `mongoose`, `path-to-regexp`,
  `socket.io-parser` — all critical/high resolved by semver-compatible
  patches.
- Frontend: `axios`, `js-cookie`, `lodash`, `socket.io-parser` resolved by
  patches; `jspdf` `^3.0.4` -> `^4.2.1` and `jspdf-autotable` -> `^5.0.8`
  (breaking major, vetted: all usage in `src/lib/exportUtils.ts`,
  `src/lib/utils/profile-pdf.ts`, `src/lib/utils/activityExport.ts` uses
  stable core APIs; none of the v4-removed APIs are present).

## Deferred — accepted risk

### frontend: `xlsx` (high + critical) — no npm-registry fix

- Advisories: Prototype Pollution (GHSA-4r6h-8v6p-xvw6), ReDoS
  (GHSA-5pgg-2g8v-p4x9).
- Why deferred: SheetJS no longer publishes patched versions to npm; the
  last registry release is `0.18.5`. Both advisories live in the **parse**
  path. This app only **writes** spreadsheets (`json_to_sheet`,
  `aoa_to_sheet`, `writeFile` in `exportUtils.ts` and `activityExport.ts`)
  and never parses untrusted `.xlsx` input, so the vulnerable code is not
  reachable from user input.
- Upgrade path when ready (MEDIUM, non-registry source — needs approval):
  ```bash
  npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
  ```
  Alternative: migrate the two writer modules to `exceljs`.

### frontend: `postcss` (moderate) — transitive inside Next.js

- Advisory: XSS via unescaped `</style>` in CSS stringify
  (GHSA-qx2v-qp2m-jg93).
- Why deferred: the vulnerable `postcss` is bundled inside `next`
  (`node_modules/next/node_modules/postcss`). `next` is already on the
  latest stable (`16.2.6`); only an upstream Next release can bump it.
  `npm audit fix --force` proposes downgrading Next to `9.3.3`, which is a
  catastrophic regression and must not be applied. Build-time only.
- Action: re-check on each Next minor/patch upgrade.

### backend: `nodemailer` (moderate)

- Advisories: SMTP command injection via `envelope.size`
  (GHSA-c7w3-x93f-qmm8) and CRLF in transport name (GHSA-vvjj-xcjg-gr5g).
- Why deferred: fix requires `nodemailer@8.0.10`, a breaking major.
- Upgrade path when ready (MEDIUM — needs approval): bump to `^8.0.10`,
  then verify all mail-sending call sites and run the backend build.

## How to re-audit

```bash
# from backend/ or frontend/
npm audit                 # full report
npm audit --omit=dev      # production dependencies only
npm audit fix             # apply non-breaking fixes only (safe)
```

Do not run `npm audit fix --force` unattended — it bumps major framework
versions (and here would downgrade Next). Framework major bumps are a HIGH
action per `CLAUDE.md` 14.14 and require explicit approval.
