import React from 'react';

interface FormattedAcademicTextProps {
  content: string;
  className?: string;
}

/**
 * FormattedAcademicText
 * Parses raw text from the AI assistant and knowledge base, cleanly transforming
 * markdown tokens into styled React elements: headings (#), bullet lists
 * (-, *, •), ordered lists (1., 2.), inline code (`), bold (**), italic (*) and
 * bold+italic (***). The point is that no markdown marker ever reaches the user:
 * an unpaired `**`, a stray `*` at the start of a line or a `###` header would
 * otherwise print literally and look unprofessional.
 */
export const FormattedAcademicText: React.FC<FormattedAcademicTextProps> = ({
  content,
  className = '',
}) => {
  const lines = content.split('\n');

  // Inline formatting within a segment of text. Handles, in order of priority,
  // `code`, ***bold italic***, **bold** and *italic*. Whatever is not a marker
  // is kept verbatim (a lone `*` that means the truncation wildcard must not be
  // eaten, so unpaired markers stay as literal text instead of being guessed).
  const inlineParts = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]*`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const token = match[0];

      if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={`code-${match.index}`}
            className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 font-mono text-[11px] sm:text-xs border border-blue-200 break-all"
          >
            {token.substring(1, token.length - 1)}
          </code>
        );
      } else if (token.startsWith('***') && token.endsWith('***')) {
        parts.push(
          <strong key={`strong-em-${match.index}`} className="font-extrabold text-slate-900">
            <em className="italic">{token.substring(3, token.length - 3)}</em>
          </strong>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={`bold-${match.index}`} className="font-extrabold text-slate-900">
            {token.substring(2, token.length - 2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={`em-${match.index}`} className="italic text-slate-700">
            {token.substring(1, token.length - 1)}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : [text];
  };

  return (
    <div className={`space-y-2 text-xs sm:text-sm leading-relaxed ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Horizontal rule
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
          return <hr key={idx} className="border-slate-200 my-1" />;
        }

        // Heading: ### Texto, ## Texto, # Texto (marker stripped)
        const heading = /^#{1,3}\s+(.*)$/.exec(trimmed);
        if (heading) {
          return (
            <div
              key={idx}
              className="font-extrabold text-slate-900 text-[13px] sm:text-sm pt-1 first:pt-0"
            >
              {inlineParts(heading[1])}
            </div>
          );
        }

        // Blockquote marker stripped (the text keeps its own emphasis)
        if (/^>\s?/.test(trimmed)) {
          return (
            <div key={idx} className="border-l-2 border-slate-300 pl-2.5 text-slate-600">
              {inlineParts(trimmed.replace(/^>\s?/, ''))}
            </div>
          );
        }

        // Unordered list: "- ", "* " or "• " (a bare "*text*" italic is not a
        // bullet because there is no space after the marker, so it is preserved)
        const bullet = /^([-•*])\s+(.*)$/.exec(trimmed);
        if (bullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
              <div className="flex-1">{inlineParts(bullet[2])}</div>
            </div>
          );
        }

        // Ordered list: "1. ", "2) ", ... keeps its own number for readability
        const ordered = /^(\d+)[.)]\s+(.*)$/.exec(trimmed);
        if (ordered) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="font-extrabold text-blue-700 shrink-0 leading-snug">
                {ordered[1]}.
              </span>
              <div className="flex-1">{inlineParts(ordered[2])}</div>
            </div>
          );
        }

        // Standard line (inline markers still parsed)
        return <div key={idx}>{inlineParts(trimmed)}</div>;
      })}
    </div>
  );
};
