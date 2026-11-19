CodeSystem: TriagePriorityCS
Id: west-a-triage-priority-cs
Title: "WEST-A triage priority"
Description: "Triage priorities (colours) that WEST-A assigns at the emergency department"
* insert OriginalCodeSystemDraft
* ^copyright = "WEST-A is developed by Västra Götalandsregionen. This code system is an unofficial representation of its priority levels."

* #1 "Röd"
  * ^definition = "Highest WEST-A priority: the patient has a red warning symptom or the vital parameters give red."
  * ^designation[0].language = #en
  * ^designation[=].value = "Red"
* #2 "Orange"
  * ^definition = "Second-highest WEST-A priority: the patient has an orange warning symptom or the vital parameters give orange."
  * ^designation[0].language = #en
  * ^designation[=].value = "Orange"
* #3 "Gul"
  * ^definition = "Third WEST-A priority: the patient has a yellow warning symptom, the vital parameters give yellow, or a need or process sets yellow as the lowest priority."
  * ^designation[0].language = #en
  * ^designation[=].value = "Yellow"
* #4 "Grön"
  * ^definition = "Lowest WEST-A priority: no warning symptom, vital parameter, need or clinical assessment gives a higher priority."
  * ^designation[0].language = #en
  * ^designation[=].value = "Green"
