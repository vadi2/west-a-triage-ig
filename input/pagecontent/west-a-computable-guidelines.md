### Overview

This page describes the parts of WEST-A that a computer can calculate, written as a computable guideline in the format of the HL7 [Clinical Practice Guidelines](https://hl7.org/fhir/uv/cpg/) implementation guide (CPG on FHIR): NEWS2 from the vital signs, and a proposed triage priority, both also provisionally while the information is coming in. The logic is written in [CQL](https://cql.hl7.org) and tested automatically in every build (see [QA](#qa)). The source is the [WEST-A triage manual](https://mellanarkiv-offentlig.vgregion.se/alfresco/s/archive/stream/public/v1/source/available/sofia/su1226-506079272-668/surrogate/WEST%20A%202025%20%C3%96stra.pdf) for adults, VGR version 2025:02:01; page numbers refer to that PDF.

The guideline proposes; the triage nurse decides. WEST-A gives the clinical assessment the same weight as the warning symptoms and the vital parameters (p. 8), and the warning symptoms of the chief complaint need a nurse to assess them, so the logic takes the warning symptoms found as input and does not replace the triage.

<table class="grid">
<thead>
<tr><th>Artifact</th><th>What it does</th></tr>
</thead>
<tbody>
<tr><td><a href="PlanDefinition-west-a-triage.html">WEST-A Triage</a> (PlanDefinition)</td><td>The protocol: calculate NEWS2, then propose a triage priority</td></tr>
<tr><td><a href="PlanDefinition-west-a-news2-calculation.html">WEST-A NEWS2 Calculation</a> (PlanDefinition)</td><td>When any vital sign is recorded and all seven NEWS2 parameters are measured, propose to record NEWS2</td></tr>
<tr><td><a href="ActivityDefinition-west-a-record-news2.html">WEST-A Record NEWS2</a> (ActivityDefinition)</td><td>A task to record a <a href="StructureDefinition-west-a-news2-observation.html">WEST-A NEWS2 Observation</a>, described with the total and the clinical risk</td></tr>
<tr><td><a href="ActivityDefinition-west-a-record-triage-priority.html">WEST-A Record Triage Priority</a> (ActivityDefinition)</td><td>A task to record a <a href="StructureDefinition-west-a-triage-observation.html">WEST-A Triage Observation</a>, described with the proposed priority</td></tr>
<tr><td><a href="Library-WestANEWS2.html">WEST-A NEWS2 Logic</a> (Library, CQL)</td><td>The NEWS2 chart: parameter scores, total and clinical risk, also provisional</td></tr>
<tr><td><a href="Library-WestATriage.html">WEST-A Triage Logic</a> (Library, CQL)</td><td>The priority from the vital parameters, and the proposed priority, also provisional</td></tr>
<tr><td><a href="Library-FHIRHelpers.html">FHIRHelpers</a> (Library, CQL)</td><td>The standard library that converts FHIR R4 types to CQL types</td></tr>
<tr><td><a href="Questionnaire-west-a-triage-questionnaire.html">WEST-A Triage Questionnaire</a> (Questionnaire)</td><td>The triage form: the vital signs, extracted as Observations, and the assessment that the guideline takes as input (see <a href="#questionnaire">triage form</a>)</td></tr>
</tbody>
</table>

Each Library page shows its CQL source.

The [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) profile is also a CPG case feature: its `cpg-inferenceExpression` extension names the CQL expression that calculates its value.

The Library ids are the CQL library names (`WestANEWS2`, not `west-a-news2`), unlike the other ids in this guide, because CQL tools find an included library at `[canonical]/Library/[CQL library name]`.

### How it runs

```
vital sign recorded ─► WEST-A NEWS2 Calculation ─► task: record NEWS2 ─► NEWS2 Observation recorded
                                                                                   │
                       WEST-A Triage ◄─────────────────────────────────────────────┘
                             └─► Röd / Orange / Gul / Grön ─► task: record the triage priority
```

A CDS service applies a PlanDefinition with the `$apply` operation for a patient and an encounter. Each action has triggers (the data that start it: here any one vital sign, or the NEWS2 Observation), a condition (a CQL expression that must be true), and a definition (what to propose). The result is a CarePlan that contains a RequestGroup with a [record-inference task](https://hl7.org/fhir/uv/cpg/StructureDefinition-cpg-recordinferencetask.html), whose description the CQL fills in, for example "NEWS2 5, clinical risk medium". The CDS service records the Observation itself from the CQL results (see [limitations](#limitations)).

### NEWS2

[WEST-A NEWS2 Logic](Library-WestANEWS2.html) takes the latest observation of each vital parameter with status `final`, `amended` or `corrected`, by the codes the [vital signs profiles](west-a-triage-mapping.html#vital-signs) require, and scores it on the NEWS2 chart (p. 6), which is the Royal College of Physicians chart. The observation is the one with the latest `effectiveDateTime`, `effectiveInstant` or end of `effectivePeriod`. A value in another unit than the profile's (°C, /min, %, mm[Hg], L/min) counts as not measured. A value between the chart's steps is rounded, half up, to a whole number, or to a tenth of a degree for temperature: pulse 40.3 scores as 40.


<table class="grid">
<thead>
<tr><th>Parameter</th><th>3</th><th>2</th><th>1</th><th>0</th><th>1</th><th>2</th><th>3</th></tr>
</thead>
<tbody>
<tr><td>Respiration rate (/min)</td><td>≤8</td><td></td><td>9-11</td><td>12-20</td><td></td><td>21-24</td><td>≥25</td></tr>
<tr><td>Oxygen saturation, scale 1 (%)</td><td>≤91</td><td>92-93</td><td>94-95</td><td>≥96</td><td></td><td></td><td></td></tr>
<tr><td>Oxygen saturation, scale 2 (%)</td><td>≤83</td><td>84-85</td><td>86-87</td><td>88-92, ≥93 on air</td><td>93-94 on oxygen</td><td>95-96 on oxygen</td><td>≥97 on oxygen</td></tr>
<tr><td>Air or oxygen</td><td></td><td>Oxygen</td><td></td><td>Air</td><td></td><td></td><td></td></tr>
<tr><td>Systolic blood pressure (mmHg)</td><td>≤90</td><td>91-100</td><td>101-110</td><td>111-219</td><td></td><td></td><td>≥220</td></tr>
<tr><td>Pulse (/min)</td><td>≤40</td><td></td><td>41-50</td><td>51-90</td><td>91-110</td><td>111-130</td><td>≥131</td></tr>
<tr><td>Consciousness</td><td></td><td></td><td></td><td>Alert</td><td></td><td></td><td>C, V, P or U</td></tr>
<tr><td>Temperature (°C)</td><td>≤35.0</td><td></td><td>35.1-36.0</td><td>36.1-38.0</td><td>38.1-39.0</td><td>≥39.1</td><td></td></tr>
</tbody>
</table>

The total is calculated only when all seven parameters are measured. Scale 2 is for a patient with known respiratory failure, on a physician's order; the CQL parameter `Use Oxygen Saturation Scale 2` selects it. Both libraries declare it, because CQL cannot pass a parameter to an included library: WEST-A Triage Logic passes its own to the `Clinical Risk For` function of WEST-A NEWS2 Logic.

#### Provisional NEWS2 {#provisional-news2}

While the vital signs are coming in, WEST-A NEWS2 Logic also scores the parameters measured so far:

<table class="grid">
<thead>
<tr><th>CQL definition</th><th>Value</th></tr>
</thead>
<tbody>
<tr><td><code>Provisional NEWS2 Total Score</code></td><td>The sum of the parameter scores so far; null when no parameter is scored</td></tr>
<tr><td><code>Provisional NEWS2 Clinical Risk</code></td><td>The clinical risk band of that sum, a single parameter scoring 3 included</td></tr>
<tr><td><code>NEWS2 Missing Parameters</code></td><td>The parameters not yet scored, in the order of the chart, named by their component slices in the <a href="StructureDefinition-west-a-news2-observation.html">WEST-A NEWS2 Observation</a> profile: <code>respirationRate</code>, <code>oxygenSaturationScale1</code> (or <code>oxygenSaturationScale2</code> on scale 2), <code>airOrOxygen</code>, <code>systolicBloodPressure</code>, <code>pulse</code>, <code>consciousness</code>, <code>temperature</code>; empty when NEWS2 is complete</td></tr>
</tbody>
</table>

A parameter not yet measured can only add points, so the provisional total and risk are a **lower bound**: the patient's NEWS2 is at least that, and they can only rise as the missing parameters come in. A provisional total of 5 is already medium risk, orange, whatever is still missing; a provisional total of 2 says nothing about what the complete NEWS2 will be. With all seven parameters, they are the NEWS2 total and clinical risk. A parameter counts as missing when it cannot be scored: not measured, measured in another unit, or, on scale 2, an oxygen saturation of 93% or more before it is known whether the patient is on oxygen. A new measurement of a parameter that is already scored replaces it, and can change the score either way. The functions `Provisional Total Score For`, `Provisional Clinical Risk For` and `Missing Parameters For` take the oxygen saturation scale, as `Clinical Risk For` does.

`NEWS2 Total Score` and `NEWS2 Clinical Risk` keep their meaning: they are null until all seven parameters are measured. A provisional NEWS2 can be recorded as a [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) with status `preliminary`, which has only the scores of the parameters measured, and whose total is their sum.

### Triage priority

[WEST-A Triage Logic](Library-WestATriage.html) gives each NEWS2 clinical risk band the colour of page 6:

<table class="grid">
<thead>
<tr><th>NEWS2</th><th>Clinical risk</th><th>Priority from the vital parameters</th></tr>
</thead>
<tbody>
<tr><td>7 or more</td><td>High</td><td>Röd (red)</td></tr>
<tr><td>5-6</td><td>Medium</td><td>Orange</td></tr>
<tr><td>A single parameter scoring 3</td><td>Low-medium</td><td>Gul (yellow)</td></tr>
<tr><td>0-4</td><td>Low</td><td>Grön (green)</td></tr>
</tbody>
</table>

The nurse assesses the warning symptoms of the chief complaint and passes those found in the CQL parameter `Triage Criteria`: a list of codes from [WEST-A triage criterion](CodeSystem-west-a-triage-criterion-cs.html), the same codes as the `criterion` components of the [WEST-A Triage Observation](StructureDefinition-west-a-triage-observation.html). Each warning symptom has its colour in its `priority` property, and *Inga varningssymtom* (`163`) says that none was found. A group code, which cannot be recorded, has no colour.

A priority is proposed only when NEWS2 is calculated and the nurse has assessed the warning symptoms, since until then the logic cannot know that nothing more urgent applies. The warning symptoms are assessed when `Triage Criteria` holds a warning symptom or `163`, or when `Complaint Priority` is given. The proposed priority is the most urgent of:

- the priority from the vital parameters;
- the most urgent colour of the warning symptoms in `Triage Criteria` (green, `4`, for `163`);
- `Complaint Priority`, a code from [WEST-A triage priority](CodeSystem-west-a-triage-priority-cs.html), for a system that records the colour of the warning symptoms without coding them: `4` when the patient has none. It cannot lower the colour of a coded warning symptom;
- yellow, for frail elderly, likely admission, or violence or sexual assault (pp. 46-48): one of the needs `159`-`162` in `Triage Criteria`, or the CQL parameter `Yellow As Lowest Priority` for a system that does not code the needs. A need alone does not mean that the warning symptoms are assessed.

The CQL lists the warning symptoms of each colour, since a terminology server cannot be assumed to filter a code system by its properties; the tests check the lists against the code system.

The nurse then records the priority in a [WEST-A Triage Observation](StructureDefinition-west-a-triage-observation.html). The clinical assessment can raise it, but a red or orange patient is never given a lower priority (p. 8).

#### Provisional priority {#provisional-priority}

While the triage is under way, `Provisional Proposed Priority` is the most urgent of what is known so far: the colour of the [provisional NEWS2](#provisional-news2) clinical risk (`Provisional Vital Parameter Priority`), the warning symptoms found and `Complaint Priority`, and yellow for the needs. It is null only when nothing is known. Each of these can only become more urgent as the vital signs and the warning symptoms come in, so it is a lower bound too: it is never more urgent than the proposed priority that follows, and it is the proposed priority once one is proposed. A provisional green means only that nothing more urgent is known yet, not that the patient is green. A provisional red or orange, on the other hand, already holds: a red or orange patient is never given a lower priority.

The PlanDefinitions stay with the complete NEWS2: they propose to record NEWS2 and a priority only when all seven parameters are measured and the warning symptoms are assessed. A client that shows the provisional results evaluates the libraries with `$evaluate`.

### Triage form {#questionnaire}

The [WEST-A Triage Questionnaire](Questionnaire-west-a-triage-questionnaire.html) is the form the triage nurse fills in. It conforms to the [SDC template-based extraction Questionnaire](https://hl7.org/fhir/uv/sdc/STU4/StructureDefinition-sdc-questionnaire-extr-template.html) profile of Structured Data Capture (SDC) 4.0.0, and has two groups:

- **Vital parameters** (`vitals`): respiratory rate, oxygen saturation, supplemental oxygen (0 L/min for room air), systolic and diastolic blood pressure, heart rate or pulse, ACVPU and body temperature, each with its UCUM unit, a plausible range, and help text with its NEWS2 scores. None is required, so that a patient can be triaged before all are measured; the diastolic pressure is asked once the systolic one is answered, and is then required.
- **Triage assessment** (`assessment`): the chief complaint (required), the triage criteria, an optional manual priority of the warning symptoms, and scale 2 for the oxygen saturation. The needs that give yellow as the lowest priority (pp. 46-48) are among the triage criteria, so that the triage Observation records them.

The triage criteria (`triage-criteria`) appear once the chief complaint is chosen. Each complaint with warning symptoms has its own item, `triage-criteria-` and the complaint code, enabled only when that complaint is chosen, which offers only the warning symptoms whose `complaint` property is that complaint, as check boxes. Gynaecology (`11`) and trauma (`30`) have a group instead, with an item per heading of the manual (such as `triage-criteria-30-aag`, *Traumalarm nivå 1*): the headings are the group codes of the code system, which cannot be answers. Complaints `2`, `14`, `18`, `19` and `25` have no warning symptoms of their own. Whatever the complaint, the form offers *Inga varningssymtom* (`triage-criteria-none`, `163`) and the needs and processes `159`-`162` (`triage-criteria-needs`). Every option is a code of the [WEST-A triage criterion value set](ValueSet-west-a-triage-criterion-vs.html), listed in the items themselves, since a value set cannot pick the criteria of one complaint; the items are generated from the code system by `input/fsh/questionnaire/generate-triage-criteria.mjs`.

The answers become the CQL parameters of the guideline: all the answers of the items whose linkId starts with `triage-criteria` are `Triage Criteria`, `complaint-priority` is `Complaint Priority`, and `oxygen-scale-2` is `Use Oxygen Saturation Scale 2`. The form leaves `Yellow As Lowest Priority` out: the needs are triage criteria. The manual priority is only for a warning symptom the criteria do not cover: the guideline takes the more urgent of it and the criteria.

The vital signs become Observations by [template-based extraction](https://hl7.org/fhir/uv/sdc/STU4/extraction.html#template-based-extraction). The Questionnaire contains one Observation template per vital sign profile: the codes, category, units and status of the profile, without the measurement. Each vital sign item points at its template with the `templateExtract` extension, and FHIRPath expressions in `templateExtractValue` extensions fill in the template from the QuestionnaireResponse:

<table class="grid">
<thead>
<tr><th>Observation</th><th>FHIRPath</th><th>From</th></tr>
</thead>
<tbody>
<tr><td><code>valueQuantity.value</code>, <code>valueCodeableConcept.coding.code</code></td><td><code>answer.value</code>, <code>answer.value.code</code></td><td>The answer of the item that points at the template</td></tr>
<tr><td><code>subject</code></td><td><code>%resource.subject</code></td><td>The patient</td></tr>
<tr><td><code>encounter</code></td><td><code>%resource.encounter</code></td><td>The emergency department visit</td></tr>
<tr><td><code>performer</code></td><td><code>%resource.author</code></td><td>The triage nurse</td></tr>
<tr><td><code>effectiveDateTime</code></td><td><code>%resource.authored</code></td><td>The time the form was filled in</td></tr>
<tr><td><code>meta.profile</code></td><td>A string, the profile's canonical URL</td><td>The template. It is a FHIRPath string so that the template, which has no measurement, is not itself validated against the profile.</td></tr>
</tbody>
</table>

Two placeholders keep the templates valid, and the extraction replaces both. The templates have a placeholder time, because the validator checks every Observation with a vital signs code against the FHIR core vital signs profile, and its constraint vs-1 fails on a time without a value. The ACVPU template has a placeholder code, because a coded value needs a code. The ACVPU value takes only the code of the answer, not its display, which is in the language of the form.

The blood pressure is one Observation with a systolic and a diastolic component. The systolic item points at its template, and the diastolic value comes from `%resource.repeat(item).where(linkId = 'diastolic').answer.value`.

An unanswered vital sign gives no Observation. The [example triage form](QuestionnaireResponse-example-triage-questionnaire-response.html) (NEWS2 5, chest pain with warning symptom `15`) gives the same seven Observations as the [example vital signs](Observation-example-respiratory-rate.html).

The demo app (`demo/lib/extract.js`) runs the extraction in the browser with [`@aehrc/sdc-template-extract`](https://www.npmjs.com/package/@aehrc/sdc-template-extract), the library of the CSIRO Smart Forms renderer. It drops the unanswered items first, refuses a response without `subject` or `authored`, and returns a transaction Bundle with the Observations. Every build extracts the Observations from the example form and validates each one against its WEST-A profile.

### QA {#qa}

Every build checks the guideline in four ways, and the [triage form](#questionnaire) in a fifth:

1. **Translation.** The IG Publisher translates the CQL into ELM and reports any CQL error as a QA error, which fails the build.
2. **Conformance.** The PlanDefinitions and ActivityDefinitions are validated against the CPG profiles: [computable PlanDefinition](https://hl7.org/fhir/uv/cpg/StructureDefinition-cpg-computableplandefinition.html) and [record-inference activity](https://hl7.org/fhir/uv/cpg/StructureDefinition-cpg-recordinferenceactivity.html).
3. **Execution.** A test runner (`.github/tests/cql`) runs the ELM from the build with the [CQL execution engine](https://github.com/cqframework/cql-execution), and fails the build on any wrong result:
   - every edge of every band of the NEWS2 chart, generated from `news2-chart.json`, which transcribes the chart on page 6 independently of the CQL;
   - every concept of the [triage criterion code system](CodeSystem-west-a-triage-criterion-cs.html), generated from the code system the build produces: each warning symptom alone must give the colour of its `priority` property, each need yellow as the lowest priority, `163` green, and each group nothing;
   - the provisional NEWS2 of several sets of vital signs, measured one parameter at a time in two orders: at each step the provisional total, risk, missing parameters and priority must be those of the chart for what is measured so far, never more than those of the complete set, and the same as the final ones once all is measured;
   - scenarios in `cases.json`: the risk bands and their colours, an incomplete NEWS2, provisional results from one to six parameters, the warning symptoms and the needs that set the priority, several warning symptoms, a warning symptom together with `Complaint Priority`, no proposal before the warning symptoms are assessed, scale 2 through both libraries, rounding between the chart's steps, units, and which observation counts;
   - this guide's examples: the [example vital signs](Observation-example-respiratory-rate.html) must give the [example NEWS2](Observation-example-news2.html), score by score, those measured first the [example provisional NEWS2](Observation-example-news2-preliminary.html), and the triage criteria and NEWS2 of the [example triage](Observation-example-triage-chest-pain.html) must give its priority.
4. **Invariants.** The NEWS2 profile itself checks that the total is the sum of the parameter scores (`westa-obs-2`, also for a preliminary NEWS2), and that a final NEWS2 with parameter scores has all seven (`westa-obs-3`); the CI checks that instances breaking them are rejected. It also checks that a triage criterion group cannot be recorded as a criterion.
5. **Extraction.** The CI extracts the vital signs from the [example triage form](QuestionnaireResponse-example-triage-questionnaire-response.html) with `demo/lib/extract.js`, checks their codes, values and references (`demo/lib/extract.test.mjs`), and validates each extracted Observation against its WEST-A profile.

To add a test, add a case to `cases.json`, giving the vital signs that differ from normal and the expected value of any CQL definition.

### Limitations {#limitations}

- The logic uses the latest observation of each parameter for the patient, not only those of the current visit. A CDS service that runs it should pass only the data of the emergency department visit.
- The proposed tasks carry the result in their description only. The [record-inference task](https://hl7.org/fhir/uv/cpg/StructureDefinition-cpg-recordinferencetask.html) profile also asks for the inferred Observation in `Task.input`, which the CDS service has to add: building the Observation in CQL is left for a later version.
- ONEWS2 for pregnant patients (p. 20) is not calculated: SNOMED CT has no ONEWS2 codes.
- The provisional results are a lower bound as the missing parameters and warning symptoms come in. A new measurement that replaces an older one, or a changed `Complaint Priority`, can lower them.
- The logic takes the triage criteria as a parameter rather than reading them from a recorded Triage Observation, which records the outcome of the triage the logic proposes.
- The logic does not check that a warning symptom belongs to the chief complaint, nor the time window of the green gynecology criteria ("GRÖN 07-16", see [open questions](west-a-triage-mapping.html#open-questions)).
