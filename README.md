# Finance ERP — Personal Money Tracking System

A production-ready personal finance ERP built with **Next.js 15**, **Firebase**, **Zustand**, and **Tailwind CSS**. Uses a **ledger architecture** — all balances are calculated from ledger entries, never stored.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| State | Zustand |
| Backend | Firebase (Auth + Firestore + Storage) |
| Utilities | date-fns, Lucide React |

---

## Setup Instructions

### 1. Clone / unzip the project

```bash
cd finance-erp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Firebase project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password sign-in
4. Create a **Firestore** database (start in production mode)
5. Go to **Project Settings → General** and copy your web app config

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Firebase config values in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5. Deploy Firestore Security Rules

In the Firebase console, go to **Firestore → Rules** and paste the contents of `firestore.rules`, or use the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

### Ledger Architecture
This app never stores balances. Every money movement creates an immutable ledger entry:
- **CREDIT** entries: income created, refunds, transfer-in
- **DEBIT** entries: expenses, transfer-out

Balances are always computed: `balance = sum(credits) - sum(debits)` for a given income source.

### Firestore Collections (per user)
```
/users/{userId}/
  settings/preferences      ← Currency config
  incomes/{id}              ← Income sources
  expenses/{id}             ← Expense records
  spentBy/{id}              ← People who spend
  tags/{id}                 ← Many-to-many labels
  transfers/{id}            ← Transfers between income sources
  ledger/{id}               ← Immutable ledger entries (single source of truth)
  auditLogs/{id}            ← Immutable audit trail
  expenseTypes/{id}         ← Expense categories
  monthlySnapshots/{id}     ← Monthly rollup snapshots
```

---

## Features

- **Authentication** — Register, login, logout, password reset, protected routes
- **Income Sources** — Track where money comes from with running balance
- **Expenses** — Log expenses against specific income sources
- **Spent By** — Track who spent what with profile analytics
- **Tags** — Many-to-many labels on income, expenses, and transfers
- **Transfers** — Move money between income sources
- **Refunds** — Record refunds that restore income balance
- **Expense Reassignment** — Move expense to different income source
- **Analytics** — Charts for categories, people, monthly trends, tags
- **Timeline** — Unified activity feed
- **Global Search** — Search across all records (⌘K)
- **Export** — CSV and JSON export
- **Smart Defaults** — Quick-add FAB remembers last entry
- **Currency Config** — Full currency customization per user

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘ K` / `Ctrl K` | Open command palette / search |
| `Esc` | Close dialogs |

---

## Seed Data

When a new user registers, the app automatically:
1. Creates default settings (KWD currency)
2. Seeds 11 default expense categories (Food, Transport, Fuel, etc.)

To add sample data, register an account and use the UI to add income sources, spent-by people, and expenses.

---

## Production Deployment

```bash
npm run build
npm start
```

Or deploy to Vercel:

```bash
npm install -g vercel
vercel --prod
```

Set all `NEXT_PUBLIC_FIREBASE_*` environment variables in your Vercel project settings.
