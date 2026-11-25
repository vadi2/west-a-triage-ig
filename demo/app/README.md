# WEST-A triage app

The web app of the WEST-A demo (see `../README.md` for the whole demo and its contracts).
Vite, React and TypeScript (strict), the CSIRO AEHRC Smart Forms renderer
(`@aehrc/smart-forms-renderer` 1.5.0), plain `fetch` to a FHIR R4 server, and the CQF CQL
engine (`cql-execution` 3.3.2, `cql-exec-fhir` 2.2.0) for running the guideline in the
browser. Where the data lives (the public HAPI sandbox, this browser, or another server) is
chosen at runtime: see *Where the data lives* in `../README.md`.

Screens, in the order a nurse uses them:

1. **Patients** – who is at the triage desk: search by name or identifier, the queue with
   each patient's last priority, or a new synthetic patient (VGR reserve number, LRID,
   tagged `HTEST`). Starting a triage opens the patient's in-progress emergency Encounter,
   or creates one.
2. **Triage** – the WEST-A Questionnaire in the renderer, with NEWS2 counted beside it while
   you type, provisionally until all seven parameters are in. Saving stores the
   QuestionnaireResponse, extracts and posts the vital signs, and runs the guideline (on
   the server, or in the browser). *Save vitals so far* does the same before all seven are measured and records a
   preliminary NEWS2.
3. **Priority** – NEWS2 per parameter, the clinical risk, the proposed priority and why.
   The nurse records it or raises it; a red or orange patient is never lowered (WEST-A p. 8),
   whether the red or orange is proposed or comes from NEWS2 alone (nothing is proposed until
   the warning symptoms are assessed), and Grön is closed when yellow is the lowest priority
   for a need (pp. 46–48).
   Records the NEWS2 and triage Observations.
4. **Record** – NEWS2 over time and every triage, each NEWS2 with the vital signs it came
   from (`derivedFrom`) and the points each scored. A preliminary NEWS2 is a hollow pin
   marked "≥", with the parameters it lacks.
5. **Discharge** – closes the stay and shows the HL7 Europe Hospital Discharge Report built
   for it, section by section from the Composition narratives, with the Bundle as JSON to
   download.

## Run it without a server of your own

```sh
(cd ../lib && npm install)     # extract.js's dependency, which the build imports
npm ci
npm run build:pages && npm run preview         # the public HAPI sandbox, http://localhost:4173
VITE_MOCK=1 npm run build && npm run preview   # this browser only
npm run dev:mock                               # this browser only, with hot reload (more memory)
```

**The public sandbox** (`https://hapi.fhir.org/baseR4`) is what the published demo uses.
Everything the app writes there is tagged, and the patient list shows only tagged patients;
see `../README.md` for what that means and why to enter synthetic data only.

**This browser only** keeps an in-memory FHIR store in the browser (saved in
`localStorage` under `west-a-mock-db-v3`), seeded with the guide's example patients, two
synthetic test patients with earlier triages, the nurse, the built Questionnaire
(`src/fixtures/questionnaire.json`) and the value sets and code systems it uses. To start
over, clear the site's storage.

In both, extraction, the Observations and the discharge report come from the real
`demo/lib` modules, and the guideline is the guide's own CQL, run in the browser
(`src/services/guideline.ts`, loaded on first use: about 320 kB compressed): the ELM in
`src/fixtures/guideline/` executed against the patient's Observations, and the
PlanDefinitions and ActivityDefinitions walked the way `$apply` does. The header says where
the data is and where the CQL ran ("public sandbox · CQL in browser").

The CQL engine was written for Node: `vite.config.ts` points the Node built-ins it imports
at `src/shims/node.ts` and leaves out the FHIR model infos other than 4.0.1.

## Run it against HAPI

Start HAPI and load the guide (`../README.md`, *Run everything locally*), then:

```sh
npm run build && npm run preview   # /fhir is proxied to http://localhost:8080/fhir
npm run dev                        # the same, with hot reload (more memory)
HAPI_URL=http://otherhost:8080 npm run preview  # another server, still proxied
VITE_FHIR_BASE=https://example.org/fhir npm run build   # call a server directly (needs CORS)
```

