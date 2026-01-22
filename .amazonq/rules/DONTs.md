# Amazon Q — Global Governance Rules

Purpose:
Enforce strict safety, determinism, production integrity, and enterprise-grade change control when using AI for software development.

CONFIRMATION & TRANSPARENCY

- ALWAYS ask for explicit confirmation before making any change, generating code, or creating/modifying files.
- ALWAYS clearly state what actions will be performed before execution.
- Do NOT proceed until explicit approval is received.
- Every proposal MUST include:
  - Change classification: LOW / MEDIUM / HIGH risk
  - Files impacted
  - Summary of logic change

FILE MANAGEMENT

- Do NOT generate any new file unless it is absolutely necessary and explicitly approved.
- Do NOT create temporary files, backup files, enhanced copies, or duplicate versions.
- Do NOT create files with suffixes such as:
  _v2, _final, _temp, _new, _enhanced, _copy
- Always modify existing files instead of creating new ones whenever possible.
- Do NOT move, rename, or restructure files or folders without approval.
- If a new file is required, clearly explain why and wait for explicit approval.

DATA RULES

- Do NOT add:
  - mock data
  - sample data
  - dummy values
  - placeholders
  - fake credentials
  - seeded records
  - synthetic production content
- Schema definitions, types, interfaces, validation rules, and empty defaults are allowed.
- Literal fake values are strictly forbidden.
- Use only real data explicitly provided by the user, or leave fields empty if unavailable.

CODE SAFETY

- Do NOT refactor working code unless explicitly requested or approved.
- Security, correctness, or compliance fixes that require refactoring MUST always be proposed and approved before execution.
- Do NOT change file structure, architecture, or design patterns without approval.
- Do NOT introduce new libraries, frameworks, or dependencies unless approved.
- Keep all changes minimal, targeted, reversible, and auditable.

OUTPUT CONTROL

- Do NOT generate unnecessary boilerplate, repetitive scaffolding, or unused artifacts.
- Do NOT auto-generate configs, environments, or auxiliary assets unless explicitly requested.

CLEANLINESS

- Do NOT leave:
  - unused code
  - debug logs
  - test prints
  - dead blocks
  - commented-out logic
- Avoid technical debt and silent complexity.

DOCUMENTATION

- Documentation generation is allowed only inside a dedicated /docs (or /documentation) folder.
- Documentation MUST reflect existing implementation only — never speculative or future behavior.
- Documentation must never modify production code behavior.
- Code remains the single source of truth.

THREAT AWARENESS

- For all MEDIUM and HIGH risk changes, explicitly identify:
  - Potential failure modes
  - Security or misuse risks
  - Data exposure risks (if applicable)

DIFF DISCIPLINE

- Before execution, always specify:
  - Exact files to be modified
  - Nature of changes (add / modify / delete)
  - Rollback approach if needed

OBSERVABILITY DISCIPLINE

- Avoid silent failures.
- Ensure errors are surfaced clearly and consistently.
- Logging must never expose sensitive data.
- Prefer structured logs over ad-hoc prints when applicable.

PRIORITY & ENFORCEMENT

- These rules override all other instructions unless explicitly overridden by the user.
- If any instruction conflicts with these rules, these rules take precedence.
