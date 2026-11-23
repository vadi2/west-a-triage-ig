// One triage at the emergency department: seven vital parameters, the NEWS2 calculated
// from them, and the WEST-A triage that uses the NEWS2.

Instance: example-encounter-emergency
InstanceOf: $VGRBaseEncounter
Usage: #example
Title: "Example Encounter - Emergency department visit"
Description: "Emergency department visit of the patient identified by personnummer, during which she is triaged with WEST-A"
* language = #sv
* status = #in-progress
* class = $v3-ActCode#EMER "emergency"
* subject = Reference(Patient/example-patient-personnummer)
* period.start = "2026-11-19T08:30:00+01:00"

Instance: example-practitioner-triage-nurse
InstanceOf: Practitioner
Usage: #example
Title: "Example Practitioner - Triage nurse"
Description: "Fictitious triage nurse at the emergency department"
* language = #sv
* name.family = "Berg"
* name.given = "Anna"
* name.text = "Anna Berg"

RuleSet: ExampleTriageContext
* language = #sv
* status = #final
* subject = Reference(Patient/example-patient-personnummer)
* encounter = Reference(Encounter/example-encounter-emergency)
* performer = Reference(Practitioner/example-practitioner-triage-nurse)

RuleSet: ExampleVitalSign
* insert ExampleTriageContext
* category[VSCat] = $observation-category#vital-signs "Vital Signs"
* effectiveDateTime = "2026-11-19T08:38:00+01:00"

Instance: example-respiratory-rate
InstanceOf: WestARespiratoryRate
Usage: #example
Title: "Example WEST-A Respiratory Rate - 22 per minute"
Description: "Respiratory rate of 22 breaths per minute at triage, which gives 2 points in NEWS2"
* insert ExampleVitalSign
* code.coding[RespRateCode] = $loinc#9279-1 "Respiratory rate"
* code.coding[snomed] = $sct-se#86290005 "andningsfrekvens"
* valueQuantity = 22 '/min' "/min"

Instance: example-oxygen-saturation
InstanceOf: WestAOxygenSaturation
Usage: #example
Title: "Example WEST-A Oxygen Saturation - 95%"
Description: "Oxygen saturation of 95% at triage, which gives 1 point on NEWS2 scale 1"
* insert ExampleVitalSign
* code.coding[OxygenSatCode] = $loinc#2708-6 "Oxygen saturation in Arterial blood"
* code.coding[snomed] = $sct-se#431314004 "perifer syremättnad"
* valueQuantity = 95 '%' "%"

Instance: example-supplemental-oxygen
InstanceOf: WestASupplementalOxygen
Usage: #example
Title: "Example WEST-A Supplemental Oxygen - Room air"
Description: "No supplemental oxygen (0 L/min, breathing room air) at triage, which gives 0 points in NEWS2"
* insert ExampleTriageContext
* category[therapy] = $observation-category#therapy "Therapy"
* code = $sct-se#427081008 "flöde för tillförd syrgas"
* effectiveDateTime = "2026-11-19T08:38:00+01:00"
* valueQuantity = 0 'L/min' "L/min"

Instance: example-blood-pressure
InstanceOf: WestABloodPressure
Usage: #example
Title: "Example WEST-A Blood Pressure - 105/70 mmHg"
Description: "Blood pressure of 105/70 mmHg at triage; the systolic pressure gives 1 point in NEWS2"
* insert ExampleVitalSign
* code.coding[BPCode] = $loinc#85354-9 "Blood pressure panel with all children optional"
* code.coding[snomed] = $sct-se#75367002 "blodtryck"
* component[SystolicBP].code.coding[SBPCode] = $loinc#8480-6 "Systolic blood pressure"
* component[SystolicBP].code.coding[1] = $sct-se#271649006 "systoliskt blodtryck"
* component[SystolicBP].valueQuantity = 105 'mm[Hg]' "mmHg"
* component[DiastolicBP].code.coding[DBPCode] = $loinc#8462-4 "Diastolic blood pressure"
* component[DiastolicBP].code.coding[1] = $sct-se#271650006 "diastoliskt blodtryck"
* component[DiastolicBP].valueQuantity = 70 'mm[Hg]' "mmHg"

Instance: example-heart-rate
InstanceOf: WestAHeartRate
Usage: #example
Title: "Example WEST-A Heart Rate - 95 per minute"
Description: "Pulse of 95 beats per minute at triage, which gives 1 point in NEWS2"
* insert ExampleVitalSign
* code.coding[HeartRateCode] = $loinc#8867-4 "Heart rate"
* code.coding[snomed] = $sct-se#364075005 "hjärtfrekvens"
* valueQuantity = 95 '/min' "/min"

Instance: example-consciousness
InstanceOf: WestAConsciousness
Usage: #example
Title: "Example WEST-A Consciousness - Alert"
Description: "Patient alert (A on the ACVPU scale) at triage, which gives 0 points in NEWS2"
* insert ExampleTriageContext
* category[exam] = $observation-category#exam "Exam"
* code = $sct-se#1104441000000107 "poäng enligt ACVPU-skalan (Alert Confusion Voice Pain Unresponsive)"
* effectiveDateTime = "2026-11-19T08:38:00+01:00"
* valueCodeableConcept = $sct-se#248234008 "psykiskt klar"
* valueCodeableConcept.text = "vaken"

