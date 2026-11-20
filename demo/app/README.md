# WEST-A triage app

The web app of the WEST-A demo (see `../README.md` for the whole demo and its contracts).
Vite, React and TypeScript (strict), the CSIRO AEHRC Smart Forms renderer
(`@aehrc/smart-forms-renderer` 1.5.0) and plain `fetch` to a FHIR R4 server.

Screens, in the order a nurse uses them:

1. **Patients** – who is at the triage desk: search by name or identifier, the queue with
   each patient's last priority, or a new synthetic patient (VGR reserve number, LRID,
   tagged `HTEST`). Starting a triage opens the patient's in-progress emergency Encounter,
   or creates one.
2. **Triage** – the WEST-A Questionnaire in the renderer, with NEWS2 counted beside it while
   you type. Saving stores the QuestionnaireResponse, extracts and posts the vital signs,
   and runs the guideline on the server.
3. **Priority** – NEWS2 per parameter, the clinical risk, the proposed priority and why.
   The nurse records it or raises it; a red or orange patient is never lowered (WEST-A p. 8),
   whether the red or orange is proposed or comes from NEWS2 alone (nothing is proposed until
   the warning symptoms are assessed), and Grön is closed when yellow is the lowest priority
   for a need (pp. 46–48).
   Records the NEWS2 and triage Observations.
4. **Record** – NEWS2 over time and every triage, each NEWS2 with the vital signs it came
   from (`derivedFrom`) and the points each scored.
5. **Discharge** – closes the stay and shows the HL7 Europe Hospital Discharge Report built
   for it, section by section from the Composition narratives, with the Bundle as JSON to
   download.

## Run it in mock mode (no server)

```sh
(cd ../lib && npm install)     # extract.js's dependency, which the build imports
npm install
npm run dev:mock          # http://localhost:5173
# or, lighter on memory:
VITE_MOCK=1 npm run build && npm run preview   # http://localhost:4173
```

Mock mode keeps an in-memory FHIR store in the browser (saved in `localStorage` under
`west-a-mock-db-v3`), seeded with the guide's example patients, two synthetic test patients
with earlier triages, the nurse, the built Questionnaire (`src/fixtures/questionnaire.json`,
from the IG package) and the value sets and code systems it uses. Extraction, the
Observations and the discharge report come from the real `demo/lib` modules in both modes;
only the guideline is applied in the browser (`mockRunTriage` in `src/services/cds.ts`:
NEWS2, the priority of each triage criterion from the code system's `priority` property,
the override, the needs as a yellow floor, the most urgent wins). The header says
"MOCK SERVER". To start over, clear the site's storage.

## Run it against HAPI

Start HAPI and load the guide (`../README.md`, *Run everything locally*), then:

```sh
npm run build && npm run preview   # /fhir is proxied to http://localhost:8080/fhir
npm run dev                        # the same, with hot reload (more memory)
HAPI_URL=http://otherhost:8080 npm run preview  # another server, still proxied
VITE_FHIR_BASE=https://example.org/fhir npm run build   # call a server directly (needs CORS)
```

The app loads `../lib/extract.js`, `../lib/cds.js` and `../lib/hdr.js` with
`import.meta.glob`; when one is missing, the step that needs it fails with a plain message
naming the file. The adapters in `src/services/` are the only code that touches them:
`extract.ts`, `cds.ts`, `hdr.ts`, with their types in `libs.ts`.

**Value sets are expanded in the browser.** HAPI's `$expand` fails for a value set that
includes a whole code system (Hibernate Search is off in the starter: `HSEARCH800001`), and
its ACVPU expansion has no displays. So `src/services/terminology.ts` reads each
`answerValueSet`'s ValueSet and CodeSystem from the server and hands the renderer a copy of
the Questionnaire with `answerOption`s. Extraction still gets the Questionnaire as
published.

**Triage criteria.** Every answer of an item whose linkId starts with `triage-criteria` is a
criterion (`src/services/answers.ts`). They go to `runTriage` and onto the triage
Observation (with the Swedish displays of the code system), and the board shows them as
pins in the priority row: one per priority of the warning symptoms, *override* for
`complaint-priority`, *lowest for need* for a need (159–162). The form refuses
*Inga varningssymtom* (163) together with a warning symptom, and a systolic pressure
without the diastolic one. When the nurse used the override, the triage note says so
("Manuell sökorsaksprioritet: Röd"), so the record explains the priority.

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
`screenshots/report-phone.jpg` (390 × 844).
