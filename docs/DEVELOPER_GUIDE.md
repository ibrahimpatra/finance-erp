# 👨‍💻 Developer Guide

Everything a developer needs to set up, understand, safely extend, and
correctly maintain this codebase.

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Firebase project (Auth + Firestore)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your Firebase config
cp .env.local.example .env.local

# 3. Deploy Firestore security rules
firebase deploy --only firestore:rules

# 4. Run development server
npm run dev

# 5. TypeScript check (run this before every commit)
npx tsc --noEmit

# 6. Production build check
npm run build
```

### Environment variables (`.env.local`)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Invariants That Must Never Be Violated

These are the rules that, when broken, cause financial bugs. Every one of
these was learned from a real bug this app has had. Memorise them.

### 1. Never store a balance — always compute it from the ledger

No Firestore document should ever have a field like `balance`, `remaining`,
or `netAmount` that is kept up-to-date by being written to on every
transaction. The only source of truth for any balance is
`calculateBalanceFromLedger(ledgerEntries)`. If you find yourself writing
`await updateDoc(incomeRef, { balance: newBalance })`, stop — that's wrong.

### 2. Never edit or delete a ledger entry

The ledger collection has `allow update, delete: if false` in Firestore rules.
Don't try to get around this. To "undo" something, add a new entry in the
opposite direction (the reversal pattern). The full correction history is
then visible forever.

### 3. Always use `formatFor(amount, currencyCode)` — never bare `format(amount)`

`format(amount)` always uses the user's base currency regardless of the
amount's actual currency. It was the root cause of multiple bugs where
USD amounts showed as KWD. Always pass the currency code explicitly.

```ts
// ❌ Wrong
const display = format(expense.amount);

// ✅ Right
const display = formatFor(expense.amount, expense.currencyCode || defaultCode);
```

### 4. Always wrap async store actions in try/catch with finally

Every async handler in a page component that calls a store action must:
- Catch the error and show a toast
- Reset any loading state in `finally`

```ts
// ❌ Wrong — UI freezes if Firestore errors
const handleDelete = async () => {
  setDeleting(true);
  await removeExpense(user.uid, id, expense);
  router.push("/expenses"); // never reached if above throws
};

// ✅ Right
const handleDelete = async () => {
  setDeleting(true);
  try {
    await removeExpense(user.uid, id, expense);
    toast("Deleted!", "success");
    router.push("/expenses");
  } catch (e: unknown) {
    toast((e as Error).message || "Failed to delete.", "error");
  } finally {
    setDeleting(false);
  }
};
```

### 5. Stores must always resolve `loading: false` in both success AND catch

A store that leaves `loading: true` after a failed fetch will cause any
hook with the pattern `!store.loading && items.length === 0` to never retry
and never show an error state.

```ts
// ❌ Wrong
fetchItems: async (userId) => {
  set({ loading: true });
  const items = await getItems(userId); // throws — loading stays true forever
  set({ items, loading: false });
},

// ✅ Right
fetchItems: async (userId) => {
  set({ loading: true, error: null });
  try {
    const items = await getItems(userId);
    set({ items, loading: false });
  } catch (e: unknown) {
    set({ loading: false, error: (e as Error).message });
  }
},
```

### 6. Fetch once per session — use `fetched` flag, not `settings !== null`

Settings can legitimately be `null` (brand-new user pre-currency-choice).
Using `settings !== null` to guard a fetch creates an infinite fetch loop
for new users.

```ts
// ❌ Wrong
if (user?.uid && !store.settings && !store.loading) {
  store.fetchSettings(user.uid); // loops forever for new users
}

