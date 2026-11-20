# WEST-A triage demo

A nurse picks a patient, fills in the WEST-A triage form, and the vital signs become
FHIR Observations through SDC template-based extraction (FHIRPath). The WEST-A Triage
PlanDefinition runs its CQL on a HAPI FHIR server and proposes NEWS2 and a triage
priority; the nurse confirms it, and the app records the NEWS2 and triage Observations.
At the end the stay is wrapped up as an HL7 Europe Hospital Discharge Report (EHDS).

Off-the-shelf, open source parts: HAPI FHIR JPA server (clinical reasoning module, CQL),
CSIRO AEHRC Smart Forms renderer and its template extraction library, the HL7 FHIR IG
packages (this guide, SDC 4.0.0, HL7 Europe HDR 1.0.0).

## Layout and owners

| Path | What |
|---|---|
| `input/fsh/questionnaire/` | The WEST-A triage Questionnaire (IG artifact), with template-based extraction |
| `demo/hapi/` | Start, stop and load a local HAPI FHIR server (podman) |
| `demo/lib/` | Plain ES modules shared by the app and the end-to-end test (browser and Node 20) |
| `demo/app/` | The web app (Vite, React, TypeScript, Smart Forms renderer) |
| `demo/e2e/` | Headless end-to-end run, used by CI |
| `.github/workflows/build.yml` | CI: job `build` builds the guide (SUSHI, IG Publisher); job `e2e` starts HAPI as a service container, loads the built package and runs the end-to-end test |
| `.github/workflows/hdr.yml` | CI (manual): builds the example discharge report with `demo/lib/hdr.js` and validates it against the HDR 1.0.0 Bundle profile |

## FHIR server

HAPI FHIR JPA starter, FHIR R4, clinical reasoning enabled, base `http://localhost:8080/fhir`.
`demo/hapi/start.sh` runs it in podman with a memory cap; `demo/hapi/stop.sh` stops it;
`node demo/hapi/load.mjs [package.tgz|url]` loads this guide's package (conformance
resources, terminology, Libraries, PlanDefinitions, ActivityDefinitions, Questionnaire)
and the example Patient, Practitioner and Encounter.

## Questionnaire contract

- id `west-a-triage-questionnaire`, url `https://vadi2.github.io/west-a-triage-ig/Questionnaire/west-a-triage-questionnaire`, version `0.1.0`
- linkIds:

| linkId | Type | Meaning |
|---|---|---|
| `vitals` | group | Vital signs |
| `respiratory-rate` | integer | Breaths per minute |
| `oxygen-saturation` | integer | SpO2 % |
| `oxygen-flow` | decimal | Supplemental oxygen, L/min; 0 for room air |
| `systolic` | integer | Systolic blood pressure, mmHg |
| `diastolic` | integer | Diastolic blood pressure, mmHg |
| `heart-rate` | integer | Heart rate (or pulse), /min |
| `consciousness` | coding | ACVPU, from the WEST-A ACVPU value set |
| `temperature` | decimal | Body temperature, °C |
| `assessment` | group | Triage assessment |
| `chief-complaint` | coding | From the WEST-A chief complaint value set |
| `triage-criteria` | group | Triage criteria, enabled once `chief-complaint` is answered |
| `triage-criteria-<n>` | coding, repeats | Warning symptoms of chief complaint `<n>`, enabled only when `chief-complaint` is `<n>`; codes from the WEST-A triage criterion value set (none for complaints 2, 14, 18, 19, 25) |
| `triage-criteria-11`, `triage-criteria-30` | group | Gynaecology and trauma: one repeating coding item per heading of the manual, `triage-criteria-11-aaa` … `-aaf` and `triage-criteria-30-aag` … `-aaj` |
| `triage-criteria-none` | coding, repeats | `163` *Inga varningssymtom*, offered for every complaint |
| `triage-criteria-needs` | coding, repeats | Needs and processes `159`-`162` (frail elderly, likely admission, sexual assault, intimate partner violence), offered for every complaint: each gives yellow as the lowest priority (pp. 46-48) |
| `complaint-priority` | coding | Optional manual override: priority of the warning symptoms, from the WEST-A triage priority value set |
| `oxygen-scale-2` | boolean | NEWS2 SpO2 scale 2, on a physician's order |

The QuestionnaireResponse carries `subject` (Patient), `encounter` (Encounter), `author`
(Practitioner) and `authored`; extraction takes the Observations' subject, encounter,
performer and effectiveDateTime from them.

## Library contract (`demo/lib`)

