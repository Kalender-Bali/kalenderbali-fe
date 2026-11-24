import React from 'react';

interface ChatMessageContentProps {
  content: string;
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'divider' }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'paragraph'; lines: string[] };

/**
 * Memecah teks markdown menjadi blok-blok terstruktur:
 * - Table (dengan pemisah |--|--|)
 * - Heading (#, ##, ###)
 * - Divider (--- atau ***)
 * - List (- atau * atau 1.)
 * - Blockquote (> )
 * - Paragraph
 */
function parseBlocks(text: string): Block[] {
  const rawLines = text.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Divider: --- atau ***
    if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // Table: Baris diawali dan diakhiri | dan baris berikutnya adalah separator (|---|---|)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < rawLines.length) {
      const nextTrimmed = rawLines[i + 1].trim();
      const isSeparator =
        nextTrimmed.startsWith('|') &&
        nextTrimmed.endsWith('|') &&
        nextTrimmed
          .split('|')
          .slice(1, -1)
          .every(cell => /^:?-+:?$/.test(cell.trim()));

      if (isSeparator) {
        const headers = trimmed
          .split('|')
          .slice(1, -1)
          .map(cell => cell.trim());
        i += 2;
        const rows: string[][] = [];
        while (
          i < rawLines.length &&
          rawLines[i].trim().startsWith('|') &&
          rawLines[i].trim().endsWith('|')
        ) {
          const cells = rawLines[i]
            .trim()
            .split('|')
            .slice(1, -1)
            .map(cell => cell.trim());
          rows.push(cells);
          i++;
        }
        blocks.push({ type: 'table', headers, rows });
        continue;
      }
    }

    // Heading: #, ##, ###
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Unordered list: - atau *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: string[] = [];
      while (
        i < rawLines.length &&
        (rawLines[i].trim().startsWith('- ') || rawLines[i].trim().startsWith('* '))
      ) {
        items.push(rawLines[i].trim().slice(2).trim());
        i++;
      }
      blocks.push({ type: 'unordered-list', items });
      continue;
    }

    // Ordered list: 1. 2. dll
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < rawLines.length && /^\d+\.\s/.test(rawLines[i].trim())) {
        items.push(rawLines[i].trim().replace(/^\d+\.\s*/, ''));
        i++;
      }
      blocks.push({ type: 'ordered-list', items });
      continue;
    }

    // Blockquote: >
    if (trimmed.startsWith('> ')) {
      const quotes: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('> ')) {
        quotes.push(rawLines[i].trim().slice(2).trim());
        i++;
      }
      blocks.push({ type: 'blockquote', lines: quotes });
      continue;
    }

    // Paragraph: kumpulkan baris sampai baris kosong atau blok khusus
    const pLines: string[] = [trimmed];
    i++;
    while (i < rawLines.length) {
      const next = rawLines[i].trim();
      if (
        !next ||
        (next.startsWith('|') &&
          next.endsWith('|') &&
          i + 1 < rawLines.length &&
          rawLines[i + 1].trim().startsWith('|') &&
          rawLines[i + 1].trim().endsWith('|')) ||
        /^(\-{3,}|\*{3,})$/.test(next) ||
        /^#{1,3}\s/.test(next) ||
        next.startsWith('- ') ||
        next.startsWith('* ') ||
        /^\d+\.\s/.test(next) ||
        next.startsWith('> ')
      ) {
        break;
      }
      pLines.push(next);
      i++;
    }
    blocks.push({ type: 'paragraph', lines: pLines });
  }

  return blocks;
}

/**
 * Format inline: **bold**, *italic*, `code`
 */
