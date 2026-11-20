CodeSystem: ObservationCodeCS
Id: west-a-observation-code-cs
Title: "WEST-A observation code"
Description: "Codes for what WEST-A observations record when SNOMED CT has no concept for it"
* insert OriginalCodeSystemDraft
* ^copyright = "WEST-A is developed by Västra Götalandsregionen. This code system is an unofficial representation of what it records."

* #1 "Triagekriterium"
  * ^definition = "A WEST-A triage criterion that the triage nurse found: a warning symptom of a complaint algorithm, a need or process that gives yellow as the lowest priority, or that none of the warning symptoms of the chief complaint applies."
  * ^designation[0].language = #en
  * ^designation[=].value = "Triage criterion"
