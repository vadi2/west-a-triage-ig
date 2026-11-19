Profile: WestATriageObservation
Parent: Observation
Id: west-a-triage-observation
Title: "WEST-A Triage Observation"
Description: "WEST-A Triage Observation profile, used to record the triage priority (colour) and chief complaint that the triage nurse assigns with WEST-A at the emergency department"

* category ^slicing.discriminator.type = #value
* category ^slicing.discriminator.path = "$this"
* category ^slicing.rules = #open
* category contains survey 1..1 MS
* category[survey] = $observation-category#survey

* code = $sct#425705009 // Determination of acuity level (procedure), Swedish "triagering"
* insert WestAObservationContext
* effective[x] only dateTime
* effective[x] ^short = "Time of triage; WEST-A's age rules use the patient's age at this time"
* performer ^short = "The triage nurse"

* value[x] 1..1 MS
* value[x] only CodeableConcept
* value[x] from TriagePriorityVS (required)
* value[x] ^short = "Triage priority: Röd | Orange | Gul | Grön"

* derivedFrom MS
* derivedFrom ^short = "The observations the priority is based on: the NEWS2 score, and any vital sign that sets the priority on its own"

* component ^slicing.discriminator.type = #value
* component ^slicing.discriminator.path = "code"
* component ^slicing.rules = #open
* component contains chiefComplaint 1..1 MS
* component[chiefComplaint]
  * ^short = "Chief complaint (sökorsak): the WEST-A complaint algorithm used"
  * code = $sct#1269489004 // Chief complaint
  * value[x] 1..1 MS
  * value[x] only CodeableConcept
  * value[x] from ChiefComplaintVS (required)
