# RayERP Keyboard Shortcuts

## Universal Shortcuts

### Account Management
- **Alt + C** - Create New Account (works anywhere with AccountSelector component)
  - Available in: Journal Entry, Account Management page, and any form with account selection
  - Does not work when typing in input fields
- **Alt + A + T** - Create New Account Type (sequence: hold Alt, press A, then T)
  - Available in: Account Creation Form
  - Does not work when typing in input fields

### Entry Creation
- **Alt + X** - Create Entry (context-aware)
  - In Account Ledger: Creates entry specific to that account
  - In Journal Entry page: Resets form for new entry
  - Anywhere else: Opens general journal entry page
  - Does not work when typing in input fields
- **Alt + X + X** - Create General Entry (double press, only in Account Ledger)
  - Bypasses account-specific context and opens general journal entry page
  - Does not work when typing in input fields

### Global Search (Finance)
- **Alt + S + A** - Search Accounts
  - Search by code, name, type
  - Navigate with ↑↓, select with Enter
  - Opens account ledger on selection
  - Does not work when typing in input fields
- **Alt + S + D** - Search Entries (Documents)
  - Search by entry number, reference, description
  - Navigate with ↑↓, select with Enter
  - Opens journal entry detail on selection
  - Does not work when typing in input fields

## Navigation Shortcuts

### Page Navigation
- **Escape** - Navigate back in folder hierarchy
  - If focused on input/textarea: Blur the field
  - If dialog is open: Let dialog handle it (close dialog)
  - Otherwise: Go back to previous page
  - Works universally across all dashboard pages

### Table/List Navigation
- **↑ Arrow Up** - Move selection up
- **↓ Arrow Down** - Move selection down
- **Enter** - Select/Open current item

Currently available in:
- Finance Accounts page

## Implementation

### For Developers

#### Add keyboard navigation to any table/list:
```tsx
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

const { getRowProps } = useKeyboardNavigation({
  items: yourArray,
  onSelect: (item) => handleSelect(item),
  enabled: true // optional
});

// In your table:
{items.map((item, index) => (
  <TableRow {...getRowProps(index)}>
    {/* content */}
  </TableRow>
))}
```

#### Add Alt+C shortcut to create accounts:
```tsx
import { useCreateAccountShortcut } from '@/hooks/useKeyboardShortcuts';

useCreateAccountShortcut(() => setShowCreateDialog(true));
```

#### Add Alt+A+T shortcut to create account types:
```tsx
import { useCreateAccountTypeShortcut } from '@/hooks/useKeyboardShortcuts';

useCreateAccountTypeShortcut(() => setShowTypeDialog(true));
```

#### Add custom sequence shortcuts:
```tsx
import { useSequenceShortcut } from '@/hooks/useKeyboardShortcuts';

useSequenceShortcut({
  sequence: ['a', 't'],
  altKey: true,
  callback: () => console.log('Alt+A+T pressed')
});
```

#### Add custom keyboard shortcuts:
```tsx
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

useKeyboardShortcuts([
  { key: 's', ctrlKey: true, callback: handleSave },
  { key: 'n', altKey: true, callback: handleNew },
  { key: 'Delete', callback: handleDelete }
]);
```

#### Add Escape navigation:
```tsx
import { useEscapeNavigation } from '@/hooks/useKeyboardShortcuts';

useEscapeNavigation(); // Automatically handles Escape key for navigation
```

## Shortcut Combinations

### Sequence Shortcuts
Some shortcuts require pressing keys in sequence:
- **Alt + A + T**: Hold Alt, press A, then press T (Account Type)
- **Alt + S + A**: Hold Alt, press S, then press A (Search Accounts)
- **Alt + S + D**: Hold Alt, press S, then press D (Search Documents/Entries)
- **Alt + X + X**: Hold Alt, press X twice (General Entry)

### Conflict Prevention
All shortcuts are designed to avoid conflicts with:
- Browser shortcuts (Ctrl+C, Ctrl+V, etc.)
- System shortcuts (Alt+Space, Alt+Tab, etc.)
- Input fields (shortcuts disabled when typing)
- Dialogs/Modals (Escape handled by dialog first)
- Content editable elements

## Future Shortcuts (Planned)

- **Ctrl + S** - Save current form
- **Ctrl + N** - New entry/record
- **Alt + J** - Quick Journal Entry
- **Alt + I** - Quick Invoice
