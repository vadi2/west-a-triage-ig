// Header for a code system defined by this guide (modelling guidelines 5.1, adapted:
// default language Swedish, English designations; the URL is the IG canonical default).
RuleSet: OriginalCodeSystemDraft
* ^status = #draft
* ^content = #complete
* ^caseSensitive = true
* ^hierarchyMeaning = #is-a
* ^language = #sv
* ^experimental = true

// Common rules for a WEST-A vital sign, on top of a FHIR core vital signs profile:
// the SNOMED CT code next to the LOINC code that the core profile requires.
RuleSet: WestAVitalSign(sctcode)
* code.coding contains snomed 0..1 MS
* code.coding[snomed] ^short = "The SNOMED CT code, as well as the LOINC code the vital signs profile requires"
* code.coding[snomed].system 1..1
* code.coding[snomed].system = $sct
* code.coding[snomed].code 1..1
* code.coding[snomed].code = #{sctcode}
* insert WestAObservationContext

// Patient, visit, time and performer of a WEST-A observation
RuleSet: WestAObservationContext
* subject 1..1 MS
* subject only Reference(WestAPatient)
* encounter MS
* encounter ^short = "The emergency department visit"
* effective[x] 1..1 MS
* performer MS
* performer only Reference(Practitioner or PractitionerRole)
