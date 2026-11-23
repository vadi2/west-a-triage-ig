WEST-A Blood Pressure records the blood pressure measured at triage. It derives from the FHIR core [Blood Pressure](http://hl7.org/fhir/R4/bp.html) vital signs profile, so a system that already sends FHIR vital signs only adds the patient and the visit. The [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) scores its systolic blood pressure from it and references it in `derivedFrom`.

The [clinical view](clinical-views.html#west-a-blood-pressure) shows this profile for clinicians: an overview, a data table, a mind map and a form preview.

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A Blood Pressure Must Have

A status, the vital-signs category, the LOINC code `85354-9` that the core profile requires, the patient, the time of measurement and the value: the systolic and diastolic pressures as two components in mmHg (UCUM `mm[Hg]`); NEWS2 uses the systolic one.

#### Each WEST-A Blood Pressure Must Support

- the SNOMED CT code `75367002` *blodtryck*, as a second coding next to the LOINC code;
- the encounter and the performer.

### Building the JSON

The complete reference instance is [105/70 mmHg; the systolic pressure gives 1 point in NEWS2](Observation-example-blood-pressure.html). The SNOMED CT displays are the Swedish terms of the Swedish edition of SNOMED CT, to match `language`; LOINC and HL7 codes have English displays.

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-blood-pressure"
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
        "code": "85354-9",
        "display": "Blood pressure panel with all children optional"
      },
      {
        "system": "http://snomed.info/sct",
        "version": "http://snomed.info/sct/45991000052106",
        "code": "75367002",
        "display": "blodtryck"
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
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8480-6",
            "display": "Systolic blood pressure"
          },
          {
            "system": "http://snomed.info/sct",
            "version": "http://snomed.info/sct/45991000052106",
            "code": "271649006",
            "display": "systoliskt blodtryck"
          }
        ]
      },
      "valueQuantity": {
        "value": 105,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      }
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8462-4",
            "display": "Diastolic blood pressure"
          },
          {
            "system": "http://snomed.info/sct",
            "version": "http://snomed.info/sct/45991000052106",
            "code": "271650006",
            "display": "diastoliskt blodtryck"
          }
        ]
      },
      "valueQuantity": {
        "value": 70,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      }
    }
  ]
}
```

See the [Quick Start](#quick-start) below for the common API calls.