Any build can also be pointed at a server from the patient list (*Where the data lives*,
*another FHIR R4 server*) or with `?server=<FHIR base URL>` in the page URL. The guideline
runs on the server when its CapabilityStatement offers `Library/$evaluate` and
`PlanDefinition/$apply` and it holds `PlanDefinition/west-a-triage`; otherwise in the
browser, as above.

The app loads `../lib/extract.js`, `../lib/cds.js` and `../lib/hdr.js` with
`import.meta.glob`; when one is missing, the step that needs it fails with a plain message
naming the file. The adapters in `src/services/` are the only code that touches them:
`extract.ts`, `cds.ts`, `hdr.ts`, with their types in `libs.ts`.

**Value sets are expanded in the browser.** HAPI's `$expand` fails for a value set that
includes a whole code system (Hibernate Search is off in the starter: `HSEARCH800001`), and
its ACVPU expansion has no displays. So `src/services/terminology.ts` reads each
`answerValueSet`'s ValueSet and CodeSystem (from the server when it has them, else the
copies built into the app: `src/services/conformance.ts`) and hands the renderer a copy of
the Questionnaire with `answerOption`s. Extraction still gets the Questionnaire as
published.

**Triage criteria.** Every answer of an item whose linkId starts with `triage-criteria` is a
criterion (`src/services/answers.ts`). They go to `runTriage` and onto the triage
Observation (with the Swedish displays of the code system), and the board shows them as
pins in the priority row: one per priority of the warning symptoms, *not on the list* for
`complaint-priority`, the priority of a warning symptom the list does not offer, *lowest for
need* for a need (159–162). Ticking *Inga varningssymtom* (163) hides the warning symptoms,
and the form still refuses it together with a warning symptom, and a systolic pressure
without the diastolic one. When the nurse gave a warning symptom not on the list, the triage
note names it with its priority ("Varningssymtom utanför listan: …, Röd"), so the record
explains the priority.

## Provisional NEWS2 and priority

The guideline scores what is known so far (`provisional` of `runTriage`, see
`../README.md` and the *Provisional* sections of the computable guidelines page). The app
follows the same rules:

- **While typing**, the board scores in the browser (`src/services/news2.ts`, the
  thresholds of `WestANEWS2.cql`): a parameter not measured yet is hatched and says
  *not yet*, the NEWS2 pin is hollow and reads "NEWS2 ≥ 6 so far", and the line above the
  priority row says "So far: at least Orange". The priority so far is the most urgent of the
  NEWS2 colour so far, the warning symptoms, the override and yellow for a need
  (`Provisional Proposed Priority`). It is a dashed outline marked *at least*, never a
  filled colour, until NEWS2 is complete and the warning symptoms are assessed. A red or
  orange so far is said to hold; a green so far only means nothing more urgent is known
  yet. On scale 2 an SpO₂ of 93 % or more is not scored until oxygen is known, as in the CQL.
- **Save vitals so far** (once at least one parameter scores, and before all seven do)
  saves the form as `in-progress`, posts the vital signs extracted from it, runs the
  guideline, shows its `provisional` result, and records a `preliminary` NEWS2
  with `news2Observation({ news2, provisional, … })`. Saving again, or saving the whole
  triage, updates the same QuestionnaireResponse and posts only the vital signs that are
  new or changed; the guideline takes the latest of each. The full save then gives the
  final NEWS2 and the proposal as before. What was saved so far is kept on the form screen
  only: leaving it starts the next save afresh.
- **The guideline in the browser** returns the same `provisional` shape, from the same CQL.

## Sample data

For a presenter, each screen where one would type has a quiet *Sample data* row
(`src/components/Samples.tsx`, data in `src/services/samples.ts`). All of it is invented,
and the free texts start with "Syntetisk exempeltext".

- **Patients:** *Sample patient* fills the new-patient form with a random Swedish name,
  birth date and gender; the reserve number is generated on save as before. The form
  starts empty.
