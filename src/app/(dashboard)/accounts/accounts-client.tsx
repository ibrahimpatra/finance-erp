"use client";
import { useState }           from "react";
import { useBankAccounts }     from "@/hooks/use-bank-accounts";
import { useAuthStore }        from "@/stores/auth.store";
import { useToast }            from "@/components/ui/toaster";
import { AccountCard }         from "@/components/bank-accounts/account-card";
import { AccountForm }         from "@/components/bank-accounts/account-form";
import { FormDrawer }          from "@/components/shared/form-drawer";
import { ConfirmDialog }       from "@/components/shared/confirm-dialog";
import { BankAccountSchema }   from "@/lib/validations/bank-account";
import { BankAccount, BankAccountWithBalance, BankAccountFormData } from "@/types";
import { Landmark, Plus, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function AccountsPageClient() {
  const { user }                   = useAuthStore();
  const { toast }                  = useToast();
  const {
    accountsWithBalance, accounts, loading,
    addAccount, editAccount, removeAccount,
  } = useBankAccounts();

  const [showAdd,   setShowAdd]   = useState(false);
  const [editTarget, setEditTarget] = useState<BankAccountWithBalance | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const handleAdd = async (data: BankAccountSchema) => {
    if (!user) return;
    try {
      await addAccount(user.uid, data as BankAccountFormData);
      toast("Account created!", "success");
      setShowAdd(false);
    } catch (e: unknown) {
      toast((e as Error).message ?? "Failed to create account", "error");
    }
  };

  const handleEdit = async (data: BankAccountSchema) => {
    if (!user || !editTarget) return;
    try {
      // Exclude currencyCode from edit (locked after creation)
      const { currencyCode: _dropped, ...rest } = data;
      await editAccount(user.uid, editTarget.id, rest as Partial<BankAccountFormData>, editTarget);
      toast("Account updated!", "success");
      setEditTarget(null);
    } catch (e: unknown) {
      toast((e as Error).message ?? "Failed to update account", "error");
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      await removeAccount(user.uid, deleteTarget.id);
      toast("Account deleted", "success");
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast((e as Error).message ?? "Failed to delete account", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Totals for header stats
  const totalsByCode = accountsWithBalance.reduce<Record<string, number>>((acc, a) => {
    acc[a.currencyCode] = (acc[a.currencyCode] ?? 0) + a.balance;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bank accounts and wallets · balances derived from your income entries
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Account</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Loading */}
      {loading && accounts.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : accountsWithBalance.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No bank accounts yet"
          description="Create a bank account to group your income entries and track per-account balances."
          action={
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" /> Create First Account
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountsWithBalance.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => setEditTarget(account)}
              onDelete={() => setDeleteTarget(account)}
            />
          ))}
        </div>
      )}

      {/* Add Drawer */}
      <FormDrawer
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="New Bank Account"
        description="Create a new bank account or wallet to track balances"
      >
        <AccountForm
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      </FormDrawer>

      {/* Edit Drawer */}
      <FormDrawer
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Account"
        description="Update account details. Currency cannot be changed."
      >
        {editTarget && (
          <AccountForm
            defaultValues={{
              name:           editTarget.name,
              bankName:       editTarget.bankName,
              accountType:    editTarget.accountType,
              lastFourDigits: editTarget.lastFourDigits,
              currencyCode:   editTarget.currencyCode,
              color:          editTarget.color,
              icon:           editTarget.icon,
              isActive:       editTarget.isActive,
              isDefault:      editTarget.isDefault,
              notes:          editTarget.notes,
            }}
            currencyLocked
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitLabel="Save Changes"
          />
        )}
      </FormDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Account"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone. You must reassign all linked income entries and expenses first.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
