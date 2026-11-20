/*
@description: NEWS2 (National Early Warning Score 2) as WEST-A uses it (WEST-A VGR 2025, p. 6):
 the score of each vital parameter, the total score and the clinical risk, calculated from the
 latest vital sign observations of the WEST-A vital signs profiles; and, while the vital signs
 are coming in, a provisional total and clinical risk of the parameters measured so far, which
 are a lower bound, with the parameters still missing. The thresholds are those of the
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
// on a physician's order; the default is scale 1. A library that includes this one cannot
// set this parameter, so it passes its own to the "... For" functions below.
parameter "Use Oxygen Saturation Scale 2" Boolean default false

context Patient

/*
 * The latest final observation of each vital parameter
 */

// The time of an observation: effectiveDateTime or effectiveInstant, or the end (else the
// start) of effectivePeriod
define function "Effective Time"(observation Observation):
  Coalesce(
    (observation.effective as FHIR.dateTime).value,
    (observation.effective as FHIR.instant).value,
    (observation.effective as FHIR.Period)."end".value,
    (observation.effective as FHIR.Period).start.value
  )

define function "Latest"(observations List<Observation>):
  Last(
    observations O
      where O.status.value in { 'final', 'amended', 'corrected' }
      return all Tuple { observation: O, time: "Effective Time"(O) }
      sort by time
  ).observation

// The value of a quantity in the given UCUM unit; null in any other unit, so that a value
// in the wrong unit counts as not measured rather than being scored on the wrong scale
define function "Value In"(quantity FHIR.Quantity, unit String):
  if quantity.code.value = unit then quantity.value.value else null

define function "Quantity Value"(observation Observation, unit String):
  "Value In"(observation.value as FHIR.Quantity, unit)

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
  "Quantity Value"("Respiration Rate Observation", '/min')

// percent
define "Oxygen Saturation":
  "Quantity Value"("Oxygen Saturation Observation", '%')

// litres per minute, 0 for room air
define "Oxygen Flow Rate":
  "Quantity Value"("Supplemental Oxygen Observation", 'L/min')

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
      return "Value In"(C.value as FHIR.Quantity, 'mm[Hg]')
  )

// beats per minute
define "Pulse":
  "Quantity Value"("Heart Rate Observation", '/min')

// true for A (SNOMED CT 248234008 Mentally alert), false for C, V, P or U
define "Alert":
  if ("Consciousness Observation".value as FHIR.CodeableConcept) is null then null
  else exists (
    (("Consciousness Observation".value as FHIR.CodeableConcept).coding) K
      where K.system.value = 'http://snomed.info/sct'
        and K.code.value = '248234008'
  )

// degrees Celsius
define "Temperature":
  "Quantity Value"("Body Temperature Observation", 'Cel')

/*
 * The NEWS2 chart (WEST-A p. 6): one function per parameter, from a measured value to a score.
 * Each returns null when the value is missing. The chart gives whole numbers, and tenths of a
 * degree for temperature, so a value is rounded to that precision before it is scored
 * (half up): pulse 40.3 scores as 40, temperature 35.04 as 35.0.
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
  "Score Respiration Rate"(Round("Respiration Rate"))

define "Oxygen Saturation Scale 1 Score":
  "Score Oxygen Saturation Scale 1"(Round("Oxygen Saturation"))

define "Oxygen Saturation Scale 2 Score":
  "Score Oxygen Saturation Scale 2"(Round("Oxygen Saturation"), "On Supplemental Oxygen")

define "Supplemental Oxygen Score":
  "Score Supplemental Oxygen"("On Supplemental Oxygen")

define "Systolic Blood Pressure Score":
  "Score Systolic Blood Pressure"(Round("Systolic Blood Pressure"))

define "Pulse Score":
  "Score Pulse"(Round("Pulse"))

define "Consciousness Score":
  "Score Consciousness"("Alert")

define "Temperature Score":
  "Score Temperature"(Round("Temperature", 1))

/*
 * The total and the clinical risk, as functions of the oxygen saturation scale, so that a
 * library that includes this one can choose the scale
 */

define function "Oxygen Saturation Score For"(scale2 Boolean):
  if scale2 then "Oxygen Saturation Scale 2 Score" else "Oxygen Saturation Scale 1 Score"

define function "Parameter Scores For"(scale2 Boolean):
  {
    "Respiration Rate Score",
    "Oxygen Saturation Score For"(scale2),
    "Supplemental Oxygen Score",
    "Systolic Blood Pressure Score",
    "Pulse Score",
    "Consciousness Score",
    "Temperature Score"
  }

