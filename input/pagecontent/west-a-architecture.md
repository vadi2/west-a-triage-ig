### Overview

This guide and its [demo](https://vadimperetok.in/west-a-triage-ig/demo/) are put together from parts that already exist and are open:

- a public source, the WEST-A triage manual;
- open HL7 standards;
- published Swedish FHIR profiles;
- open source tools;
- free public services.

<div class="westa-arch-wrap" style="max-width: 960px; margin: 1em 0 1.5em">
{% include west-a-architecture.svg %}
</div>

### A triage in the demo

1. The nurse fills in the guide's [WEST-A Triage Questionnaire](Questionnaire-west-a-triage-questionnaire.html). The CSIRO AEHRC Smart Forms renderer draws it from the Questionnaire itself, with no form code of its own.
1. SDC template-based extraction turns the answers into this guide's vital sign Observations. The extraction templates are in the Questionnaire, so the guide, not the app, decides what is recorded.
1. The app reads the [WEST-A Triage](PlanDefinition-west-a-triage.html) PlanDefinition the way `$apply` does. It runs the [WEST-A NEWS2 Logic](Library-WestANEWS2.html) and [WEST-A Triage Logic](Library-WestATriage.html) CQL in the browser with `cql-execution`, using the ELM that the IG Publisher translated in the build. The result is a proposed NEWS2 and triage priority.
1. The nurse confirms the priority or changes it. The app records the NEWS2 and triage Observations on the public HAPI FHIR sandbox, using plain FHIR REST.
1. When the patient leaves, the stay becomes an HL7 Europe Hospital Discharge Report, a FHIR document for the European Health Data Space.

The same CQL also runs on a FHIR server: HAPI FHIR with clinical reasoning applies the PlanDefinitions with `$apply`. Every build runs the demo end to end that way. The demo can use such a server too (*Where the data lives* in the demo).

The demo is for showing how the parts fit. It uses synthetic data only, and anyone can read and change what is on the public sandbox. Like the rest of this guide, it is not for patient care (see [Home](index.html)).
