"use client";
import { useState } from "react";
import { useSettingsStore } from "@/stores/settings.store";
import { useAuthStore } from "@/stores/auth.store";
import { useToast } from "@/components/ui/toaster";
import { PRESET_CURRENCIES } from "@/types";
import { Globe, X, Loader2 } from "lucide-react";

/**
 * Non-blocking currency setup nudge for brand-new users.
 *
 * Renders ONLY when:
 *   - settings.fetched === true  (we've actually checked, not just "loading")
 *   - settings.settings === null (no settings doc exists yet at all)
 *
 * This makes it structurally impossible for this banner to ever appear for
 * an existing user — anyone with a settings doc (which is every user who
 * signed up before this change, and anyone who has already dismissed/
 * completed this banner) will never see it, regardless of what currency
 * they have configured.
 */
export function CurrencySetupBanner() {
  const { user } = useAuthStore();
  const { settings, fetched, updateSettings } = useSettingsStore();
  const { toast } = useToast();

  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!fetched || settings !== null || dismissed) return null;

  const handlePick = async (code: string, name: string, symbol: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateSettings(user.uid, {
        currencyName: name,
        currencyCode: code,
        currencySymbol: symbol,
        attributionMode: "auto",
      });
      toast(`Currency set to ${code}`, "success");
    } catch (e: unknown) {
      toast((e as Error).message || "Failed to set currency.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-primary/30 bg-primary/5 mb-4">
      <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Globe className="w-4.5 h-4.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Set your base currency</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pick the currency you use most. You can change this anytime in Settings,
          and you'll still be able to track income and expenses in other currencies too.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {PRESET_CURRENCIES.map((c) => (
            <button
              key={c.code}
              disabled={saving}
              onClick={() => handlePick(c.code, c.name, c.symbol)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-primary hover:text-white hover:border-primary transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {c.code}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
