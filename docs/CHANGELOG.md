# 📋 Changelog

All notable changes to this project, most recent first.
See `DEVELOPER_GUIDE.md → "Keeping These Docs Alive"` for how to add entries.

---

## [2024-06] Phase 8 — Complete Bug Fix & Feature Hardening Session

**Type:** Bug Fix + Feature

### What changed

**Critical crash fixes:**
- Expense detail page: `handleDelete`, `handleRefund`, `handleReassign` now wrapped in try/catch with `finally { setDeleting(false) }`. Previously a Firestore failure (network blip, timeout) left the button in a permanent spinner state with no error shown and no way to recover.
- Auth provider: post-login Firestore calls wrapped in try/catch. A slow connection at login could previously strand a user in a broken authenticated-but-empty-app state.
- Income detail page: same try/catch fix on delete.

**Currency label fixes:**
- Command palette: was using `format(r.amount)` (always base currency). Now `formatFor(r.amount, r.currencyCode || defaultCode)`.
- Expense detail page: was using `format(expense.amount)`. Now `formatFor` with the expense's actual `currencyCode`.

**Performance:**
- `use-settings.ts`: settings now fetched once per session using a `fetched` flag on `SettingsStore`. Was re-fetching on every page navigation (every mount of the hook).
- Settings store: added `fetched: boolean` flag separate from `settings !== null`, to correctly handle new users whose settings doc doesn't exist yet without causing an infinite fetch loop.
- `useBankAccounts` hook: added `!store.error` guard to prevent infinite retry on persistent fetch failure.
- `income.service.ts → getIncomesWithBalances`: changed from N+1 Firestore reads (one per income) to 2 reads total (all incomes + all ledger entries, grouped client-side).
- `transfer.service.ts → createTransfer`: was fetching ALL user ledger entries (potentially thousands) just to check one income's balance. Now fetches only that income's entries.

