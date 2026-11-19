WEST-A NEWS2 Observation records the National Early Warning Score 2 (NEWS2) that WEST-A uses to set a priority from the vital parameters: the total score and the score of each parameter. The [WEST-A Triage Observation](StructureDefinition-west-a-triage-observation.html) refers to it in `derivedFrom`. The [triage mapping page](west-a-triage-mapping.html#news2) lists the parameters and their codes.

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A NEWS2 Observation Must Have

A status, the survey category, the SNOMED CT code for the NEWS2 total score, the patient, the time of the assessment, and the total score (0-20).

#### Each WEST-A NEWS2 Observation Must Support

- the encounter and the performer;
- one score per parameter: respiration rate, oxygen saturation (scale 1 or scale 2, never both), supplemental oxygen, systolic blood pressure, pulse, consciousness (ACVPU) and temperature.

When all seven parameter scores are sent, the total must be their sum.

### Building the JSON, step by step

The complete reference instance is the [NEWS2 of 5](Observation-example-news2.html).

#### The smallest NEWS2 you can send

Only the total score is mandatory:

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": ["https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-news2-observation"]
  },
  "status": "final",
  "category": [
    {
      "coding": [
        { "system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "survey" }
      ]
    }
  ],
  "code": {
    "coding": [{ "system": "http://snomed.info/sct", "code": "1104051000000101" }]
  },
  "subject": { "reference": "Patient/example-patient-personnummer" },
  "effectiveDateTime": "2026-11-19T08:40:00+01:00",
  "valueInteger": 5
}
```

#### Adding the parameter scores

Each parameter score is a component with its own SNOMED CT code; the codes are in the [formal views](#profile). The scores below add up to the total of 5. Use the scale 2 code `1104321000000108` instead of scale 1 only for a patient with known respiratory failure, on a physician's order:

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": ["https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-news2-observation"]
  },
  "status": "final",
  "category": [
    {
      "coding": [
        { "system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "survey" }
      ]
    }
  ],
  "code": {
    "coding": [{ "system": "http://snomed.info/sct", "code": "1104051000000101" }]
  },
  "subject": { "reference": "Patient/example-patient-personnummer" },
  "encounter": { "reference": "Encounter/example-encounter-emergency" },
  "effectiveDateTime": "2026-11-19T08:40:00+01:00",
  "valueInteger": 5,
  "component": [
    {
      "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "1104301000000104" }] },
      "valueInteger": 2
    },
    {
      "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "1104311000000102" }] },
      "valueInteger": 1
    },
    {
      "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "1104331000000105" }] },
      "valueInteger": 0
    },
    {
      "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "1104341000000101" }] },
      "valueInteger": 1
    },
    {
      "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "1104351000000103" }] },
      "valueInteger": 1
    },
    {
      "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "1104361000000100" }] },
      "valueInteger": 0
    },
    {
      "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "1104371000000107" }] },
      "valueInteger": 0
    }
  ]
}
```

See the [Quick Start](#quick-start) below for the common API calls.
