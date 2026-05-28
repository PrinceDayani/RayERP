# Requirements Document

## Introduction

RayERP currently ships with a complete Tender backend (Tender model, controller, RBAC-protected routes, an eleven-stage lifecycle, and a `generateWorkOrder` action that auto-creates a Project and WorkOrder from an awarded tender). The previous draft of this spec assumed our company is always the tender ISSUER. That assumption was wrong: our company's primary use case is acting as a BIDDER responding to Indian government tenders, while we ALSO issue our own tenders to subcontractors and material vendors. This revision restructures the spec around a foundational `direction` discriminator on the Tender model and layers every other rule on top of it.

This feature, "Tender Project Workflow", delivers:

1. A foundational `direction` field on the Tender model (`'incoming' | 'outgoing'`) that drives all downstream semantics — UI, validation, document catalogue grouping, lifecycle states, RBAC, and the win-to-project handoff.
2. A typed, categorized document model (`tenderDocuments: ITenderDocument[]`) with one canonical `docType` enum that is reused across both directions; only the stage grouping and the "who authored vs received" perspective flips.
3. Two creation paths — direct form entry (both directions) and upload-driven creation from a government NIT/RFP PDF (incoming primary; outgoing optional / lower priority).
4. Direction-aware transition validation that blocks lifecycle advancement until the right documents are attached.
5. Competitor tracking on incoming tenders (via `bids[].isUs` flag) and an `outcomeForUs` summary field.
6. A win-to-project handoff for incoming tenders that mirrors the existing outgoing `generateWorkOrder` path.
7. A direction-aware frontend (list filter, detail page tabs, document checklist, bid panel) that reuses one rendering pipeline driven by a direction-aware catalogue.
8. A non-destructive migration of legacy `documents: string[]` data, with all pre-existing Tender records defaulted to `direction: 'outgoing'`.

**Explicitly OUT OF SCOPE (deferred to future specs):** OCR / auto-parsing of government tender PDFs; e-procurement portal integration (CPP Portal, GeM API, state portals); competitive-intelligence analytics across tenders; automated EMD return tracking. The upload-driven creation path only attaches the file and leaves all remaining form fields for the user.

## Requirements

### Requirement 1: Direction Discriminator (Foundational)

**User Story:** As a Tender Officer, I want every Tender to be explicitly labelled as `incoming` (we are the bidder responding to a published tender) or `outgoing` (we are the issuer publishing a tender that vendors bid into), so that all downstream behaviour — UI, validation, document semantics, lifecycle states, and the win/award handoff — branches correctly from a single source of truth.

#### Acceptance Criteria

1. WHEN the Tender model is extended THEN the system SHALL add a required field `direction: 'incoming' | 'outgoing'` with default value `'outgoing'` for backward compatibility with pre-existing records.
2. WHEN a Tender is created via any path THEN the user SHALL select `direction` BEFORE any other field is rendered, because the rest of the form, the document catalogue grouping, and the lifecycle state machine all depend on it.
3. WHEN the Tender record is persisted THEN `direction` SHALL be immutable; the system SHALL reject any update request that attempts to change `direction` with HTTP 400.
4. WHERE any controller, validator, or UI component branches on tender semantics (lifecycle states, required documents, RBAC scope, bid handling, project handoff) the implementation SHALL consult `direction` rather than infer from any other field.
5. WHEN the API returns a Tender DTO THEN `direction` SHALL always be present in the payload.
6. IF a legacy Tender record has no `direction` field at read time THEN the system SHALL treat it as `direction: 'outgoing'` (see Requirement 17 on migration).

### Requirement 2: Unified Doc-Type Enum, Direction-Aware Grouping

**User Story:** As a Tender Officer, I want one canonical set of document type codes that is reused across both incoming and outgoing tenders, with only the stage grouping and the "we author vs we receive" perspective flipping by direction, so that the system stays simple and consistent regardless of which side of the table we are on.

#### Acceptance Criteria

1. WHEN the system enumerates the canonical `docType` codes THEN the set SHALL be exactly: `nit`, `rfp`, `sow`, `boq-pdf`, `tech-specs`, `drawings`, `gcc-scc`, `pre-bid-minutes`, `corrigenda`, `tech-bid-env1`, `financial-bid-env2`, `emd-proof`, `co-registration`, `pan-gst`, `tax-clearance`, `class-registration`, `experience-certs`, `audited-financials`, `loa`, `pbg`, `sd-receipt`, `signed-agreement`, `work-order-doc`, `insurance`, `site-handover`.
2. WHEN the system groups doc-types by stage for an `incoming` tender THEN the catalogue SHALL be:
   1. **Inbound (received from govt portal — attached, not authored by us):** `nit`, `rfp`, `sow`, `boq-pdf`, `tech-specs`, `drawings`, `gcc-scc`, `pre-bid-minutes`, `corrigenda`.
   2. **Our-submission (we author and upload to the govt portal):** `tech-bid-env1`, `financial-bid-env2`, `emd-proof`, `co-registration`, `pan-gst`, `tax-clearance`, `class-registration`, `experience-certs`, `audited-financials`.
   3. **Post-award (if we win):** `loa` (received), `pbg` (we submit), `sd-receipt` (we pay), `signed-agreement`, `work-order-doc` (received from govt), `insurance` (we take out), `site-handover` (received).
