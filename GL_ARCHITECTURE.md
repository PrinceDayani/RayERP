# General Ledger Currency Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              User Interface Layer                         │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  • CurrencyAwareGeneralLedger.tsx                        │  │
│  │  • CurrencySettings.tsx                                  │  │
│  │  • GeneralLedger.tsx                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              State Management Layer                       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  CurrencyContext                                          │  │
│  │  ├─ currency: string                                     │  │
│  │  ├─ symbol: string                                       │  │
│  │  ├─ setCurrency(currency)                                │  │
│  │  ├─ formatAmount(amount, showSymbol)                     │  │
│  │  └─ formatCompact(amount)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Business Logic Layer                         │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  useGeneralLedger Hook                                    │  │
│  │  ├─ accounts[]                                           │  │
│  │  ├─ journalEntries[]                                     │  │
│  │  ├─ currencies[]                                         │  │
│  │  ├─ fetchAccounts()                                      │  │
│  │  ├─ createAccount()                                      │  │
│  │  ├─ createJournalEntry()                                 │  │
│  │  ├─ calculateKPIs()                                      │  │
│  │  └─ getTrialBalance()                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Utility Layer                                │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Currency Utilities (currency.ts)                        │  │
│  │  ├─ formatCurrency()                                     │  │
│  │  ├─ formatIndianNumber()    → 1,00,000 = 1 L           │  │
│  │  ├─ formatInternationalNumber() → 1,000,000 = 1 M       │  │
│  │  ├─ getCurrencySymbol()                                  │  │
│  │  └─ setNumberFormat()                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Client Layer                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  generalLedger.ts                                         │  │
│  │  ├─ getAccounts()                                        │  │
│  │  ├─ createAccount()                                      │  │
│  │  ├─ getJournalEntries()                                  │  │
│  │  ├─ createJournalEntry()                                 │  │
│  │  ├─ getCurrencies()                                      │  │
│  │  ├─ getExchangeRate()                                    │  │
│  │  └─ getTrialBalance()                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    HTTP/REST API
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Route Layer                                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  generalLedger.routes.ts                                  │  │
│  │  ├─ GET    /currencies                                   │  │
│  │  ├─ POST   /currencies                                   │  │
│  │  ├─ GET    /exchange-rates                               │  │
│  │  ├─ POST   /exchange-rates                               │  │
│  │  ├─ GET    /accounts                                     │  │
│  │  ├─ POST   /accounts                                     │  │
│  │  ├─ GET    /journal-entries                              │  │
│  │  ├─ POST   /journal-entries                              │  │
│  │  └─ GET    /trial-balance                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Controller Layer                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  generalLedgerController.ts                               │  │
│  │  ├─ getCurrencies()                                      │  │
│  │  ├─ createCurrency()                                     │  │
│  │  ├─ getExchangeRate()                                    │  │
│  │  ├─ updateExchangeRate()                                 │  │
│  │  ├─ getAccounts()                                        │  │
│  │  ├─ createAccount()                                      │  │
│  │  ├─ getJournalEntries()                                  │  │
│  │  ├─ createJournalEntry()                                 │  │
│  │  └─ getTrialBalance()                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Model Layer                                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Currency.ts                                              │  │
│  │  ├─ code: string                                         │  │
│  │  ├─ name: string                                         │  │
│  │  ├─ symbol: string                                       │  │
│  │  └─ isBaseCurrency: boolean                              │  │
│  │                                                            │  │
│  │  ExchangeRate.ts                                          │  │
│  │  ├─ fromCurrency: string                                 │  │
│  │  ├─ toCurrency: string                                   │  │
│  │  ├─ rate: number                                         │  │
│  │  └─ date: Date                                           │  │
│  │                                                            │  │
│  │  Account.ts                                               │  │
│  │  ├─ code: string                                         │  │
│  │  ├─ name: string                                         │  │
│  │  ├─ type: string                                         │  │
│  │  ├─ balance: number                                      │  │
│  │  └─ currency: string                                     │  │
│  │                                                            │  │
│  │  JournalEntry.ts                                          │  │
│  │  ├─ entryNumber: string                                  │  │
│  │  ├─ date: Date                                           │  │
│  │  ├─ description: string                                  │  │
│  │  ├─ currency: string                                     │  │
│  │  ├─ totalDebit: number                                   │  │
│  │  ├─ totalCredit: number                                  │  │
│  │  └─ lines: []                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Database Layer                               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  MongoDB Collections                                      │  │
│  │  ├─ currencies                                           │  │
│  │  ├─ exchangerates                                        │  │
│  │  ├─ accounts                                             │  │
│  │  └─ journalentries                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1. Selects Currency (INR)
       ↓
