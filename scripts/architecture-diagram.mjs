// Generates the diagram on the WEST-A Architecture page:
//
//   node scripts/architecture-diagram.mjs [input/includes/west-a-architecture.svg]
//
// Change the bands and boxes below, run it, and commit both files.
import { writeFileSync } from 'node:fs';

const MANUAL = 'https://mellanarkiv-offentlig.vgregion.se/alfresco/s/archive/stream/public/v1/source/available/sofia/su1226-506079272-668/surrogate/WEST%20A%202025%20%C3%96stra.pdf';
const DEMO = 'https://vadimperetok.in/west-a-triage-ig/demo/';

const bands = [
  {
    title: 'What it builds on',
    boxes: [
      { h: 'WEST-A manual', l: ["VGR's triage manual,", 'version 2025:02:01'], tag: 'public document', href: MANUAL },
      { h: 'NEWS2', l: ['Royal College of', "Physicians' score chart"], tag: 'published score', href: 'https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/' },
      { h: 'Terminology', l: ['SNOMED CT (Swedish),', 'LOINC, UCUM'], tag: 'free to use in Sweden', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/e-halsa/snomed-ct/' },
      { h: 'HL7 standards', l: ['FHIR R4, CQL, CPG, SDC,', 'CRMI, Europe HDR'], tag: 'open standards', href: 'https://hl7.org/fhir/R4/' },
      { h: 'Swedish profiles', l: ['HL7 Sweden SE Base,', 'VGR Base'], tag: 'public FHIR packages', href: 'https://fhir.vgregion.se/ig/base/' },
    ],
    arrow: 'turned into',
  },
  {
    title: 'The guide',
    href: 'https://github.com/vadi2/west-a-triage-ig',
    boxes: [
      { h: 'Profiles and codes', l: ['patient, vital signs, NEWS2,', 'triage, Swedish code systems'], tag: 'FHIR Shorthand', href: 'artifacts.html' },
      { h: 'Triage form', l: ['a Questionnaire that extracts', 'its own Observations'], tag: 'SDC 4.0.0', href: 'Questionnaire-west-a-triage-questionnaire.html' },
      { h: 'Triage logic', l: ['NEWS2 and the priority in CQL,', 'as CPG PlanDefinitions'], tag: 'CPG 2.0.0, CQL', href: 'west-a-computable-guidelines.html' },
      { h: 'Examples and tests', l: ['synthetic patients, and the', 'NEWS2 chart as test cases'], tag: 'synthetic data only', href: 'artifacts.html' },
    ],
    arrow: 'used by',
  },
  {
    title: 'The demo, in your browser',
    href: DEMO,
    link: 'Try it',
    boxes: [
      { h: 'Smart Forms', l: ['CSIRO AEHRC, draws the', 'triage form from the guide'], tag: 'Apache 2.0', href: 'https://github.com/aehrc/smart-forms' },
      { h: 'Form to data', l: ['the answers become', 'vital sign Observations'], tag: 'Apache 2.0', href: 'https://github.com/aehrc/smart-forms' },
      { h: 'CQL engine', l: ["cql-execution runs the guide's", 'own ELM, as $apply would'], tag: 'Apache 2.0', href: 'https://github.com/cqframework/cql-execution' },
      { h: 'Discharge report', l: ['HL7 Europe Hospital', 'Discharge Report, for EHDS'], tag: 'HDR 1.0.0', href: 'https://hl7.eu/fhir/hdr/' },
    ],
    arrow: 'saved and read with FHIR',
    both: true,
  },
  {
    title: 'Where the data lives',
    href: 'https://hapi.fhir.org/',
    wide: {
      h: 'hapi.fhir.org/baseR4',
      l: 'An open FHIR server that anyone can use: patients, visits, Observations and discharge reports, tagged as the demo’s. No server of our own.',
      tag: 'HAPI FHIR, Apache 2.0',
    },
  },
];

const W = 960, X0 = 16, BW = W - 2 * X0, PAD = 12, GAP = 12, BOXH = 82, BANDH = 136, ARROW = 44;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (href, inner) => href ? `<a href="${esc(href)}"${href.startsWith('http') ? ' target="_blank"' : ''}>${inner}</a>` : inner;

const out = [];
let y = 8;
bands.forEach((b, i) => {
  const h = b.wide ? 104 : BANDH;
  out.push(`<rect class="band" x="${X0}" y="${y}" width="${BW}" height="${h}" rx="10"/>`);
  out.push(`<circle class="num" cx="${X0 + 22}" cy="${y + 22}" r="11"/><text class="numt" x="${X0 + 22}" y="${y + 26}">${i + 1}</text>`);
  let t = `<text class="bt" x="${X0 + 42}" y="${y + 27}">${esc(b.title)}</text>`;
  out.push(b.link ? t : link(b.href, t));
  if (b.link) out.push(link(b.href, `<text class="try" x="${X0 + BW - PAD - 4}" y="${y + 27}">${esc(b.link)} →</text>`));
  const by = y + 42;
  if (b.wide) {
    const w = b.wide, bx = X0 + PAD, bw = BW - 2 * PAD;
    out.push(`<rect class="box" x="${bx}" y="${by}" width="${bw}" height="50" rx="6"/>`);
    out.push(`<text class="h" x="${bx + 12}" y="${by + 21}">${esc(w.h)}</text>`);
    out.push(`<text class="tag" x="${bx + bw - 12}" y="${by + 21}" text-anchor="end">${esc(w.tag)}</text>`);
    out.push(`<text class="s" x="${bx + 12}" y="${by + 39}">${esc(w.l)}</text>`);
  } else {
    const n = b.boxes.length, w = (BW - 2 * PAD - (n - 1) * GAP) / n;
    b.boxes.forEach((bx, j) => {
      const x = X0 + PAD + j * (w + GAP);
      const g = [
        `<rect class="box${bx.href ? ' ln' : ''}" x="${x.toFixed(1)}" y="${by}" width="${w.toFixed(1)}" height="${BOXH}" rx="6"/>`,
        `<text class="h" x="${(x + 10).toFixed(1)}" y="${by + 20}">${esc(bx.h)}</text>`,
        ...bx.l.map((l, k) => `<text class="s" x="${(x + 10).toFixed(1)}" y="${by + 38 + k * 15}">${esc(l)}</text>`),
        `<text class="tag" x="${(x + 10).toFixed(1)}" y="${by + 72}">${esc(bx.tag)}</text>`,
      ].join('');
      out.push(bx.href ? link(bx.href, `<g>${g}</g>`) : g);
    });
  }
  y += h;
  if (b.arrow) {
    const cx = W / 2;
    out.push(`<line class="ar" x1="${cx}" y1="${y + 4}" x2="${cx}" y2="${y + ARROW - 6}" marker-end="url(#westa-arrow)"${b.both ? ' marker-start="url(#westa-arrow-up)"' : ''}/>`);
    out.push(`<text class="al" x="${cx + 12}" y="${y + ARROW / 2 + 4}">${esc(b.arrow)}</text>`);
    y += ARROW;
  }
});
const H = y + 8;

const svg = `<svg class="westa-arch" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-labelledby="westa-arch-title">
<title id="westa-arch-title">How the WEST-A guide and its demo are put together from open sources, open standards and open source tools</title>
<defs>
<marker id="westa-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#5b7083"/></marker>
<marker id="westa-arrow-up" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill="#5b7083"/></marker>
<style>
.westa-arch text{font-family:"Segoe UI",Helvetica,Arial,sans-serif}
.westa-arch .band{fill:#f3f6f9;stroke:#c8d3de}
.westa-arch .num{fill:#1f4e79}
.westa-arch .numt{fill:#fff;font-size:12px;font-weight:700;text-anchor:middle}
.westa-arch .bt{fill:#16324f;font-size:14px;font-weight:700}
.westa-arch .try{fill:#1a6dc1;font-size:13px;font-weight:700;text-anchor:end}
.westa-arch .box{fill:#fff;stroke:#9fb1c3}
.westa-arch a:hover .box,.westa-arch a:focus .box{stroke:#1a6dc1;stroke-width:2}
.westa-arch a:hover .bt,.westa-arch a:hover .try{text-decoration:underline}
.westa-arch .h{fill:#10273d;font-size:13px;font-weight:700}
.westa-arch .s{fill:#3e5368;font-size:11.5px}
.westa-arch .tag{fill:#2b7a3d;font-size:10.5px;font-weight:700;letter-spacing:.02em}
.westa-arch .ar{stroke:#5b7083;stroke-width:2}
.westa-arch .al{fill:#3e5368;font-size:12px;font-style:italic}
</style>
</defs>
${out.join('\n')}
</svg>
`;
writeFileSync(process.argv[2] ?? 'input/includes/west-a-architecture.svg', svg);
console.log(W, H);
