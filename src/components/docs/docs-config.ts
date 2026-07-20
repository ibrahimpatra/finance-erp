/**
 * Docs configuration shared across the /devhub route.
 *
 * To add a new doc:
 *  1. Create the .md file in /docs/
 *  2. Add a new entry here
 *  3. Done — the route renders it automatically
 *
 * PUBLIC_SLUGS: accessible without any password (end-user facing docs)
 * All other slugs require the devhub password.
 */

export interface DocEntry {
  slug: string;
  filename: string;
  title: string;
  description: string;
  icon: string;
}

export const DOCS: DocEntry[] = [
  {
    slug:        "index",
    filename:    "INDEX.md",
    title:       "Overview",
    description: "Start here — what every file covers",
    icon:        "📚",
  },
  {
    slug:        "architecture",
    filename:    "ARCHITECTURE.md",
    title:       "Architecture",
    description: "Tech stack, folder structure, layer diagram",
    icon:        "🏗️",
  },
  {
    slug:        "database",
    filename:    "DATABASE.md",
    title:       "Database",
    description: "Firestore schema, every collection and field",
    icon:        "🗄️",
  },
  {
    slug:        "ledger-engine",
    filename:    "LEDGER_ENGINE.md",
    title:       "Ledger Engine",
    description: "The financial brain — balances, shortfalls, FIFO",
    icon:        "🧠",
  },
  {
    slug:        "api-reference",
    filename:    "API_REFERENCE.md",
    title:       "API Reference",
    description: "Every service function — params, returns, side effects",
    icon:        "📡",
  },
  {
    slug:        "ux-flows",
    filename:    "UX_FLOWS.md",
    title:       "UX Flows",
    description: "Every page and user flow with diagrams",
    icon:        "🗺️",
  },
  {
    slug:        "user-guide",
    filename:    "USER_GUIDE.md",
    title:       "User Guide",
    description: "Plain-language guide for end users",
    icon:        "📱",
  },
  {
    slug:        "developer-guide",
    filename:    "DEVELOPER_GUIDE.md",
    title:       "Developer Guide",
    description: "Setup, conventions, invariants, how to extend safely",
    icon:        "👨‍💻",
  },
  {
    slug:        "changelog",
    filename:    "CHANGELOG.md",
    title:       "Changelog",
    description: "Full history of every change made to the app",
    icon:        "📋",
  },
];

/** Slugs accessible without any password. */
export const PUBLIC_SLUGS = new Set(["user-guide"]);

/** The devhub password. Change this or override via NEXT_PUBLIC_DEVHUB_PASSWORD env var. */
export const DEVHUB_PASSWORD =
  process.env.NEXT_PUBLIC_DEVHUB_PASSWORD ?? "devdocs@2024";

/** Key used to store auth state in localStorage. */
export const DEVHUB_STORAGE_KEY = "devhub_access_v1";