┌─────────────────────┐
│  CurrencyContext    │
│  currency = "INR"   │
└──────┬──────────────┘
       │ 2. Provides currency to components
       ↓
┌─────────────────────┐
│  useGeneralLedger   │
│  Hook               │
└──────┬──────────────┘
       │ 3. Fetches data with currency
       ↓
┌─────────────────────┐
│  API Client         │
│  GET /accounts      │
│  ?currency=INR      │
└──────┬──────────────┘
       │ 4. HTTP Request
       ↓
┌─────────────────────┐
│  Backend API        │
│  /general-ledger    │
└──────┬──────────────┘
       │ 5. Query MongoDB
       ↓
┌─────────────────────┐
│  MongoDB            │
│  accounts           │
│  collection         │
└──────┬──────────────┘
       │ 6. Returns data
       ↓
┌─────────────────────┐
│  Backend            │
│  Formats response   │
└──────┬──────────────┘
       │ 7. JSON Response
       ↓
┌─────────────────────┐
│  Frontend           │
│  Receives data      │
└──────┬──────────────┘
       │ 8. Formats with currency utils
       ↓
┌─────────────────────┐
│  formatAmount()     │
│  50000 → INR 50,000 │
└──────┬──────────────┘
       │ 9. Display to user
       ↓
┌─────────────────────┐
│  UI Component       │
│  Shows: INR 50,000  │
└─────────────────────┘
```

## Currency Formatting Flow

```
┌──────────────────┐
│  Amount: 1234567 │
└────────┬─────────┘
         │
         ↓
┌────────────────────────┐
│  Get User Preferences  │
│  - currency: INR       │
│  - format: indian      │
└────────┬───────────────┘
         │
         ↓
┌────────────────────────┐
│  formatCurrency()      │
└────────┬───────────────┘
         │
         ├─────────────────────────┐
         │                         │
         ↓                         ↓