// ✅ Right
if (user?.uid && !store.fetched && !store.loading) {
  store.fetchSettings(user.uid); // runs once, then stops
}
```

### 7. A bank account's currency can never be changed after creation

`updateBankAccount()` in `bank-account.service.ts` explicitly strips
`currencyCode` from any update payload. Do not add it back. Every income
and expense linked to an account must share its currency — if the account
currency could change, all existing linked transactions would have a
currency mismatch.

### 8. Always add a Firestore rule when adding a new collection

The catch-all `allow read, write: if false` at the bottom of
`firestore.rules` means a new collection without an explicit rule will
silently reject all reads and writes in production. Pattern to copy:

```js
match /myNewCollection/{docId} {
  allow read: if isOwner(userId);
  allow create: if isOwner(userId) && hasValidUserId(userId);
  allow update, delete: if isOwner(userId);
}
```

Also add the collection path to `src/lib/firebase/db.ts → COLLECTIONS`.

### 9. Pages never talk to Firestore — services do

```
Page → Hook → Store → Service → Firebase
```

If you're writing a Firestore import in a `page.tsx` or a `*-client.tsx`
file, you're in the wrong layer. Move the logic to a service function.

### 10. New bank-account-related expenses must use `debitIncomeWithShortfall`

Don't call `createLedgerEntry` directly for expense debits. The shortfall
engine only activates if you go through `debitIncomeWithShortfall`. Direct
ledger writes bypass the income-floor-at-zero guarantee.

```ts
// ❌ Wrong — can push income negative
await createLedgerEntry({ transactionType: "EXPENSE_CREATED", direction: "DEBIT", amount, ... });

// ✅ Right — income can never go below zero
await debitIncomeWithShortfall({ userId, incomeSourceId, accountId, amount, ... });
```

---

## How to Safely Add a New Feature

### Adding a new page/route

1. Create `src/app/(dashboard)/my-feature/page.tsx` (server component) and
   `src/app/(dashboard)/my-feature/my-feature-client.tsx` (client component).
2. Add the route to the sidebar (`src/components/layout/sidebar.tsx`) and
   bottom navbar (`src/components/layout/navbar.tsx`).
3. If it shows financial amounts: use `formatFor`, never `format`.
4. If it has a list: implement `GlobalCurrencyFilter` and filter with
   `useCurrencyFilter().matches(item.currencyCode)`.

### Adding a new Firestore collection

1. Add the collection path to `COLLECTIONS` in `src/lib/firebase/db.ts`.
2. Add the TypeScript interface to `src/types/index.ts`.
3. Add a security rule in `firestore.rules`.
4. Create `src/services/my-thing.service.ts` with standard CRUD functions.
5. Create `src/stores/my-thing.store.ts` following the standard store shape.
6. Create `src/hooks/use-my-thing.ts` following the fetch-once pattern.
7. Update `docs/DATABASE.md` and `docs/API_REFERENCE.md`.

### Adding a new transaction type to the ledger

1. Add the new string literal to `TransactionType` in `src/types/index.ts`.
2. Update `docs/DATABASE.md → TransactionType values list`.
3. Update `docs/LEDGER_ENGINE.md` if the new type affects balance logic.
4. Ensure your service uses `createLedgerEntry` with the new type.
5. If it's a debit against an income, use `debitIncomeWithShortfall` instead.

### Adding a new chart to analytics

1. Compute the data in `src/hooks/use-analytics.ts` using `useMemo` from
   the already-loaded store data. **No new Firestore queries for charts.**
2. Create a new component in `src/components/analytics/my-chart.tsx`.
3. Import and render it at the bottom of `analytics-client.tsx`.
4. Handle empty/loading states explicitly — `if (!data.length) return null`.

---

## Pre-Ship Testing Checklist

Before merging any change that touches financial logic:

- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `npm run build` — clean production build
- [ ] Create a test income → verify balance is correct
- [ ] Create an expense larger than the income → verify income lands at 0,
      not negative; verify shortfall appears on account page
- [ ] Add a new income → verify shortfall auto-resolves
- [ ] Delete an expense → verify income balance is restored
- [ ] Change an expense amount up/down → verify balance changes correctly
- [ ] Reassign an expense → verify old income is credited, new income is
      debited with shortfall protection
- [ ] Multi-currency: create income in USD, expense in USD, verify KWD
      income is unaffected; try cross-currency assignment → verify it's
      blocked with a clear error
- [ ] "Recompute" button → verify it's a no-op on a clean account

---

## Keeping These Docs Alive

Every time a change is made to the codebase, update the docs immediately
in the same pull request. The rule: **never merge a feature or bug fix
without a corresponding docs update.**

Which file to update:

| Change type | Update this |
|---|---|
| New page / route | `UX_FLOWS.md`, `USER_GUIDE.md` |
| New service function | `API_REFERENCE.md` |
| New Firestore collection or field | `DATABASE.md` |
| Change to balance/ledger logic | `LEDGER_ENGINE.md` |
| New invariant / convention learned from a bug | `DEVELOPER_GUIDE.md` (this file, Invariants section) |
| Architectural change | `ARCHITECTURE.md` |
| Any user-facing change | `USER_GUIDE.md` |
| Everything | `CHANGELOG.md` (always, every PR) |

### CHANGELOG entry format

```markdown
## [YYYY-MM-DD] Short title of change

