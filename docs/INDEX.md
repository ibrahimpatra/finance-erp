# 📚 Finance ERP — Documentation

This `/docs` folder is the living technical and functional documentation for this
project. It is **separate from `README.md`** (which only covers installation/setup).
This folder explains *how the app actually works* — its design, its core financial
logic, its data model, its APIs, its user flows, and how to safely extend it.

> **This is a living document.** Every time a bug fix, feature, or architectural
> change is made, the relevant file(s) below should be updated, and a new entry
> added to `CHANGELOG.md`. See `DEVELOPER_GUIDE.md → "Keeping these docs alive"`
> for the exact process.

---

## Start Here

| If you are... | Read this first |
|---|---|
| A new developer joining the project | [`ARCHITECTURE.md`](./ARCHITECTURE.md) → [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md) |
| Trying to understand the money logic | [`LEDGER_ENGINE.md`](./LEDGER_ENGINE.md) — this is the most important file in this folder |
| Looking up what a specific function does | [`API_REFERENCE.md`](./API_REFERENCE.md) |
| Looking up the database schema | [`DATABASE.md`](./DATABASE.md) |
| Trying to understand a specific screen/flow | [`UX_FLOWS.md`](./UX_FLOWS.md) |
| An actual end-user of the app | [`USER_GUIDE.md`](./USER_GUIDE.md) |
| Curious what's changed over time | [`CHANGELOG.md`](./CHANGELOG.md) |

---

## File Map

```
docs/
├── INDEX.md              ← you are here
├── ARCHITECTURE.md        System design: tech stack, folder structure, layers, diagrams
├── DATABASE.md             Firestore schema: every collection, every field, security rules
├── LEDGER_ENGINE.md        The financial "brain": ledger, balances, shortfall engine, FIFO, currency
├── API_REFERENCE.md        Every service-layer function: purpose, params, returns, side effects
├── UX_FLOWS.md             Every page and major user flow, with flow diagrams
├── USER_GUIDE.md           Plain-language walkthrough for actual end-users
├── DEVELOPER_GUIDE.md       Local setup, conventions, how to safely add features, how to update these docs
└── CHANGELOG.md             Running history of every change made to the app
```

---

## One-Paragraph Summary of the Whole App

This is a **personal finance ERP** — a multi-currency income/expense tracker built
on **Next.js 15 + Firebase + Zustand**. Its defining architectural decision is a
**double-entry, append-only ledger**: nobody's balance is ever stored as a number
in a document — every balance (an income's balance, a bank account's balance) is
*computed live* by summing immutable ledger entries. Nothing in the ledger is ever
edited or deleted, only added to. On top of that ledger sits a **bank account
layer** that groups income sources together, with a **shortfall engine** that
guarantees an individual income can never go negative — any overflow is tracked
at the account level instead, and automatically resolved when new income arrives.

---

## Accessing These Docs in the Browser

The app has a built-in docs viewer at `/devhub`. It reads these `.md` files and
renders them with full formatting (tables, code blocks, Mermaid diagrams).

**Default password:** `devdocs@2024`
To change it: edit `DEVHUB_PASSWORD` in `src/components/docs/docs-config.ts`
or set the `NEXT_PUBLIC_DEVHUB_PASSWORD` environment variable.

The `/devhub/user-guide` route is open to everyone with no password required.
All other routes require the developer password.

To update a doc: edit the `.md` file directly, deploy — that's it.
To add a new doc: create the file in `/docs/`, add one entry to the `DOCS` array
in `docs-config.ts`, deploy.

See `DEVELOPER_GUIDE.md → "The Developer Docs Route"` for the full reference.
