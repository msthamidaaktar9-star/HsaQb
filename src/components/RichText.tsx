import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface RichTextProps {
  text: string;
  className?: string;
}

interface TextToken {
  type: 'text' | 'inline-math' | 'block-math';
  content: string;
  raw: string;
}

function parseLatexTokens(text: string): TextToken[] {
  if (!text) return [];

  const tokens: TextToken[] = [];
  // Match $$...$$ first, then $...$
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = text.substring(lastIndex, match.index);
      tokens.push({
        type: 'text',
        content: textChunk,
        raw: textChunk,
      });
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$') && matchedStr.length >= 4) {
      tokens.push({
        type: 'block-math',
        content: matchedStr.slice(2, -2).trim(),
        raw: matchedStr,
      });
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$') && matchedStr.length >= 2) {
      tokens.push({
        type: 'inline-math',
        content: matchedStr.slice(1, -1).trim(),
        raw: matchedStr,
      });
    } else {
      tokens.push({
        type: 'text',
        content: matchedStr,
        raw: matchedStr,
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const trailingChunk = text.substring(lastIndex);
    tokens.push({
      type: 'text',
      content: trailingChunk,
      raw: trailingChunk,
    });
  }

  return tokens;
}

export const RichText: React.FC<RichTextProps> = ({ text, className = '' }) => {
  const tokens = useMemo(() => parseLatexTokens(text), [text]);

  if (!text) {
    return null;
  }

  return (
    <div className={`whitespace-pre-wrap leading-relaxed text-[#1B1F2A] ${className}`}>
      {tokens.map((token, index) => {
        if (token.type === 'text') {
          return <span key={index}>{token.content}</span>;
        }

        if (token.type === 'inline-math') {
          try {
            const html = katex.renderToString(token.content, {
              displayMode: false,
              throwOnError: true,
            });
            return (
              <span
                key={index}
                dangerouslySetInnerHTML={{ __html: html }}
                className="inline-block align-baseline px-0.5"
              />
            );
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'LaTeX Error';
            return (
              <span
                key={index}
                title={errorMessage}
                className="inline-block text-red-600 bg-red-50 border border-red-300 rounded px-1 py-0.5 text-xs font-mono select-text"
              >
                {token.raw}
              </span>
            );
          }
        }

        if (token.type === 'block-math') {
          try {
            const html = katex.renderToString(token.content, {
              displayMode: true,
              throwOnError: true,
            });
            return (
              <div
                key={index}
                dangerouslySetInnerHTML={{ __html: html }}
                className="my-3 overflow-x-auto py-1 text-center"
              />
            );
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'LaTeX Error';
            return (
              <div
                key={index}
                title={errorMessage}
                className="my-2 p-2.5 text-red-600 bg-red-50 border border-red-300 rounded-lg text-xs font-mono overflow-x-auto text-left select-text"
              >
                {token.raw}
              </div>
            );
          }
        }

        return null;
      })}
    </div>
  );
};

export default RichText;