Plain ES modules for the browser and Node 20. `extract.js` needs its dependency installed:
`npm install` in `demo/lib` (the app's build imports it from there too).

- `extract.js`: `extractVitals(questionnaire, questionnaireResponse)` → Promise of a
  transaction Bundle with the 7 vital sign Observations (blood pressure as one Observation
  with two components), each conforming to its WEST-A profile. Pass the Questionnaire as
  published (with its extraction templates). Throws when the QuestionnaireResponse has no
  `subject` or `authored`.
- `cds.js`: talks to the FHIR server and runs the guideline.
  - `fhir(base)` → `{ request, read, search, create, update, transaction, operation(path, parameters?, { method }) }`.
  - `runTriage(client, { patientId, encounterId, practitionerId, complaintPriority, yellowAsLowest, scale2, triageCriteria })`
    → `{ news2, proposedPriority, vitalParameterPriority, provisional, summaries, carePlan }`, by
    `PlanDefinition/west-a-triage/$apply` and `Library/WestANEWS2` and `Library/WestATriage`
    `$evaluate`. Takes 1–15 s on HAPI, so show progress.
    - `complaintPriority`: `'1'`–`'4'`, a Coding, or `null` (left out: the override is optional).
    - `triageCriteria`: codes or Codings of the WEST-A triage criterion code system (below),
      the needs `159`-`162` among them.
    - `yellowAsLowest`: only for a client that does not pass the needs as criteria; the app
      and the form do not use it.
    - `news2`: `{ total, risk, scale2, scores, derivedFrom }`. `scores` is keyed by the CQL
      definitions: `Respiration Rate Score`, `Oxygen Saturation Scale 1 Score` *or*
      `Oxygen Saturation Scale 2 Score`, `Supplemental Oxygen Score`, `Systolic Blood Pressure Score`,
      `Pulse Score`, `Consciousness Score`, `Temperature Score`. `derivedFrom` references the
      vital sign Observations the CQL scored (the latest of each).
    - `proposedPriority`, `vitalParameterPriority`: Codings of the WEST-A triage priority
      code system, or `null`. No priority is proposed until NEWS2 is complete and the warning
      symptoms are assessed (a symptom, `163`, or `complaintPriority`).
    - `provisional`: `{ total, risk, missing, priority }`, what is known so far, from the same
      two `$evaluate` calls. `total` (number or `null`) is the sum of the parameter scores
      measured so far, `risk` (`'low'`, `'low-medium'`, `'medium'`, `'high'` or `null`) its
      clinical risk band, `missing` the parameters not yet scored, in chart order, named by
      their component slices in the NEWS2 profile (`'respirationRate'`,
      `'oxygenSaturationScale1'` or `'oxygenSaturationScale2'`, `'airOrOxygen'`,
      `'systolicBloodPressure'`, `'pulse'`, `'consciousness'`, `'temperature'`; `[]` when
      NEWS2 is complete), and `priority` a Coding of the triage priority code system: the most
      urgent of the provisional NEWS2 colour, the warning symptoms, `complaintPriority` and the
      needs, `null` only when nothing is known. All are lower bounds: they can only rise as
      data comes in, and they equal `news2.total`, `news2.risk` and `proposedPriority` once
      those are there. Show a provisional green as "at least green", not as green; a
      provisional red or orange already holds.
  - `news2Observation({ news2, provisional?, patientId, encounterId, performerId, effectiveDateTime, derivedFrom?, id? })`
    → a WEST-A NEWS2 Observation; `derivedFrom` defaults to `news2.derivedFrom`. Without
    `provisional` it is `final` and needs a complete NEWS2. With `provisional` (the
    `provisional` of `runTriage`) it is a `preliminary` NEWS2: total `provisional.total`, only
    the scores measured so far. It throws when nothing is measured yet, or when all seven are
    (record it as final then).
  - `triageObservation({ priority, chiefComplaint, news2?, proposedPriority?, vitalParameterPriority?, patientId, encounterId, performerId, effectiveDateTime, note?, derivedFrom, criteria, id? })`
    → a WEST-A Triage Observation, each criterion a component. `news2` may be the
    Observation, an id, or a Reference (a `urn:uuid` inside a transaction). Throws when
    `priority` is lower than a red or orange `proposedPriority` or `vitalParameterPriority`
    (WEST-A p. 8): a red NEWS2 counts even when nothing is proposed.
  - The builders write `language: 'sv'`; give Swedish displays (the code system displays)
    or none.
- `hdr.js`: `dischargeReport({ patient, encounter, author, organization?, vitals, news2, triage, dischargeDate?, dischargeSummary?, language?, fhirBase? })`
  → a document Bundle conforming to the HL7 Europe HDR 1.0.0 Bundle profile. It takes *one*
  NEWS2 and *one* triage Observation: the app passes the latest triage of the stay, the
  NEWS2 it was based on, and the vital signs that NEWS2 was scored from, and says so on
  screen. Without `organization` it names a placeholder emergency department. Throws when
  the resources disagree on `language`.

CQL parameter names are exactly those of the libraries: `Triage Criteria` (List<Code>),
`Complaint Priority` (Code), `Yellow As Lowest Priority` (Boolean), `Use Oxygen Saturation
Scale 2` (Boolean). `Triage Criteria` is every answer of every item whose linkId starts with
`triage-criteria` (FHIRPath on the QuestionnaireResponse:
`repeat(item).where(linkId.startsWith('triage-criteria')).answer.value`).

HAPI 8.12 passes a CQL list parameter that is given only once as a single value, and the
CQL then sees `Triage Criteria` as null; `cds.js` therefore sends a single criterion twice.

## Run everything locally

```sh
cd demo/lib && npm install && cd ../..
demo/hapi/start.sh                          # HAPI in podman, http://localhost:8080/fhir (about 1.2 GB)
node demo/hapi/load.mjs output/package.tgz  # this guide's package: the ig-output artifact of a CI run
cd demo/app && npm ci
npm run build && npm run preview            # http://localhost:4173, /fhir proxied to HAPI
# walk the flow, then stop the preview server and:
demo/hapi/stop.sh                           # keeps the database volume; --purge deletes it
```

`npm run dev` works too, but the dev server takes more memory than the preview server.
Without HAPI, `VITE_MOCK=1 npm run build && npm run preview` runs the app on an in-browser
store (see `demo/app/README.md`).

## Ground rules

- This machine is small (6 GB RAM, no swap): do not run SUSHI, the IG Publisher, the FHIR
  validator or any Java locally, except the HAPI container, capped, started only when
  needed and stopped afterwards. Builds and validation run in GitHub Actions.
- Synthetic data only.
