### Overview

This page describes the parts of WEST-A that a computer can calculate, written as a computable guideline in the format of the HL7 [Clinical Practice Guidelines](https://hl7.org/fhir/uv/cpg/) implementation guide (CPG on FHIR): NEWS2 from the vital signs, and a proposed triage priority. The logic is written in [CQL](https://cql.hl7.org) and tested automatically in every build (see [QA](#qa)). The source is the WEST-A triage manual for adults, VGR version 2025:02:01; page numbers refer to the WEST-A PDF.

The guideline proposes; the triage nurse decides. WEST-A gives the clinical assessment the same weight as the warning symptoms and the vital parameters (p. 8), and the warning symptoms of the chief complaint need a nurse to assess them, so the logic takes them as input and does not replace the triage.

<table class="grid">
<thead>
<tr><th>Artifact</th><th>What it does</th></tr>
</thead>
<tbody>
<tr><td><a href="PlanDefinition-west-a-triage.html">WEST-A Triage</a> (PlanDefinition)</td><td>The protocol: calculate NEWS2, then propose a triage priority</td></tr>
<tr><td><a href="PlanDefinition-west-a-news2-calculation.html">WEST-A NEWS2 Calculation</a> (PlanDefinition)</td><td>When any vital sign is recorded and all seven NEWS2 parameters are measured, propose to record NEWS2</td></tr>
<tr><td><a href="ActivityDefinition-west-a-record-news2.html">WEST-A Record NEWS2</a> (ActivityDefinition)</td><td>A task to record a <a href="StructureDefinition-west-a-news2-observation.html">WEST-A NEWS2 Observation</a>, described with the total and the clinical risk</td></tr>
<tr><td><a href="ActivityDefinition-west-a-record-triage-priority.html">WEST-A Record Triage Priority</a> (ActivityDefinition)</td><td>A task to record a <a href="StructureDefinition-west-a-triage-observation.html">WEST-A Triage Observation</a>, described with the proposed priority</td></tr>
<tr><td><a href="Library-WestANEWS2.html">WEST-A NEWS2 Logic</a> (Library, <a href="Library-WestANEWS2.cql">CQL</a>)</td><td>The NEWS2 chart: parameter scores, total and clinical risk</td></tr>
<tr><td><a href="Library-WestATriage.html">WEST-A Triage Logic</a> (Library, <a href="Library-WestATriage.cql">CQL</a>)</td><td>The priority from the vital parameters, and the proposed priority</td></tr>
<tr><td><a href="Library-FHIRHelpers.html">FHIRHelpers</a> (Library, <a href="Library-FHIRHelpers.cql">CQL</a>)</td><td>The standard library that converts FHIR R4 types to CQL types</td></tr>
</tbody>
</table>

Each Library page shows its CQL source, and the CQL links above give it as a text file.

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

A priority is proposed only when NEWS2 is calculated and the nurse has assessed the warning symptoms of the chief complaint, since until then the logic cannot know that nothing more urgent applies. The proposed priority is the most urgent of:

- the priority from the vital parameters;
- the priority of the warning symptoms of the chief complaint algorithm, which the nurse assesses (CQL parameter `Complaint Priority`, a code from [WEST-A triage priority](CodeSystem-west-a-triage-priority-cs.html), `4` when the patient has none of the warning symptoms);
- yellow, for frail elderly, likely admission, or violence or sexual assault (pp. 46-48; CQL parameter `Yellow As Lowest Priority`).

The nurse then records the priority in a [WEST-A Triage Observation](StructureDefinition-west-a-triage-observation.html). The clinical assessment can raise it, but a red or orange patient is never given a lower priority (p. 8).

### QA {#qa}

Every build checks the guideline in four ways:

1. **Translation.** The IG Publisher translates the CQL into ELM and reports any CQL error as a QA error, which fails the build.
2. **Conformance.** The PlanDefinitions and ActivityDefinitions are validated against the CPG profiles: [computable PlanDefinition](https://hl7.org/fhir/uv/cpg/StructureDefinition-cpg-computableplandefinition.html) and [record-inference activity](https://hl7.org/fhir/uv/cpg/StructureDefinition-cpg-recordinferenceactivity.html).
3. **Execution.** A test runner (`.github/tests/cql`) runs the ELM from the build with the [CQL execution engine](https://github.com/cqframework/cql-execution), and fails the build on any wrong result:
   - every edge of every band of the NEWS2 chart, generated from `news2-chart.json`, which transcribes the chart on page 6 independently of the CQL;
   - scenarios in `cases.json`: the risk bands and their colours, an incomplete NEWS2, the warning symptoms and the needs that set the priority, no proposal before the warning symptoms are assessed, scale 2 through both libraries, rounding between the chart's steps, units, and which observation counts;
   - this guide's examples: the [example vital signs](Observation-example-respiratory-rate.html) must give the [example NEWS2](Observation-example-news2.html), score by score, and the [example triage](Observation-example-triage-chest-pain.html) must be at least as urgent as its vital parameters.
4. **Invariants.** The NEWS2 profile itself checks that the total is the sum of the parameter scores (`westa-obs-2`), and the CI checks that an instance breaking it is rejected.

To add a test, add a case to `cases.json`, giving the vital signs that differ from normal and the expected value of any CQL definition.

### Limitations {#limitations}

- The logic uses the latest observation of each parameter for the patient, not only those of the current visit. A CDS service that runs it should pass only the data of the emergency department visit.
- The proposed tasks carry the result in their description only. The [record-inference task](https://hl7.org/fhir/uv/cpg/StructureDefinition-cpg-recordinferencetask.html) profile also asks for the inferred Observation in `Task.input`, which the CDS service has to add: building the Observation in CQL is left for a later version.
- ONEWS2 for pregnant patients (p. 20) is not calculated: SNOMED CT has no ONEWS2 codes.
- The warning symptoms of the complaint algorithms are not coded (see [open questions](west-a-triage-mapping.html#open-questions)), so the logic cannot find them in the record and takes their priority as a parameter.
