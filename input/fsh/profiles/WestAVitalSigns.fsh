// The vital parameters that NEWS2 is calculated from. Five are FHIR core vital signs;
// consciousness (ACVPU) and supplemental oxygen have no core profile.

Profile: WestARespiratoryRate
Parent: $resprate
Id: west-a-respiratory-rate
Title: "WEST-A Respiratory Rate"
Description: "WEST-A Respiratory Rate profile, used to record the respiratory rate (andningsfrekvens) measured at triage, from which the NEWS2 respiration rate score is calculated"
* insert WestAVitalSign(86290005)
* valueQuantity MS
* valueQuantity ^short = "Breaths per minute"

Profile: WestAOxygenSaturation
Parent: $oxygensat
Id: west-a-oxygen-saturation
Title: "WEST-A Oxygen Saturation"
Description: "WEST-A Oxygen Saturation profile, used to record the peripheral oxygen saturation (syremättnad, SpO2) measured at triage, from which the NEWS2 oxygen saturation score is calculated"
* insert WestAVitalSign(431314004)
* valueQuantity MS
* valueQuantity ^short = "Oxygen saturation in %"

Profile: WestABloodPressure
Parent: $bp
Id: west-a-blood-pressure
Title: "WEST-A Blood Pressure"
Description: "WEST-A Blood Pressure profile, used to record the blood pressure measured at triage; NEWS2 uses the systolic pressure"
* insert WestAVitalSign(75367002)
* component[SystolicBP] MS
* component[SystolicBP] ^short = "Systolic blood pressure, which NEWS2 scores"
* component[DiastolicBP] MS

Profile: WestAHeartRate
Parent: $heartrate
Id: west-a-heart-rate
Title: "WEST-A Heart Rate"
Description: "WEST-A Heart Rate profile, used to record the pulse (pulsfrekvens) measured at triage, from which the NEWS2 pulse score is calculated"
* insert WestAVitalSign(364075005)
* valueQuantity MS
* valueQuantity ^short = "Beats per minute"

Profile: WestABodyTemperature
Parent: $bodytemp
Id: west-a-body-temperature
Title: "WEST-A Body Temperature"
Description: "WEST-A Body Temperature profile, used to record the body temperature measured at triage, from which the NEWS2 temperature score is calculated"
* insert WestAVitalSign(386725007)
* valueQuantity MS
* valueQuantity ^short = "Body temperature in °C"
* valueQuantity.code = #Cel

Profile: WestAConsciousness
Parent: Observation
Id: west-a-consciousness
Title: "WEST-A Consciousness"
Description: "WEST-A Consciousness profile, used to record the level of consciousness on the ACVPU scale (medvetandegrad) assessed at triage, from which the NEWS2 consciousness score is calculated"
* category ^slicing.discriminator.type = #value
* category ^slicing.discriminator.path = "$this"
* category ^slicing.rules = #open
* category contains exam 1..1 MS
* category[exam] = $observation-category#exam
* code = $sct#1104441000000107 // Alert Confusion Voice Pain Unresponsive scale score
* insert WestAObservationContext
* value[x] 1..1 MS
* value[x] only CodeableConcept
* value[x] from AcvpuVS (required)
* value[x] ^short = "Alert | new Confusion | Voice | Pain | Unresponsive"

Profile: WestASupplementalOxygen
Parent: Observation
Id: west-a-supplemental-oxygen
Title: "WEST-A Supplemental Oxygen"
Description: "WEST-A Supplemental Oxygen profile, used to record the oxygen flow the patient receives at triage (tillförd syrgas); 0 L/min means breathing room air. NEWS2 scores any supplemental oxygen."
* category ^slicing.discriminator.type = #value
* category ^slicing.discriminator.path = "$this"
* category ^slicing.rules = #open
* category contains therapy 1..1 MS
* category[therapy] = $observation-category#therapy
* code = $sct#427081008 // Delivered oxygen flow rate
* insert WestAObservationContext
* value[x] 1..1 MS
* value[x] only Quantity
* valueQuantity ^short = "Oxygen flow in L/min; 0 for room air"
* valueQuantity.value 1..1 MS
* valueQuantity.value ^minValueDecimal = 0
* valueQuantity.system 1..1 MS
* valueQuantity.system = $ucum
* valueQuantity.code 1..1 MS
* valueQuantity.code = #L/min
