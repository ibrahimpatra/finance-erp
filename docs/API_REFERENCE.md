# 📡 API Reference

Every exported function from every service file. This is what the stores
call — nothing outside `src/services/` should ever talk to Firestore directly.

**Notation:** `→ T` means the function returns `Promise<T>`.
Side effects in **bold** mean "writes to Firestore."

---

## `ledger.service.ts` — The Core Engine

These functions are the lowest level. Every balance in the app flows through here.
Never call `createLedgerEntry` from a page or store — only services call it.

| Function | Params | Returns | Notes |
|---|---|---|---|
| `createLedgerEntry(params)` | `{ userId, transactionType, incomeSourceId?, expenseId?, accountId?, amount, direction, description, metadata? }` | `→ string` (entry ID) | **Writes one immutable ledger row.** The only way money "moves" in this app. |
| `getLedgerForIncome(userId, incomeSourceId)` | strings | `→ LedgerEntry[]` | All entries for one income. Used to compute that income's current balance. |
| `getAllLedgerEntries(userId)` | string | `→ LedgerEntry[]` | Full user ledger. **Expensive — use only when you genuinely need everything.** |
| `getLedgerForAccount(userId, accountId)` | strings | `→ LedgerEntry[]` | All entries tagged to a bank account (`accountId` field). Used by shortfall engine. |
| `calculateBalanceFromLedger(entries)` | `LedgerEntry[]` | `number` | `Σ CREDIT − Σ DEBIT`. The single balance formula. Pure function, no Firestore. |
| `calculateBalanceForIncome(entries, incomeSourceId)` | array + string | `number` | Filters first, then calls `calculateBalanceFromLedger`. |
| `calculateTotalCredits(entries)` | `LedgerEntry[]` | `number` | Sum of all CREDIT entries. |
| `calculateTotalDebits(entries)` | `LedgerEntry[]` | `number` | Sum of all DEBIT entries — includes transfers, not just expenses. |

---

## `income.service.ts`

