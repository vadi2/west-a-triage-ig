WEST-A Consciousness records the level of consciousness on the ACVPU scale (*medvetandegrad*) assessed at triage: Alert, new Confusion, Voice, Pain or Unresponsive. FHIR has no core vital signs profile for it, so it is a plain Observation with SNOMED CT codes. The [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) scores it (0 for alert, 3 otherwise) and references it in `derivedFrom`.

The [clinical view](clinical-views.html#west-a-consciousness) shows this profile for clinicians: an overview, a data table, a mind map and a form preview.

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A Consciousness Must Have

A status, the exam category, the SNOMED CT code `1104441000000107` for the ACVPU scale, the patient, the time of assessment and the level, coded from [WEST-A ACVPU](ValueSet-west-a-acvpu-vs.html):

| ACVPU | SNOMED CT | Swedish display | NEWS2 |
|---|---|---|---|
| A - Alert | `248234008` | psykiskt klar | 0 |
| C - new Confusion | `130987000` | akut konfusion | 3 |
| V - Voice | `300202002` | reagerar på röst | 3 |
| P - Pain | `450847001` | reagerar på smärta | 3 |
| U - Unresponsive | `422768004` | reagerar inte | 3 |
{:.grid}

#### Each WEST-A Consciousness Must Support

- the encounter and the performer.

### Building the JSON

The complete reference instance is [alert patient, 0 points in NEWS2](Observation-example-consciousness.html). The SNOMED CT displays are the Swedish terms of the Swedish edition of SNOMED CT, to match `language`; LOINC and HL7 codes have English displays.

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-consciousness"
    ]
  },
  "language": "sv",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "exam",
          "display": "Exam"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "version": "http://snomed.info/sct/45991000052106",
        "code": "1104441000000107",
        "display": "poäng enligt ACVPU-skalan (Alert Confusion Voice Pain Unresponsive)"
      }
    ]
  },
  "subject": {
    "reference": "Patient/example-patient-personnummer"
  },
  "encounter": {
    "reference": "Encounter/example-encounter-emergency"
  },
  "effectiveDateTime": "2026-11-19T08:38:00+01:00",
  "performer": [
    {
      "reference": "Practitioner/example-practitioner-triage-nurse"
    }
  ],
  "valueCodeableConcept": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "version": "http://snomed.info/sct/45991000052106",
        "code": "248234008",
        "display": "psykiskt klar"
      }
    ]
  }
}
```

See the [Quick Start](#quick-start) below for the common API calls.
