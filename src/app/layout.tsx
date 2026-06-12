import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: { template: "%s | Finance ERP", default: "Finance ERP — Personal Money Tracker" },
  description: "Track every dinar with precision. Personal finance ERP with ledger architecture.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background">
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
