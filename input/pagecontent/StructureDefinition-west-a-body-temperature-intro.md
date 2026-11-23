WEST-A Body Temperature records the body temperature measured at triage. It derives from the FHIR core [Body Temperature](http://hl7.org/fhir/R4/bodytemp.html) vital signs profile, so a system that already sends FHIR vital signs only adds the patient and the visit. The [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) scores its temperature from it and references it in `derivedFrom`.

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A Body Temperature Must Have

A status, the vital-signs category, the LOINC code `8310-5` that the core profile requires, the patient, the time of measurement and the value: the temperature in degrees Celsius, UCUM `Cel`.

#### Each WEST-A Body Temperature Must Support

- the SNOMED CT code `386725007` *kroppstemperatur*, as a second coding next to the LOINC code;
- the encounter and the performer.

### Clinical view

The elements of this profile as clinicians see them: a data table, a mind map and a form preview.

{% include clinical-view-west-a-body-temperature.html %}

### Building the JSON

The complete reference instance is [37.5 °C, 0 points in NEWS2](Observation-example-body-temperature.html). The SNOMED CT displays are the Swedish terms of the Swedish edition of SNOMED CT, to match `language`; LOINC and HL7 codes have English displays.

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-body-temperature"
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
        "code": "8310-5",
        "display": "Body temperature"
      },
      {
        "system": "http://snomed.info/sct",
        "version": "http://snomed.info/sct/45991000052106",
        "code": "386725007",
        "display": "kroppstemperatur"
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
    "value": 37.5,
    "unit": "°C",
    "system": "http://unitsofmeasure.org",
    "code": "Cel"
  }
}
```

See the [Quick Start](#quick-start) below for the common API calls.
