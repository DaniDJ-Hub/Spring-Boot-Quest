/** Resaltado mínimo de Java, properties y SQL: suficiente para leer, sin dependencias. */

const KEYWORDS = new Set([
  'public', 'private', 'protected', 'class', 'interface', 'void', 'return', 'new', 'static',
  'final', 'extends', 'implements', 'import', 'package', 'if', 'else', 'for', 'while', 'try',
  'catch', 'throw', 'throws', 'this', 'super', 'null', 'true', 'false', 'enum', 'boolean',
  'int', 'long', 'double', 'String', 'List', 'Set', 'Map', 'Object', 'Override',
])

export type TokenKind = 'ann' | 'kw' | 'str' | 'cmt' | 'num' | 'txt'
export interface Token { t: string; k: TokenKind }

export function tokenize(line: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < line.length) {
    const rest = line.slice(i)
    if (rest.startsWith('//') || rest.startsWith('#')) { out.push({ t: rest, k: 'cmt' }); break }
    const ann = /^@[A-Za-z_][\w.]*/.exec(rest)
    if (ann) { out.push({ t: ann[0], k: 'ann' }); i += ann[0].length; continue }
    const str = /^"(?:[^"\\]|\\.)*"?|^'(?:[^'\\]|\\.)*'?/.exec(rest)
    if (str) { out.push({ t: str[0], k: 'str' }); i += str[0].length; continue }
    const num = /^\d[\d_.]*/.exec(rest)
    if (num) { out.push({ t: num[0], k: 'num' }); i += num[0].length; continue }
    const word = /^[A-Za-z_][\w]*/.exec(rest)
    if (word) {
      out.push({ t: word[0], k: KEYWORDS.has(word[0]) ? 'kw' : 'txt' })
      i += word[0].length
      continue
    }
    out.push({ t: rest[0], k: 'txt' })
    i += 1
  }
  return out
}

export const TOKEN_CLASS: Record<TokenKind, string> = {
  ann: 'text-accent-bright',
  kw: 'text-info',
  str: 'text-warning',
  cmt: 'text-fg-tertiary italic',
  num: 'text-warning',
  txt: 'text-fg',
}