// NEWS2 is only calculated when all seven parameters are measured
define function "Total Score For"(scale2 Boolean):
  if Count("Parameter Scores For"(scale2)) = 7 then Sum("Parameter Scores For"(scale2)) else null

// WEST-A p. 6: 7 or more high, 5-6 medium, a single parameter scoring 3 low-medium, 0-4 low
define function "Risk Band"(total Integer, scores List<Integer>):
  case
    when total is null then null
    when total >= 7 then 'high'
    when total >= 5 then 'medium'
    when exists (scores S where S = 3) then 'low-medium'
    else 'low'
  end

define function "Clinical Risk For"(scale2 Boolean):
  "Risk Band"("Total Score For"(scale2), "Parameter Scores For"(scale2))

/*
 * Provisional NEWS2, while the vital signs are coming in: the scores of the parameters measured
 * so far. A parameter not yet measured can only add points, never take them away, so the
 * provisional total and clinical risk are a lower bound of the NEWS2 that the complete
 * measurements give: they can only rise as the missing parameters come in (a new measurement
 * of a parameter already scored replaces it, and can change it either way). With all seven
 * parameters they are the NEWS2 total and clinical risk.
 */

// The sum of the parameter scores so far; null when no parameter can be scored yet
define function "Provisional Total Score For"(scale2 Boolean):
  if Count("Parameter Scores For"(scale2)) = 0 then null else Sum("Parameter Scores For"(scale2))

// The clinical risk band of the provisional total, a single parameter scoring 3 included:
// the least risk the patient has
define function "Provisional Clinical Risk For"(scale2 Boolean):
  "Risk Band"("Provisional Total Score For"(scale2), "Parameter Scores For"(scale2))

// The parameters that cannot be scored yet, in the order of the NEWS2 chart: not measured,
// measured in another unit, or, on scale 2, an oxygen saturation of 93% or more while it is
// not known whether the patient is on oxygen. Each is named by its component slice in the
// WEST-A NEWS2 Observation profile, the oxygen saturation by the slice of its scale.
define function "Missing Parameters For"(scale2 Boolean):
  (
    {
      Tuple { name: 'respirationRate', score: "Respiration Rate Score" },
      Tuple { name: if scale2 then 'oxygenSaturationScale2' else 'oxygenSaturationScale1', score: "Oxygen Saturation Score For"(scale2) },
      Tuple { name: 'airOrOxygen', score: "Supplemental Oxygen Score" },
      Tuple { name: 'systolicBloodPressure', score: "Systolic Blood Pressure Score" },
      Tuple { name: 'pulse', score: "Pulse Score" },
      Tuple { name: 'consciousness', score: "Consciousness Score" },
      Tuple { name: 'temperature', score: "Temperature Score" }
    }
  ) P
    where P.score is null
    return P.name

/*
 * The scores on the scale that the parameter selects: the components of the WEST-A NEWS2
 * Observation, the total and the clinical risk
 */

define "Oxygen Saturation Score":
  "Oxygen Saturation Score For"("Use Oxygen Saturation Scale 2")

define "Parameter Scores":
  "Parameter Scores For"("Use Oxygen Saturation Scale 2")

define "Has All Parameters":
  Count("Parameter Scores") = 7

define "NEWS2 Total Score":
  "Total Score For"("Use Oxygen Saturation Scale 2")

define "Any Parameter Scores 3":
  exists ("Parameter Scores" S where S = 3)

define "NEWS2 Clinical Risk":
  "Clinical Risk For"("Use Oxygen Saturation Scale 2")

// A lower bound of the NEWS2 total until all seven parameters are measured, then the total
define "Provisional NEWS2 Total Score":
  "Provisional Total Score For"("Use Oxygen Saturation Scale 2")

// A lower bound of the NEWS2 clinical risk until all seven parameters are measured, then the risk
define "Provisional NEWS2 Clinical Risk":
  "Provisional Clinical Risk For"("Use Oxygen Saturation Scale 2")

// The component slice names of the parameters not yet scored; empty when NEWS2 is complete
define "NEWS2 Missing Parameters":
  "Missing Parameters For"("Use Oxygen Saturation Scale 2")

// The description of the task that proposes to record the NEWS2 Observation
define "NEWS2 Summary":
  if "NEWS2 Total Score" is null then null
  else 'NEWS2 ' + ToString("NEWS2 Total Score") + ', clinical risk ' + "NEWS2 Clinical Risk"