3. WHEN the system groups doc-types by stage for an `outgoing` tender THEN the catalogue SHALL be:
   1. **Tender-publish (we author):** `nit`, `rfp`, `sow`, `boq-pdf`, `tech-specs`, `drawings`, `gcc-scc`, `pre-bid-minutes` (we record), `corrigenda` (we publish).
   2. **Vendor-bid (per vendor bid received):** `tech-bid-env1`, `financial-bid-env2`, `emd-proof`, `co-registration`, `pan-gst`, `tax-clearance`, `class-registration`, `experience-certs`, `audited-financials`.
   3. **Post-award:** `loa` (we issue), `pbg` (vendor submits), `sd-receipt` (vendor pays), `signed-agreement`, `work-order-doc` (we issue), `insurance` (vendor takes out), `site-handover`.
4. WHEN the catalogue is consulted at runtime THEN the system SHALL expose for each `(direction, docType)` pair: the `stageGroup` label, the `authoredByUs: boolean` flag, and the `required` flag (see Requirement 9 for which are required per transition).
5. WHEN any document is uploaded under a `docType` not present in the canonical enum THEN the system SHALL reject the request with HTTP 400.
6. WHERE a `docType` is naturally repeatable (e.g. `corrigenda`, `experience-certs`, `audited-financials`, `insurance`) the system SHALL allow more than one `tenderDocuments` entry with that same `docType`.

### Requirement 3: Typed Document Model (`tenderDocuments`)

**User Story:** As a Tender Officer, I want documents to be stored as typed slots grouped by lifecycle stage instead of a flat string array, so that I can see at a glance which required documents are missing and where each file belongs — regardless of whether the tender is incoming or outgoing.

#### Acceptance Criteria

1. WHEN the Tender model is extended THEN the system SHALL add a `tenderDocuments: ITenderDocument[]` array where each element contains `docType`, `stageGroup` (derived from direction + docType per Requirement 2), `required`, `file` (reference to ProjectFile), `uploadedBy`, `uploadedAt`, `status` (`'pending' | 'uploaded' | 'verified' | 'rejected'`), and `notes`.
2. WHEN a document is uploaded THEN the system SHALL persist the underlying file via the existing `ProjectFile` model and SHALL store only the `ProjectFile._id` reference inside the `tenderDocuments` entry.
3. WHEN the same `docType` already has a non-repeatable `tenderDocuments` entry on the Tender THEN the system SHALL replace the existing file reference and mark `status = 'uploaded'`, preserving the previous version id in the audit trail.
4. WHEN a bid is created THEN the system SHALL extend the bid sub-schema with its own `bidDocuments: ITenderDocument[]` field using the same shape, scoped to vendor-bid / our-submission `docType`s per direction.
5. WHEN a document's `status` is changed (e.g. reviewer marks it `'verified'` or `'rejected'`) THEN the system SHALL append an audit-trail entry recording the prior status, the new status, the user, and the timestamp.
6. IF an entry has `required = true` and no `file` set THEN the system SHALL treat its `status` as `'pending'` regardless of any stored value.

### Requirement 4: Tender Creation - Path A (Direct Form Entry, Both Directions)

**User Story:** As a Tender Officer with `tenders.respond` or `tenders.issue` permission, I want to create a new Tender by first picking the direction and then filling a step-by-step form, so that I can register either an incoming government tender or an outgoing subcontractor tender from scratch.

#### Acceptance Criteria

1. WHEN a user opens the "New Tender" page THEN the system SHALL display a direction picker (`Incoming` / `Outgoing`) as the first step, BEFORE any other form field.
2. WHEN the user selects a direction THEN the system SHALL render a multi-step form covering Basic Info, Scope and Eligibility, Financials, Timeline, Evaluation Criteria, and Documents, with field labels and helper text adapted to that direction.
3. WHEN the user submits the form with `tenderNumber`, `title`, `type`, `category`, `estimatedValue`, `currency`, and `direction` populated THEN the system SHALL create a Tender record with `createdBy` set to the current user and the initial status set per Requirement 8 (`'draft'` for outgoing, `'identified'` for incoming).
4. IF the user submits the form with a duplicate `tenderNumber` THEN the system SHALL reject the request with a validation error and SHALL NOT create the record.
5. WHEN the Tender is created THEN the system SHALL append an audit-trail entry with `action = 'tender.created'`, `details = { direction }`, and the creating user's id.
6. WHILE the Tender is in its earliest editable state (`draft` for outgoing; `identified` or `evaluating-pursuit` or `preparing-bid` for incoming) the system SHALL allow the user to edit any field and upload documents into any stage-appropriate slot.
7. IF the user lacks `tenders.respond` THEN the system SHALL hide the `Incoming` option on the direction picker; IF the user lacks `tenders.issue` THEN the system SHALL hide the `Outgoing` option; IF the user lacks both THEN the system SHALL NOT render the "New Tender" entry point at all.

