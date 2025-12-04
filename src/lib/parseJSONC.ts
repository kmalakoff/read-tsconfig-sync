// Parse JSONC (JSON with Comments) - supports:
// - Line comments (//)
// - Block comments
// - Trailing commas
// Compatible with Node 0.8+

export default function parseJSONC(text: string): unknown {
  var result = '';
  var i = 0;
  var len = text.length;
  var inString = false;
  var stringChar = '';

  while (i < len) {
    var char = text[i];
    var next = text[i + 1];

    // Handle string literals (don't strip comments inside strings)
    if (inString) {
      result += char;
      if (char === '\\' && i + 1 < len) {
        // Escape sequence - include next char
        result += next;
        i += 2;
        continue;
      }
      if (char === stringChar) {
        inString = false;
      }
      i++;
      continue;
    }

    // Check for string start
    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      result += char;
      i++;
      continue;
    }

    // Line comment
    if (char === '/' && next === '/') {
      // Skip until end of line
      while (i < len && text[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Block comment
    if (char === '/' && next === '*') {
      i += 2;
      while (i < len) {
        if (text[i] === '*' && text[i + 1] === '/') {
          i += 2;
          break;
        }
        i++;
      }
      continue;
    }

    result += char;
    i++;
  }

  // Remove trailing commas before } or ]
  result = result.replace(/,(\s*[}\]])/g, '$1');

  return JSON.parse(result);
}
