### About this guide

This is an unofficial, draft FHIR R5 implementation guide for the data used in **WEST-A** (West coast System for Triage - Adult), the emergency department triage system of Västra Götalandsregionen (VGR). It is not published, endorsed or maintained by VGR.

The source is the WEST-A triage manual without referral support, VGR version 2025:02:01. WEST-A and its content belong to VGR; this guide only refers to it.

### Scope

The first part of the guide covers the **patient administrative data** that WEST-A uses:

- [WEST-A Patient](StructureDefinition-west-a-patient.html) - the patient being triaged;
- [WEST-A Patient Mapping](west-a-patient-mapping.html) - where each element comes from in WEST-A, what is out of scope, and the open questions.

The clinical part of WEST-A - warning symptoms (red, orange, yellow), NEWS2 and ONEWS2, pain, GCS, mNIHSS, FRESH and the resulting triage priority - is not modelled yet.

### Conventions

The guide follows the [UZ Core modelling guidelines](https://github.com/uzinfocom-org/digital-health-ig/blob/main/modelling-guidelines.en.md), adapted to Sweden:

- profiles are named `WestA[Resource]`, with ids `west-a-[resource]` and titles "WEST-A [Resource]";
- invariants are named `westa-[resource-abbreviation]-[number]`;
- Swedish identifier systems are reused from the HL7 Sweden [SE Base profiles](http://hl7.se/fhir/ig/base/) rather than created here;
- standard codes (SNOMED CT, LOINC, HL7) come before local ones; local code systems use Swedish (`sv`) as their default language, with English designations;
- examples use `language = sv`.

SE Base is FHIR R4. This guide is FHIR R5, as the modelling guidelines require, so its profiles cannot derive from the SE Base profiles; they reuse SE Base's identifier systems and follow its modelling where possible.