### Requirement 5: Tender Creation - Path B (Upload-Driven from NIT/RFP PDF)

**User Story:** As a Tender Officer, I want to start a new Tender by uploading a source NIT/RFP PDF, so that the source document is captured from minute one and I do not have to re-attach it later. This is the primary path for incoming tenders; for outgoing tenders it is optional and lower priority.

#### Acceptance Criteria

1. WHEN the user selects "Create from Tender PDF" on the New Tender page THEN the system SHALL ask for the direction first, then present a single-file upload control accepting PDF only.
2. WHEN the user uploads a PDF for an `incoming` tender and confirms THEN the system SHALL create a Tender record with `direction = 'incoming'`, `status = 'identified'`, persist the file via the existing `ProjectFile` upload pipeline, and attach the resulting ProjectFile reference to a `tenderDocuments` entry with `docType = 'nit'` and the appropriate `stageGroup` (inbound).
3. WHEN the user uploads a PDF for an `outgoing` tender and confirms THEN the system SHALL create a Tender record with `direction = 'outgoing'`, `status = 'draft'`, persist the file, and attach it as `docType = 'nit'` in the tender-publish stage group; this outgoing-side flow is OPTIONAL functionality and MAY be deferred behind a feature flag.
4. WHEN the upload-driven Tender is created THEN the system SHALL navigate the user to the same step-by-step form used in Path A (already scoped to the chosen direction), pre-populating only `tenderNumber` (auto-generated placeholder) and leaving all other fields blank.
5. IF the uploaded file is not a PDF or exceeds the configured max size THEN the system SHALL reject the upload with a clear error and SHALL NOT create the Tender record.
6. WHEN the upload succeeds THEN the system SHALL append an audit-trail entry with `action = 'tender.created.from-upload'` containing the ProjectFile id and the chosen direction in `details`.
7. WHERE OCR or automated field extraction is concerned the system SHALL NOT attempt any parsing of the uploaded PDF; the file is stored as-is and all other Tender fields remain user-entered.

### Requirement 6: Bid Records and Competitor Tracking

**User Story:** As a Tender Officer working an incoming government tender, I want to track our own bid AND any competitor bids we learn about (e.g. from public bid-opening lists), so that we keep a complete history of the competitive landscape; and on outgoing tenders, I want the same `bids[]` array to record each vendor's bid, so that one model serves both directions.

#### Acceptance Criteria

1. WHEN the bid sub-schema is extended THEN the system SHALL add a boolean field `isUs: boolean` (default `false`) to each entry in `bids[]`.
2. WHEN a Tender has `direction = 'incoming'` THEN the system SHALL require exactly ONE bid in `bids[]` with `isUs = true` (representing our submission); additional bids in `bids[]` SHALL all have `isUs = false` and represent competitor bid records added as we learn of them.
3. WHEN a Tender has `direction = 'outgoing'` THEN the system SHALL require that no bid carries `isUs = true`; every entry SHALL represent a vendor bid received from an external party.
4. WHEN the `awardedBidder` reference is set THEN for incoming tenders it MAY point to our own Company-Contact-of-record (if we won) or to a competitor's Contact (if a competitor won); for outgoing tenders it SHALL point to the winning vendor's Contact.
5. WHEN a Tender has `direction = 'incoming'` THEN the system SHALL add an `outcomeForUs: 'won' | 'lost' | 'cancelled' | 'withdrawn' | 'pending'` field defaulting to `'pending'`; for outgoing tenders this field SHALL be absent and the existing lifecycle (`awarded` → `work-order-issued`) SHALL serve as the outcome signal.
6. WHEN a user adds or edits a competitor bid (any bid with `isUs = false` on an incoming tender) THEN the actor SHALL hold `tenders.competitor-intel` permission.
7. WHEN a user adds, edits, or removes our own bid (the `isUs = true` entry) on an incoming tender, or any vendor bid on an outgoing tender, THEN the actor SHALL hold `tenders.manage_bids` permission.

### Requirement 7: Win-to-Project Handoff (Incoming) and Work-Order Handoff (Outgoing)

