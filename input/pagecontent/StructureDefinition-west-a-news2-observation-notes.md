### Quick Start {#quick-start}

Common API interactions for this profile. `[base]` is the base URL of your FHIR server; `|` separates a code system from its code and must be URL-encoded as `%7C`.

**Read a NEWS2 by server id**

```
GET [base]/Observation/[id]
```

**Find the NEWS2 scores of a patient, newest first**

```
GET [base]/Observation?code=http://snomed.info/sct|1104051000000101&subject=Patient/[id]&_sort=-date
```

**Find the NEWS2 scores of an emergency department visit**

```
GET [base]/Observation?code=http://snomed.info/sct|1104051000000101&encounter=Encounter/[id]
```

The standard `value-quantity` search parameter does not cover `valueInteger`, so a server needs a custom search parameter to search on the score.

**Record a NEWS2**

```
POST [base]/Observation
{
  "resourceType": "Observation",
  "meta": { "profile": [ "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-news2-observation" ] },
  ...
}
```

Observation is not yet listed in a CapabilityStatement; the searches above use standard FHIR R5 search parameters.

### Related

- [WEST-A Triage Mapping](west-a-triage-mapping.html#news2) - the NEWS2 parameters and their codes
- [WEST-A Triage Observation](StructureDefinition-west-a-triage-observation.html) - the triage that uses this score
