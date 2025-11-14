# Accounting Modes - Western vs Indian

## System Overview

RayERP supports **TWO accounting modes** that can be switched dynamically:

### 🌍 Western Mode (Default)
- **Account**: Chart of accounts with balances
- **Ledger**: Transaction history (audit trail) - read-only entries created when journal entries are posted
- **Use case**: Standard double-entry bookkeeping, financial statements

### 🇮🇳 Indian Mode (Tally-style)
- **Account**: Chart of accounts with balances
- **PartyLedger**: Party-specific ledgers with contact info, GST, PAN, bank details
- **Ledger**: Transaction history (audit trail)
- **Use case**: Indian accounting with party management, GST compliance

## Model Purposes

### Account (Both Modes)
```typescript
{
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  openingBalance: number;
}
```
- Core chart of accounts
- Used in both modes
- Balance updated when journal entries are posted

### Ledger (Both Modes)
```typescript
{
  accountId: ObjectId;
  date: Date;
  debit: number;
  credit: number;
  balance: number;
  journalEntryId: ObjectId;
}
```
- **Purpose**: Transaction history / audit trail
- **Read-only**: Created automatically when posting journal entries
- **Used for**: Account statements, transaction reports

### PartyLedger (Indian Mode Only)
```typescript
{
  code: string;
  name: string;
  accountId: ObjectId;
  currentBalance: number;
  gstInfo: { gstNo, gstType };
  taxInfo: { panNo, tanNo, cinNo };
  contactInfo: { email, phone, address };
  bankDetails: { accountNumber, ifscCode };
  creditLimit: number;
  creditDays: number;
}
```
- **Purpose**: Party (customer/vendor) management
- **Indian-specific**: GST, PAN, TAN compliance
- **Links to**: Account via accountId
- **Balance**: Updated when posting journal entries

## API Endpoints

### Get Current Settings
```http
GET /api/settings
```

### Switch Mode
```http
POST /api/settings/switch-mode
{
  "mode": "western" | "indian"
}
```

### Convert to Indian Mode
```http
POST /api/settings/convert-to-indian
```
- Switches to Indian mode
- Creates PartyLedger entries for all asset/liability accounts
- Preserves all existing data

### Convert to Western Mode
```http
POST /api/settings/convert-to-western
```
- Switches to Western mode
- Preserves PartyLedger data (not deleted)
- Can switch back to Indian mode anytime

## Usage Examples

### Check Current Mode
```javascript
const settings = await Settings.findOne();
console.log(settings.accountingMode); // 'western' or 'indian'
```

### Switch to Indian Mode
```javascript
// Simple switch
await fetch('/api/settings/switch-mode', {
  method: 'POST',
  body: JSON.stringify({ mode: 'indian' })
});

// Convert with party ledger creation
await fetch('/api/settings/convert-to-indian', {
  method: 'POST'
});
```

### Conditional Logic Based on Mode
```javascript
const settings = await Settings.findOne();

if (settings.accountingMode === 'indian') {
  // Show PartyLedger UI
  // Display GST fields
  // Show party-wise reports
} else {
  // Show standard account UI
  // Hide GST fields
}
```

## Posting Journal Entries

### Western Mode
```javascript
// Only updates Account balance
await Account.findByIdAndUpdate(accountId, { balance: newBalance });
await Ledger.create({ accountId, debit, credit, balance });
```

### Indian Mode
```javascript
// Updates both Account and PartyLedger
await Account.findByIdAndUpdate(accountId, { balance: newBalance });

const party = await PartyLedger.findOne({ accountId });
if (party) {
  await PartyLedger.findByIdAndUpdate(party._id, { 
    currentBalance: newPartyBalance 
  });
}

await Ledger.create({ accountId, debit, credit, balance });
```

## Migration Strategy

### From Western to Indian
1. Click "Convert to Indian Mode"
2. System creates PartyLedger for asset/liability accounts
3. Balances copied from Account to PartyLedger
4. All existing data preserved

### From Indian to Western
1. Click "Convert to Western Mode"
2. System switches mode
3. PartyLedger data preserved (not deleted)
4. Can switch back anytime

## Best Practices

1. **Choose mode at setup**: Decide early based on business location
2. **Indian businesses**: Use Indian mode for GST compliance
3. **International businesses**: Use Western mode for simplicity
4. **Switching**: Safe to switch anytime, data is preserved
5. **Testing**: Test mode switch in development before production

## Technical Notes

- Mode stored in `Settings` collection (singleton)
- PartyLedger always available (backward compatible as AccountLedger)
- Ledger model simplified (removed duplicate contact/tax fields)
- Journal entry posting logic checks mode automatically
- No data loss when switching modes