**User Story:** As a Project Manager, I want a project to be auto-created at the right hand-off point regardless of direction — when we win an incoming tender, or when we issue a work order on an outgoing tender — so that execution starts cleanly with all tender documents already attached.

#### Acceptance Criteria

1. WHEN a Tender has `direction = 'incoming'` and `outcomeForUs` is updated to `'won'` THEN the system SHALL invoke `generateProjectFromWonTender` (a new function) which SHALL auto-create a Project record, set `Tender.project = newProjectId`, and copy / link all existing tender documents to the Project per Requirement 13.
2. WHEN a Tender has `direction = 'outgoing'` and transitions to `work-order-issued` THEN the system SHALL invoke the existing `generateWorkOrder` action, which SHALL auto-create both a Project and a WorkOrder and link them to the Tender.
3. WHEN either handoff function executes THEN the Tender record SHALL remain the source of truth for the bid history (incoming) or vendor selection (outgoing); the Project takes over execution, but the Tender is not closed.
4. WHEN documents are attached to a Tender AFTER the handoff THEN the system SHALL also associate the resulting ProjectFile with the linked Project (see Requirement 13).
5. IF `generateProjectFromWonTender` is invoked on a Tender that is not incoming OR whose `outcomeForUs` is not `'won'` THEN the system SHALL reject the call with HTTP 400.
6. IF `generateWorkOrder` is invoked on a Tender that is not outgoing THEN the system SHALL reject the call with HTTP 400.
7. WHEN either handoff completes THEN the system SHALL append an audit-trail entry with `action = 'tender.project.handoff'` and `details = { direction, projectId, workOrderId? }`.

### Requirement 8: Lifecycle States Split by Direction

**User Story:** As a Tender Officer, I want the tender lifecycle to model what actually happens on the ground for each direction, so that I can pick the right transition at the right time without confusing fields meant for the other side.

#### Acceptance Criteria

1. WHEN a Tender has `direction = 'incoming'` THEN the valid `status` values SHALL be: `'identified'`, `'evaluating-pursuit'`, `'preparing-bid'`, `'bid-submitted'`, `'awaiting-result'`, `'won'`, `'lost'`, `'withdrawn-by-us'`, `'cancelled'`, `'in-progress'`, `'completed'`.
2. WHEN a Tender has `direction = 'outgoing'` THEN the valid `status` values SHALL be: `'draft'`, `'published'`, `'bid-submission'`, `'evaluation'`, `'negotiation'`, `'awarded'`, `'work-order-issued'`, `'in-progress'`, `'completed'`, `'cancelled'`, `'no-bid'`.
3. WHEN the system stores `status` THEN the underlying enum SHALL be the union of both lists; the validation layer SHALL reject any `(direction, status)` combination that is not in the direction-specific list above with HTTP 400.
4. WHEN the system loads `VALID_TRANSITIONS` THEN it SHALL be split by direction into `VALID_TRANSITIONS_INCOMING` and `VALID_TRANSITIONS_OUTGOING` maps, and the controller SHALL select the right map based on `tender.direction`.
5. WHEN a user attempts a transition not in the direction-appropriate map THEN the system SHALL reject the request with HTTP 400 and a message listing the legal next states for the current `(direction, status)`.
6. WHILE a Tender is in `cancelled`, `no-bid`, `lost`, or `withdrawn-by-us` status the system SHALL NOT permit further forward transitions; only a user with `tenders.manage` MAY reset the Tender to its earliest editable state for that direction (`draft` for outgoing, `identified` for incoming).

### Requirement 9: Transition Validation — Required Documents (Direction-Aware)

**User Story:** As a Tender Officer, I want the system to block lifecycle transitions when required documents are missing, where the required documents depend on the direction of the tender, so that no tender progresses without the paperwork the law or our internal process requires.

#### Acceptance Criteria

