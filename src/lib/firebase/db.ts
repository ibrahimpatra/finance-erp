export { db } from "./config";

export const COLLECTIONS = {
  USERS: "users",
  SETTINGS:             (uid: string) => `users/${uid}/settings`,
  INCOMES:              (uid: string) => `users/${uid}/incomes`,
  EXPENSES:             (uid: string) => `users/${uid}/expenses`,
  SPENT_BY:             (uid: string) => `users/${uid}/spentBy`,
  TAGS:                 (uid: string) => `users/${uid}/tags`,
  TRANSFERS:            (uid: string) => `users/${uid}/transfers`,
  LEDGER:               (uid: string) => `users/${uid}/ledger`,
  AUDIT_LOGS:           (uid: string) => `users/${uid}/auditLogs`,
  MONTHLY_SNAPSHOTS:    (uid: string) => `users/${uid}/monthlySnapshots`,
  EXPENSE_TYPES:        (uid: string) => `users/${uid}/expenseTypes`,
  INCOME_SOURCE_TYPES:  (uid: string) => `users/${uid}/incomeSourceTypes`,
  CURRENCIES:           (uid: string) => `users/${uid}/currencies`,
} as const;
