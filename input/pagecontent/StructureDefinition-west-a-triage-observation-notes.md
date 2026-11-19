### Quick Start {#quick-start}

Common API interactions for this profile. `[base]` is the base URL of your FHIR server; `|` separates a code system from its code and must be URL-encoded as `%7C`.

**Read a triage by server id**

```
GET [base]/Observation/[id]
```

**Find the triages of a patient, newest first**

```
GET [base]/Observation?code=http://snomed.info/sct|425705009&subject=Patient/[id]&_sort=-date
```

**Find the triages of an emergency department visit**

```
GET [base]/Observation?code=http://snomed.info/sct|425705009&encounter=Encounter/[id]
```

**Record a triage**

```
POST [base]/Observation
{
  "resourceType": "Observation",
  "meta": { "profile": [ "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-triage-observation" ] },
  ...
}
```

**Correct a triage** (a re-triage is a new Observation, not an update)

```
PUT [base]/Observation/[id]
If-Match: W/"1"   # the ETag from your last read; 412 if it changed since
{
  "resourceType": "Observation",
  "id": "[id]",
  "status": "amended",
  ...
}
```

Observation is not yet listed in a CapabilityStatement; the searches above use standard FHIR R4 search parameters.

### Related

- [WEST-A Triage Mapping](west-a-triage-mapping.html) - how WEST-A sets the priority, and every code
- [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) - the vital parameters the priority is based on
- [WEST-A Patient](StructureDefinition-west-a-patient.html) - the patient being triaged