**Balance fix (#7 — the core architectural fix):**
- Added `shortfall.service.ts` — the shortfall engine.
- `expense.service.ts`: all expense debits against account-linked incomes now go through `debitIncomeWithShortfall()`, which caps the debit at the income's available balance and writes a `SHORTFALL_CREATED` ledger entry for any overflow. Income can never go negative.
- `income.service.ts → createIncome`: after writing the income, auto-calls `resolveAccountShortfalls()` to cover any outstanding shortfall on the account (oldest first, partial coverage if needed). Non-blocking (wrapped in try/catch).
- Added `SHORTFALL_CREATED` and `SHORTFALL_RESOLVED` to `TransactionType`.
- Added `outstandingShortfall` field to `BankAccountWithBalance`.
- Bank account balance now: `Σ(linked income balances) + openingBalance − outstandingShortfall`.
- Account detail page: new Shortfalls panel showing each outstanding item, a "Reassign" action per item (manual resolution), and a "Recompute" button (safe, additive-only catch-up).
- Accounts list page: "Recompute All" button.

**Currency safety (#2/#10):**
- `assertCurrencyMatchesAccount()` added to both `expense.service.ts` and `income.service.ts`. Throws a clear error and logs `BLOCKED_CURRENCY_MISMATCH` to audit logs if an expense/income tries to be assigned to an account with a different currency.

**Navigation fix (#6):**
- Account detail page: "Add Income" and "Add Expense" buttons were `<Link>` elements navigating to full pages. Now open `FormDrawer` side panels pre-filled with `preselectedAccountId`, matching the pattern used everywhere else in the app.

**Opening balance (#4):**
- `BankAccountFormData`: added optional `openingBalance` field.
- `account-form.tsx`: added Opening Balance input (create-only, hidden on edit).
- `createBankAccount()`: writes an `OPENING_BALANCE` ledger entry if `openingBalance` is non-zero. Not stored on the account doc.
- `bank-account.service.ts → computeAccountWithBalance()`: accepts `openingBalanceAdjustment` parameter.

**Modal overflow fix (#5):**
- `modal.tsx`: body div now has `overflow-y-auto` and `maxHeight: "75dvh"`. Fixes any tall form (bank account config, etc.) overflowing the viewport with no scroll.

**Global readiness (#3):**
- `KNOWN_BANKS` replaced with an empty `readonly string[]`. Bank name is now a free-text input — no hardcoded country-specific bank list.
- New users no longer get KWD pre-assigned at signup. Settings doc is intentionally NOT created at registration.
- `CurrencySetupBanner` component: shown only when `settings.fetched === true && settings === null`. Structurally impossible to show for existing users.

**FormDrawer scroll lock fix:**
- Fixed: closing one of two stacked drawers was unconditionally restoring body scroll even if the outer drawer was still open. Now checks `useUIStore.getState().drawerCount === 0` via `setTimeout` before restoring.

**FAB enhancements:**
- Added "Account" action to QuickAddFAB — opens `AccountForm` in a side drawer.
- FAB expense form: clears stale `smartDefaults.incomeSourceId` when accounts exist, preventing the form from pre-filling an income source that doesn't belong to the selected account.

**Inline tag creation:**
- `AddTagModal` component added.
- `TagSelector`: added "+ New Tag" button that opens `AddTagModal`. Newly created tag is auto-selected. Works in create AND edit mode since both reuse `TagSelector`.

**Firestore security fix:**
- `expenseIncomeAllocations` delete rule: added `resource.data.userId == userId` check (was missing).

**Database fix: totalExpenses calculation:**
- `bank-account.service.ts → computeAccountWithBalance()`: was using `i.totalDebits` (all debits including transfers). Now uses `i.totalExpenses` (EXPENSE_CREATED debits only). Account cards no longer inflate "total spent" by including transfer amounts.

**Multi-currency consistency:**
- `global-currency-filter.tsx`: currency chips now built from union of configured currencies AND currencies actually present in transaction data. Filter appears even when a transaction currency was never explicitly configured in Settings.
- `use-per-currency-data.ts`: "All" mode rows now use the same merged currency set as `GlobalCurrencyFilter` and `useAnalytics.availableChartCurrencies` — all three now consistent.
- `use-analytics.ts`: `availableChartCurrencies` now includes income currencies in addition to expense currencies.
- `use-timeline.ts`: `TimelineEvent` now has `currencyCode`. Timeline client uses `formatFor` per event.
- `timeline-client.tsx`: added `GlobalCurrencyFilter`. Events filtered by selected currency.
- `search-client.tsx`: uses `formatFor` with each result's own `currencyCode`.
- `transfers-client.tsx`: added `GlobalCurrencyFilter`. Transfer list filtered by `fromCurrencyCode`.
- `use-search.ts`: `SearchResult` now includes `currencyCode` for income and expense results.
- `types/index.ts → SearchResult`: added `currencyCode?: string`.

**Snapshot fix:**
- `snapshot.service.ts`: `closingBalance` formula was hardcoded `income - expenses + refunds`. Now correctly computes real opening balance from all pre-month entries and includes transfers in closing balance.

**Income service guard:**
- `deleteIncome()`: now checks for linked *transfers* in addition to linked expenses before allowing deletion. Previously deleting an income with transfers left transfer records orphaned.
- `updateIncome()`: `INCOME_ADJUSTMENT` ledger entry now carries `accountId` from `oldData`.

**Files changed (major):**
New: `shortfall.service.ts`, `add-tag-modal.tsx`, `currency-setup-banner.tsx`

Modified: `types/index.ts`, `ledger.service.ts`, `expense.service.ts`, `income.service.ts`, `bank-account.service.ts`, `bank-account.store.ts`, `use-bank-accounts.ts`, `settings.store.ts`, `use-settings.ts`, `snapshot.service.ts`, `transfer.service.ts`, `attribution.service.ts`, `validations/bank-account.ts`, `account-form.tsx`, `account-detail-client.tsx`, `accounts-client.tsx`, `modal.tsx`, `form-drawer.tsx`, `tag-selector.tsx`, `quick-add-fab.tsx`, `command-palette.tsx`, `auth-provider.tsx`, `auth.ts`, `firestore.rules`, `expenses/[id]/page.tsx`, `dashboard-client.tsx`, `global-currency-filter.tsx`, `use-per-currency-data.ts`, `use-analytics.ts`, `use-timeline.ts`, `timeline-client.tsx`, `transfers-client.tsx`, `search-client.tsx`, `use-search.ts`

**Known items NOT fixed (by design or complexity):**
- Pre-existing negative incomes in live data (from before the shortfall fix) are not retroactively corrected — old ledger entries are immutable.
- "Prompt Me" attribution mode: saves the setting but doesn't yet open a prompt modal — falls back to Auto FIFO silently.
- `expenseCount` on bank account cards is hardcoded to 0 (not computable at the service layer without expense data, and not displayed in UI).
- Spend By / Tags currency mixing: reported as still present by user, but could not be reproduced from code reading — needs exact reproduction steps to resolve.

---

## [2024-06] Phase 1 — Bank Accounts Feature (Original Build)

**Type:** Feature

**What changed:**
- New `BankAccount` entity, Firestore collection, CRUD service, store, hook.
- New pages: `/accounts` (list) and `/accounts/[id]` (detail).
- FIFO attribution engine (`attribution.service.ts`) — display-only matching of expenses to incomes, never touches ledger.
- `MigrationBanner` and `MigrationWizard` for existing users to link existing incomes to accounts.
- Account balance computed from summed income balances.
- `GlobalCurrencyFilter` component first introduced.
- `MultiCurrencyAmount` component for displaying multi-currency totals.
- Opening balance: NOT YET (added later — see Phase 8 above).

---

## [2024-06] Phase 0 — Initial Codebase

**Type:** Initial build

**What was in place:**
- Complete income/expense tracking with ledger architecture.
- Firebase Auth (email/password) + Firestore per-user subcollections.
- Multi-currency support (`currencyCode` per transaction, `GlobalCurrencyFilter`).
- Spent By (household member tracking).
- Tags.
- Transfers (income-to-income with cross-currency support).
- Analytics page with monthly trend, category pie, spending by person.
- Timeline, Search.
- Settings (base currency, extra currencies, attribution mode).
- QuickAddFAB.
- Command palette (⌘K).
- Export utility (`export.ts`).

---

## Template for new entries

Copy this block at the top of the file when adding a new entry:

```markdown
## [YYYY-MM-DD] Short title

**Type:** Bug Fix | Feature | Refactor | Security

**What changed:**
- Thing 1
- Thing 2

**Why:**
Root cause or motivation in one sentence.

**Files changed:**
- `src/...`

**Risks / notes:**
Any edge cases or remaining items.
```
