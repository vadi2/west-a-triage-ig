### Quick Start {#quick-start}

Common API interactions for this profile. `[base]` is the base URL of your FHIR server; `|` separates a code system from its code and must be URL-encoded as `%7C`.

**Find the heart rate measurements of an emergency department visit**

```
GET [base]/Observation?code=http://loinc.org|8867-4&encounter=Encounter/[id]
```

**Record a heart rate measurement**

```
POST [base]/Observation
{
  "resourceType": "Observation",
  "meta": { "profile": [ "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-heart-rate" ] },
  ...
}
```

Observation is not yet listed in a CapabilityStatement; the search above uses standard FHIR R4 search parameters.

### Related

- [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) - the score calculated from this measurement
- [WEST-A Triage Mapping](west-a-triage-mapping.html#vital-signs) - how the vital signs map to FHIR
