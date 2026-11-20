// The triage criterion code system is pre-generated JSON (input/vocabulary), with its FSH
// source in input/manual-fsh, so it is referenced by URL here.
ValueSet: TriageCriterionVS
Id: west-a-triage-criterion-vs
Title: "WEST-A triage criterion value set"
Description: "WEST-A triage criteria that can be recorded: the warning symptoms, the needs and processes, and no warning symptoms, without the groups"
* ^status = #draft
* ^experimental = true
* include codes from system $west-a-triage-criterion
// the groups (notSelectable)
* exclude $west-a-triage-criterion#AAA
* exclude $west-a-triage-criterion#AAB
* exclude $west-a-triage-criterion#AAC
* exclude $west-a-triage-criterion#AAD
* exclude $west-a-triage-criterion#AAE
* exclude $west-a-triage-criterion#AAF
* exclude $west-a-triage-criterion#AAG
* exclude $west-a-triage-criterion#AAH
* exclude $west-a-triage-criterion#AAI
* exclude $west-a-triage-criterion#AAJ
* exclude $west-a-triage-criterion#AAK
