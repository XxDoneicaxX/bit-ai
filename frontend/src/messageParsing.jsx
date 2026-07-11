const PARTIAL_MARKERS = ["```", "[[QUIZ]]"];

function stripDanglingPartialMarker(text) {
  for (const marker of PARTIAL_MARKERS) {
    for (let len = marker.length - 1; len >= 1; len--) {
      if (text.endsWith(marker.slice(0, len))) {
        return text.slice(0, text.length - len);
      }
    }
  }
  return text;
}

function makeCodeNode(raw, closed) {
  const newlineIdx = raw.indexOf("\n");

  if (newlineIdx !== -1) {
    const firstLine = raw.slice(0, newlineIdx).trim();

    if (/^(python|py)?$/i.test(firstLine)) {
      return {
        type: "code",
        value: raw.slice(newlineIdx + 1).replace(/\n$/, ""),
        closed,
      };
    }
  }

  return { type: "code", value: raw.replace(/\n$/, ""), closed };
}

function parseQuizBody(body) {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let question = "";
  const options = [];

  for (const line of lines) {
    const qMatch = line.match(/^Q:\s*(.+)$/);
    if (qMatch) {
      question = qMatch[1];
      continue;
    }

    const optMatch = line.match(/^([A-Z])\)\s*(.+)$/);
    if (optMatch) {
      options.push({ label: optMatch[1], text: optMatch[2] });
    }
  }

  if (!question || options.length < 2) {
    return { type: "text", value: body.trim() };
  }

  return { type: "quiz", question, options };
}

export function parseMessageContent(content) {
  const nodes = [];
  let cursor = 0;

  const pushText = (raw) => {
    const cleaned = stripDanglingPartialMarker(raw);
    if (cleaned) nodes.push({ type: "text", value: cleaned });
  };

  while (cursor < content.length) {
    const fenceIdx = content.indexOf("```", cursor);
    const quizIdx = content.indexOf("[[QUIZ]]", cursor);
    const candidates = [fenceIdx, quizIdx].filter((i) => i !== -1);

    if (candidates.length === 0) {
      pushText(content.slice(cursor));
      break;
    }

    const nextIdx = Math.min(...candidates);
    if (nextIdx > cursor) pushText(content.slice(cursor, nextIdx));

    if (nextIdx === fenceIdx) {
      const closeIdx = content.indexOf("```", nextIdx + 3);

      if (closeIdx === -1) {
        nodes.push(makeCodeNode(content.slice(nextIdx + 3), false));
        cursor = content.length;
      } else {
        nodes.push(makeCodeNode(content.slice(nextIdx + 3, closeIdx), true));
        cursor = closeIdx + 3;
      }
    } else {
      const closeIdx = content.indexOf("[[/QUIZ]]", nextIdx + 8);

      if (closeIdx === -1) {
        cursor = content.length;
      } else {
        nodes.push(parseQuizBody(content.slice(nextIdx + 8, closeIdx)));
        cursor = closeIdx + 9;
      }
    }
  }

  return nodes;
}

const PY_KEYWORDS = new Set([
  "def", "return", "if", "elif", "else", "for", "while", "in", "import",
  "from", "as", "class", "try", "except", "finally", "with", "pass",
  "break", "continue", "and", "or", "not", "is", "lambda", "yield",
  "global", "nonlocal", "raise", "assert", "del", "async", "await",
]);
const PY_CONSTANTS = new Set(["True", "False", "None"]);

const TOKEN_RE =
  /(#.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b\d+\.?\d*\b)|(\b[A-Za-z_]\w*\b)(?=\s*\()|(\b[A-Za-z_]\w*\b)/gm;

export function highlightPython(code) {
  const nodes = [];
  let lastIndex = 0;
  let match;
  TOKEN_RE.lastIndex = 0;

  while ((match = TOKEN_RE.exec(code)) !== null) {
    if (match.index > lastIndex) nodes.push(code.slice(lastIndex, match.index));

    const [, comment, string, number, funcCall, word] = match;
    const key = nodes.length;

    if (comment) nodes.push(<span className="tok-comment" key={key}>{comment}</span>);
    else if (string) nodes.push(<span className="tok-string" key={key}>{string}</span>);
    else if (number) nodes.push(<span className="tok-number" key={key}>{number}</span>);
    else if (funcCall) nodes.push(<span className="tok-func" key={key}>{funcCall}</span>);
    else if (PY_KEYWORDS.has(word)) nodes.push(<span className="tok-keyword" key={key}>{word}</span>);
    else if (PY_CONSTANTS.has(word)) nodes.push(<span className="tok-constant" key={key}>{word}</span>);
    else nodes.push(word);

    lastIndex = TOKEN_RE.lastIndex;
  }

  if (lastIndex < code.length) nodes.push(code.slice(lastIndex));
  return nodes;
}
