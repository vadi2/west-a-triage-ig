Instance: example-encounter-emergency
InstanceOf: Encounter
Usage: #example
Title: "Example Encounter - Emergency department visit"
Description: "Emergency department visit of the patient identified by personnummer, during which she is triaged with WEST-A"
* language = #sv
* status = #in-progress
* class = $v3-ActCode#EMER
* subject = Reference(Patient/example-patient-personnummer)
* actualPeriod.start = "2026-11-19T08:30:00+01:00"

Instance: example-practitioner-triage-nurse
InstanceOf: Practitioner
Usage: #example
Title: "Example Practitioner - Triage nurse"
Description: "Fictitious triage nurse at the emergency department"
* language = #sv
* name.family = "Berg"
* name.given = "Anna"
* name.text = "Anna Berg"

Instance: example-news2
InstanceOf: WestANews2Observation
Usage: #example
Title: "Example WEST-A NEWS2 Observation - Total score 5"
Description: "NEWS2 at triage: respiration rate 22 (2), oxygen saturation 95% on scale 1 (1), breathing air (0), systolic blood pressure 105 (1), pulse 95 (1), alert (0) and temperature 37.5 °C (0). Total 5, medium clinical risk."
* language = #sv
* status = #final
* category[survey] = $observation-category#survey
* code = $sct#1104051000000101 "Royal College of Physicians NEWS2 (National Early Warning Score 2) total score"
* subject = Reference(Patient/example-patient-personnummer)
* encounter = Reference(Encounter/example-encounter-emergency)
* effectiveDateTime = "2026-11-19T08:40:00+01:00"
* performer = Reference(Practitioner/example-practitioner-triage-nurse)
* valueInteger = 5
* component[respirationRate].valueInteger = 2
* component[oxygenSaturationScale1].valueInteger = 1
* component[airOrOxygen].valueInteger = 0
* component[systolicBloodPressure].valueInteger = 1
* component[pulse].valueInteger = 1
* component[consciousness].valueInteger = 0
* component[temperature].valueInteger = 0

Instance: example-triage-chest-pain
InstanceOf: WestATriageObservation
Usage: #example
Title: "Example WEST-A Triage Observation - Chest pain, orange"
Description: "Triage of ongoing chest pain with suspected acute coronary syndrome, an orange warning symptom in WEST-A (page 13). NEWS2 is 5."
* language = #sv
* status = #final
* category[survey] = $observation-category#survey
* code = $loinc#11283-9 "Acuity assessment [Function] at First encounter"
* subject = Reference(Patient/example-patient-personnummer)
* encounter = Reference(Encounter/example-encounter-emergency)
* effectiveDateTime = "2026-11-19T08:42:00+01:00"
* performer = Reference(Practitioner/example-practitioner-triage-nurse)
* valueCodeableConcept = TriagePriorityCS#2 "Orange"
* derivedFrom = Reference(Observation/example-news2)
* component[chiefComplaint].valueCodeableConcept = ChiefComplaintCS#4 "Bröstsmärta"
* note.text = "Bröstsmärta, pågående med misstanke om AKS."