- **Triage:** one scenario per WEST-A outcome, worked out from the NEWS2 chart and the
  criterion code system and checked in the browser:

  | Button | Vitals | NEWS2 | Criteria | Proposed |
  |---|---|---|---|---|
  | Röd · sepsis | RR 26, SpO₂ 91, air, 95/55, pulse 125, C, 38.9 | 14, high | 16 Infektion: 74 (Röd) | Röd |
  | Orange · chest pain | the guide's example | 5, medium | 4 Bröstsmärta: 15 (Orange) | Orange |
  | Gul · vomiting | RR 18, SpO₂ 97, air, 118/74, pulse 112, A, 37.8 | 2, low | 7 Diarré/kräkningar: 20 (Gul) | Gul |
  | Grön · limb | RR 14, SpO₂ 98, air, 128/78, pulse 72, A, 36.8 | 0, low | 9 Extremitetsproblem: 163 | Grön |
  | Grön + need → Gul | RR 18, SpO₂ 96, air, 142/86, pulse 84, A, 36.0 | 1, low | 23 Ospecifik sjukdom: 163 and 159 | Gul |
  | Vitals only | RR 16, SpO₂ 97, air, 132/84, pulse 78, A, 37.1 | 0, low | none: pick them live | none |
  | Partial vitals | RR 24, SpO₂ 93, pulse 118 only | ≥ 6 so far, at least medium | none | at least Orange so far, which holds |

- **Priority:** *Sample note* writes a Swedish note that fits the choice on the board
  (raised, lowered or kept).
- **Discharge:** a *Hospital course* field goes into the report (`dischargeSummary` of
  `hdr.js`; it is not stored on the server). *Sample summary* writes one in Swedish, for an
  admitted patient after a red or orange triage, else for one sent home. Once the report is
  built, *Change the hospital course* rebuilds it.

## The design decision

**The patient is a thread pinned across a board.** One pin per vital sign sits in the
NEWS2 score column it earns (3, 2, 1, 0), and the thread falls from pin to pin into the
WEST-A priority row below, whose four columns are the same columns: Röd under 3, Orange
under 2, Gul under 1, Grön under 0. The board answers the one question the nurse opens the
screen for, "how urgent is this patient?", and shows why in the same glance. You can see
which parameter pulled the thread to the left before reading a number.

The reason: a result page that leads with a big number and a coloured badge hides the
parameter that made it, and the nurse has to defend the priority to a colleague in
seconds. On the board the proposed priority, the warning symptom and any yellow floor are
pins in the priority row, and the nurse's choice is made on the same board.

What follows from that:

- One ink on a grey felt ground. The four WEST-A colours appear only as states: the
  proposed or chosen priority, the recorded priority on the wristband header, and the
  priority recorded at each triage. They are never decoration.
- Closed choices are hatched and struck through, and keyboard arrows skip them.
- The working parts stay plain: white inputs with a full ink border, a 3 px focus ring,
  real radio inputs in the priority row, and text alternatives for every pin.

Visual seed (antialgorithm): method "string and pins", colour "one ink only", layout
"upside down or turned" (the board is read top to bottom into the priority row, with the
most urgent end on the left), type "only small type".

## Screenshots

Real mode, against HAPI 8.12 with the guide's CI package: the guide's example (chest pain,
criterion 15, NEWS2 5) proposes Orange, raised to Röd.
`screenshots/form-desktop.jpg`, `screenshots/result-desktop.jpg`,
`screenshots/record-desktop.jpg`, `screenshots/report-desktop.jpg` (1366 × 768) and
`screenshots/form-phone.jpg`, `screenshots/result-phone.jpg`, `screenshots/record-phone.jpg`,
`screenshots/report-phone.jpg` (390 × 844). These predate the sample data and the
provisional NEWS2.

Mock mode, with the sample data and the provisional NEWS2: `screenshots/patients-sample-desktop.jpg`
(*Sample patient*), `screenshots/form-provisional-desktop.jpg` (*Partial vitals*: NEWS2 ≥ 6
so far, at least Orange), `screenshots/form-partial-saved-desktop.jpg` (after *Save vitals
so far*), `screenshots/record-preliminary-desktop.jpg` (the preliminary NEWS2 beside the
final one), `screenshots/result-sample-note-desktop.jpg`,
`screenshots/report-sample-summary-desktop.jpg` (1366 × 768) and
`screenshots/form-samples-phone.jpg` (390 × 844).
