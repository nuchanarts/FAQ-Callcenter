import { Fragment } from "react";
import { parseContent, type Inline } from "@/domain/content-format";
import { th } from "@/i18n/th";

function InlineRow({ row }: { row: Inline[] }) {
  return (
    <>
      {row.map((node, i) => {
        switch (node.type) {
          case "bold":
            return (
              <strong key={i} className="font-semibold text-ink">
                {node.text}
              </strong>
            );
          case "code":
            return (
              <code
                key={i}
                className="rounded-md border border-line bg-surface-muted px-1.5 py-0.5 font-sans text-[0.95em] font-medium whitespace-nowrap text-herb"
              >
                {node.text}
              </code>
            );
          case "link":
            return (
              <a
                key={i}
                href={node.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-herb underline decoration-herb/40 underline-offset-3 hover:decoration-herb"
              >
                {node.text}
                <span className="sr-only"> {th.topic.opensNewTab}</span>
              </a>
            );
          default:
            return <Fragment key={i}>{node.text}</Fragment>;
        }
      })}
    </>
  );
}

/**
 * Renders the topic content format as React elements.
 * No HTML strings and no dangerouslySetInnerHTML: React escapes every text node (Constitution V).
 */
export function ContentRenderer({ source }: { source: string }) {
  const blocks = parseContent(source);
  return (
    <div className="flex flex-col gap-3 text-ink-muted">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "ordered":
            return (
              <ol key={i} className="flex flex-col gap-2">
                {block.items.map((row, j) => (
                  <li key={j} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-herb-soft font-display text-[0.95rem] font-semibold text-herb"
                    >
                      {j + 1}
                    </span>
                    <span className="text-ink">
                      <InlineRow row={row} />
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "bullets":
            return (
              <ul key={i} className="ml-10 list-disc space-y-1 marker:text-herb">
                {block.items.map((row, j) => (
                  <li key={j}>
                    <InlineRow row={row} />
                  </li>
                ))}
              </ul>
            );
          case "note":
            return (
              <aside
                key={i}
                className="rounded-soft border-l-4 border-level-partial bg-level-partial-soft px-4 py-3 text-ink"
              >
                {block.lines.map((row, j) => (
                  <p key={j}>
                    <InlineRow row={row} />
                  </p>
                ))}
              </aside>
            );
          case "paragraph":
            return (
              <p key={i}>
                {block.lines.map((row, j) => (
                  <Fragment key={j}>
                    {j > 0 && <br />}
                    <InlineRow row={row} />
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
