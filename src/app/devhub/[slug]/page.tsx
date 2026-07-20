import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import { DOCS } from "@/components/docs/docs-config";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsPasswordGate } from "@/components/docs/docs-password-gate";
import { MarkdownRenderer } from "@/components/docs/markdown-renderer";

interface Props {
  params: Promise<{ slug: string }>;
}

function readDoc(filename: string): string {
  try {
    return readFileSync(join(process.cwd(), "docs", filename), "utf-8");
  } catch {
    return `# File not found\n\nCould not read \`docs/${filename}\`. Make sure the file exists.`;
  }
}

/** Pre-generate static pages for every known slug at build time. */
export function generateStaticParams() {
  return DOCS.filter((d) => d.slug !== "index").map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const doc = DOCS.find((d) => d.slug === slug);
  return {
    title:  doc ? `${doc.title} — Finance ERP Docs` : "Not Found",
    robots: { index: false, follow: false }, // keep out of search engines
  };
}

export default async function DevhubDocPage({ params }: Props) {
  const { slug } = await params;

  // Find the doc entry — 404 on unknown slugs
  const doc = DOCS.find((d) => d.slug === slug);
  if (!doc) notFound();

  const content = readDoc(doc.filename);

  return (
    <DocsPasswordGate slug={slug}>
      <div className="flex h-screen overflow-hidden">
        <DocsSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-8 py-10">
            <MarkdownRenderer content={content} />
          </div>
        </main>
      </div>
    </DocsPasswordGate>
  );
}