1. WHEN `direction = 'outgoing'` and a user attempts to transition from `draft` to `published` THEN the system SHALL verify that `tenderDocuments` contains entries with `status` in `('uploaded', 'verified')` for each of: `nit`, `rfp`, `sow`, `boq-pdf`; AND the existing rules that `submissionDeadline` is set and at least one `evaluationCriteria` entry exists SHALL still apply.
2. WHEN `direction = 'outgoing'` and a user attempts to transition from `evaluation` to `awarded` THEN the system SHALL require exactly one bid with `status = 'selected'` AND that bid's `bidDocuments` SHALL contain `tech-bid-env1`, `financial-bid-env2`, and `emd-proof` with `status` in `('uploaded', 'verified')`.
3. WHEN `direction = 'outgoing'` and a user attempts to transition from `awarded` to `work-order-issued` THEN the system SHALL require `tenderDocuments` to contain `loa` and `pbg` with `status` in `('uploaded', 'verified')`.
4. WHEN `direction = 'incoming'` and a user attempts to transition from `preparing-bid` to `bid-submitted` THEN the system SHALL require `tenderDocuments` (our-submission stage group) to contain `tech-bid-env1`, `financial-bid-env2`, and `emd-proof` with `status` in `('uploaded', 'verified')`.
5. WHEN `direction = 'incoming'` and a user attempts to set `outcomeForUs = 'won'` (or transition `awaiting-result` to `won`) THEN the system SHALL require `tenderDocuments` (post-award stage group) to contain `loa` with `status` in `('uploaded', 'verified')`.
6. WHEN `direction = 'incoming'` and `outcomeForUs = 'won'` and the system attempts to invoke `generateProjectFromWonTender` THEN the system SHALL require `tenderDocuments` to contain `pbg` (or the configured post-award gating doc, defaulting to `pbg`) with `status` in `('uploaded', 'verified')`.
7. IF any required document or existing rule is unsatisfied THEN the system SHALL reject the transition with HTTP 400 and a response listing each missing requirement by `docType` label.
8. WHEN any lifecycle transition succeeds THEN the system SHALL append an audit-trail entry recording `previousStatus`, `newStatus`, `direction`, `performedBy`, and the timestamp.

### Requirement 10: RBAC Matrix (Direction-Aware Extensions)

**User Story:** As a System Administrator, I want each tender and document action to be gated by the correct permission — including new permissions that recognize the bidder-vs-issuer split — so that least-privilege is enforced consistently across the UI and API.

#### Acceptance Criteria

1. WHEN the system checks permissions THEN the canonical mapping SHALL be:
   1. View tender list / detail — `tenders.view`
   2. Act on an `incoming` tender (create, edit while editable, upload our-submission docs, set outcome) — `tenders.respond` (NEW)
   3. Act on an `outgoing` tender (create, edit while in `draft`, upload tender-publish docs) — `tenders.issue` (NEW; effectively the scope previously occupied by `tenders.create` / `tenders.manage` for outgoing flows)
   4. Add / edit competitor bid records on an incoming tender (any bid with `isUs = false`) — `tenders.competitor-intel` (NEW)
   5. Manage bids (add our own bid on incoming, add any vendor bid on outgoing, upload bid-stage documents) — `tenders.manage_bids`
   6. Score / evaluate bids — `tenders.evaluate`
   7. Transition `evaluation -> awarded` on outgoing tenders and upload outgoing post-award docs — `tenders.award`
   8. Force re-open / override transition rules / cancel a tender / re-classify legacy docs — `tenders.manage`
   9. View existing list/detail pages — `tenders.view` (unchanged)
2. WHEN a user lacks the required permission for an action THEN the API SHALL return HTTP 403 and the UI SHALL hide or disable the corresponding control.
3. WHEN a document's `status` is changed to `'verified'` or `'rejected'` THEN the actor SHALL hold the permission that governs uploading that document in that direction (e.g. `tenders.respond` for our-submission docs on incoming; `tenders.award` for post-award docs on outgoing).
4. IF a user holds `tenders.manage` THEN the system SHALL implicitly grant `tenders.respond`, `tenders.issue`, `tenders.competitor-intel`, `tenders.manage_bids`, `tenders.evaluate`, and `tenders.award` for the duration of the request.
5. WHEN existing roles are seeded / migrated THEN any role that previously held `tenders.create` SHALL be granted `tenders.issue` to preserve outgoing-side capability without manual intervention.

### Requirement 11: Frontend — Tender List Page (Direction Filter)

**User Story:** As a Tender Officer, I want a Tender List page with a prominent top-level filter for Incoming / Outgoing / All, so that I can quickly slice the workload to whichever side I am working on.

#### Acceptance Criteria

1. WHEN a user with `tenders.view` navigates to the Tender List page THEN the system SHALL display a paginated table with columns: Direction (badge), Tender Number, Title, Type, Category, Status, Estimated Value, Submission Deadline (incoming) / Bid Submission End Date (outgoing), Outcome (incoming only), Created By.
2. WHEN the page renders THEN the system SHALL display a top-level segmented control "Incoming / Outgoing / All" as the most prominent filter, persisted in the URL query string.
3. WHEN the user applies additional filters on Status, Category, Department, date range, or outcome THEN the system SHALL refetch results matching the combined filter set.
4. WHEN the user clicks a row THEN the system SHALL navigate to the Tender Detail page for that tender.
5. WHEN the user has `tenders.respond` OR `tenders.issue` THEN the page SHALL render a "New Tender" button offering Path A and Path B as entry options (per Requirements 4 and 5); the direction picker is the first step on either path.
6. IF the user lacks `tenders.view` THEN the route SHALL not be reachable and the navigation entry SHALL be hidden.