| Function | Params | Returns | Notes |
|---|---|---|---|
| `getIncomes(userId)` | string | `→ Income[]` | Ordered by `createdAt desc`. |
| `getIncome(userId, id)` | strings | `→ Income \| null` | Single doc fetch. |
| `createIncome(userId, data)` | IncomeFormData | `→ string` (income ID) | **Writes income doc + `INCOME_CREATED` ledger CREDIT.** Also runs `resolveAccountShortfalls` (auto, non-blocking) if the income has an `accountId`. Checks `assertCurrencyMatchesAccount` first. |
| `updateIncome(userId, id, data, oldData?)` | — | `→ void` | **Writes income doc update.** If `amount` changed, **also writes `INCOME_ADJUSTMENT` ledger entry** (CREDIT if up, DEBIT if down) carrying `accountId` from `oldData`. |
| `deleteIncome(userId, id)` | strings | `→ void` | Guards: throws if any expenses OR transfers reference this income. Does NOT delete ledger entries (they're immutable). |
| `getIncomesWithBalances(userId)` | string | `→ IncomeWithBalance[]` | Fetches all incomes + all ledger entries in **2 Firestore reads** (not N+1), groups ledger client-side, computes `balance`, `totalExpenses`, `totalCredits`, `totalDebits`, `percentageUsed` for each income. |

---

## `expense.service.ts`

| Function | Params | Returns | Notes |
|---|---|---|---|
| `getExpenses(userId, filters?)` | `ExpenseFilters` optional | `→ Expense[]` | Client-side filtering after one Firestore read. Filters: `incomeSourceId`, `spentById`, `expenseTypeId`, `tagIds`, `minAmount`, `maxAmount`, `startDate`, `endDate`, `search`. |
| `getExpense(userId, id)` | strings | `→ Expense \| null` | Single doc fetch. |
| `createExpense(userId, data)` | ExpenseFormData | `→ string` (expense ID) | Checks currency guard first. **Writes expense doc.** Then calls `debitIncomeWithShortfall` (capped debit + optional `SHORTFALL_CREATED`). |
| `updateExpense(userId, id, data, oldData?)` | — | `→ void` | Checks currency guard. **Updates expense doc.** If amount increased: capped debit on the diff. If amount decreased: simple CREDIT on the diff (always safe). |
| `deleteExpense(userId, id, expense)` | — | `→ void` | **Deletes expense doc.** Writes simple CREDIT reversal (always safe). Calls `clearAutoAllocationsForExpense` (non-blocking). |
| `createRefund(userId, expense, amount, reason)` | — | `→ void` | Writes a `REFUND` CREDIT ledger entry against the expense's income. Always safe (credits never go negative). |
| `reassignExpense(userId, expense, newIncomeId)` | — | `→ void` | **Updates `incomeSourceId` on expense.** Writes CREDIT back to old income, then capped DEBIT (with shortfall) against new income. |

**Currency guard** (`assertCurrencyMatchesAccount`): both `createExpense` and
`updateExpense` check that the expense's `currencyCode` matches the linked
account's `currencyCode`. Throws a user-facing error and logs
`BLOCKED_CURRENCY_MISMATCH` to `auditLogs` if there's a mismatch.

---

## `bank-account.service.ts`

| Function | Params | Returns | Notes |
|---|---|---|---|
| `getBankAccounts(userId)` | string | `→ BankAccount[]` | All accounts, ordered by name. |
| `getBankAccount(userId, id)` | strings | `→ BankAccount \| null` | Single doc. Used internally by currency guard. |
| `createBankAccount(userId, data)` | BankAccountFormData | `→ string` (account ID) | **Writes account doc.** If `data.openingBalance` is non-zero, **also writes `OPENING_BALANCE` ledger entry.** `openingBalance` is stripped before writing the doc (never stored on the account itself). |
| `updateBankAccount(userId, id, data, old?)` | — | `→ void` | Explicitly strips `currencyCode` from the update — **a bank account's currency can never be changed after creation.** |
| `deleteBankAccount(userId, id)` | strings | `→ void` | Guards against linked incomes. |
| `computeAccountWithBalance(account, incomes, shortfall?, openingAdj?)` | — | `BankAccountWithBalance` | Pure function. Aggregates linked incomes' balances, adds opening balance adjustment, subtracts outstanding shortfall. No Firestore. |
| `getBankAccountsWithBalances(userId, incomes)` | — | `→ BankAccountWithBalance[]` | Fetches all accounts and maps through `computeAccountWithBalance`. Note: doesn't apply shortfall/opening adjustments — the store does that after calling `fetchShortfallData`. |
| `reconcileAccount(userId, accountId, incomeIds)` | — | `→ { resolvedCount, totalResolved }` | Thin wrapper around `reconcileAccountShortfalls`. The "Recompute" button calls this. |

---

## `shortfall.service.ts`

| Function | Params | Returns | Notes |
|---|---|---|---|
| `debitIncomeWithShortfall(params)` | `{ userId, incomeSourceId, accountId?, amount, expenseId, transactionType, description, ... }` | `→ { covered, shortfall }` | The core safety function. If `accountId` is present: caps the debit at the income's current balance, writes a `SHORTFALL_CREATED` entry for any overflow. If no `accountId`: one uncapped debit, legacy behavior. |
| `getOutstandingShortfalls(userId, accountId)` | strings | `→ OutstandingShortfall[]` | Reads account's ledger, computes `SHORTFALL_CREATED − SHORTFALL_RESOLVED` per `expenseId`. Returns only items with `remaining > 0.0005`. |
| `getTotalOutstandingShortfall(shortfalls)` | `OutstandingShortfall[]` | `number` | Sum of all `.remaining` values. Pure function. |
| `resolveAccountShortfalls(userId, accountId, resolvingIncomeId, availableAmount, trigger, targetExpenseId?)` | — | `→ { totalResolved, details }` | Iterates outstanding shortfalls (oldest first, or targeted if `targetExpenseId` set). **Writes `SHORTFALL_RESOLVED` DEBIT entries** against `resolvingIncomeId`. Stops when `availableAmount` runs out. |
| `reconcileAccountShortfalls(userId, accountId, incomeIds)` | — | `→ { resolvedCount, totalResolved }` | For each income: reads its balance, calls `resolveAccountShortfalls`. **Additive only — never modifies or deletes.** Safe to call any number of times. |
| `getAllShortfallEntries(userId)` | string | `→ LedgerEntry[]` | One query for ALL `SHORTFALL_CREATED`, `SHORTFALL_RESOLVED`, and `OPENING_BALANCE` entries. Used by the store to compute per-account adjustments in one Firestore read instead of N. |
| `computeOutstandingShortfallsByAccount(entries)` | `LedgerEntry[]` | `Map<accountId, number>` | Pure function. Groups entries by account, computes outstanding shortfall for each. |
| `computeOpeningBalanceByAccount(entries)` | `LedgerEntry[]` | `Map<accountId, number>` | Pure function. Sums `OPENING_BALANCE` credits/debits per account. |

---

## `transfer.service.ts`

| Function | Params | Returns | Notes |
|---|---|---|---|
| `getTransfers(userId)` | string | `→ Transfer[]` | Ordered by `createdAt desc`. |
| `createTransfer(userId, data)` | TransferFormData | `→ string` | Checks `fromIncome` has enough balance (fetches only that income's ledger — not the entire user ledger). **Writes transfer doc + DEBIT on `fromIncomeId` + CREDIT on `toIncomeId`** as two ledger entries. |

---

## `attribution.service.ts` — Display Only, Never Affects Balances

| Function | Params | Returns | Notes |
|---|---|---|---|
| `getAllocationsForAccount(userId, accountId)` | strings | `→ ExpenseIncomeAllocation[]` | All attribution records for one account. |
| `getAllocationsForExpense(userId, expenseId)` | strings | `→ ExpenseIncomeAllocation[]` | How one expense was spread across incomes. |
| `getAllocationsForIncome(userId, incomeId)` | strings | `→ ExpenseIncomeAllocation[]` | All expenses attributed to one income. |
| `clearAutoAllocationsForExpense(userId, expenseId)` | strings | `→ void` | Deletes all auto-generated allocations for one expense. Called before re-running FIFO. |
| `createManualAllocation(userId, data)` | AllocationFormData | `→ string` | Creates a single user-confirmed allocation record. |
| `resolveFIFOPrimaryIncome(incomes)` | `IncomeWithBalance[]` | `string \| null` | Returns the ID of the oldest income with `balance > 0`. Used by the expense form to pick the primary debit target for the shortfall engine. |
| `runFIFOAttribution(userId, accountId, expenseId, amount, incomes)` | — | `→ void` | Computes the full FIFO waterfall and **writes `expenseIncomeAllocations` docs**. No ledger writes. |
| `computeAllocatedPerIncome(allocations)` | array | `Map<incomeId, number>` | Helper used inside `runFIFOAttribution`. |
| `computeAttributionRate(income, allocations)` | — | `number` | What fraction of an income has been attributed to expenses. |

---

## `audit.service.ts`

| Function | Params | Returns | Notes |
|---|---|---|---|
| `logAudit(userId, action, entityType, entityId, before?, after?)` | — | `→ void` | **Writes one `auditLogs` doc.** Called from every service after a mutation. Action values: `CREATE`, `UPDATE`, `DELETE`, `REFUND`, `REASSIGN`, `BLOCKED_CURRENCY_MISMATCH`. |
| `getAuditLogs(userId, limitCount?)` | string, number (default 100) | `→ AuditLog[]` | Most recent N audit entries. |

---

## `settings.service.ts`

| Function | Params | Returns | Notes |
|---|---|---|---|
| `getSettings(userId)` | string | `→ Settings \| null` | Returns `null` for brand-new users (no settings doc yet). |
| `upsertSettings(userId, data)` | SettingsFormData | `→ void` | Creates or updates the `preferences` document. |

---

## `currency.service.ts`

Standard CRUD for the user's extra configured currencies (beyond their base).

`getCurrencies`, `createCurrency`, `updateCurrency`, `deleteCurrency` — all
take `(userId, ...)`, standard signatures.

---

## Reference-Data Services

All follow the same standard pattern:
`get{Type}s(userId)`, `create{Type}(userId, data)`, `update{Type}(userId, id, data)`, `delete{Type}(userId, id)`.

| Service | Entity |
|---|---|
| `expense-type.service.ts` | Expense categories (Food, Transport, etc). `seedDefaultExpenseTypes` seeds on first login. |
| `income-source-type.service.ts` | Income types (Salary, Freelance, etc). `seedDefaultIncomeSourceTypes` seeds on first login. |
| `spent-by.service.ts` | People who can spend (household members). |
| `tag.service.ts` | User-created labels applied to incomes/expenses. |

---

## `snapshot.service.ts`

| Function | Params | Returns | Notes |
|---|---|---|---|
| `generateMonthlySnapshot(userId, month, year)` | — | `→ void` | Computes and **writes** a `monthlySnapshots` doc for the given month. **Not yet wired to any UI.** Exists for future reporting features. |
| `getMonthlySnapshots(userId)` | string | `→ MonthlySnapshot[]` | All saved snapshots, most recent first. |
