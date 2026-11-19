### Quick Start {#quick-start}

Common API interactions for this profile. `[base]` is the base URL of your FHIR server; `|` separates a code system from its code and must be URL-encoded as `%7C`.

**Find the oxygen flow recordings of an emergency department visit**

```
GET [base]/Observation?code=http://snomed.info/sct|427081008&encounter=Encounter/[id]
```

**Record an oxygen flow measurement**

```
POST [base]/Observation
{
  "resourceType": "Observation",
  "meta": { "profile": [ "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-supplemental-oxygen" ] },
  ...
}
```

Observation is not yet listed in a CapabilityStatement; the search above uses standard FHIR R4 search parameters.

### Related

- [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) - the score calculated from this measurement
- [WEST-A Triage Mapping](west-a-triage-mapping.html#vital-signs) - how the vital signs map to FHIR
