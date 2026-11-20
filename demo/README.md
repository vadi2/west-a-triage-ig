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
| `.github/workflows/demo.yml` | CI: HAPI as a service container, load the IG, run the end-to-end test, validate the output |

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
| `complaint-priority` | coding | Priority of the most urgent warning symptom of the complaint algorithm, from the WEST-A triage priority value set; 4 (Grön) when none |
| `frail-elderly` | boolean | Yellow as lowest priority (p. 46) |
| `likely-admission` | boolean | Yellow as lowest priority (p. 47) |
| `violence-or-assault` | boolean | Yellow as lowest priority (p. 48) |
| `oxygen-scale-2` | boolean | NEWS2 SpO2 scale 2, on a physician's order |

The QuestionnaireResponse carries `subject` (Patient), `encounter` (Encounter), `author`
(Practitioner) and `authored`; extraction takes the Observations' subject, encounter,
performer and effectiveDateTime from them.

## Library contract (`demo/lib`)

- `extract.js`: `extractVitals(questionnaire, questionnaireResponse)` → Promise of a
  transaction Bundle with the 7 vital sign Observations (blood pressure as one Observation
  with two components), each conforming to its WEST-A profile.
- `cds.js`: talks to the FHIR server and runs the guideline.
  - `fhir(base)` → a small client: `read`, `search`, `create`, `update`, `transaction`, `operation`.
  - `runTriage(client, { patientId, encounterId, complaintPriority, yellowAsLowest, scale2 })`
    → `{ news2: { total, risk, scores: { 'Respiration Rate Score': n, ... } }, proposedPriority: Coding | null, summaries: string[], carePlan }`
    by `PlanDefinition/west-a-triage/$apply` (and `Library/$evaluate` for the scores).
  - `news2Observation(...)`, `triageObservation(...)` → resources conforming to the WEST-A
    NEWS2 and Triage Observation profiles, with `derivedFrom` set.
- `hdr.js`: `dischargeReport({ patient, encounter, author, organization, vitals, news2, triage, ... })`
  → a document Bundle conforming to the HL7 Europe HDR 1.0.0 Bundle profile.

CQL parameter names are exactly those of the libraries: `Complaint Priority` (Code),
`Yellow As Lowest Priority` (Boolean), `Use Oxygen Saturation Scale 2` (Boolean).

## Ground rules

- This machine is small (6 GB RAM, no swap): do not run SUSHI, the IG Publisher, the FHIR
  validator or any Java locally, except the HAPI container, capped, started only when
  needed and stopped afterwards. Builds and validation run in GitHub Actions.
- Synthetic data only.
