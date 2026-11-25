<div class="dragon">
<p><b>Here be dragons.</b> This guide requires review by a health informatics professional, and it needs further development. Its profiles, codes, mappings, computable guidelines and clinical views may be wrong or incomplete. Only after that review can it be used for patient care.</p>
</div>

### About this guide

This is an unofficial, draft FHIR R4 implementation guide for the data used in **WEST-A** (West coast System for Triage - Adult), the emergency department triage system of Västra Götalandsregionen (VGR). It is not published, endorsed or maintained by VGR.

The source is the [WEST-A triage manual](https://mellanarkiv-offentlig.vgregion.se/alfresco/s/archive/stream/public/v1/source/available/sofia/su1226-506079272-668/surrogate/WEST%20A%202025%20%C3%96stra.pdf) without referral support, VGR version 2025:02:01 (the Östra/SU edition, from VGR's public document archive). WEST-A and its content belong to VGR; this guide only refers to it.

### Scope

The guide follows the data of one triage, from the form the nurse fills in to the report written when the patient leaves, and each step uses a FHIR standard rather than code of its own:

1. **Questionnaire** - the nurse records the vital signs and the triage assessment, the chief complaint and the warning symptoms found, in the [WEST-A Triage Questionnaire](Questionnaire-west-a-triage-questionnaire.html) ([example answers](QuestionnaireResponse-example-triage-questionnaire-response.html)).
1. **Vital signs** - HL7 Structured Data Capture (SDC) template-based extraction turns the answers into one Observation per NEWS2 parameter: [respiratory rate](StructureDefinition-west-a-respiratory-rate.html), [oxygen saturation](StructureDefinition-west-a-oxygen-saturation.html), [supplemental oxygen](StructureDefinition-west-a-supplemental-oxygen.html), [blood pressure](StructureDefinition-west-a-blood-pressure.html), [heart rate](StructureDefinition-west-a-heart-rate.html), [consciousness (ACVPU)](StructureDefinition-west-a-consciousness.html) and [body temperature](StructureDefinition-west-a-body-temperature.html), based on the FHIR core vital signs profiles. The extraction templates are in the Questionnaire, so the guide, not the app, decides what is recorded.
1. **NEWS2 and triage** - the [WEST-A Triage](PlanDefinition-west-a-triage.html) PlanDefinition, an HL7 Clinical Practice Guidelines (CPG on FHIR) computable guideline, runs the [WEST-A NEWS2 Logic](Library-WestANEWS2.html) and [WEST-A Triage Logic](Library-WestATriage.html) CQL on the vital signs. It calculates the [NEWS2 score](StructureDefinition-west-a-news2-observation.html) and proposes the [triage result](StructureDefinition-west-a-triage-observation.html), the priority (Röd, Orange, Gul, Grön) with the chief complaint, which the nurse confirms or changes. The [computable guidelines](west-a-computable-guidelines.html) page describes the logic, which every build tests against the NEWS2 chart and this guide's examples.
1. **Discharge report** - when the patient leaves, the stay becomes an [HL7 Europe Hospital Discharge Report](https://hl7.eu/fhir/hdr/), a FHIR document for the European Health Data Space, with the vital signs, NEWS2 and triage result. The [demo](https://vadimperetok.in/west-a-triage-ig/demo/) builds it, and this guide does not profile it.

Every step is about the [WEST-A Patient](StructureDefinition-west-a-patient.html), the patient administrative data that WEST-A uses.

Two pages map WEST-A to these resources, each with what is out of scope and the open questions: the [WEST-A Patient Mapping](west-a-patient-mapping.html), where each patient element comes from, and the [WEST-A Triage Mapping](west-a-triage-mapping.html), how WEST-A sets the priority and every code. The [clinical views](clinical-views.html) show every profile for clinicians: an overview, a data table, a mind map and a form preview.

The [demo](https://vadimperetok.in/west-a-triage-ig/demo/) runs these steps end to end with synthetic data on the public HAPI FHIR sandbox, and the [architecture](west-a-architecture.html) page shows how open standards, open source and free public services make up the guide and the demo.

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
