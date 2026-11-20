import { createElement, Fragment, type ReactNode } from 'react';

// FHIR narrative is restricted XHTML. It comes from the server, so it is rebuilt as React
// elements from an allow-list of tags, with no attributes but table spans: no scripts, no
// styles, no links out.
const ALLOWED = new Set([
  'div', 'p', 'b', 'strong', 'i', 'em', 'u', 'br', 'hr', 'span', 'sub', 'sup', 'pre', 'code', 'blockquote',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
]);
const VOID = new Set(['br', 'hr', 'col']);
// Section headings inside the narrative sit under the section's own heading
const DEMOTE: Record<string, string> = { h1: 'h4', h2: 'h4', h3: 'h4', h4: 'h5', h5: 'h6', h6: 'h6' };

function convert(node: Node, key: number): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as Element;
  const tag = el.localName.toLowerCase();
  const children = [...el.childNodes].map((c, i) => convert(c, i));
  if (!ALLOWED.has(tag)) return createElement(Fragment, { key }, ...children);
  const props: Record<string, unknown> = { key };
  for (const a of ['colspan', 'rowspan']) {
    const v = el.getAttribute(a);
    if (v && /^\d+$/.test(v)) props[a === 'colspan' ? 'colSpan' : 'rowSpan'] = Number(v);
  }
  return VOID.has(tag) ? createElement(tag, props) : createElement(DEMOTE[tag] ?? tag, props, ...children);
}

export function Narrative({ xhtml }: { xhtml?: string }) {
  if (!xhtml) return <p className="quiet">This section has no narrative.</p>;
  const doc = new DOMParser().parseFromString(xhtml, 'application/xhtml+xml');
  if (doc.querySelector('parsererror')) {
    const html = new DOMParser().parseFromString(xhtml, 'text/html');
    return <div className="narrative">{[...html.body.childNodes].map((c, i) => convert(c, i))}</div>;
  }
  return <div className="narrative">{convert(doc.documentElement, 0)}</div>;
}