### Requirement 12: Frontend — Tender Detail Page with Direction-Aware Tabs

**User Story:** As a Tender Officer working on an in-flight tender, I want a detail page whose tabs and content adapt to BOTH the tender's direction and its current stage, so that I see only the controls and data relevant to right-now and I never see issuer-side controls on an incoming tender (or vice versa).

#### Acceptance Criteria

1. WHEN the Tender Detail page loads for an `incoming` tender THEN the system SHALL render tabs: Overview, Documents (Inbound / Our Submission / Post-Award), Our Bid, Competitors, Result, Timeline, Audit Trail.
2. WHEN the Tender Detail page loads for an `outgoing` tender THEN the system SHALL render tabs: Overview, Documents (Tender-Publish / Vendor-Bid / Post-Award), Vendor Bids, Evaluation, Award, Timeline, Audit Trail.
3. WHERE the current `status` is the earliest editable state for that direction (`draft` for outgoing; `identified` / `evaluating-pursuit` / `preparing-bid` for incoming) the relevant later tabs SHALL be visible but disabled with an explanatory tooltip; the Documents tab SHALL be fully active.
4. WHEN the user clicks a stage-transition button (e.g. "Publish", "Open Bids", "Award", "Issue Work Order" for outgoing; "Mark Bid Submitted", "Record Outcome: Won/Lost", "Generate Project" for incoming) THEN the system SHALL preflight Requirement 9's validation client-side and show inline blocking errors if any required documents are missing.
5. WHEN the page renders the Documents tab THEN it SHALL render each `docType` as a labelled slot card (not a generic dropzone) with: label, "Required" badge if applicable for the current direction-and-stage policy, current status badge (`pending`/`uploaded`/`verified`/`rejected`), upload button, replace button, and history link; the same component SHALL be reused for both directions, driven by the direction-aware catalogue from Requirement 2.
6. WHEN the page renders the Our Bid panel on an incoming tender THEN it SHALL show OUR submission prominently (the bid with `isUs = true`) with its `bidDocuments` checklist; the Competitors sub-section / tab SHALL list bids with `isUs = false` and SHALL be gated by `tenders.competitor-intel`.

### Requirement 13: Documents Flow into the Project File System (Both Directions)

**User Story:** As a Project Manager viewing the project that was generated from a tender (whether we won an incoming tender or issued a work order on an outgoing tender), I want all tender-sourced documents to appear inside the project's file area so that I do not have to bounce between the Tender screen and the Project screen.

#### Acceptance Criteria

1. WHEN either `generateProjectFromWonTender` (incoming) or `generateWorkOrder` (outgoing) creates a Project from a Tender THEN the system SHALL associate every existing `tenderDocuments[].file` ProjectFile with the newly created Project (setting `ProjectFile.project = newProjectId`).
2. WHEN a ProjectFile is associated with the Project via either flow THEN the system SHALL preserve `sourceTender` (ref to the Tender), `docType`, and `stageGroup` on the ProjectFile as metadata/tags so the file is filterable inside the Project file UI.
3. WHEN the Project file UI is rendered for a Project linked to a Tender THEN it SHALL display a "Tender Documents" section grouped by `stageGroup` (using the direction-appropriate labels from Requirement 2) listing every ProjectFile that carries a `sourceTender` tag.
4. WHEN a new document is uploaded against the Tender AFTER the Project has been generated THEN the system SHALL also associate the newly created ProjectFile with the linked Project.
5. IF the Tender has no linked Project yet THEN tender-sourced ProjectFiles SHALL exist without a `project` reference until the appropriate handoff function runs.
6. IF the user opening the Project lacks `tenders.view` THEN the "Tender Documents" section SHALL be hidden, but other (non-tender) project files SHALL still display per their existing permissions.

### Requirement 14: Frontend — Bid Panel and Competitor Sub-Section

**User Story:** As a Tender Officer, I want the bid panel to clearly distinguish OUR bid from competitor bids on incoming tenders, and to manage vendor bids on outgoing tenders, so that I never confuse the two sides.

#### Acceptance Criteria

