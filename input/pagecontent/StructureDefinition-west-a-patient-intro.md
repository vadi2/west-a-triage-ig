WEST-A Patient identifies the adult patient who is triaged with WEST-A at the emergency department. It derives from the [VGR Base Patient](https://fhir.vgregion.se/ig/base/StructureDefinition-VGRBasePatient.html), so every WEST-A Patient is also a valid VGR Base and SE Base patient. It holds the patient administrative data that WEST-A uses: name, identifier, date of birth (for the age rules) and gender (for the sex-specific complaint pages). The [mapping page](west-a-patient-mapping.html) shows where each element comes from in WEST-A. A patient is usually already known to the hospital's patient administration system, so search for an existing Patient by identifier before you create a new one.

The [clinical view](clinical-views.html#west-a-patient) shows this profile for clinicians: an overview, a data table, a mind map and a form preview.

### Mandatory and Must Support data elements

The elements below must always be present (mandatory) or must be supported when the data is available (Must Support) - not all are required, but your system must populate each Must Support element when it has the data and process it on receipt. This is the human-readable summary; the [formal views](#profile) below give the exact cardinalities, types, and terminology bindings.

#### Each WEST-A Patient Must Have

At least one identifier, with both its system and its value. Every patient at the emergency department has one: a personnummer, a samordningsnummer, or a reserve number when the identity is not known.

#### Each WEST-A Patient Must Support

- an identifier - the personnummer, samordningsnummer, national reserve number and VGR reserve number slices (see [the table below](#identifier-slices));
- the name (family name and given names);
- the gender (female / male / other / unknown);
- the date of birth.

### Finding an existing Patient {#finding}

Search by identifier, with the system and value separated by `|`:

```
GET [base]/Patient?identifier=http://electronichealth.se/identifier/personnummer|196101182803
GET [base]/Patient?identifier=http://electronichealth.se/identifier/samordningsnummer|198503723135
GET [base]/Patient?identifier=https://fhir.vgregion.se/NamingSystem/LRID|19700101M081
```

### Building the JSON, step by step

The examples go from the smallest valid instance to a complete one. The complete reference instances are the [patient with a personnummer](Patient-example-patient-personnummer.html), the [patient with a samordningsnummer](Patient-example-patient-samordningsnummer.html) and the [unidentified patient](Patient-example-patient-lrid.html).

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
  "language": "sv",
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

#### An unidentified patient

An unconscious patient without identity documents gets a VGR local reserve number (LRID): an estimated date of birth, `K` for woman, `M` for man or `X` for unknown, and a three-digit number from 060 to 899. With no known birth date, send the estimated birth year only:

```json
{
  "resourceType": "Patient",
  "meta": {
    "profile": ["https://vadi2.github.io/west-a-triage-ig/StructureDefinition/west-a-patient"]
  },
  "language": "sv",
  "identifier": [
    {
      "system": "https://fhir.vgregion.se/NamingSystem/LRID",
      "value": "19700101M081"
    }
  ],
  "gender": "male",
  "birthDate": "1970"
}
```

#### Identifier slices {#identifier-slices}

| Slice | Identifier | `system` | Format rule |
|---|---|---|---|
| `personnummer` | Personal identity number | `http://electronichealth.se/identifier/personnummer` | `westa-pat-1`: YYYYMMDDNNNC |
| `samordningsnummer` | Coordination number | `http://electronichealth.se/identifier/samordningsnummer` | `westa-pat-2`: day of birth + 60 |
| `nationelltReservnummer` | National reserve number | `http://electronichealth.se/identifier/nationelltReservnummer` | none yet |
| `LRID` | VGR local reserve number | `https://fhir.vgregion.se/NamingSystem/LRID` | `LRID-invariant` (VGR Base) |
| `GRID` | Superseded VGR reserve number | `https://fhir.vgregion.se/NamingSystem/GRID` | `GRID-invariant` (VGR Base) |
{:.grid}

The first three slices and their system URIs come from the HL7 Sweden SE Base profiles, the VGR reserve numbers from VGR Base.

See the [Quick Start](#quick-start) below for the common API calls.
