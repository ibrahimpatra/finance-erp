import { Header } from "@/components/layout/header";
import { QuickAddFAB } from "@/components/expenses/quick-add-fab";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {children}
      </main>
      <QuickAddFAB />
    </div>
  );
}
