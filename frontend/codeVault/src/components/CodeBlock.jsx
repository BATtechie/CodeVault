import { useState } from 'react';
import './CodeBlock.css';

const LANGUAGE_KEYWORDS = {
  JAVASCRIPT: [
    'async',
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'default',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'from',
    'function',
    'if',
    'import',
    'let',
    'new',
    'return',
    'switch',
    'throw',
    'try',
    'var',
    'while',
  ],
  TYPESCRIPT: [
    'as',
    'async',
    'await',
    'class',
    'const',
    'enum',
    'export',
    'extends',
    'function',
    'implements',
    'import',
    'interface',
    'let',
    'new',
    'private',
    'protected',
    'public',
    'readonly',
    'return',
    'type',
  ],
  PYTHON: [
    'and',
    'as',
    'class',
    'def',
    'elif',
    'else',
    'except',
    'False',
    'for',
    'from',
    'if',
    'import',
    'in',
    'lambda',
    'None',
    'not',
    'or',
    'pass',
    'raise',
    'return',
    'True',
    'try',
    'while',
  ],
  SQL: [
    'and',
    'as',
    'by',
    'create',
    'delete',
    'from',
    'group',
    'having',
    'insert',
    'into',
    'join',
    'limit',
    'on',
    'or',
    'order',
    'select',
    'set',
    'table',
    'update',
    'values',
    'where',
  ],
};

const getKeywordSet = (language) =>
  new Set(LANGUAGE_KEYWORDS[String(language || '').toUpperCase()] || []);

const tokenizeLine = (line, language) => {
  const keywordSet = getKeywordSet(language);
  const tokens = [];
  let remaining = line;

  while (remaining.length > 0) {
    const matchers = [
      [/^\s+/, 'plain'],
      [/^(\/\/.*)/, 'comment'],
      [/^(#.*)/, 'comment'],
      [/^\/\*.*?\*\//, 'comment'],
      [/^"(?:\\.|[^"])*"/, 'string'],
      [/^'(?:\\.|[^'])*'/, 'string'],
      [/^`(?:\\.|[^`])*`/, 'string'],
      [/^\b\d+(?:\.\d+)?\b/, 'number'],
      [/^[+\-*/%=<>!&|^~:?]+/, 'operator'],
      [/^[{}[\]();,.]/, 'punctuation'],
      [/^[A-Za-z_$][\w$]*(?=\()/, 'function'],
      [/^[A-Za-z_$][\w$]*/, 'word'],
      [/^./, 'plain'],
    ];

    let matched = false;

    for (const [pattern, type] of matchers) {
      const result = remaining.match(pattern);

      if (!result) {
        continue;
      }

      const value = result[0];
      const actualType =
        type === 'word' && keywordSet.has(value) ? 'keyword' : type === 'word' ? 'plain' : type;

      tokens.push({
        value,
        type: actualType,
      });

      remaining = remaining.slice(value.length);
      matched = true;
      break;
    }

    if (!matched) {
      tokens.push({ value: remaining[0], type: 'plain' });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
};

const formatLanguage = (language) => {
  const value = String(language || 'Text').trim();

  if (!value) {
    return 'Text';
  }

  if (value === value.toUpperCase()) {
    return value[0] + value.slice(1).toLowerCase();
  }

  return value;
};

const CodeBlock = ({
  code,
  language,
  collapsedLines = 12,
  title,
  allowCopy = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const lines = String(code || '').split('\n');
  const visibleLines = expanded ? lines : lines.slice(0, collapsedLines);
  const canExpand = lines.length > collapsedLines;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="code-block">
      <div className="code-block__header">
        <div>
          {title ? <p className="code-block__eyebrow">{title}</p> : null}
          <p className="code-block__language">{formatLanguage(language)}</p>
        </div>
        {allowCopy ? (
          <button
            type="button"
            className="code-block__copy"
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        ) : null}
      </div>

      <div className="code-block__body">
        {visibleLines.map((line, lineIndex) => (
          <div key={`${lineIndex}-${line}`} className="code-block__line">
            <span className="code-block__line-number">{lineIndex + 1}</span>
            <span className="code-block__line-content">
              {tokenizeLine(line, language).map((token, tokenIndex) => (
                <span
                  key={`${lineIndex}-${tokenIndex}-${token.value}`}
                  className={`code-token code-token--${token.type}`}
                >
                  {token.value}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>

      {canExpand ? (
        <button
          type="button"
          className="code-block__toggle"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded
            ? 'Show less'
            : `Show ${lines.length - collapsedLines} more line${lines.length - collapsedLines === 1 ? '' : 's'}`}
        </button>
      ) : null}
    </div>
  );
};

export default CodeBlock;
