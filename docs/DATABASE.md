# 🗄️ Database

Firestore schema — every collection, every field, and the security rules
that govern them.

---

## Structure

Everything lives under one top-level collection, scoped per-user:

```
users/{userId}/
├── settings/preferences        ← single document, not a list
├── incomes/{incomeId}
├── expenses/{expenseId}
├── spentBy/{spentById}
├── tags/{tagId}
├── transfers/{transferId}
├── ledger/{ledgerEntryId}      ← IMMUTABLE — see below
├── auditLogs/{logId}            ← IMMUTABLE
├── monthlySnapshots/{YYYY-MM}
├── expenseTypes/{typeId}
├── incomeSourceTypes/{typeId}
├── currencies/{currencyId}
├── bankAccounts/{accountId}
└── expenseIncomeAllocations/{allocationId}   ← display-only, see LEDGER_ENGINE.md
```

All collection paths are centralized in one place:
`src/lib/firebase/db.ts → COLLECTIONS`. **Never hardcode a Firestore path
anywhere else in the codebase** — always import from `COLLECTIONS`.

---

## Collections in Detail

### `settings` (one document: `preferences`)
```ts
{
  id, userId,
  currencyName: string,        // e.g. "US Dollar"
  currencyCode: string,        // e.g. "USD"
  currencySymbol: string,      // e.g. "$"
  attributionMode?: "auto" | "prompt",  // how expenses match to income (see LEDGER_ENGINE.md)
  createdAt, updatedAt
}
```
⚠️ **A brand-new user has NO settings document at all** (not even with a
default currency) until they pick one via `CurrencySetupBanner`. Any code
reading `settings?.currencyCode` must use a safe fallback (`?? "KWD"` is the
existing convention) purely to avoid crashes during that loading window —
this is NOT a business-logic default, just a render-safety net.

### `incomes`
```ts
{
  id, userId,
  name: string, source: string, amount: number,
  notes?: string, tagIds: string[],
  currencyCode?: string,        // missing on pre-multi-currency records
  accountId?: string,           // NEW — links to a bankAccounts doc
  incomeSourceTypeId?: string,
  createdAt, updatedAt
}
```
**The `amount` field is never updated to reflect spending.** An income's real
balance is never stored — it's computed live from the ledger. See
`LEDGER_ENGINE.md`.

### `expenses`
```ts
{
  id, userId,
  incomeSourceId?: string,      // which income this draws from
  spentById: string, amount: number, reason: string,
  notes?: string, expenseTypeId: string, tagIds: string[],
  currencyCode?: string,
  accountId?: string,           // NEW — which bank account is debited
  createdAt, updatedAt
}
```

### `transfers`
```ts
{
  id, userId,
  fromIncomeId: string, toIncomeId: string,
  amount: number, toAmount?: number,        // supports cross-currency transfers
  fromCurrencyCode?: string, toCurrencyCode?: string,
  note?: string,
  fromAccountId?: string, toAccountId?: string,
  createdAt
}
```
**Immutable** — `allow update, delete: if false`.

### `ledger` — THE source of truth for every balance in the app
```ts
{
  id, userId,
  transactionType: TransactionType,   // see full list below
  incomeSourceId?: string,
  expenseId?: string, transferId?: string, spentById?: string,
  accountId?: string,
  amount: number,
  direction: "CREDIT" | "DEBIT",
  description: string,                // human-readable, often auto-generated
  metadata?: Record<string, unknown>,
  createdAt
}
```
**Immutable** — `allow update, delete: if false`. This is the single most
important collection in the app. Full explanation in `LEDGER_ENGINE.md`.

All current `transactionType` values:
```
INCOME_CREATED, EXPENSE_CREATED, EXPENSE_UPDATED, EXPENSE_DELETED,
TRANSFER, EXPENSE_REASSIGNED, REFUND, INCOME_ADJUSTMENT,
OPENING_BALANCE, SHORTFALL_CREATED, SHORTFALL_RESOLVED
```

### `auditLogs` — security/compliance trail
```ts
{ id, userId, action: string, entityType: string, entityId: string,
  before?: unknown, after?: unknown, createdAt }
```
**Immutable.** Currently logs CRUD actions plus `BLOCKED_CURRENCY_MISMATCH`
when the currency-safety guard rejects a save.

### `bankAccounts`
```ts
{
  id, userId,
  name: string, bankName?: string,
  accountType: "checking" | "savings" | "cash" | "wallet" | "credit",
  lastFourDigits?: string,
  currencyCode: string,          // LOCKED forever after creation
  color: string, icon?: string,
  isActive: boolean, isDefault: boolean, notes?: string,
  createdAt, updatedAt
}
```
An account's `currencyCode` can never be changed after creation
(`updateBankAccount` explicitly strips it from any update payload).
Its `openingBalance` (used only at creation, never stored on the doc itself)
becomes a single `OPENING_BALANCE` ledger entry — see `LEDGER_ENGINE.md`.

### `expenseIncomeAllocations` — display-only, never affects balances
```ts
{ id, userId, accountId, expenseId, incomeId, amount,
  isAutoMapped: boolean, createdAt }
```
Records which income(s) a given expense was matched to via FIFO, purely for
display. **Deleting these has zero effect on any balance** — the ledger is
the only source of truth. Full explanation in `LEDGER_ENGINE.md → FIFO
Attribution`.

### `expenseTypes`, `incomeSourceTypes`, `tags`, `spentBy`, `currencies`
Simple per-user reference/lookup collections — standard CRUD, nothing
special. `spentBy` represents "who spent the money" (a household member,
not the app's user).

### `monthlySnapshots`
One document per `YYYY-MM`, generated on demand by
`snapshot.service.ts → generateMonthlySnapshot()`. Stores a point-in-time
summary (income, expenses, transfers, refunds, opening/closing balance) for
reporting. Not currently wired into any UI — exists for future use.

---

## Security Rules Summary

File: `firestore.rules`. The pattern is consistent across every collection:

```js
function isOwner(userId) { return request.auth != null && request.auth.uid == userId; }
function hasValidUserId(userId) { return request.resource.data.userId == userId; }

match /incomes/{docId} {
  allow read: if isOwner(userId);
  allow create: if isOwner(userId) && hasValidUserId(userId);
  allow update, delete: if isOwner(userId);
}
```

**Three collections are append-only** (`allow update, delete: if false`):
`ledger`, `transfers`, `auditLogs`. This is intentional and load-bearing —
the entire balance-calculation model depends on the ledger never being
edited after the fact.

The catch-all at the bottom of the rules file (`allow read, write: if false`
for any unmatched path) means a new collection added to the code **will not
work** until a matching rule is added here too. This is the #1 thing a new
collection-adding PR forgets.
