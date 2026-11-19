WEST-A NEWS2 Observation records the National Early Warning Score 2 (NEWS2) that WEST-A uses to set a priority from the vital parameters: the total score and the score of each parameter. It is calculated from seven vital sign observations, which it references in `derivedFrom`, and the [WEST-A Triage Observation](StructureDefinition-west-a-triage-observation.html) references it in turn. The [triage mapping page](west-a-triage-mapping.html#news2) lists the parameters, their codes and how a score follows from a measurement.

```
vital signs (measured) ──derivedFrom── NEWS2 (calculated) ──derivedFrom── WEST-A triage (assessed)
```

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A NEWS2 Observation Must Have

A status, the survey category, the SNOMED CT code for the NEWS2 total score, the patient, the time the score was calculated, and the total score (0-20).

#### Each WEST-A NEWS2 Observation Must Support

- the encounter and the performer;
- the seven vital sign observations the score is calculated from, in `derivedFrom`: [respiratory rate](StructureDefinition-west-a-respiratory-rate.html), [oxygen saturation](StructureDefinition-west-a-oxygen-saturation.html), [supplemental oxygen](StructureDefinition-west-a-supplemental-oxygen.html), [blood pressure](StructureDefinition-west-a-blood-pressure.html), [heart rate](StructureDefinition-west-a-heart-rate.html), [consciousness](StructureDefinition-west-a-consciousness.html) and [body temperature](StructureDefinition-west-a-body-temperature.html);
- one score per parameter: respiration rate, oxygen saturation (scale 1 or scale 2, never both), supplemental oxygen, systolic blood pressure, pulse, consciousness (ACVPU) and temperature.

When all seven parameter scores are sent, the total must be their sum.

### Building the JSON, step by step

The complete reference instance is the [NEWS2 of 5](Observation-example-news2.html). The displays are the Swedish terms of the Swedish edition of SNOMED CT, to match `language`, and `version` names that edition, so that a validator checks each display against the Swedish terms.

#### The smallest NEWS2 you can send

Only the total score is mandatory:

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-news2-observation"
    ]
  },
  "language": "sv",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "survey",
          "display": "Survey"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "version": "http://snomed.info/sct/45991000052106",
        "code": "1104051000000101",
        "display": "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), totalpoäng"
      }
    ]
  },
  "subject": {
    "reference": "Patient/example-patient-personnummer"
  },
  "effectiveDateTime": "2026-11-19T08:40:00+01:00",
  "valueInteger": 5
}
```

#### Adding the vital signs and the parameter scores

`derivedFrom` points to the measurements the score is calculated from, so a receiver can check the calculation. Each parameter score is a component with its own SNOMED CT code. The scores below add up to the total of 5. Use the scale 2 code `1104321000000108` instead of scale 1 only for a patient with known respiratory failure, on a physician's order:

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-news2-observation"
    ]
  },
  "language": "sv",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "survey",
          "display": "Survey"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "version": "http://snomed.info/sct/45991000052106",
        "code": "1104051000000101",
        "display": "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), totalpoäng"
      }
    ]
  },
  "subject": {
    "reference": "Patient/example-patient-personnummer"
  },
  "encounter": {
    "reference": "Encounter/example-encounter-emergency"
  },
  "effectiveDateTime": "2026-11-19T08:40:00+01:00",
  "performer": [
    {
      "reference": "Practitioner/example-practitioner-triage-nurse"
    }
  ],
  "valueInteger": 5,
  "derivedFrom": [
    {
      "reference": "Observation/example-respiratory-rate"
    },
    {
      "reference": "Observation/example-oxygen-saturation"
    },
    {
      "reference": "Observation/example-supplemental-oxygen"
    },
    {
      "reference": "Observation/example-blood-pressure"
    },
    {
      "reference": "Observation/example-heart-rate"
    },
    {
      "reference": "Observation/example-consciousness"
    },
    {
      "reference": "Observation/example-body-temperature"
    }
  ],
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "version": "http://snomed.info/sct/45991000052106",
            "code": "1104301000000104",
            "display": "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), andningsfrekvens"
          }
        ]
      },
      "valueInteger": 2
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "version": "http://snomed.info/sct/45991000052106",
            "code": "1104311000000102",
            "display": "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), syremättnad 1"
          }
        ]
      },
      "valueInteger": 1
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "version": "http://snomed.info/sct/45991000052106",
            "code": "1104331000000105",
            "display": "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), tillförd syrgas"
          }
        ]
      },
      "valueInteger": 0
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "version": "http://snomed.info/sct/45991000052106",
            "code": "1104341000000101",
            "display": "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), systoliskt blodtryck"
          }
        ]
      },
      "valueInteger": 1
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "version": "http://snomed.info/sct/45991000052106",
            "code": "1104351000000103",
            "display": "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), pulsfrekvens"
          }
        ]
      },
      "valueInteger": 1
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "version": "http://snomed.info/sct/45991000052106",
            "code": "1104361000000100",
            "display": "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), medvetandegrad"
          }
        ]
      },
      "valueInteger": 0
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "version": "http://snomed.info/sct/45991000052106",
            "code": "1104371000000107",
            "display": "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), temperatur"
          }
        ]
      },
      "valueInteger": 0
    }
  ]
}
```

See the [Quick Start](#quick-start) below for the common API calls.
