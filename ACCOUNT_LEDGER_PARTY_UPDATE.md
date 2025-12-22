# Account Ledger Party & Attachments Update

## Changes Made:

### 1. Backend (journalEntry.routes.ts)
- Updated GET routes to populate `contactInfo` from accounts
- Both `/api/journal-entries` and `/api/journal-entries/:id` now include party information

### 2. Frontend (JournalEntry.tsx)
- Added "Party" column showing From/To direction with contact info
- Added View Entry dialog with:
  - From/To badges for each transaction line
  - Party contact details (email/phone)
  - File attachments with download links

### 3. Frontend (AccountLedger.tsx)
- Added "From/To" column in ledger entries table
- Shows direction badge (To/From) with counterparty account name
- View dialog includes:
  - From/To badges for all accounts in the entry
  - Attachments section with download buttons

## Backend Update Needed:

Update `getAccountLedger` in `generalLedgerController.ts` around line 1055:

```typescript
journalEntryId: {
  _id: entry._id,
  entryNumber: entry.entryNumber,
  reference: entry.reference,
  description: entry.description,
  date: entry.entryDate || entry.date,
  entries: entry.lines.map((l: any) => ({
    account: { code: l.account?.code || '', name: l.account?.name || '' },
    debit: l.debit,
    credit: l.credit,
    description: l.description
  })),
  attachments: entry.attachments || [],
  createdBy: entry.createdBy,
  status: entry.status
},
```

This ensures the ledger view has complete journal entry details including attachments.