┌──────────────────┐    ┌──────────────────┐
│  Standard Format │    │  Compact Format  │
│  INR 12,34,567   │    │  INR 12.35 L     │
└──────────────────┘    └──────────────────┘
         │                         │
         └──────────┬──────────────┘
                    ↓
         ┌──────────────────┐
         │  Display to User │
         └──────────────────┘
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────┐
│                    App Layout                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │            CurrencyProvider                        │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │         General Ledger Page                  │  │ │
│  │  │  ┌───────────────────────────────────────┐  │  │ │
│  │  │  │  Currency Switcher                     │  │  │ │
│  │  │  │  [INR ▼] [USD] [EUR] [GBP]            │  │  │ │
│  │  │  └───────────────────────────────────────┘  │  │ │
│  │  │                                              │  │ │
│  │  │  ┌───────────────────────────────────────┐  │  │ │
│  │  │  │  KPI Dashboard                         │  │  │ │
│  │  │  │  Revenue: INR 75,000                   │  │  │ │
│  │  │  │  Expenses: INR 15,000                  │  │  │ │
│  │  │  │  Profit: INR 60,000                    │  │  │ │
│  │  │  └───────────────────────────────────────┘  │  │ │
│  │  │                                              │  │ │
│  │  │  ┌───────────────────────────────────────┐  │  │ │
│  │  │  │  Accounts Table                        │  │  │ │
│  │  │  │  Code | Name | Balance                 │  │  │ │
│  │  │  │  1001 | Cash | INR 50,000              │  │  │ │
│  │  │  │  1002 | Bank | INR 1,00,000 (1 L)      │  │  │ │
│  │  │  └───────────────────────────────────────┘  │  │ │
│  │  │                                              │  │ │
│  │  │  ┌───────────────────────────────────────┐  │  │ │
│  │  │  │  Journal Entries                       │  │  │ │
│  │  │  │  Date | Description | Debit | Credit   │  │  │ │
│  │  │  │  All amounts in INR                    │  │  │ │
│  │  │  └───────────────────────────────────────┘  │  │ │
│  │  └──────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌──────────────────────────────────────────────────────┐
│              CurrencyContext State                    │
├──────────────────────────────────────────────────────┤
│  currency: "INR"                                      │
│  symbol: "₹"                                          │
│  locales: { INR: "en-IN", USD: "en-US", ... }       │
│  symbols: { INR: "₹", USD: "$", ... }               │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ↓            ↓            ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│Component │  │Component │  │Component │
│    A     │  │    B     │  │    C     │
└──────────┘  └──────────┘  └──────────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
                   ↓
        ┌──────────────────┐
        │  All components  │
        │  use same        │
        │  currency        │
        └──────────────────┘
```

## API Request/Response Flow

```
Frontend                    Backend                   Database
   │                          │                          │
   │  GET /accounts           │                          │
   ├─────────────────────────>│                          │
   │  ?currency=INR           │                          │
   │                          │  db.accounts.find()      │
   │                          ├─────────────────────────>│
   │                          │  { currency: "INR" }     │
   │                          │                          │
   │                          │  [accounts...]           │
   │                          │<─────────────────────────┤
   │                          │                          │
   │  Response:               │                          │
   │  [{                      │                          │
   │    code: "1001",         │                          │
   │    name: "Cash",         │                          │
   │    balance: 50000,       │                          │
   │    currency: "INR"       │                          │
   │  }]                      │                          │
   │<─────────────────────────┤                          │
   │                          │                          │
   ↓                          ↓                          ↓
Format with                Store in                  Persist
currency utils             state                     data
```

## Multi-Currency Transaction Flow

```
┌─────────────────────────────────────────────────────┐
│  User creates transaction in USD                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  System checks base currency (INR)                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  Fetch exchange rate: USD to INR                    │
│  Rate: 83.12                                        │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  Store transaction with both amounts:               │
│  - Original: USD 100                                │
│  - Converted: INR 8,312                             │
│  - Exchange Rate: 83.12                             │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  Display based on user's selected currency          │
│  - If INR selected: Show INR 8,312                  │
│  - If USD selected: Show USD 100                    │
└─────────────────────────────────────────────────────┘
```

## Key Integration Points

1. **CurrencyContext** → Provides global currency state
2. **useGeneralLedger** → Manages GL operations with currency
3. **currency.ts** → Formats numbers based on currency
4. **generalLedger.ts** → API calls with currency parameters
5. **generalLedgerController.ts** → Handles currency logic
6. **Models** → Store currency information

## Benefits of This Architecture

✅ **Separation of Concerns**: Each layer has specific responsibility
✅ **Reusability**: Components and utilities can be reused
✅ **Type Safety**: Full TypeScript support throughout
✅ **Scalability**: Easy to add new currencies or features
✅ **Maintainability**: Clear structure and documentation
✅ **Performance**: Efficient state management and API calls
✅ **Flexibility**: Support for multiple currencies and formats

---

This architecture ensures a robust, scalable, and maintainable general ledger system with comprehensive currency support.
