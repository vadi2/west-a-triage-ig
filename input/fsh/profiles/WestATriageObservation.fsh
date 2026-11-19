Profile: WestATriageObservation
Parent: Observation
Id: west-a-triage-observation
Title: "WEST-A Triage Observation"
Description: "WEST-A Triage Observation profile, used to record the triage priority (colour) and chief complaint that the triage nurse assigns with WEST-A at the emergency department"

* category ^slicing.discriminator.type = #pattern
* category ^slicing.discriminator.path = "$this"
* category ^slicing.rules = #open
* category contains survey 1..1 MS
* category[survey] = $observation-category#survey

* code = $loinc#11283-9 "Acuity assessment [Function] at First encounter"
* subject 1..1 MS
* subject only Reference(WestAPatient)
* encounter MS
  * ^short = "The emergency department visit"
* effective[x] 1..1 MS
* effective[x] only dateTime
* effective[x] ^short = "Time of triage; WEST-A's age rules use the patient's age at this time"
* performer MS
* performer only Reference(Practitioner or PractitionerRole)
* performer ^short = "The triage nurse"

* value[x] 1..1 MS
* value[x] only CodeableConcept
* value[x] from TriagePriorityVS (required)
* value[x] ^short = "Triage priority: Röd | Orange | Gul | Grön"

* derivedFrom MS
* derivedFrom ^short = "The observations the priority is based on, such as NEWS2"

* component ^slicing.discriminator.type = #pattern
* component ^slicing.discriminator.path = "code"
* component ^slicing.rules = #open
* component contains chiefComplaint 1..1 MS
* component[chiefComplaint]
  * ^short = "Chief complaint (sökorsak): the WEST-A complaint algorithm used"
  * code = $sct#1269489004 "Chief complaint"
  * value[x] 1..1 MS
  * value[x] only CodeableConcept
  * value[x] from ChiefComplaintVS (required)
