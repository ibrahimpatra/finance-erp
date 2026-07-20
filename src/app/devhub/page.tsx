import { readFileSync } from "fs";
import { join } from "path";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsPasswordGate } from "@/components/docs/docs-password-gate";
import { MarkdownRenderer } from "@/components/docs/markdown-renderer";

function readDoc(filename: string): string {
  try {
    return readFileSync(join(process.cwd(), "docs", filename), "utf-8");
  } catch {
    return `# File not found\n\nCould not read \`docs/${filename}\`. Make sure the file exists.`;
  }
}

export default function DevhubIndexPage() {
  const content = readDoc("INDEX.md");

  return (
    <DocsPasswordGate slug="index">
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