1. WHEN the Bid panel is opened on an `incoming` tender THEN the system SHALL show the bid with `isUs = true` at the top of the panel with full document checklist (our-submission docs) and a "Competitors" sub-section listing all `isUs = false` bids.
2. WHEN the Bid panel is opened on an `outgoing` tender THEN the system SHALL list every vendor bid with bidder name, bid amount, currency, status, and a "View / Manage" action — there SHALL be no "Our Bid" treatment because no bid carries `isUs = true`.
3. WHEN a bid is opened THEN the system SHALL render a Bid Documents section in the same labelled-checklist pattern as the Tender Documents tab (Requirement 12.5), scoped to this bid's `bidDocuments`.
4. WHEN the user with `tenders.evaluate` marks a bid document as `'verified'` or `'rejected'` THEN the system SHALL persist the change and refresh the status badge without a full page reload.
5. WHEN the user with `tenders.award` clicks "Select Bid" on an outgoing-tender bid that satisfies Requirement 9.2 THEN the system SHALL set that bid's `status = 'selected'` and unlock the `evaluation -> awarded` transition button.
6. IF the user clicks "Select Bid" on a bid that does NOT satisfy Requirement 9.2 THEN the system SHALL display an inline error listing the missing required bid documents and SHALL NOT change the bid status.
7. IF the user adds or edits a competitor bid record without `tenders.competitor-intel` THEN the API SHALL return HTTP 403 and the UI SHALL hide the "Add Competitor" / "Edit Competitor" controls.

### Requirement 15: Audit Trail Extension for Document and Direction Actions

**User Story:** As a Compliance Officer, I want every document action and direction-sensitive event on a Tender to be recorded in the audit trail with actor, timestamp, and before/after state, so that we can demonstrate procurement integrity to auditors regardless of which side of the table we sat on.

#### Acceptance Criteria

1. WHEN a document is uploaded into any `tenderDocuments` or `bidDocuments` slot THEN the system SHALL append an audit-trail entry with `action = 'document.uploaded'`, `performedBy`, `timestamp`, and `details = { direction, docType, stageGroup, fileId, bidId?, isUs? }`.
2. WHEN a document is replaced (same docType, new file) THEN the system SHALL append `action = 'document.replaced'` with `details = { direction, docType, previousFileId, newFileId }`.
3. WHEN a document's status is changed THEN the system SHALL append `action = 'document.status-changed'` with `details = { direction, docType, previousStatus, newStatus }`.
4. WHEN a document is deleted (only allowed in the earliest editable state for the direction by a user with `tenders.manage`) THEN the system SHALL append `action = 'document.deleted'` with `details = { direction, docType, fileId }` and SHALL soft-delete the underlying ProjectFile rather than purging it.
5. WHEN `outcomeForUs` is set on an incoming tender THEN the system SHALL append `action = 'tender.outcome.recorded'` with `details = { previousOutcome, newOutcome }`.
6. WHEN a competitor bid is added or edited THEN the system SHALL append `action = 'tender.competitor.added'` or `'tender.competitor.updated'` with `details = { bidId, bidderName }`.
7. WHEN the Audit Trail tab on the Tender Detail page is rendered THEN the system SHALL display all `document.*` and `tender.*` entries chronologically with actor name, action label, and a "View details" expander.

### Requirement 16: Direction-Aware Validation Layer

**User Story:** As a Backend Engineer, I want one validation entry-point that decides what is legal for the current `(direction, status, docType, bid.isUs)` combination, so that we do not scatter direction-checks across controllers.

#### Acceptance Criteria

1. WHEN the API receives any state-changing request on a Tender THEN the controller SHALL first resolve `tender.direction` and SHALL route the request through the matching direction-specific validator module (e.g. `incomingTenderValidator`, `outgoingTenderValidator`).
2. WHEN the validator processes a transition request THEN it SHALL consult `VALID_TRANSITIONS_INCOMING` or `VALID_TRANSITIONS_OUTGOING` (per Requirement 8) AND the document-requirements policy (per Requirement 9) before allowing the transition.
3. WHEN the validator processes a bid request THEN it SHALL enforce the `isUs` invariants from Requirement 6 (exactly one `isUs = true` on incoming; none on outgoing).
4. WHEN the validator processes a document-upload request THEN it SHALL confirm that the chosen `docType` is in the canonical enum (Requirement 2.1) AND that its `stageGroup` resolution for the tender's direction is legal.
5. IF any direction-aware rule is violated THEN the system SHALL return HTTP 400 with a machine-readable error code (e.g. `TENDER_DIRECTION_IMMUTABLE`, `INVALID_TRANSITION_FOR_DIRECTION`, `MISSING_REQUIRED_DOCS`, `ISUS_INVARIANT_VIOLATED`) and a human-readable message.

### Requirement 17: Data Migration of Legacy Records and `documents: string[]`

**User Story:** As a System Administrator deploying this feature to an environment that already holds Tender records (created under the issuer-only assumption), I want a non-destructive migration that defaults legacy records to `direction: 'outgoing'` and lifts the flat `documents: string[]` field into the typed `tenderDocuments` model.

#### Acceptance Criteria