function renderInline(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*[^*\r\n]+\*\*|\*[^*\r\n]+\*|`[^`\r\n]+`)/);

  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      return (
        <em key={index} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code
          key={index}
          className="rounded border border-slate-200/80 bg-slate-100 px-1 py-0.5 font-mono text-xs text-teal-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
}

/**
 * Render sel tabel dengan semantic styling sesuai konteks (Nilai, Kategori, atau teks biasa)
 */
function renderTableCell(cellText: string, headerText = ''): React.ReactNode {
  const trimmed = cellText.trim();
  const lowerHeader = headerText.toLowerCase();

  // Kolom Nilai (atau angka 0 s/d 9)
  const isScoreCol = lowerHeader.includes('nilai') || lowerHeader.includes('skor');
  const isNumberOnly = /^\d+$/.test(trimmed);

  if (isScoreCol || isNumberOnly) {
    const num = parseInt(trimmed, 10);
    if (!isNaN(num)) {
      if (num <= 1) {
        return (
          <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-xs font-extrabold text-rose-800">
            {trimmed}
          </span>
        );
      }
      if (num <= 4) {
        return (
          <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-teal-200 bg-teal-100 px-2 py-0.5 text-xs font-extrabold text-teal-800">
            {trimmed}
          </span>
        );
      }
      return (
        <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
          {trimmed}
        </span>
      );
    }
  }

  // Kolom Kategori (Masa Perjuangan / Masa Stabil / Masa Kejayaan)
  const lowerCell = trimmed.toLowerCase();
  if (lowerCell.includes('perjuangan') || lowerCell.includes('prihatin')) {
    return (
      <span className="inline-flex items-center rounded-md border border-rose-200/80 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
        {trimmed}
      </span>
    );
  }
  if (lowerCell.includes('stabil') || lowerCell.includes('berkembang')) {
    return (
      <span className="inline-flex items-center rounded-md border border-teal-200/80 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
        {trimmed}
      </span>
    );
  }
  if (lowerCell.includes('kejayaan') || lowerCell.includes('keberlimpahan') || lowerCell.includes('mewah')) {
    return (
      <span className="inline-flex items-center rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        {trimmed}
      </span>
    );
  }

  return renderInline(trimmed);
}

/**
 * Komponen penyaji isi pesan bot dengan dukungan tabel responsif, badge nilai, list, dan heading.
 */
export const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ content }) => {
  const blocks = React.useMemo(() => parseBlocks(content), [content]);

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-slate-700">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 1) {
              return (
                <h3
                  key={idx}
                  className="mt-3.5 mb-1 text-base font-extrabold tracking-tight text-slate-900"
                >
                  {renderInline(block.text)}
                </h3>
              );
            }
            if (block.level === 2) {
              return (
                <h4
                  key={idx}
                  className="mt-3 mb-1 text-sm font-extrabold tracking-tight text-slate-900"
                >
                  {renderInline(block.text)}
                </h4>
              );
            }
            return (
              <h5
                key={idx}
                className="mt-2.5 mb-0.5 text-xs font-extrabold uppercase tracking-wider text-teal-800"
              >
                {renderInline(block.text)}
              </h5>
            );
          }

          case 'divider':
            return <hr key={idx} className="my-2.5 border-t border-slate-200/80" />;

          case 'table': {
            return (
              <div
                key={idx}
                className="my-3 max-h-84 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs"
              >
                <table className="w-full min-w-[320px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/95 font-bold text-slate-800 backdrop-blur-xs">
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3.5 py-2.5 whitespace-nowrap">
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {block.rows.map((row, rIdx) => {
                      const isCurrentRow = row.some(cell => {
                        const l = cell.toLowerCase();
                        return l.includes('saat ini') || l.includes('aktif');
                      });

                      return (
                        <tr
                          key={rIdx}
                          className={`transition-colors hover:bg-teal-50/40 ${
                            isCurrentRow
                              ? 'border-l-4 border-l-teal-600 bg-teal-50/70 font-semibold'
                              : 'even:bg-slate-50/40'
                          }`}
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3.5 py-2 text-slate-700">
                              {renderTableCell(cell, block.headers[cIdx])}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }

          case 'unordered-list':
            return (
              <ul
                key={idx}
                className="my-1.5 list-disc space-y-1 pl-4.5 marker:text-teal-600"
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            );

          case 'ordered-list':
            return (
              <ol
                key={idx}
                className="my-1.5 list-decimal space-y-1 pl-4.5 marker:font-semibold marker:text-teal-700"
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            );

          case 'blockquote':
            return (
              <blockquote
                key={idx}
                className="my-2 rounded-xl border-l-4 border-teal-600 bg-teal-50/70 p-3 text-xs leading-relaxed font-medium text-teal-950 sm:text-sm"
              >
                {block.lines.map((line, lIdx) => (
                  <p key={lIdx}>
                    {renderInline(line)}
                  </p>
                ))}
              </blockquote>
            );

          case 'paragraph': {
            return (
              <p key={idx} className="leading-relaxed">
                {block.lines.map((line, lIdx) => (
                  <React.Fragment key={lIdx}>
                    {lIdx > 0 && <br />}
                    {renderInline(line)}
                  </React.Fragment>
                ))}
              </p>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
};
