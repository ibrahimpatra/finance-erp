# 📱 User Guide

A plain-language walkthrough of how to use the Finance ERP app.
No technical knowledge required.

---

## What this app does

It tracks your money — every time money comes in (income) or goes out
(expenses), you record it here. The app shows you where your money is going,
how much you have left, and keeps a permanent record you can review any time.

Unlike a simple spreadsheet, this app supports multiple currencies, multiple
bank accounts, multiple household members spending money, and a full
transaction history that can never be edited after the fact.

---

## First time setup

### 1. Pick your base currency

The first time you log in, you'll see a banner at the top of the dashboard
asking you to pick a currency. This is the currency you use most. You can
change it later in Settings, and you can still record transactions in other
currencies too.

### 2. Create a bank account (optional but recommended)

Go to **Accounts** in the navigation. Create your first bank account — give
it a name (e.g., "Personal Checking"), pick the bank name, account type,
and currency. If you already have money in the account, enter the opening
balance so the app starts from the correct number.

Once you have accounts, incomes and expenses link to them — this lets you
track each account's balance separately.

### 3. Add your people (Spent By)

Go to **Spent By** and add the people in your household who spend money.
Every expense needs to know who spent it. Most people add themselves and
their partner/family members here.

### 4. Set up categories

Expense categories (Food, Transport, Health, etc.) come pre-loaded with
defaults. You can add more in **Settings → Categories** or directly from
the quick-add form.

---

## Recording income

Income is money that comes in — a salary, a freelance payment, a gift,
rental income, etc.

**To add income:**
1. Tap the **+** button (bottom right) and choose "Income" — OR —
   go to the **Income** page and tap "Add Income"
2. Fill in:
   - **Name** — what to call this income entry (e.g., "January Salary")
   - **Source** — where it came from (e.g., "Employer Name")
   - **Amount** — how much
   - **Account** — which bank account received it (if you use accounts)
   - **Currency** — which currency (defaults to your base currency)
3. Save.

The income appears on the Income page with its current balance shown.
The balance starts at the full amount and decreases as you record expenses
against it.

**The balance you see on an income card is its remaining unspent amount.**

---

## Recording expenses

An expense is money that went out.

**To add an expense:**
1. Tap the **+** button and choose "Expense" — OR —
   go to **Expenses** and tap "Add Expense"
2. Fill in:
   - **Reason** — what you bought (e.g., "Supermarket")
   - **Amount** — how much
   - **Who spent it** — pick from your people list
   - **Category** — what type of spending (Food, Transport, etc.)
   - **Account / Income Source** — where the money came from
   - **Tags** — optional labels for extra filtering
3. Save.

**About balance protection:** if an expense is larger than the available
balance on the linked income, the income stays at zero — it never goes
negative. The remaining amount shows as an "outstanding shortfall" on the
bank account page, and gets automatically resolved when you add your next
income.

---

## Bank accounts

The **Accounts** page shows each of your bank accounts with:

- **Balance** — current amount available (updated live from all transactions)
- **Total Income** — everything that came in
- **Total Spent** — everything that went out (expenses only, not transfers)
- **Attribution rate** — what percentage of income has been spent

Tapping an account shows all its transactions (incomes and expenses)
in a timeline, plus any outstanding shortfall details.

**Outstanding shortfall** (the amber panel): this appears when an expense
exceeded the available income balance. It shows exactly which expense
caused it and how much is still unresolved. It resolves automatically
when you add new income, or you can manually assign it to an existing
income with spare balance using the "Reassign" button.

**Recompute button**: if you think a balance looks off, tap "Recompute."
This runs a safe catch-up check and fixes any shortfalls that should have
resolved automatically but didn't. It's always safe to tap — it can only
add corrections, never remove anything.

---

## Transfers

A transfer moves money between two income sources (within the same account
or between accounts). Use this when you physically move money — e.g., from
checking to savings.

Both sides of the transfer are recorded. Cross-currency transfers are
supported — you enter the amount on both sides and the app records both
currencies correctly.

---

## Spent By

The **Spent By** page shows a summary of how much each person in your
household has spent, broken down by currency. Tap a person to see their
full expense history.

---

## Tags

Tags are custom labels you can add to any income or expense — things like
"Business," "Recurring," "Medical," etc. The **Tags** page shows how much
has been tagged with each label.

You can create a tag directly inside the expense or income form without
leaving it — tap "New Tag" in the tag picker.

---

## Analytics

The **Analytics** page gives you charts:

- **Monthly trend** — income vs. expenses per month (last 12 months)
- **Category breakdown** — pie chart of what you're spending on
- **Spending by person** — who's spending what
- **Tag breakdown** — spending by tag

Use the currency filter at the top to switch between currencies or view all
at once.

---

## Timeline

The **Timeline** page shows every single transaction (incomes, expenses,
transfers) in one chronological feed, grouped by date. Use the currency
filter to narrow it down. Each item links to its detail page.

---

## Search

The search bar (the magnifying glass icon, or ⌘K on desktop) searches
across all incomes, expenses, people, and tags instantly. No need to
navigate to specific pages.

---

## Settings

**Base Currency** — your primary currency. Affects how fallback amounts
are displayed for older records.

**Extra Currencies** — add currencies you use in addition to your base one.
These make the currency filter chips appear throughout the app.

**Attribution Mode** — controls how expenses get matched to income sources.
"Auto" does it automatically using oldest-income-first logic.

---

## Common questions

**Why does my income show a lower balance than I entered?**
Because expenses have been recorded against it. The balance is the
*remaining* amount after all spending.

**Why does an account show a negative balance?**
An expense was larger than the available income linked to that account.
The income itself stays at zero (it never goes negative), but the account
shows the overdraft. Add new income to that account to resolve it
automatically.

**Can I delete a transaction?**
Expenses can be deleted (which writes a reversal credit automatically).
Incomes can be deleted if no expenses or transfers reference them — you'd
need to reassign those first. The underlying ledger history is always kept
for accuracy.

**Can I edit an expense amount?**
Yes. If you increase an amount, the difference is debited from the same
income (with shortfall protection). If you decrease it, the difference is
credited back.

**What's a refund?**
If an expense gets partially or fully refunded, use the "Refund" button
on the expense detail page. Enter the refunded amount — this credits it
back to the original income source without deleting the expense history.
