### Quick Start {#quick-start}

Common API interactions for this profile. `[base]` is the base URL of your FHIR server; `|` separates an identifier system from its value and must be URL-encoded as `%7C`.

**Read a patient by server id**

```
GET [base]/Patient/[id]
```

**Find a patient before registering (the usual first step)**

```
GET [base]/Patient?identifier=http://electronichealth.se/identifier/personnummer|196101182803
GET [base]/Patient?family=Ljungberg&birthdate=1961-01-18
```

**Register a new patient** (only after confirming no match exists)

```
POST [base]/Patient
{
  "resourceType": "Patient",
  "meta": { "profile": [ "https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-patient" ] },
  ...
}
```

**Update an existing patient**

```
PUT [base]/Patient/[id]
If-Match: W/"3"   # the ETag from your last read; 412 if it changed since
{
  "resourceType": "Patient",
  "id": "[id]",
  ...
}
```

Patient is not yet listed in a CapabilityStatement; the searches above use standard FHIR R5 search parameters.

### Related

- [WEST-A Patient Mapping](west-a-patient-mapping.html) - where each element comes from in WEST-A
- [Home](index.html) - scope of this guide
