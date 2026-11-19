<style>
  table.mapping td:nth-child(1) { width: 24%; }
  table.mapping td:nth-child(2) { width: 24%; }
  table.mapping td:nth-child(3) { width: 10%; }
</style>

### Overview

This page maps a WEST-A triage to FHIR R4: the vital parameters measured at triage, the NEWS2 score calculated from them, and the result of the triage, which is the priority (colour) and the chief complaint. The source is the WEST-A triage manual for adults, VGR version 2025:02:01. Page numbers refer to the WEST-A PDF.

A triage is recorded in three layers, each referencing the one below it in `derivedFrom`:

1. **Measured:** seven vital sign observations, one per NEWS2 parameter (see [vital signs](#vital-signs)). Five derive from the FHIR core vital signs profiles.
2. **Calculated:** one [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html), with the total and the parameter scores.
3. **Assessed:** one [WEST-A Triage Observation](StructureDefinition-west-a-triage-observation.html), whose value is the priority and whose `chiefComplaint` component is the complaint algorithm used.

Keeping the measurements apart from the scores means that a system that already records vital signs reuses them as they are, and that a receiver can recalculate NEWS2 from the measurements. FHIR R4 has no element for "triggered by", and `derivedFrom` is the element FHIR defines for a value calculated from other observations.

All of them refer to the [WEST-A Patient](StructureDefinition-west-a-patient.html) and the emergency department Encounter. Examples: [triage of chest pain](Observation-example-triage-chest-pain.html) and [NEWS2 of 5](Observation-example-news2.html).

### How WEST-A sets the priority

The triage nurse chooses the chief complaint (*sökorsak*) and checks its warning symptoms (*varningssymtom*, red, orange or yellow) together with the vital parameters (NEWS2, whose clinical risk gives a [colour](#news2)). The clinical assessment (*klinisk bedömning*) has the same weight as these, but a red or orange patient is never given a lower priority because of it (p. 8). Some needs and processes give yellow as the lowest priority: frail elderly (p. 46), likely admission (p. 47), and violence or sexual assault (p. 48).

FHIR records the outcome, and the [computable guidelines](west-a-computable-guidelines.html) calculate the parts of the rules that can be calculated: the priority in `Observation.value`, the complaint in `component[chiefComplaint]`, and the NEWS2 in `derivedFrom`. The warning symptom that decided the priority is not coded yet (see [open questions](#open-questions)).

### Triage priority

`Observation.code` is SNOMED CT `425705009` *triagering* (Determination of acuity level). SNOMED CT has no observable entity for a triage priority, so the code is this procedure, which the Swedish edition names "triagering". The value comes from [WEST-A triage priority](CodeSystem-west-a-triage-priority-cs.html).

<table class="grid mapping">
<thead>
<tr><th>WEST-A (sv)</th><th>English</th><th>Code</th><th>Source</th></tr>
</thead>
<tbody>
<tr><td>Röd</td><td>Red</td><td><code>1</code></td><td>pp. 3-5</td></tr>
<tr><td>Orange</td><td>Orange</td><td><code>2</code></td><td>pp. 3-5</td></tr>
<tr><td>Gul</td><td>Yellow</td><td><code>3</code></td><td>pp. 3-5, 46-48</td></tr>
<tr><td>Grön</td><td>Green</td><td><code>4</code></td><td>pp. 22-23</td></tr>
</tbody>
</table>

The Swedish edition of SNOMED CT has triage grades for RETTS, a different triage system, but none for WEST, so the colours are local codes.

### Chief complaint

`component[chiefComplaint].code` is SNOMED CT `1269489004` "Chief complaint". The value comes from [WEST-A chief complaint](CodeSystem-west-a-chief-complaint-cs.html): one code per WEST-A complaint algorithm.

<table class="grid mapping">
<thead>
<tr><th>WEST-A (sv)</th><th>English</th><th>Code</th><th>Source</th></tr>
</thead>
<tbody>
<tr><td>Allergi</td><td>Allergy</td><td><code>1</code></td><td>p. 10</td></tr>
<tr><td>Blodtryck</td><td>Blood pressure</td><td><code>2</code></td><td>p. 11</td></tr>
<tr><td>Blödning/anemi</td><td>Bleeding/anemia</td><td><code>3</code></td><td>p. 12</td></tr>
<tr><td>Bröstsmärta</td><td>Chest pain</td><td><code>4</code></td><td>p. 13</td></tr>
<tr><td>Buksmärta</td><td>Abdominal pain</td><td><code>5</code></td><td>p. 14</td></tr>
<tr><td>Diabetes</td><td>Diabetes</td><td><code>6</code></td><td>p. 15</td></tr>
<tr><td>Diarré/kräkningar</td><td>Diarrhea/vomiting</td><td><code>7</code></td><td>p. 16</td></tr>
<tr><td>Dyspné</td><td>Dyspnea</td><td><code>8</code></td><td>p. 17</td></tr>
<tr><td>Extremitetsproblem</td><td>Limb problem</td><td><code>9</code></td><td>p. 18</td></tr>
<tr><td>Graviditet fr.o.m. 18+0/post partum</td><td>Pregnancy from week 18+0/postpartum</td><td><code>10</code></td><td>p. 19</td></tr>
<tr><td>Gynekologiska sökorsaker</td><td>Gynecological complaints</td><td><code>11</code></td><td>pp. 21-22</td></tr>
<tr><td>Hjärtrytm</td><td>Heart rhythm</td><td><code>12</code></td><td>p. 23</td></tr>
<tr><td>Hjärtstopp/luftvägshinder</td><td>Cardiac arrest/airway obstruction</td><td><code>13</code></td><td>p. 24</td></tr>
<tr><td>Hud</td><td>Skin</td><td><code>14</code></td><td>p. 25</td></tr>
<tr><td>Huvudvärk</td><td>Headache</td><td><code>15</code></td><td>p. 26</td></tr>
<tr><td>Infektion/feber/sepsis</td><td>Infection/fever/sepsis</td><td><code>16</code></td><td>p. 27</td></tr>
<tr><td>Intox</td><td>Poisoning</td><td><code>17</code></td><td>p. 28</td></tr>
<tr><td>Komplikation operation/gips</td><td>Complication after surgery or cast</td><td><code>18</code></td><td>p. 29</td></tr>
<tr><td>Leversjukdom</td><td>Liver disease</td><td><code>19</code></td><td>p. 30</td></tr>
<tr><td>Ljumske</td><td>Groin</td><td><code>20</code></td><td>p. 31</td></tr>
<tr><td>Medvetandepåverkan</td><td>Altered consciousness</td><td><code>21</code></td><td>p. 32</td></tr>
<tr><td>Neuro/yrsel/kramper</td><td>Neurology/dizziness/seizures</td><td><code>22</code></td><td>p. 33</td></tr>
<tr><td>Ospecifik sjukdom</td><td>Non-specific illness</td><td><code>23</code></td><td>p. 35</td></tr>
<tr><td>Psykiska besvär</td><td>Mental health problems</td><td><code>24</code></td><td>pp. 36-37</td></tr>
<tr><td>Rektala besvär (page "Rect")</td><td>Rectal problems</td><td><code>25</code></td><td>p. 38</td></tr>
<tr><td>Ryggsmärta</td><td>Back pain</td><td><code>26</code></td><td>p. 39</td></tr>
<tr><td>Svimning</td><td>Fainting</td><td><code>27</code></td><td>p. 40</td></tr>
<tr><td>Underlivsbesvär män</td><td>Male genital problems</td><td><code>28</code></td><td>p. 41</td></tr>
<tr><td>Urinvägsbesvär</td><td>Urinary tract problems</td><td><code>29</code></td><td>p. 42</td></tr>
<tr><td>Trauma/skador</td><td>Trauma/injuries</td><td><code>30</code></td><td>pp. 43-44</td></tr>
<tr><td>Ögon och öron</td><td>Eyes and ears</td><td><code>31</code></td><td>p. 45</td></tr>
</tbody>
</table>

The complaints are WEST-A's algorithms, not clinical findings: "Bröstsmärta" means "triaged with the WEST-A chest pain page", which is not the same as the SNOMED CT finding *Chest pain*. That is why they are local codes. A sender can add the matching SNOMED CT finding as a second coding in the same `CodeableConcept`.

The trauma pages (43-44) and the gynecology pages (21-22) are one complaint each. NEWS2, ONEWS2 and mNIHSS (pp. 6, 20, 34) are scores, not complaints. The three "behov/process" pages (46-48) are needs, not complaints (see [open questions](#open-questions)).

### Vital signs {#vital-signs}

Each NEWS2 parameter is measured as its own Observation. The five that FHIR has core vital signs profiles for keep the LOINC code those profiles require and add the SNOMED CT code as a second coding. Consciousness and supplemental oxygen have no core profile and use SNOMED CT only.

<table class="grid">
<thead>
<tr><th>WEST-A (sv)</th><th>English</th><th>Profile</th><th>Code</th><th>Value</th></tr>
</thead>
<tbody>
<tr><td>Andningsfrekvens</td><td>Respiration rate</td><td><a href="StructureDefinition-west-a-respiratory-rate.html">WEST-A Respiratory Rate</a> (core <code>resprate</code>)</td><td>LOINC <code>9279-1</code>, SNOMED CT <code>86290005</code></td><td>/min</td></tr>
<tr><td>Syremättnad</td><td>Oxygen saturation</td><td><a href="StructureDefinition-west-a-oxygen-saturation.html">WEST-A Oxygen Saturation</a> (core <code>oxygensat</code>)</td><td>LOINC <code>2708-6</code>, SNOMED CT <code>431314004</code></td><td>%</td></tr>
<tr><td>Tillförd syrgas</td><td>Supplemental oxygen</td><td><a href="StructureDefinition-west-a-supplemental-oxygen.html">WEST-A Supplemental Oxygen</a></td><td>SNOMED CT <code>427081008</code></td><td>L/min, 0 for room air</td></tr>
<tr><td>Systoliskt blodtryck</td><td>Systolic blood pressure</td><td><a href="StructureDefinition-west-a-blood-pressure.html">WEST-A Blood Pressure</a> (core <code>bp</code>)</td><td>LOINC <code>85354-9</code>, SNOMED CT <code>75367002</code>; systolic component LOINC <code>8480-6</code>, SNOMED CT <code>271649006</code></td><td>mmHg</td></tr>
<tr><td>Pulsfrekvens (hjärtfrekvens when measured, p. 6)</td><td>Pulse (heart rate when measured)</td><td><a href="StructureDefinition-west-a-heart-rate.html">WEST-A Heart Rate</a> (core <code>heartrate</code>)</td><td>LOINC <code>8867-4</code>, SNOMED CT <code>364075005</code></td><td>/min</td></tr>
<tr><td>Medvetandegrad (ACVPU)</td><td>Consciousness (ACVPU)</td><td><a href="StructureDefinition-west-a-consciousness.html">WEST-A Consciousness</a></td><td>SNOMED CT <code>1104441000000107</code></td><td>coded: <a href="ValueSet-west-a-acvpu-vs.html">WEST-A ACVPU</a></td></tr>
<tr><td>Temperatur</td><td>Temperature</td><td><a href="StructureDefinition-west-a-body-temperature.html">WEST-A Body Temperature</a> (core <code>bodytemp</code>)</td><td>LOINC <code>8310-5</code>, SNOMED CT <code>386725007</code></td><td>°C</td></tr>
</tbody>
</table>

### NEWS2 {#news2}

`Observation.code` is SNOMED CT `1104051000000101` "Royal College of Physicians NEWS2 (National Early Warning Score 2) total score". The total is `valueInteger` (0-20). Each parameter score is a component with its own SNOMED CT code. The NEWS2 codes are in the Swedish edition of SNOMED CT, which this guide uses, and in the International edition from the August 2026 release.

<table class="grid mapping">
<thead>
<tr><th>WEST-A (sv)</th><th>English</th><th>Score</th><th>FHIR path</th></tr>
</thead>
<tbody>
<tr><td>Andningsfrekvens</td><td>Respiration rate</td><td>0-3</td><td><code>component[respirationRate]</code></td></tr>
<tr><td>Syremättnad 1</td><td>Oxygen saturation, scale 1</td><td>0-3</td><td><code>component[oxygenSaturationScale1]</code></td></tr>
<tr><td>Syremättnad 2 (känd resp-insuff, på läkarordination)</td><td>Oxygen saturation, scale 2 (known respiratory failure, on a physician's order)</td><td>0-3</td><td><code>component[oxygenSaturationScale2]</code></td></tr>
<tr><td>Tillförd syrgas</td><td>Supplemental oxygen</td><td>0 or 2</td><td><code>component[airOrOxygen]</code></td></tr>
<tr><td>Systoliskt blodtryck</td><td>Systolic blood pressure</td><td>0-3</td><td><code>component[systolicBloodPressure]</code></td></tr>
<tr><td>Pulsfrekvens</td><td>Pulse</td><td>0-3</td><td><code>component[pulse]</code></td></tr>
<tr><td>Medvetandegrad (ACVPU)</td><td>Consciousness (ACVPU)</td><td>0 or 3</td><td><code>component[consciousness]</code></td></tr>
<tr><td>Temperatur</td><td>Temperature</td><td>0-3</td><td><code>component[temperature]</code></td></tr>
<tr><td>Totalt</td><td>Total</td><td>0-20</td><td><code>valueInteger</code></td></tr>
</tbody>
</table>

Two rules are invariants: only one oxygen saturation scale is used (`westa-obs-1`), and when all seven parameter scores are present the total is their sum (`westa-obs-2`). The measured values (for example a respiration rate of 22/min) are the [vital sign observations](#vital-signs), which the NEWS2 Observation references in `derivedFrom`.

WEST-A groups the total into clinical risk, and gives each risk a priority colour (p. 6): 7 or more high (red), 5-6 medium (orange), a single parameter scoring 3 low-medium (yellow), 0-4 low (green). The risk follows from the scores, so it is not stored. The [computable guidelines](west-a-computable-guidelines.html) calculate it.

### Open questions {#open-questions}

1. **Blue and referral.** This edition of WEST-A is "utan hänvisningsstöd" (without referral support) and has four colours. Does the referral edition add a level, such as blue, or referral to primary care?
2. **Warning symptoms.** The warning symptom that set the priority (for example "Bröstsmärta, pågående med misstanke om AKS", orange, p. 13) is only free text in `note` for now. Coding them would need a code system for every warning symptom on pages 3-48.
3. **Needs and processes.** Frail elderly, likely admission, and violence or sexual assault (pp. 46-48) set yellow as the lowest priority. Should they be a coded component of the triage observation?
4. **ONEWS2.** Pregnant patients from week 18+0 up to 12 weeks postpartum use ONEWS2 instead of NEWS2 (p. 20). SNOMED CT has no ONEWS2 codes, so it would need local codes.
5. **Time-dependent routing.** On the gynecology pages, green complaints are marked "GRÖN 07-16" (p. 22), which reads as a time window for routing green patients. This is not modelled.

### Terminology checklist

The two local code systems were checked against the [terminology quality checklist](https://github.com/uzinfocom-org/digital-health-ig/blob/main/terminology-quality-checklist.en.md):

- Codes are sequence numbers with no meaning (1.2). Every concept has a Swedish display, an English designation and a definition that names its WEST-A page (2.2, 2.3, 2.6).
- Displays are unique within each code system (2.4). They follow the WEST-A page headings, with two changes for readability: "Rect" became "Rektala besvär", and "etc" was dropped from "Komplikation operation/gips".
- "Ospecifik sjukdom" sounds like "not elsewhere classified" (3.3), but in WEST-A it has fixed content: abnormal potassium with ECG changes, or known Addison's disease or adrenal insufficiency (p. 35). Its definition names that content, so it does not change when other complaints are added.
- The code systems are flat, so the hierarchy rules do not apply, and they have no formal definitions (1.3).
