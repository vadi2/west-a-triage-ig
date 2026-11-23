WEST-A Oxygen Saturation records the peripheral oxygen saturation (*syremättnad*, SpO2) measured at triage. It derives from the FHIR core [Oxygen Saturation](http://hl7.org/fhir/R4/oxygensat.html) vital signs profile, so a system that already sends FHIR vital signs only adds the patient and the visit. The [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) scores its oxygen saturation (scale 1 or scale 2) from it and references it in `derivedFrom`.

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A Oxygen Saturation Must Have

A status, the vital-signs category, the LOINC code `2708-6` that the core profile requires, the patient, the time of measurement and the value: the saturation in %.

#### Each WEST-A Oxygen Saturation Must Support

- the SNOMED CT code `431314004` *perifer syremättnad*, as a second coding next to the LOINC code;
- the encounter and the performer.

### Clinical view

The elements of this profile as clinicians see them: a data table, a mind map and a form preview.

{% include clinical-view-west-a-oxygen-saturation.html %}

### Building the JSON

The complete reference instance is [95%, 1 point on NEWS2 scale 1](Observation-example-oxygen-saturation.html). The SNOMED CT displays are the Swedish terms of the Swedish edition of SNOMED CT, to match `language`; LOINC and HL7 codes have English displays.

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-oxygen-saturation"
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
        "code": "2708-6",
        "display": "Oxygen saturation in Arterial blood"
      },
      {
        "system": "http://snomed.info/sct",
        "version": "http://snomed.info/sct/45991000052106",
        "code": "431314004",
        "display": "perifer syremättnad"
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
    "unit": "%",
    "system": "http://unitsofmeasure.org",
    "code": "%"
  }
}
```

See the [Quick Start](#quick-start) below for the common API calls.
