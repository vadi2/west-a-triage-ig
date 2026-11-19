WEST-A Respiratory Rate records the respiratory rate (*andningsfrekvens*) measured at triage. It derives from the FHIR core [Respiratory Rate](http://hl7.org/fhir/R4/resprate.html) vital signs profile, so a system that already sends FHIR vital signs only adds the patient and the visit. The [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) scores its respiration rate from it and references it in `derivedFrom`.

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A Respiratory Rate Must Have

A status, the vital-signs category, the LOINC code `9279-1` that the core profile requires, the patient, the time of measurement and the value: the number of breaths per minute, in UCUM `/min`.

#### Each WEST-A Respiratory Rate Must Support

- the SNOMED CT code `86290005` *andningsfrekvens*, as a second coding next to the LOINC code;
- the encounter and the performer.

### Building the JSON

The complete reference instance is [22 breaths per minute, 2 points in NEWS2](Observation-example-respiratory-rate.html). The SNOMED CT displays are the Swedish terms of the Swedish edition of SNOMED CT, to match `language`; LOINC and HL7 codes have English displays.

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-respiratory-rate"
    ]
  },
  "language": "sv",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs",
          "display": "Vital Signs"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "9279-1",
        "display": "Respiratory rate"
      },
      {
        "system": "http://snomed.info/sct",
        "version": "http://snomed.info/sct/45991000052106",
        "code": "86290005",
        "display": "andningsfrekvens"
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
  "valueQuantity": {
    "value": 22,
    "unit": "/min",
    "system": "http://unitsofmeasure.org",
    "code": "/min"
  }
}
```

See the [Quick Start](#quick-start) below for the common API calls.