**Type:** Bug Fix | Feature | Refactor | Security

**What changed:**
- Specific thing 1
- Specific thing 2

**Why:**
One sentence explaining the root cause or motivation.

**Files changed:**
- `src/services/expense.service.ts`
- `src/components/expenses/expense-form.tsx`

**Risks / notes:**
Any edge cases, things that weren't fixed, or things to watch out for.
```

Do not skip the CHANGELOG. It's how future developers (including future
you) understand why the code looks the way it does.

---

## The Developer Docs Route (`/devhub`)

The app has a built-in documentation viewer accessible at `/devhub`. It reads
the `.md` files from the `/docs` folder and renders them as formatted pages
with tables, code blocks, and Mermaid diagrams.

### Access

| URL | Access |
|---|---|
| `/devhub` | Password required |
| `/devhub/architecture` | Password required |
| `/devhub/database` | Password required |
| `/devhub/ledger-engine` | Password required |
| `/devhub/api-reference` | Password required |
| `/devhub/ux-flows` | Password required |
| `/devhub/user-guide` | **Open — no password** (end-user facing) |
| `/devhub/developer-guide` | Password required |
| `/devhub/changelog` | Password required |

### Default password

```
devdocs@2024
```

**To change the password** — one of two ways:
1. Edit `src/components/docs/docs-config.ts → DEVHUB_PASSWORD` directly.
2. Set the environment variable `NEXT_PUBLIC_DEVHUB_PASSWORD` — this
   overrides the hardcoded value with no code change needed.

The password is stored as a simple hash in the user's `localStorage` after
first entry. The "Lock docs" button in the sidebar footer clears it
immediately and returns to the password screen.

### Adding a new doc

1. Create the `.md` file in `/docs/` (e.g. `docs/MY_NEW_DOC.md`).
2. Add one entry to the `DOCS` array in `src/components/docs/docs-config.ts`:
   ```ts
   {
     slug:        "my-new-doc",
     filename:    "MY_NEW_DOC.md",
     title:       "My New Doc",
     description: "What this doc covers",
     icon:        "📄",
   }
   ```
3. If it should be open without a password (like the User Guide), add its
   slug to `PUBLIC_SLUGS` in the same file.
4. Deploy. The route picks it up automatically — no other code changes.

### Updating existing docs

Edit the `.md` file directly and deploy. The route reads the file fresh on
every request — there is no cache, no sync step, no copy-paste. The file
in `/docs/` is the single source of truth.

### Key files for the devhub

| File | Purpose |
|---|---|
| `src/components/docs/docs-config.ts` | Slug→filename map, password, public slugs list |
| `src/components/docs/markdown-renderer.tsx` | react-markdown + Mermaid renderer |
| `src/components/docs/docs-password-gate.tsx` | Password check + localStorage auth |
| `src/components/docs/docs-sidebar.tsx` | Sidebar navigation with all doc links |
| `src/app/devhub/page.tsx` | Index page (`/devhub`) — renders `INDEX.md` |
| `src/app/devhub/[slug]/page.tsx` | Dynamic page for every other slug |
| `src/app/devhub/layout.tsx` | Minimal layout (no dashboard chrome) |
