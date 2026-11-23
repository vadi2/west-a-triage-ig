WEST-A Supplemental Oxygen records the oxygen flow the patient receives at triage (*tillförd syrgas*), with SNOMED CT `427081008` *flöde för tillförd syrgas* (delivered oxygen flow rate). A flow of 0 L/min means the patient breathes room air. NEWS2 gives 2 points for any supplemental oxygen; the [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) references this observation in `derivedFrom`.

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A Supplemental Oxygen Must Have

A status, the therapy category, the SNOMED CT code `427081008`, the patient, the time and the oxygen flow in UCUM `L/min` (0 for room air).

#### Each WEST-A Supplemental Oxygen Must Support

- the encounter and the performer.

{% include clinical-view-west-a-supplemental-oxygen.html %}

### Building the JSON

The complete reference instance is [room air, 0 points in NEWS2](Observation-example-supplemental-oxygen.html). The SNOMED CT displays are the Swedish terms of the Swedish edition of SNOMED CT, to match `language`; LOINC and HL7 codes have English displays. A patient on 2 L/min sends `"value": 2` instead.

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-supplemental-oxygen"
    ]
  },
  "language": "sv",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "therapy",
          "display": "Therapy"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "version": "http://snomed.info/sct/45991000052106",
        "code": "427081008",
        "display": "flöde för tillförd syrgas"
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
    "value": 0,
    "unit": "L/min",
    "system": "http://unitsofmeasure.org",
    "code": "L/min"
  }
}
```

See the [Quick Start](#quick-start) below for the common API calls.
