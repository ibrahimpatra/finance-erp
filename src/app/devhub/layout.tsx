import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Docs — Finance ERP",
  robots: { index: false, follow: false }, // hide from search engines
};

/**
 * Clean standalone layout for /devhub — no dashboard sidebar, no top navbar,
 * no app chrome at all. Just docs. The root app layout (globals.css, fonts)
 * still applies since this nests inside it, but nothing else from the main
 * app structure bleeds in here.
 */
export default function DevhubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
