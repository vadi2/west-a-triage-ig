/*
@description: NEWS2 (National Early Warning Score 2) as WEST-A uses it (WEST-A VGR 2025, p. 6):
 the score of each vital parameter, the total score and the clinical risk, calculated from the
 latest vital sign observations of the WEST-A vital signs profiles. The thresholds are those of the
 Royal College of Physicians NEWS2 chart, which page 6 of WEST-A reproduces.
*/
library WestANEWS2 version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers

codesystem "LOINC": 'http://loinc.org'
codesystem "SNOMED CT": 'http://snomed.info/sct'

// The codes the WEST-A vital signs profiles require: LOINC for the five that derive from
// the FHIR core vital signs profiles, SNOMED CT for the other two
code "Respiratory rate": '9279-1' from "LOINC" display 'Respiratory rate'
code "Oxygen saturation": '2708-6' from "LOINC" display 'Oxygen saturation in Arterial blood'
code "Blood pressure panel": '85354-9' from "LOINC" display 'Blood pressure panel with all children optional'
code "Heart rate": '8867-4' from "LOINC" display 'Heart rate'
code "Body temperature": '8310-5' from "LOINC" display 'Body temperature'
code "Delivered oxygen flow rate": '427081008' from "SNOMED CT" display 'Delivered oxygen flow rate'
code "ACVPU scale score": '1104441000000107' from "SNOMED CT"

// Scale 2 is for a patient with known respiratory failure (for example severe COPD),
// on a physician's order; the default is scale 1
parameter "Use Oxygen Saturation Scale 2" Boolean default false

context Patient

/*
 * The latest final observation of each vital parameter
 */

define function "Latest"(observations List<Observation>):
  Last(
    observations O
      where O.status.value in { 'final', 'amended', 'corrected' }
      sort by (effective as FHIR.dateTime).value
  )

define function "Quantity Value"(observation Observation):
  (observation.value as FHIR.Quantity).value.value

define "Respiration Rate Observation":
  "Latest"([Observation: "Respiratory rate"])

define "Oxygen Saturation Observation":
  "Latest"([Observation: "Oxygen saturation"])

define "Supplemental Oxygen Observation":
  "Latest"([Observation: "Delivered oxygen flow rate"])

define "Blood Pressure Observation":
  "Latest"([Observation: "Blood pressure panel"])

define "Heart Rate Observation":
  "Latest"([Observation: "Heart rate"])

define "Consciousness Observation":
  "Latest"([Observation: "ACVPU scale score"])

define "Body Temperature Observation":
  "Latest"([Observation: "Body temperature"])

/*
 * The measured values, as CQL system types
 */

// breaths per minute
define "Respiration Rate":
  "Quantity Value"("Respiration Rate Observation")

// percent
define "Oxygen Saturation":
  "Quantity Value"("Oxygen Saturation Observation")

// litres per minute, 0 for room air
define "Oxygen Flow Rate":
  "Quantity Value"("Supplemental Oxygen Observation")

define "On Supplemental Oxygen":
  "Oxygen Flow Rate" > 0

// mmHg, from the systolic component (LOINC 8480-6) of the blood pressure panel
define "Systolic Blood Pressure":
  singleton from (
    "Blood Pressure Observation".component C
      where exists (
        C.code.coding K
          where K.system.value = 'http://loinc.org'
            and K.code.value = '8480-6'
      )
      return (C.value as FHIR.Quantity).value.value
  )

// beats per minute
define "Pulse":
  "Quantity Value"("Heart Rate Observation")

// true for A (SNOMED CT 248234008 Mentally alert), false for C, V, P or U
define "Alert":
  if ("Consciousness Observation".value as FHIR.CodeableConcept) is null then null
  else exists (
    ("Consciousness Observation".value as FHIR.CodeableConcept).coding K
      where K.system.value = 'http://snomed.info/sct'
        and K.code.value = '248234008'
  )

// degrees Celsius
define "Temperature":
  "Quantity Value"("Body Temperature Observation")

/*
 * The NEWS2 chart (WEST-A p. 6): one function per parameter, from a measured value to a score.
 * Each returns null when the value is missing.
 */

define function "Score Respiration Rate"(rate Decimal):
  case
    when rate is null then null
    when rate <= 8 then 3
    when rate <= 11 then 1
    when rate <= 20 then 0
    when rate <= 24 then 2
    else 3
  end

