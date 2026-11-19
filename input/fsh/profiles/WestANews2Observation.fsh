Profile: WestANews2Observation
Parent: Observation
Id: west-a-news2-observation
Title: "WEST-A NEWS2 Observation"
Description: "WEST-A NEWS2 Observation profile, used to record the National Early Warning Score 2 (NEWS2) total and its parameter scores, which WEST-A uses to set a priority from the vital parameters"

* obeys westa-obs-1 and westa-obs-2

// CPG case feature: the WEST-A NEWS2 logic calculates the total from the vital signs
* ^extension[+].url = $cpg-inferenceExpression
* ^extension[=].valueExpression.language = #text/cql-identifier
* ^extension[=].valueExpression.expression = "NEWS2 Total Score"
* ^extension[=].valueExpression.reference = "https://vadi2.github.io/west-a-triage-ig/Library/WestANEWS2"

* category ^slicing.discriminator.type = #value
* category ^slicing.discriminator.path = "$this"
* category ^slicing.rules = #open
* category contains survey 1..1 MS
* category[survey] = $observation-category#survey

* code = $sct#1104051000000101 // Royal College of Physicians NEWS2 (National Early Warning Score 2) total score
* insert WestAObservationContext
* effective[x] only dateTime
* effective[x] ^short = "Time the score was calculated"

* value[x] 1..1 MS
* value[x] only integer
* valueInteger ^minValueInteger = 0
* valueInteger ^maxValueInteger = 20
* valueInteger ^short = "NEWS2 total score (0-20)"

* derivedFrom MS
* derivedFrom only Reference(WestARespiratoryRate or WestAOxygenSaturation or WestASupplementalOxygen or WestABloodPressure or WestAHeartRate or WestAConsciousness or WestABodyTemperature)
* derivedFrom ^short = "The vital sign observations the scores are calculated from"

* component ^slicing.discriminator.type = #value
* component ^slicing.discriminator.path = "code"
* component ^slicing.rules = #open
* component ^slicing.description = "One score per NEWS2 parameter"
* component contains
    respirationRate 0..1 MS and
    oxygenSaturationScale1 0..1 MS and
    oxygenSaturationScale2 0..1 MS and
    airOrOxygen 0..1 MS and
    systolicBloodPressure 0..1 MS and
    pulse 0..1 MS and
    consciousness 0..1 MS and
    temperature 0..1 MS

* component[respirationRate]
  * ^short = "Respiration rate score (andningsfrekvens)"
  * code = $sct#1104301000000104 // Royal College of Physicians NEWS2 (National Early Warning Score 2) - respiration rate score
  * value[x] 1..1 MS
  * value[x] only integer
  * valueInteger ^minValueInteger = 0
  * valueInteger ^maxValueInteger = 3
* component[oxygenSaturationScale1]
  * ^short = "Oxygen saturation score, scale 1 (syremättnad 1)"
  * code = $sct#1104311000000102 // Royal College of Physicians NEWS2 (National Early Warning Score 2) - oxygen saturation scale 1 score
  * value[x] 1..1 MS
  * value[x] only integer
  * valueInteger ^minValueInteger = 0
  * valueInteger ^maxValueInteger = 3
* component[oxygenSaturationScale2]
  * ^short = "Oxygen saturation score, scale 2 (syremättnad 2), for known respiratory failure on a physician's order"
  * code = $sct#1104321000000108 // Royal College of Physicians NEWS2 (National Early Warning Score 2) - oxygen saturation scale 2 score
  * value[x] 1..1 MS
  * value[x] only integer
  * valueInteger ^minValueInteger = 0
  * valueInteger ^maxValueInteger = 3
* component[airOrOxygen]
  * ^short = "Air or supplemental oxygen score (tillförd syrgas)"
  * code = $sct#1104331000000105 // Royal College of Physicians NEWS2 (National Early Warning Score 2) - air or oxygen score
  * value[x] 1..1 MS
  * value[x] only integer
  * valueInteger ^minValueInteger = 0
  * valueInteger ^maxValueInteger = 2
* component[systolicBloodPressure]
  * ^short = "Systolic blood pressure score (systoliskt blodtryck)"
  * code = $sct#1104341000000101 // Royal College of Physicians NEWS2 (National Early Warning Score 2) - systolic blood pressure score
  * value[x] 1..1 MS
  * value[x] only integer
  * valueInteger ^minValueInteger = 0
  * valueInteger ^maxValueInteger = 3
* component[pulse]
  * ^short = "Pulse score (pulsfrekvens)"
  * code = $sct#1104351000000103 // Royal College of Physicians NEWS2 (National Early Warning Score 2) - pulse score
  * value[x] 1..1 MS
  * value[x] only integer
  * valueInteger ^minValueInteger = 0
  * valueInteger ^maxValueInteger = 3
* component[consciousness]
  * ^short = "Consciousness score, ACVPU (medvetandegrad)"
  * code = $sct#1104361000000100 // Royal College of Physicians NEWS2 (National Early Warning Score 2) - consciousness score
  * value[x] 1..1 MS
  * value[x] only integer
  * valueInteger ^minValueInteger = 0
  * valueInteger ^maxValueInteger = 3
* component[temperature]
  * ^short = "Temperature score (temperatur)"
  * code = $sct#1104371000000107 // Royal College of Physicians NEWS2 (National Early Warning Score 2) - temperature score
  * value[x] 1..1 MS
  * value[x] only integer
  * valueInteger ^minValueInteger = 0
  * valueInteger ^maxValueInteger = 3

Invariant: westa-obs-1
Description: "NEWS2 uses one oxygen saturation scale: scale 1 or scale 2, not both"
Severity: #error
Expression: "component.where(code.coding.where(system = 'http://snomed.info/sct' and code = '1104311000000102').exists()).empty() or component.where(code.coding.where(system = 'http://snomed.info/sct' and code = '1104321000000108').exists()).empty()"

Invariant: westa-obs-2
Description: "When all seven parameter scores are present, the total score is their sum"
Severity: #error
Expression: "component.where(value is integer).count() < 7 or component.value.ofType(integer).aggregate($this + $total, 0) = value.ofType(integer)"
