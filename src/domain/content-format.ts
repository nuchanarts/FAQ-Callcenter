import { isHttpsUrl } from "@/domain/topic";

/**
 * Minimal content format for topic solutions (Constitution "รูปแบบการเขียนคำตอบ").
 * Parsed into an AST and rendered as React elements — never as HTML (Constitution V).
 *
 *   1. step      → ordered list      - item → bullets      > note → note box
 *   **bold**     → emphasis          `Setting › เมนู` → menu path
 *   [text](https://…) → link (non-https links become plain text)
 */
export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string };

export type Block =
  | { type: "paragraph"; lines: Inline[][] }
  | { type: "ordered"; items: Inline[][] }
  | { type: "bullets"; items: Inline[][] }
  | { type: "note"; lines: Inline[][] };

const INLINE = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
const ORDERED = /^\d+[.)]\s+(.*)$/;
const BULLET = /^[-•]\s+(.*)$/;
const NOTE = /^>\s?(.*)$/;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const index = m.index ?? 0;
    if (index > last) out.push({ type: "text", text: text.slice(last, index) });
    const [, bold, code, label, href] = m;
    if (bold !== undefined) out.push({ type: "bold", text: bold });
    else if (code !== undefined) out.push({ type: "code", text: code });
    else if (label !== undefined && href !== undefined) {
      out.push(
        isHttpsUrl(href) ? { type: "link", text: label, href } : { type: "text", text: label },
      );
    }
    last = index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

type ListKind = "ordered" | "bullets" | "note" | "paragraph";

function classify(line: string): { kind: ListKind; body: string } {
  const ordered = ORDERED.exec(line);
  if (ordered) return { kind: "ordered", body: ordered[1] ?? "" };
  const bullet = BULLET.exec(line);
  if (bullet) return { kind: "bullets", body: bullet[1] ?? "" };
  const note = NOTE.exec(line);
  if (note) return { kind: "note", body: note[1] ?? "" };
  return { kind: "paragraph", body: line };
}

function makeBlock(kind: ListKind, rows: Inline[][]): Block {
  return kind === "ordered" || kind === "bullets"
    ? { type: kind, items: rows }
    : { type: kind, lines: rows };
}

export function parseContent(source: string): Block[] {
  const blocks: Block[] = [];
  let kind: ListKind | null = null;
  let rows: Inline[][] = [];

  const flush = () => {
    if (kind && rows.length) blocks.push(makeBlock(kind, rows));
    kind = null;
    rows = [];
  };

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    const { kind: lineKind, body } = classify(line);
    if (lineKind !== kind) flush();
    kind = lineKind;
    rows.push(parseInline(body));
  }
  flush();
  return blocks;
}

function inlineText(row: Inline[]): string {
  return row.map((i) => i.text).join("");
}

/** Plain text (markup removed) for search and short previews. */
export function toPlainText(source: string): string {
  return parseContent(source)
    .flatMap((b) => ("items" in b ? b.items : b.lines))
    .map(inlineText)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
