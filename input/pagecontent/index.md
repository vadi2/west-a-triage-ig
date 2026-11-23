<div class="dragon">
<p><b>Here be dragons.</b> This guide has not been reviewed by a health informatics professional, and it needs further development. Its profiles, codes, mappings, computable guidelines and clinical views may be wrong or incomplete. Do not use it for patient care.</p>
</div>

### About this guide

This is an unofficial, draft FHIR R4 implementation guide for the data used in **WEST-A** (West coast System for Triage - Adult), the emergency department triage system of Västra Götalandsregionen (VGR). It is not published, endorsed or maintained by VGR.

The source is the [WEST-A triage manual](https://mellanarkiv-offentlig.vgregion.se/alfresco/s/archive/stream/public/v1/source/available/sofia/su1226-506079272-668/surrogate/WEST%20A%202025%20%C3%96stra.pdf) without referral support, VGR version 2025:02:01 (the Östra/SU edition, from VGR's public document archive). WEST-A and its content belong to VGR; this guide only refers to it.

### Scope

The guide covers the **patient administrative data** that WEST-A uses:

- [WEST-A Patient](StructureDefinition-west-a-patient.html) - the patient being triaged;
- [WEST-A Patient Mapping](west-a-patient-mapping.html) - where each element comes from in WEST-A, what is out of scope, and the open questions.

and a **triage**, in three layers:

- the **vital signs** measured at triage, one Observation per NEWS2 parameter: [respiratory rate](StructureDefinition-west-a-respiratory-rate.html), [oxygen saturation](StructureDefinition-west-a-oxygen-saturation.html), [supplemental oxygen](StructureDefinition-west-a-supplemental-oxygen.html), [blood pressure](StructureDefinition-west-a-blood-pressure.html), [heart rate](StructureDefinition-west-a-heart-rate.html), [consciousness (ACVPU)](StructureDefinition-west-a-consciousness.html) and [body temperature](StructureDefinition-west-a-body-temperature.html), based on the FHIR core vital signs profiles;
- the **NEWS2 score** calculated from them: [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html);
- the **triage result**, the priority (Röd, Orange, Gul, Grön) and the chief complaint, based on NEWS2: [WEST-A Triage Observation](StructureDefinition-west-a-triage-observation.html);
- [WEST-A Triage Mapping](west-a-triage-mapping.html) - how WEST-A sets the priority, every code, and the open questions.

The [computable guidelines](west-a-computable-guidelines.html) calculate NEWS2 and propose a triage priority in CQL, as HL7 Clinical Practice Guidelines (CPG on FHIR) PlanDefinitions, tested against the NEWS2 chart and this guide's examples in every build.

The [clinical views](clinical-views.html) show every profile for clinicians: an overview, a data table, a mind map and a form preview.

The rest of the clinical part of WEST-A - coded warning symptoms, ONEWS2, pain, GCS, mNIHSS and FRESH - is not modelled yet.

### Conventions

The guide follows the [UZ Core modelling guidelines](https://github.com/uzinfocom-org/digital-health-ig/blob/main/modelling-guidelines.en.md), adapted to Sweden:

- profiles are named `WestA[Resource]`, with ids `west-a-[resource]` and titles "WEST-A [Resource]";
- invariants are named `westa-[resource-abbreviation]-[number]`;
- profiles derive from the [VGR Base profiles](https://fhir.vgregion.se/ig/base/) where VGR Base has one (Patient, Encounter), and so from the HL7 Sweden [SE Base profiles](http://hl7.se/fhir/ig/base/); the Swedish and VGR identifier systems come from there;
- vital signs derive from the FHIR core vital signs profiles;
- SNOMED CT comes first, then LOINC where a FHIR profile requires it, then local codes; SNOMED CT is the Swedish edition (`http://snomed.info/sct/45991000052106`), which value set expansion and validation use, and a coding with a Swedish display names that edition in `Coding.version`; local code systems use Swedish (`sv`) as their default language, with English designations;
- examples use `language = sv`.

VGR Base and SE Base are FHIR R4, so this guide is FHIR R4 too, rather than the R5 that the modelling guidelines ask for: a profile can only derive from a profile of the same FHIR version.
