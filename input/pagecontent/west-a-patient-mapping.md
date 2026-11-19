<style>
  table.mapping td:nth-child(1) { width: 18%; }
  table.mapping td:nth-child(2) { width: 18%; }
  table.mapping td:nth-child(3) { width: 14%; }
  table.mapping td:nth-child(4) { width: 30%; }
  table.mapping td:nth-child(5) { width: 20%; }
</style>

### Overview

This page maps the patient administrative data that WEST-A uses to FHIR R4. The source is the WEST-A triage manual for adults, VGR version 2025:02:01. WEST-A has no registration form of its own. The administrative data comes from two places:

- the SBAR handover (page 49), which asks for the patient's name, age and, if available, personnummer;
- the triage rules, which depend on the patient's age (pages 4, 43, 44 and 46) and sex (pages 3, 21-22 and 41).

All of it maps to one resource: [WEST-A Patient](StructureDefinition-west-a-patient.html), which derives from the [VGR Base Patient](https://fhir.vgregion.se/ig/base/StructureDefinition-VGRBasePatient.html) and through it from the HL7 Sweden [SE Base Patient](http://hl7.se/fhir/ig/base/StructureDefinition-SEBasePatient.html). Examples: [patient with a personnummer](Patient-example-patient-personnummer.html), [patient with a samordningsnummer](Patient-example-patient-samordningsnummer.html) and [unidentified patient with a VGR reserve number](Patient-example-patient-lrid.html).

Page numbers refer to the WEST-A PDF.

### Patient identity

<table class="grid mapping">
<thead>
<tr><th>WEST-A (sv)</th><th>English</th><th>Source</th><th>FHIR path</th><th>Example</th></tr>
</thead>
<tbody>
<tr>
  <td>patientens namn</td>
  <td>patient's name</td>
  <td>SBAR, p. 49</td>
  <td><code>Patient.name.family</code>, <code>Patient.name.given</code>, <code>Patient.name.text</code></td>
  <td>Ljungberg; Maria, Birgitta</td>
</tr>
<tr>
  <td>eventuellt personnummer</td>
  <td>personal identity number, if available</td>
  <td>SBAR, p. 49</td>
  <td><code>Patient.identifier[personnummer]</code><br/>system <code>http://electronichealth.se/identifier/personnummer</code></td>
  <td><code>196101182803</code></td>
</tr>
<tr>
  <td>(not in WEST-A)</td>
  <td>coordination number</td>
  <td>-</td>
  <td><code>Patient.identifier[samordningsnummer]</code><br/>system <code>http://electronichealth.se/identifier/samordningsnummer</code></td>
  <td><code>198503723135</code></td>
</tr>
<tr>
  <td>(not in WEST-A)</td>
  <td>national reserve number</td>
  <td>-</td>
  <td><code>Patient.identifier[nationelltReservnummer]</code><br/>system <code>http://electronichealth.se/identifier/nationelltReservnummer</code></td>
  <td>-</td>
</tr>
<tr>
  <td>(not in WEST-A)</td>
  <td>VGR local reserve number</td>
  <td>VGR Base</td>
  <td><code>Patient.identifier[LRID]</code><br/>system <code>https://fhir.vgregion.se/NamingSystem/LRID</code></td>
  <td><code>19700101M081</code></td>
</tr>
<tr>
  <td>(not in WEST-A)</td>
  <td>superseded VGR reserve number</td>
  <td>VGR Base</td>
  <td><code>Patient.identifier[GRID]</code><br/>system <code>https://fhir.vgregion.se/NamingSystem/GRID</code></td>
  <td>-</td>
</tr>
</tbody>
</table>

WEST-A says "eventuellt personnummer" because not every patient has one. Swedish care then uses a samordningsnummer, or a reserve number when the patient has neither or cannot be identified. These slices come from Swedish practice, not from WEST-A: the personnummer, samordningsnummer and national reserve number from SE Base, and the VGR reserve numbers LRID and GRID from VGR Base, which also checks their format. This guide adds format rules for the personnummer and the samordningsnummer.

### Age and sex

<table class="grid mapping">
<thead>
<tr><th>WEST-A (sv)</th><th>English</th><th>Source</th><th>FHIR path</th><th>Example</th></tr>
</thead>
<tbody>
<tr>
  <td>ålder</td>
  <td>age</td>
  <td>SBAR, p. 49</td>
  <td><code>Patient.birthDate</code></td>
  <td><code>1961-01-18</code></td>
</tr>
<tr>
  <td>≥65 år</td>
  <td>65 years or older (head injury with antiplatelet drugs)</td>
  <td>pp. 4, 44</td>
  <td>age at triage, calculated from <code>Patient.birthDate</code></td>
  <td>-</td>
</tr>
<tr>
  <td>ålder &lt;5 år eller &gt;60 år</td>
  <td>under 5 or over 60 (trauma: observe)</td>
  <td>p. 43</td>
  <td>age at triage, calculated from <code>Patient.birthDate</code></td>
  <td>-</td>
</tr>
<tr>
  <td>alla över 75 år</td>
  <td>everyone over 75 (frailty screening)</td>
  <td>p. 46</td>
  <td>age at triage, calculated from <code>Patient.birthDate</code></td>
  <td>-</td>
</tr>
<tr>
  <td>Kvinna / Män</td>
  <td>woman / men (sex-specific complaints)</td>
  <td>pp. 3, 21-22, 41</td>
  <td><code>Patient.gender</code></td>
  <td><code>female</code></td>
</tr>
</tbody>
</table>

Age is not stored. WEST-A applies its age rules at the moment of triage, so a system calculates the age from `birthDate` and the triage date. A personnummer or samordningsnummer contains the date of birth, but `birthDate` is still sent on its own so that receivers don't have to parse the number.

`Patient.gender` is administrative gender. The gynaecological pages (21-22) and the pages for men (41) choose by the patient's sex. When the triage nurse needs the clinical sex rather than the registered one, that is a clinical observation, outside this profile.

### Data in WEST-A that is not patient administrative data

These items appear near the administrative data in WEST-A but belong to other resources. Apart from the triage colour, they are not modelled yet.

<table class="grid">
<thead>
<tr><th>WEST-A (sv)</th><th>English</th><th>Source</th><th>Likely FHIR resource</th></tr>
</thead>
<tbody>
<tr><td>eget namn, titel, enhet</td><td>the caller's name, title and unit</td><td>SBAR, p. 49</td><td>Practitioner, PractitionerRole, Organization</td></tr>
<tr><td>bor på särskilt boende</td><td>lives in residential care (FRESH, 2 points)</td><td>p. 46</td><td>Observation (social history, part of the FRESH screening)</td></tr>
<tr><td>gravid, graviditetsvecka</td><td>pregnant, week of pregnancy</td><td>pp. 5, 19</td><td>Observation (pregnancy status)</td></tr>
<tr><td>frihetsberövad</td><td>deprived of liberty</td><td>p. 5</td><td>to decide: Flag or Observation</td></tr>
<tr><td>eventuell allergi</td><td>allergy, if any</td><td>SBAR, p. 49</td><td>AllergyIntolerance</td></tr>
<tr><td>eventuell smittorisk</td><td>infection risk, if any</td><td>SBAR, p. 49</td><td>Flag or Condition</td></tr>
<tr><td>Röd / Orange / Gul / Grön</td><td>triage colour</td><td>pp. 3-5</td><td>Observation: <a href="StructureDefinition-west-a-triage-observation.html">WEST-A Triage Observation</a></td></tr>
</tbody>
</table>

### Open questions

1. **Unidentified patients.** An unconscious, unidentified patient has no known date of birth, but WEST-A still needs an estimated age. R4 `Patient` has no element for an estimated age. The [LRID example](Patient-example-patient-lrid.html) sends an estimated birth year only; the alternative is to leave `birthDate` out and record the estimated age as an Observation.
2. **Protected identity.** SE Base marks protected identity (*sekretessmarkering*, *skyddad folkbokföring*) in `meta.security`. WEST-A does not mention it. Should this profile carry it?
3. **Check digit.** The format rules check the digits and the date, not the last (Luhn) check digit.
4. **National or regional reserve number.** VGR Base has both the national reserve number and VGR's own LRID. Which one does the VGR emergency department assign to an unidentified patient today?