1. WHEN the migration script runs against an existing Tender record THEN the system SHALL set `direction = 'outgoing'` for any record that lacks the field, and SHALL append an audit-trail entry with `action = 'tender.direction.defaulted-outgoing'`.
2. WHEN the migration script runs THEN for each string in a Tender's legacy `documents` array, the system SHALL create a corresponding `tenderDocuments` entry with `docType = 'unclassified-legacy'`, `stageGroup` resolved to the legacy "tender" stage under outgoing semantics, `status = 'uploaded'`, `notes = 'Migrated from legacy documents array'`, and `file` populated by either resolving the string to an existing ProjectFile or by registering a placeholder ProjectFile pointing at the original URL/path.
3. WHEN the migration completes for a Tender THEN the system SHALL leave the legacy `documents: string[]` field intact (read-only) for one release cycle and SHALL mark the Tender's audit trail with `action = 'tender.documents.migrated'`.
4. WHEN the migration runs on bids THEN the system SHALL apply the same logic to each bid's legacy `documents: string[]` field, producing `bidDocuments` entries with `docType = 'unclassified-legacy'`; bids on migrated (outgoing) tenders SHALL have `isUs = false`.
5. WHILE the legacy field still exists post-migration the API SHALL continue to return both `documents` (legacy, read-only) and `tenderDocuments` (canonical) so any in-flight integrations are not broken.
6. WHEN `docType = 'unclassified-legacy'` is present on a Tender THEN the UI SHALL surface a banner prompting a user with `tenders.manage` to re-classify those entries into proper `docType` slots.
7. IF the migration encounters a legacy string that cannot be resolved to any file or URL THEN the system SHALL log the failure and SHALL NOT abort the migration for the rest of the Tender's documents.
8. WHEN existing roles are migrated THEN any role previously holding `tenders.create` SHALL also be granted `tenders.issue` (per Requirement 10.5); no role is automatically granted `tenders.respond` or `tenders.competitor-intel` — those SHALL be assigned by an administrator.

### Requirement 18: Non-Functional Requirements

**User Story:** As a System Administrator, I want clear non-functional guarantees around file size, MIME types, performance, and audit retention so that the feature behaves predictably in production for both incoming and outgoing flows.

#### Acceptance Criteria

1. WHEN any document is uploaded THEN the system SHALL enforce a per-file maximum of 25 MB and SHALL reject larger files with HTTP 413 and a clear error message.
2. WHEN any document is uploaded THEN the system SHALL accept only MIME types in the allowlist: `application/pdf`, `image/png`, `image/jpeg`, `image/jpg`, `image/webp`; for the upload-driven Tender creation path (Requirement 5) the allowlist SHALL be restricted to `application/pdf` only.
3. IF a file's MIME type is not in the allowlist OR its declared extension does not match its sniffed content type THEN the system SHALL reject the upload with HTTP 415.
4. WHEN the Tender List page is loaded THEN the API SHALL return the first page within 1500 ms p95 on a dataset of up to 10,000 tenders (combined across both directions), paginating server-side at 25 rows per page; the direction filter SHALL be a query parameter, not a separate endpoint.
5. WHEN the Tender Detail page is loaded THEN the API SHALL return the full tender (including `tenderDocuments` with populated ProjectFile refs but excluding raw file bytes) within 1000 ms p95.
6. WHILE the audit trail grows the system SHALL retain audit entries for the full lifetime of the Tender record and SHALL NOT prune them; archival of completed tenders is out of scope for this feature.
7. WHEN any API endpoint introduced by this feature is called THEN it SHALL validate input against a Zod (or equivalent) schema and SHALL return structured `400` errors enumerating each invalid field; direction-aware error codes (Requirement 16.5) SHALL be used where applicable.
8. WHERE the user's locale is set the system SHALL render dates in `dd-MMM-yyyy` and monetary values in INR with the Indian digit-grouping convention by default.

### Requirement 19: Explicit Out-of-Scope Boundaries

**User Story:** As a Reviewer, I want the spec to call out what is explicitly NOT being built, so that I do not waste cycles asking about features that have been deliberately deferred.

#### Acceptance Criteria

1. WHEN the implementation team interprets this spec THEN they SHALL treat the following as OUT OF SCOPE: (a) OCR or AI-based parsing of government tender PDFs to auto-populate Tender fields; (b) integration with e-procurement portals (CPP Portal, GeM API, state tender portals) for either reading published tenders or submitting bids; (c) cross-tender competitive-intelligence analytics or dashboards (win-rate by competitor, etc.); (d) automated EMD return tracking and reconciliation.
2. WHEN any of the above out-of-scope topics arise during implementation THEN the system SHALL gracefully no-op or defer to manual workflows; specifically, the upload-driven creation path (Requirement 5) SHALL only attach the PDF and SHALL NOT attempt to read its contents.
3. WHEN future specs are written to cover any of the out-of-scope items THEN they SHALL build on the `direction` discriminator and the unified `docType` enum established here; this spec does not preclude them, it just does not deliver them.

---

Do the requirements look good? If so, we can move on to the design.