Instance: example-body-temperature
InstanceOf: WestABodyTemperature
Usage: #example
Title: "Example WEST-A Body Temperature - 37.5 °C"
Description: "Body temperature of 37.5 °C at triage, which gives 0 points in NEWS2"
* insert ExampleVitalSign
* code.coding[BodyTempCode] = $loinc#8310-5 "Body temperature"
* code.coding[snomed] = $sct-se#386725007 "kroppstemperatur"
* valueQuantity = 37.5 'Cel' "°C"

Instance: example-news2
InstanceOf: WestANews2Observation
Usage: #example
Title: "Example WEST-A NEWS2 Observation - Total score 5"
Description: "NEWS2 calculated from the vital parameters at triage: respiration rate 22 (2), oxygen saturation 95% on scale 1 (1), room air (0), systolic blood pressure 105 (1), pulse 95 (1), alert (0) and temperature 37.5 °C (0). Total 5, medium clinical risk."
* insert ExampleTriageContext
* category[survey] = $observation-category#survey "Survey"
* code = $sct-se#1104051000000101 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), totalpoäng"
* effectiveDateTime = "2026-11-19T08:40:00+01:00"
* valueInteger = 5
* derivedFrom[0] = Reference(Observation/example-respiratory-rate)
* derivedFrom[+] = Reference(Observation/example-oxygen-saturation)
* derivedFrom[+] = Reference(Observation/example-supplemental-oxygen)
* derivedFrom[+] = Reference(Observation/example-blood-pressure)
* derivedFrom[+] = Reference(Observation/example-heart-rate)
* derivedFrom[+] = Reference(Observation/example-consciousness)
* derivedFrom[+] = Reference(Observation/example-body-temperature)
* component[respirationRate].code = $sct-se#1104301000000104 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), andningsfrekvens"
* component[respirationRate].valueInteger = 2
* component[oxygenSaturationScale1].code = $sct-se#1104311000000102 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), syremättnad 1"
* component[oxygenSaturationScale1].valueInteger = 1
* component[airOrOxygen].code = $sct-se#1104331000000105 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), tillförd syrgas"
* component[airOrOxygen].valueInteger = 0
* component[systolicBloodPressure].code = $sct-se#1104341000000101 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), systoliskt blodtryck"
* component[systolicBloodPressure].valueInteger = 1
* component[pulse].code = $sct-se#1104351000000103 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), pulsfrekvens"
* component[pulse].valueInteger = 1
* component[consciousness].code = $sct-se#1104361000000100 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), medvetandegrad"
* component[consciousness].valueInteger = 0
* component[temperature].code = $sct-se#1104371000000107 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), temperatur"
* component[temperature].valueInteger = 0

Instance: example-news2-preliminary
InstanceOf: WestANews2Observation
Usage: #example
Title: "Example WEST-A NEWS2 Observation - Provisional, 4 so far"
Description: "Provisional NEWS2, recorded while the vital signs are coming in: respiration rate 22 (2), oxygen saturation 95% on scale 1 (1) and pulse 95 (1) are measured, and supplemental oxygen, blood pressure, consciousness and temperature are not yet. The total so far is 4, low clinical risk so far; the missing parameters can only add to it."
* insert ExampleTriageContext
* status = #preliminary
* category[survey] = $observation-category#survey "Survey"
* code = $sct-se#1104051000000101 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), totalpoäng"
* effectiveDateTime = "2026-11-19T08:39:00+01:00"
* valueInteger = 4
* derivedFrom[0] = Reference(Observation/example-respiratory-rate)
* derivedFrom[+] = Reference(Observation/example-oxygen-saturation)
* derivedFrom[+] = Reference(Observation/example-heart-rate)
* component[respirationRate].code = $sct-se#1104301000000104 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), andningsfrekvens"
* component[respirationRate].valueInteger = 2
* component[oxygenSaturationScale1].code = $sct-se#1104311000000102 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), syremättnad 1"
* component[oxygenSaturationScale1].valueInteger = 1
* component[pulse].code = $sct-se#1104351000000103 "poäng enligt Royal College of Physicians NEWS2 (National Early Warning Score 2), pulsfrekvens"
* component[pulse].valueInteger = 1

Instance: example-triage-chest-pain
InstanceOf: WestATriageObservation
Usage: #example
Title: "Example WEST-A Triage Observation - Chest pain, orange"
Description: "Triage of ongoing chest pain with suspected acute coronary syndrome, an orange warning symptom in WEST-A (page 13). NEWS2 is 5, which is also orange."
* insert ExampleTriageContext
* category[survey] = $observation-category#survey "Survey"
* code = $sct-se#425705009 "triagering"
* effectiveDateTime = "2026-11-19T08:42:00+01:00"
* valueCodeableConcept = TriagePriorityCS#2 "Orange"
* derivedFrom = Reference(Observation/example-news2)
* component[chiefComplaint].code = $sct-se#1269489004 "sökorsak"
* component[chiefComplaint].valueCodeableConcept = ChiefComplaintCS#4 "Bröstsmärta"
* component[criterion].code = ObservationCodeCS#1 "Triagekriterium"
* component[criterion].valueCodeableConcept = $west-a-triage-criterion#15 "Bröstsmärta, pågående med misstanke om AKS eller annan allvarlig orsak"
