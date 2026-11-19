WEST-A Patient identifies the adult patient who is triaged with WEST-A at the emergency department. It holds the patient administrative data that WEST-A uses: name, identifier, date of birth (for the age rules) and gender (for the sex-specific complaint pages). The [mapping page](west-a-patient-mapping.html) shows where each element comes from in WEST-A. A patient is usually already known to the hospital's patient administration system, so search for an existing Patient by identifier before you create a new one.

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A Patient Must Have

At least one identifier, with both its system and its value. Every patient at the emergency department has one: a personnummer, a samordningsnummer, or a reserve number when the identity is not known.

#### Each WEST-A Patient Must Support

- an identifier - the personnummer, samordningsnummer and national reserve number slices (see [the table below](#identifier-slices));
- the name (family name and given names);
- the gender (female / male / other / unknown);
- the date of birth.

### Finding an existing Patient {#finding}

Search by identifier, with the system and value separated by `|`:

```
GET [base]/Patient?identifier=http://electronichealth.se/identifier/personnummer|196101182803
GET [base]/Patient?identifier=http://electronichealth.se/identifier/samordningsnummer|198503723135
```

### Building the JSON, step by step

The examples go from the smallest valid instance to a complete one. The complete reference instances are the [patient with a personnummer](Patient-example-patient-personnummer.html) and the [patient with a samordningsnummer](Patient-example-patient-samordningsnummer.html).

#### The smallest Patient you can send

An identifier is the only mandatory element. `meta.profile` names this profile so the receiver knows which rules to validate against:

```json
{
  "resourceType": "Patient",
  "meta": {
    "profile": ["https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-patient"]
  },
  "identifier": [
    {
      "system": "http://electronichealth.se/identifier/personnummer",
      "value": "196101182803"
    }
  ]
}
```

The `system` URI makes this identifier a personnummer, so it must match exactly. The value has 12 digits and no hyphen.

#### Adding name, gender and date of birth

This is what WEST-A needs at triage: the name for the SBAR handover, the date of birth for the age rules and the gender for the sex-specific complaint pages:

```json
{
  "resourceType": "Patient",
  "meta": {
    "profile": ["https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-patient"]
  },
  "language": "sv",
  "identifier": [
    {
      "system": "http://electronichealth.se/identifier/personnummer",
      "value": "196101182803"
    }
  ],
  "name": [
    {
      "use": "official",
      "text": "Maria Ljungberg",
      "family": "Ljungberg",
      "given": ["Maria", "Birgitta"]
    }
  ],
  "gender": "female",
  "birthDate": "1961-01-18"
}
```

Send `birthDate` even though the personnummer contains the date of birth: receivers should not have to parse the number. Do not send the age itself - it changes, and WEST-A needs it at the time of triage.

#### A patient without a personnummer

A patient who is not registered in Sweden has a samordningsnummer instead. It looks like a personnummer, but 60 is added to the day of birth (12 March becomes `0372`):

```json
{
  "resourceType": "Patient",
  "meta": {
    "profile": ["https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-patient"]
  },
  "identifier": [
    {
      "system": "http://electronichealth.se/identifier/samordningsnummer",
      "value": "198503723135"
    }
  ],
  "gender": "male",
  "birthDate": "1985-03-12"
}
```

#### Identifier slices {#identifier-slices}

| Slice | Identifier | `system` | Format rule |
|---|---|---|---|
| `personnummer` | Personal identity number | `http://electronichealth.se/identifier/personnummer` | `westa-pat-1`: YYYYMMDDNNNC |
| `samordningsnummer` | Coordination number | `http://electronichealth.se/identifier/samordningsnummer` | `westa-pat-2`: day of birth + 60 |
| `nationelltReservnummer` | National reserve number | `http://electronichealth.se/identifier/nationelltReservnummer` | none yet |
{:.grid}

The system URIs are the ones the HL7 Sweden SE Base profiles define. The slicing is open, so a regional reserve number can be sent with its own system.

See the [Quick Start](#quick-start) below for the common API calls.
