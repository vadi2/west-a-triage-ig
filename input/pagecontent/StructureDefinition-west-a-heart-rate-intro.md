WEST-A Heart Rate records the pulse (*pulsfrekvens*) measured at triage. It derives from the FHIR core [Heart Rate](http://hl7.org/fhir/R4/heartrate.html) vital signs profile, so a system that already sends FHIR vital signs only adds the patient and the visit. The [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) scores its pulse from it and references it in `derivedFrom`.

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A Heart Rate Must Have

A status, the vital-signs category, the LOINC code `8867-4` that the core profile requires, the patient, the time of measurement and the value: the beats per minute, in UCUM `/min`.

#### Each WEST-A Heart Rate Must Support

- the SNOMED CT code `364075005` *hjärtfrekvens*, as a second coding next to the LOINC code;
- the encounter and the performer.

### Building the JSON

The complete reference instance is [95 beats per minute, 1 point in NEWS2](Observation-example-heart-rate.html). The SNOMED CT displays are the Swedish terms of the Swedish edition of SNOMED CT, to match `language`; LOINC and HL7 codes have English displays.

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-heart-rate"
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
        "code": "8867-4",
        "display": "Heart rate"
      },
      {
        "system": "http://snomed.info/sct",
        "code": "364075005",
        "display": "hjärtfrekvens"
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
    "value": 95,
    "unit": "/min",
    "system": "http://unitsofmeasure.org",
    "code": "/min"
  }
}
```

See the [Quick Start](#quick-start) below for the common API calls.
