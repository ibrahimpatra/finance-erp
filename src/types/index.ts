import { Timestamp } from "firebase/firestore";

export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Settings {
  id: string;
  userId: string;
  currencyName: string;
  currencyCode: string;
  currencySymbol: string;
  attributionMode?: "auto" | "prompt"; // NEW — how expenses match to incomes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Multi-Currency ──────────────────────────────────────────────
export interface Currency {
  id: string;
  userId: string;
  name: string;
  code: string;
  symbol: string;
  isDefault: boolean;
  createdAt: Timestamp;
}

export type CurrencyFormData = Omit<Currency, "id" | "userId" | "createdAt">;

export interface Income {
  id: string;
  userId: string;
  name: string;
  source: string;
  amount: number;
  notes?: string;
  tagIds: string[];
  currencyCode?: string; // multi-currency support
  accountId?: string;          // NEW — which bank account this income is deposited into
  incomeSourceTypeId?: string; // NEW — links to IncomeSourceType (richer categorisation)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Expense {
  id: string;
  userId: string;
  incomeSourceId: string;
  spentById: string;
  amount: number;
  reason: string;
  notes?: string;
  expenseTypeId: string;
  tagIds: string[];
  currencyCode?: string;   // multi-currency support
  accountId?: string;      // which bank account this expense debits
  /** NEW — true for system-generated shortfall-adjustment expenses.
   *  These cannot be deleted by the user, only reassigned to another
   *  income in the same account with balance > 0. */
  isSystemGenerated?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SpentBy {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  notes?: string;
  avatarColor?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Timestamp;
}

export interface Transfer {
  id: string;
  userId: string;
  fromIncomeId: string;
  toIncomeId: string;
  amount: number;          // amount deducted from source (in fromCurrencyCode)
  toAmount?: number;       // amount credited to destination (in toCurrencyCode); equals amount for same-currency
  fromCurrencyCode?: string;
  toCurrencyCode?: string;
  note?: string;
  fromAccountId?: string;  // NEW — account-level transfer source
  toAccountId?: string;    // NEW — account-level transfer destination
  createdAt: Timestamp;
}

export type TransactionType =
  | "INCOME_CREATED"
  | "EXPENSE_CREATED"
  | "EXPENSE_UPDATED"
  | "EXPENSE_DELETED"
  | "TRANSFER"
  | "EXPENSE_REASSIGNED"
  | "REFUND"
  | "INCOME_ADJUSTMENT"
  | "OPENING_BALANCE"
  | "SHORTFALL_CREATED"   // NEW — expense exceeded available income balance; remainder tracked at account level
  | "SHORTFALL_RESOLVED"; // NEW — a later income (or manual action) covered an outstanding shortfall

export type LedgerDirection = "CREDIT" | "DEBIT";

export interface LedgerEntry {
  id: string;
  userId: string;
  transactionType: TransactionType;
  incomeSourceId?: string;
  expenseId?: string;
  transferId?: string;
  spentById?: string;
  accountId?: string;  // NEW — which bank account this entry belongs to
  amount: number;
  direction: LedgerDirection;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
  timestamp: Timestamp;
}

export interface ExpenseType {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MonthlySnapshot {
  id: string;
  userId: string;
  month: number;
  year: number;
  openingBalance: number;
  income: number;
  expenses: number;
  transfers: number;
  refunds: number;
  closingBalance: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface IncomeWithBalance extends Income {
  balance: number;
  totalExpenses: number;
  totalCredits: number;
  totalDebits: number;
  percentageUsed: number;
}

export interface ExpenseWithRelations extends Expense {
  income?: Income;
  spentBy?: SpentBy;
  expenseType?: ExpenseType;
  tags?: Tag[];
}

export interface TransferWithRelations extends Transfer {
  fromIncome?: Income;
  toIncome?: Income;
}

export interface SpentByWithStats extends SpentBy {
  totalSpent: number;
  transactionCount: number;
  averageExpense: number;
  largestTransaction: number;
  favoriteCategory?: string;
  favoriteTag?: string;
  incomeSources?: string[];
  recentExpenses?: ExpenseWithRelations[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface TagAnalytics {
  tagId: string;
  tagName: string;
  color: string;
  incomeCount: number;
  expenseCount: number;
  totalAmount: number;
  usageCount: number;
}

export interface SearchResult {
  type:         "income" | "expense" | "spentBy" | "tag" | "transfer";
  id:           string;
  title:        string;
  subtitle?:    string;
  amount?:      number;
  currencyCode?: string;  // FIX: was missing — caused base-currency label on search result amounts
  date?:        Timestamp;
}

export interface ExpenseFilters {
  startDate?: Date;
  endDate?: Date;
  incomeSourceId?: string;
  spentById?: string;
  expenseTypeId?: string;
  tagIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export type ExportFormat = "csv" | "json" | "excel";

export type IncomeFormData = Omit<Income, "id" | "userId" | "createdAt" | "updatedAt">;

// incomeSourceId is intentionally optional here.
// The expense form always resolves it via FIFO before calling the service,
// but callers that already have it (edit, reassign) pass it directly.
// The service MUST receive it populated — the form guarantees this.
export interface ExpenseFormData {
  incomeSourceId?: string; // resolved before Firestore write (FIFO or manual)
  accountId?:      string; // NEW — which bank account is debited
  spentById:       string;
  amount:          number;
  reason:          string;
  notes?:          string;
  expenseTypeId:   string;
  tagIds:          string[];
  currencyCode?:   string;
}

export type SpentByFormData      = Omit<SpentBy,  "id" | "userId" | "createdAt" | "updatedAt">;
export type TagFormData          = Omit<Tag,       "id" | "userId" | "createdAt">;
export type TransferFormData     = Omit<Transfer,  "id" | "userId" | "createdAt">;
export type ExpenseTypeFormData  = Omit<ExpenseType, "id" | "userId" | "createdAt" | "updatedAt">;
export type SettingsFormData     = Omit<Settings,  "id" | "userId" | "createdAt" | "updatedAt">;

export const DEFAULT_SETTINGS: SettingsFormData = {
  currencyName: "Kuwaiti Dinar",
  currencyCode: "KWD",
  currencySymbol: "KD",
  attributionMode: "auto",
};

export const INCOME_SOURCES = [
  "Salary","Gift","Business","Allowance","Investment","Freelance","Rental Income","Other",
] as const;

export const DEFAULT_EXPENSE_TYPES = [
  { name: "Food", icon: "🍔", color: "#ef4444" },
  { name: "Transport", icon: "🚗", color: "#f97316" },
  { name: "Fuel", icon: "⛽", color: "#eab308" },
  { name: "Shopping", icon: "🛍️", color: "#a855f7" },
  { name: "Bills", icon: "📄", color: "#3b82f6" },
  { name: "Education", icon: "📚", color: "#06b6d4" },
  { name: "Healthcare", icon: "🏥", color: "#ec4899" },
  { name: "Entertainment", icon: "🎬", color: "#f43f5e" },
  { name: "Investment", icon: "📈", color: "#10b981" },
  { name: "Subscription", icon: "🔄", color: "#8b5cf6" },
  { name: "Other", icon: "📦", color: "#6b7280" },
] as const;

export const AVATAR_COLORS = [
  "#3b82f6","#ef4444","#10b981","#f59e0b",
  "#8b5cf6","#ec4899","#06b6d4","#f97316","#84cc16","#6b7280",
] as const;

export const TAG_COLORS = [
  "#3b82f6","#ef4444","#10b981","#f59e0b","#8b5cf6",
  "#ec4899","#06b6d4","#f97316","#84cc16","#6366f1","#14b8a6","#f43f5e",
] as const;

// ─── Income Source Types (Dynamic) ──────────────────────────────
export interface IncomeSourceType {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type IncomeSourceTypeFormData = Omit<IncomeSourceType, "id" | "userId" | "createdAt" | "updatedAt">;

export const DEFAULT_INCOME_SOURCE_TYPES = [
  { name: "Salary",        icon: "💼", color: "#3b82f6" },
  { name: "Gift",          icon: "🎁", color: "#ec4899" },
  { name: "Business",      icon: "🏢", color: "#8b5cf6" },
  { name: "Allowance",     icon: "💰", color: "#f59e0b" },
  { name: "Investment",    icon: "📈", color: "#10b981" },
  { name: "Freelance",     icon: "💻", color: "#06b6d4" },
  { name: "Rental Income", icon: "🏠", color: "#f97316" },
  { name: "Other",         icon: "📦", color: "#6b7280" },
] as const;

// ─── Preset Currencies ───────────────────────────────────────────
export const PRESET_CURRENCIES = [
  { name: "Kuwaiti Dinar", code: "KWD", symbol: "KD" },
  { name: "US Dollar", code: "USD", symbol: "$" },
  { name: "Euro", code: "EUR", symbol: "€" },
  { name: "British Pound", code: "GBP", symbol: "£" },
  { name: "UAE Dirham", code: "AED", symbol: "AED" },
  { name: "Saudi Riyal", code: "SAR", symbol: "SAR" },
  { name: "Bahraini Dinar", code: "BHD", symbol: "BD" },
  { name: "Qatari Riyal", code: "QAR", symbol: "QAR" },
  { name: "Omani Rial", code: "OMR", symbol: "OMR" },
  { name: "Japanese Yen", code: "JPY", symbol: "¥" },
  { name: "Indian Rupee", code: "INR", symbol: "₹" },
  { name: "Canadian Dollar", code: "CAD", symbol: "CA$" },
] as const;

// ─── Bank Accounts ───────────────────────────────────────────────
export type AccountType = "checking" | "savings" | "cash" | "wallet" | "credit";

export const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: "checking", label: "Checking", icon: "🏦" },
  { value: "savings",  label: "Savings",  icon: "💰" },
  { value: "cash",     label: "Cash",     icon: "💵" },
  { value: "wallet",   label: "Wallet",   icon: "👜" },
  { value: "credit",   label: "Credit",   icon: "💳" },
];

// Bank name is now free-text (no hardcoded country-specific bank list).
// Kept as an empty const for backward import-compatibility — safe no-op.
export const KNOWN_BANKS: readonly string[] = [];

export interface BankAccount {
  id: string;
  userId: string;
  name: string;
  bankName?: string;
  accountType: AccountType;
  lastFourDigits?: string;
  currencyCode: string;   // locked at creation — never changes
  color: string;
  icon?: string;
  isActive: boolean;
  isDefault: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BankAccountFormData = Omit<BankAccount, "id" | "userId" | "createdAt" | "updatedAt"> & {
  /** NEW — optional starting balance, only used at account creation. Writes a single
   *  OPENING_BALANCE ledger entry tied to the account (not any income). Never required. */
  openingBalance?: number;
};

/**
 * BankAccount enriched with computed balance derived from linked incomes.
 * Balance = sum of IncomeWithBalance.balance for all incomes where income.accountId === account.id.
 * This intentionally uses the existing ledger-based income balance so NO ledger data is ever
 * touched or migrated — the account balance is a real-time aggregate view.
 */
export interface BankAccountWithBalance extends BankAccount {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  incomeCount: number;
  expenseCount: number;
  attributionRate: number; // 0–100%: what % of income has been attributed to expenses
  outstandingShortfall: number; // NEW — amount currently uncovered by any income (account-level overdraft)
}

// ─── Expense Income Allocations (FIFO Attribution) ───────────────
// These records are DISPLAY-ONLY. They track which income entries "funded" which
// expenses via FIFO. They never affect ledger entries or balances.
export interface ExpenseIncomeAllocation {
  id: string;
  userId: string;
  accountId: string;
  expenseId: string;
  incomeId: string;
  amount: number;
  isAutoMapped: boolean; // true = FIFO auto, false = manually set by user
  createdAt: Timestamp;
}

export type AllocationFormData = Omit<ExpenseIncomeAllocation, "id" | "userId" | "createdAt">;

// Sentinel — written when expense amount exceeds all available income in the account
export const UNATTRIBUTED_SENTINEL = "__unattributed__";
