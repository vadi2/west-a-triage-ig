WEST-A Triage Observation records the result of a WEST-A triage at the emergency department: the priority (Röd, Orange, Gul or Grön), the chief complaint, that is, the WEST-A complaint algorithm the triage nurse used, and the triage criteria found: the warning symptoms of that algorithm, which set the priority, and the needs that give yellow as the lowest priority. It refers to the [WEST-A Patient](StructureDefinition-west-a-patient.html) and the emergency department Encounter, and it points to the [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) the priority is based on. The [triage mapping page](west-a-triage-mapping.html) explains how WEST-A sets the priority and lists every code.

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A Triage Observation Must Have

A status, the survey category, the SNOMED CT code for triage (`425705009` *triagering*), the patient, the time of triage, the priority, and the chief complaint.

#### Each WEST-A Triage Observation Must Support

- the encounter (the emergency department visit);
- the performer (the triage nurse);
- the triage criteria found, one `criterion` component each: a warning symptom, a need, or *Inga varningssymtom* (no warning symptoms);
- the observations the priority is based on, such as NEWS2.

### Building the JSON, step by step

The examples go from the smallest valid instance to a complete one. The complete reference instance is the [triage of chest pain](Observation-example-triage-chest-pain.html).

#### The smallest triage you can send

The priority goes in `valueCodeableConcept` and the chief complaint in a component whose code is SNOMED CT `1269489004` *sökorsak* (chief complaint). Both values are codes from this guide's code systems, with Swedish displays to match `language`. The SNOMED CT codings name the Swedish edition in `version`, since their displays are its Swedish terms:

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-triage-observation"
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
        "code": "425705009",
        "display": "triagering"
      }
    ]
  },
  "subject": {
    "reference": "Patient/example-patient-personnummer"
  },
  "effectiveDateTime": "2026-11-19T08:42:00+01:00",
  "valueCodeableConcept": {
    "coding": [
      {
        "system": "https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-triage-priority-cs",
        "code": "2",
        "display": "Orange"
      }
    ]
  },
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "version": "http://snomed.info/sct/45991000052106",
            "code": "1269489004",
            "display": "sökorsak"
          }
        ]
      },
      "valueCodeableConcept": {
        "coding": [
          {
            "system": "https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-chief-complaint-cs",
            "code": "4",
            "display": "Bröstsmärta"
          }
        ]
      }
    }
  ]
}
```

#### Adding the visit, the nurse, NEWS2 and the warning symptom

`encounter` and `performer` say where and by whom the patient was triaged. `derivedFrom` points to the NEWS2 the priority is based on. Each triage criterion the nurse found is a `criterion` component, coded *Triagekriterium* (triage criterion) from this guide's [observation codes](CodeSystem-west-a-observation-code-cs.html), whose value is from [WEST-A triage criterion](CodeSystem-west-a-triage-criterion-cs.html). Here it is the orange warning symptom of the chest pain algorithm; with NEWS2 5, which is also orange, the priority is orange:

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-triage-observation"
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
        "code": "425705009",
        "display": "triagering"
      }
    ]
  },
  "subject": {
    "reference": "Patient/example-patient-personnummer"
  },
  "encounter": {
    "reference": "Encounter/example-encounter-emergency"
  },
  "effectiveDateTime": "2026-11-19T08:42:00+01:00",
  "performer": [
    {
      "reference": "Practitioner/example-practitioner-triage-nurse"
    }
  ],
  "valueCodeableConcept": {
    "coding": [
      {
        "system": "https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-triage-priority-cs",
        "code": "2",
        "display": "Orange"
      }
    ]
  },
  "derivedFrom": [
    {
      "reference": "Observation/example-news2"
    }
  ],
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "version": "http://snomed.info/sct/45991000052106",
            "code": "1269489004",
            "display": "sökorsak"
          }
        ]
      },
      "valueCodeableConcept": {
        "coding": [
          {
            "system": "https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-chief-complaint-cs",
            "code": "4",
            "display": "Bröstsmärta"
          }
        ]
      }
    },
    {
      "code": {
        "coding": [
          {
            "system": "https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-observation-code-cs",
            "code": "1",
            "display": "Triagekriterium"
          }
        ]
      },
      "valueCodeableConcept": {
        "coding": [
          {
            "system": "https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-triage-criterion-cs",
            "code": "15",
            "display": "Bröstsmärta, pågående med misstanke om AKS eller annan allvarlig orsak"
          }
        ]
      }
    }
  ]
}
```

A triage with several criteria has one `criterion` component for each. When the nurse has checked the warning symptoms of the chief complaint and none applies, the component holds *Inga varningssymtom* (`163`), so that a receiver can tell "none found" from "not recorded".

See the [Quick Start](#quick-start) below for the common API calls.