define function "Score Oxygen Saturation Scale 1"(saturation Decimal):
  case
    when saturation is null then null
    when saturation <= 91 then 3
    when saturation <= 93 then 2
    when saturation <= 95 then 1
    else 0
  end

// Scale 2: 88-92 scores 0, and so does 93 or more on room air; on oxygen, 93 or more scores again
define function "Score Oxygen Saturation Scale 2"(saturation Decimal, onOxygen Boolean):
  case
    when saturation is null then null
    when saturation <= 83 then 3
    when saturation <= 85 then 2
    when saturation <= 87 then 1
    when saturation <= 92 then 0
    when onOxygen is null then null
    when not onOxygen then 0
    when saturation <= 94 then 1
    when saturation <= 96 then 2
    else 3
  end

define function "Score Supplemental Oxygen"(onOxygen Boolean):
  case
    when onOxygen is null then null
    when onOxygen then 2
    else 0
  end

define function "Score Systolic Blood Pressure"(systolic Decimal):
  case
    when systolic is null then null
    when systolic <= 90 then 3
    when systolic <= 100 then 2
    when systolic <= 110 then 1
    when systolic <= 219 then 0
    else 3
  end

define function "Score Pulse"(pulse Decimal):
  case
    when pulse is null then null
    when pulse <= 40 then 3
    when pulse <= 50 then 1
    when pulse <= 90 then 0
    when pulse <= 110 then 1
    when pulse <= 130 then 2
    else 3
  end

define function "Score Consciousness"(alert Boolean):
  case
    when alert is null then null
    when alert then 0
    else 3
  end

define function "Score Temperature"(temperature Decimal):
  case
    when temperature is null then null
    when temperature <= 35.0 then 3
    when temperature <= 36.0 then 1
    when temperature <= 38.0 then 0
    when temperature <= 39.0 then 1
    else 2
  end

/*
 * The parameter scores, one per component of the WEST-A NEWS2 Observation
 */

define "Respiration Rate Score":
  "Score Respiration Rate"("Respiration Rate")

define "Oxygen Saturation Scale 1 Score":
  if "Use Oxygen Saturation Scale 2" then null
  else "Score Oxygen Saturation Scale 1"("Oxygen Saturation")

define "Oxygen Saturation Scale 2 Score":
  if "Use Oxygen Saturation Scale 2"
    then "Score Oxygen Saturation Scale 2"("Oxygen Saturation", "On Supplemental Oxygen")
  else null

define "Oxygen Saturation Score":
  Coalesce("Oxygen Saturation Scale 1 Score", "Oxygen Saturation Scale 2 Score")

define "Supplemental Oxygen Score":
  "Score Supplemental Oxygen"("On Supplemental Oxygen")

define "Systolic Blood Pressure Score":
  "Score Systolic Blood Pressure"("Systolic Blood Pressure")

define "Pulse Score":
  "Score Pulse"("Pulse")

define "Consciousness Score":
  "Score Consciousness"("Alert")

define "Temperature Score":
  "Score Temperature"("Temperature")

define "Parameter Scores":
  {
    "Respiration Rate Score",
    "Oxygen Saturation Score",
    "Supplemental Oxygen Score",
    "Systolic Blood Pressure Score",
    "Pulse Score",
    "Consciousness Score",
    "Temperature Score"
  }

/*
 * The total and the clinical risk
 */

// NEWS2 is only calculated when all seven parameters are measured
define "Has All Parameters":
  Count("Parameter Scores") = 7

define "NEWS2 Total Score":
  if "Has All Parameters" then Sum("Parameter Scores") else null

define "Any Parameter Scores 3":
  exists ("Parameter Scores" S where S = 3)

// WEST-A p. 6: 7 or more high, 5-6 medium, a single parameter scoring 3 low-medium, 0-4 low
define "NEWS2 Clinical Risk":
  case
    when "NEWS2 Total Score" is null then null
    when "NEWS2 Total Score" >= 7 then 'high'
    when "NEWS2 Total Score" >= 5 then 'medium'
    when "Any Parameter Scores 3" then 'low-medium'
    else 'low'
  end

// The description of the task that proposes to record the NEWS2 Observation
define "NEWS2 Summary":
  if "NEWS2 Total Score" is null then null
  else 'NEWS2 ' + ToString("NEWS2 Total Score") + ', clinical risk ' + "NEWS2 Clinical Risk"
