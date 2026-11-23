### Overview

This guide and its [demo](https://vadimperetok.in/west-a-triage-ig/demo/) are put together from parts that already exist and are open:

- a public source, the WEST-A triage manual;
- open HL7 standards;
- published Swedish FHIR profiles;
- open source tools;
- free public services.

The project's own part is the model, the CQL logic and the app that ties them together. Nothing runs on a server of its own.

- **No server of its own.** The demo is static files on GitHub Pages. Its data is kept on the public HAPI FHIR sandbox.
- **One source of truth.** The demo runs the CQL that this guide publishes, as the IG Publisher translated it, so the guideline is written once.
- **Open throughout.** Every part is an open standard, open source software or a free public service (see [every part](#parts)).

Click a box to open that part.

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

### Every part {#parts}

<table class="grid">
<thead>
<tr><th>Part</th><th>Used for</th><th>Open as</th></tr>
</thead>
<tbody>
<tr><td><a href="https://mellanarkiv-offentlig.vgregion.se/alfresco/s/archive/stream/public/v1/source/available/sofia/su1226-506079272-668/surrogate/WEST%20A%202025%20%C3%96stra.pdf">WEST-A triage manual</a>, VGR version 2025:02:01</td><td>What the guide models</td><td>A public document in VGR's document archive. WEST-A and its content belong to VGR.</td></tr>
<tr><td>NEWS2, Royal College of Physicians</td><td>The early warning score in the CQL</td><td>A published score chart</td></tr>
<tr><td>SNOMED CT Swedish edition, LOINC, UCUM</td><td>Codes and units</td><td>SNOMED CT is free to use in Sweden, a SNOMED International member. LOINC and UCUM are free. The guide's terminology server is <a href="https://tx-nordics.fhir.org">tx-nordics.fhir.org</a>.</td></tr>
<tr><td>FHIR R4, CQL, <a href="https://hl7.org/fhir/uv/cpg/">CPG on FHIR</a> 2.0.0, <a href="https://hl7.org/fhir/uv/sdc/">SDC</a> 4.0.0, CRMI 2.0.0, <a href="https://hl7.eu/fhir/hdr/">HL7 Europe HDR</a> 1.0.0</td><td>The model, the guideline, the form, the discharge report</td><td>HL7 standards, free to use</td></tr>
<tr><td><a href="http://hl7.se/fhir/ig/base/">HL7 Sweden SE Base</a> 1.1.0, <a href="https://fhir.vgregion.se/ig/base/">VGR Base</a> 1.0.0</td><td>The base profiles and identifier systems</td><td>Published FHIR packages</td></tr>
<tr><td>SUSHI, the HL7 IG Publisher, the FHIR validator</td><td>Build, CQL to ELM translation, QA, this website</td><td>Open source</td></tr>
<tr><td><a href="https://build.fhir.org/ig/vadi2/west-a-triage-ig/">build.fhir.org</a>, GitHub Pages</td><td>Hosting the guide and the demo</td><td>Free public hosting</td></tr>
<tr><td><a href="https://github.com/aehrc/smart-forms">Smart Forms renderer and SDC template extraction</a>, CSIRO AEHRC</td><td>Showing the form, extracting the Observations</td><td>Open source, Apache 2.0</td></tr>
<tr><td><a href="https://github.com/cqframework/cql-execution">cql-execution</a> and <a href="https://github.com/cqframework/cql-exec-fhir">cql-exec-fhir</a>, CQF</td><td>Running the guide's CQL in the browser</td><td>Open source, Apache 2.0</td></tr>
<tr><td><a href="https://hapifhir.io">HAPI FHIR</a> and its <a href="https://hapi.fhir.org">public sandbox</a></td><td>Storing the demo's data; CQL on the server in the end-to-end test</td><td>Open source, Apache 2.0, and a free public server</td></tr>
<tr><td>Clinical views generator, from the UZ Core guide</td><td>The <a href="clinical-views.html">clinical views</a> of each profile</td><td>Reused, and run in every build</td></tr>
<tr><td>This guide and the demo, <a href="https://github.com/vadi2/west-a-triage-ig">vadi2/west-a-triage-ig</a></td><td>The model, the CQL, the app</td><td>The guide is CC0 1.0. All of the source is public on GitHub.</td></tr>
</tbody>
</table>

### What is the guide's own

- the profiles, code systems and value sets, in FHIR Shorthand;
- the triage Questionnaire, with its extraction templates;
- the CQL and the PlanDefinitions and ActivityDefinitions that run it, tested against the NEWS2 chart;
- the demo app, a React page that connects the parts above.
