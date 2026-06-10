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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Income {
  id: string;
  userId: string;
  name: string;
  source: string;
  amount: number;
  notes?: string;
  tagIds: string[];
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
  amount: number;
  note?: string;
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
  | "OPENING_BALANCE";

export type LedgerDirection = "CREDIT" | "DEBIT";

export interface LedgerEntry {
  id: string;
  userId: string;
  transactionType: TransactionType;
  incomeSourceId?: string;
  expenseId?: string;
  transferId?: string;
  spentById?: string;
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
  type: "income" | "expense" | "spentBy" | "tag" | "transfer";
  id: string;
  title: string;
  subtitle?: string;
  amount?: number;
  date?: Timestamp;
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
export type ExpenseFormData = Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">;
export type SpentByFormData = Omit<SpentBy, "id" | "userId" | "createdAt" | "updatedAt">;
export type TagFormData = Omit<Tag, "id" | "userId" | "createdAt">;
export type TransferFormData = Omit<Transfer, "id" | "userId" | "createdAt">;
export type ExpenseTypeFormData = Omit<ExpenseType, "id" | "userId" | "createdAt" | "updatedAt">;
export type SettingsFormData = Omit<Settings, "id" | "userId" | "createdAt" | "updatedAt">;

export const DEFAULT_SETTINGS: SettingsFormData = {
  currencyName: "Kuwaiti Dinar",
  currencyCode: "KWD",
  currencySymbol: "KD",
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
