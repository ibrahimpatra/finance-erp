"use client";
import { useEffect, useId, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

/* ── Mermaid diagram — lazy-loads the library only when needed ── */
function MermaidBlock({ chart }: { chart: string }) {
  const id  = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;

    import("mermaid").then(({ default: mermaid }) => {
      if (cancelled) return;
      mermaid.initialize({
        startOnLoad: false,
        theme:       "neutral",
        fontFamily:  "DM Sans, system-ui, sans-serif",
      });
      mermaid
        .render(`mermaid-${id}`, chart.trim())
        .then(({ svg }) => {
          if (cancelled || !ref.current) return;
          ref.current.innerHTML = svg;
        })
        .catch(() => {
          if (!ref.current) return;
          ref.current.innerHTML = `<pre class="text-xs text-red-500 p-3">${chart}</pre>`;
        });
    });

    return () => { cancelled = true; };
  }, [chart, id]);

  return (
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4"
      aria-label="Diagram"
    />
  );
}

/* ── Code block — detect mermaid vs regular code ── */
function CodeBlock({
  inline,
  className,
  children,
}: {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const lang = (className ?? "").replace("language-", "");
  const raw  = String(children ?? "").replace(/\n$/, "");

  if (!inline && lang === "mermaid") {
    return <MermaidBlock chart={raw} />;
  }

  if (inline) {
    return (
      <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-pink-600">
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-gray-200">
      {lang && (
        <div className="border-b border-gray-200 bg-gray-100 px-4 py-1.5">
          <span className="font-mono text-xs font-medium text-gray-500">{lang}</span>
        </div>
      )}
      <pre className="overflow-x-auto bg-gray-50 p-4 text-sm leading-relaxed">
        <code className="font-mono text-gray-800">{children}</code>
      </pre>
    </div>
  );
}

/* ── Main renderer ── */
interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="docs-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          /* Headings */
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-3xl font-bold tracking-tight text-gray-900 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-8 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-800">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 text-lg font-semibold text-gray-800">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-4 font-semibold text-gray-700">{children}</h4>
          ),

          /* Paragraph */
          p: ({ children }) => (
            <p className="my-3 leading-7 text-gray-700">{children}</p>
          ),

          /* Lists */
          ul: ({ children }) => (
            <ul className="my-3 ml-5 list-disc space-y-1 text-gray-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-5 list-decimal space-y-1 text-gray-700">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,

          /* Emphasis */
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,

          /* Blockquote */
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-blue-400 bg-blue-50 py-2 pl-4 pr-3 text-sm text-blue-900">
              {children}
            </blockquote>
          ),

          /* Code */
          code: CodeBlock as React.ComponentType<React.HTMLAttributes<HTMLElement>>,

          /* Horizontal rule */
          hr: () => <hr className="my-8 border-gray-200" />,

          /* Links */
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),

          /* Tables — GitHub-flavored */
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-100">{children}</tbody>
          ),
          tr: ({ children }) => <tr className="hover:bg-gray-50/60">{children}</tr>,
          th: ({ children }) => (
            <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-gray-700">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
