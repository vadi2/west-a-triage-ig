// The WEST-A triage form: the seven vital parameters of NEWS2 and the triage assessment.
// SDC template-based extraction (FHIRPath) turns the vital signs into the WEST-A vital sign
// Observations: each vital sign item points at a contained Observation template, and the
// FHIRPath expressions in the template fill in the answer, patient, visit, time and nurse.

// Structured Data Capture (hl7.fhir.uv.sdc 4.0.0)
Alias: $sdc-questionnaire-extr-template = http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-extr-template
Alias: $sdc-questionnaireresponse = http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse
Alias: $sdc-templateExtract = http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-templateExtract
Alias: $sdc-templateExtractValue = http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-templateExtractValue
// FHIR R4 core Questionnaire extensions
Alias: $maxDecimalPlaces = http://hl7.org/fhir/StructureDefinition/maxDecimalPlaces
Alias: $maxValue = http://hl7.org/fhir/StructureDefinition/maxValue
Alias: $minValue = http://hl7.org/fhir/StructureDefinition/minValue
Alias: $questionnaire-item-control = http://hl7.org/fhir/questionnaire-item-control
Alias: $questionnaire-itemControl = http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl
Alias: $questionnaire-unit = http://hl7.org/fhir/StructureDefinition/questionnaire-unit
// FHIR R5 extension for R4, which the SDC Questionnaire profile asks for when there is a version (sdc-2)
Alias: $artifact-versionAlgorithm = http://hl7.org/fhir/StructureDefinition/artifact-versionAlgorithm

// A FHIRPath expression whose result becomes the value of the element at {path}
RuleSet: TemplateExtractValue(path, expression)
* {path}.extension[+].url = $sdc-templateExtractValue
* {path}.extension[=].valueString = "{expression}"

// What every extracted vital sign Observation takes from the QuestionnaireResponse:
// patient, visit, time and the nurse who recorded it.
// - The profile is a FHIRPath string literal, so that the template itself is not validated
//   against the profile it lacks the answers for.
// - The time has a placeholder value, which the extraction replaces with the time of the
//   response: the validator checks every Observation with a vital signs code against the
//   FHIR core vital signs profile, whose vs-1 fails on a time without a value.
RuleSet: VitalSignTemplate(profile)
* insert TemplateExtractValue(meta.profile[0], [['https://vadi2.github.io/west-a-triage-ig/StructureDefinition/{profile}']])
* status = #final
* insert TemplateExtractValue(subject, %resource.subject)
* insert TemplateExtractValue(encounter, %resource.encounter)
* effectiveDateTime = "2000-01-01"
* insert TemplateExtractValue(effectiveDateTime, %resource.authored)
* insert TemplateExtractValue(performer[0], %resource.author)

// The item at the current path is extracted with the contained template {template}
RuleSet: ExtractWith(template)
* extension[+].url = $sdc-templateExtract
* extension[=].extension[0].url = "template"
* extension[=].extension[0].valueReference.reference = "#{template}"

// A help text, shown behind a help button next to the question at the current path
RuleSet: HelpText(linkId, text)
* item[+].linkId = "{linkId}"
* item[=].type = #display
* item[=].text = "{text}"
* item[=].extension[+].url = $questionnaire-itemControl
* item[=].extension[=].valueCodeableConcept = $questionnaire-item-control#help

// The UCUM unit of the measurement at the current path, shown next to the input
RuleSet: Unit(code, display)
* extension[+].url = $questionnaire-unit
* extension[=].valueCoding = $ucum#{code} "{display}"

RuleSet: IntegerRange(min, max)
* extension[+].url = $minValue
* extension[=].valueInteger = {min}
* extension[+].url = $maxValue
* extension[=].valueInteger = {max}

RuleSet: DecimalRange(min, max)
* extension[+].url = $minValue
* extension[=].valueDecimal = {min}
* extension[+].url = $maxValue
* extension[=].valueDecimal = {max}
* extension[+].url = $maxDecimalPlaces
* extension[=].valueInteger = 1

RuleSet: ItemControl(code)
* extension[+].url = $questionnaire-itemControl
* extension[=].valueCodeableConcept = $questionnaire-item-control#{code}

// A yes/no need or order, answered "no" until the nurse changes it
RuleSet: BooleanItem(linkId, text)
* item[+].linkId = "{linkId}"
* item[=].type = #boolean
* item[=].text = "{text}"
* item[=].initial[0].valueBoolean = false

Instance: west-a-triage-questionnaire
InstanceOf: $sdc-questionnaire-extr-template
Usage: #definition
Title: "WEST-A Triage Questionnaire"
Description: "Form for a WEST-A triage at the emergency department: the seven vital parameters of NEWS2 and the triage assessment. The vital signs are extracted as WEST-A vital sign Observations by SDC template-based extraction."
* url = "https://vadi2.github.io/west-a-triage-ig/Questionnaire/west-a-triage-questionnaire"
* version = "0.1.0"
* extension[+].url = $artifact-versionAlgorithm
* extension[=].valueCoding = http://hl7.org/fhir/version-algorithm#semver
* name = "WestATriageQuestionnaire"
* title = "WEST-A Triage Questionnaire"
* status = #draft
* experimental = true
* subjectType = #Patient
* language = #en
* description = "Form for a WEST-A triage of an adult at the emergency department. The triage nurse measures the seven vital parameters that NEWS2 is calculated from, chooses the chief complaint, assesses the warning symptoms of its complaint algorithm, and records the needs that give yellow as the lowest priority. The vital signs are extracted as [WEST-A vital sign Observations](west-a-triage-mapping.html#vital-signs) by SDC template-based extraction; the assessment is the input of the [WEST-A Triage](PlanDefinition-west-a-triage.html) guideline, which proposes a priority. Source: the WEST-A triage manual for adults, Västra Götalandsregionen, version 2025:02:01."
* purpose = "Records a WEST-A triage as structured data, from which the vital sign Observations are extracted and NEWS2 and a triage priority are calculated"

* contained[+] = respiratory-rate-template
* contained[+] = oxygen-saturation-template
* contained[+] = supplemental-oxygen-template
* contained[+] = blood-pressure-template
* contained[+] = heart-rate-template
* contained[+] = consciousness-template
* contained[+] = body-temperature-template

// Vital parameters (p. 6). None is required: a patient can be triaged before all are
// measured, and only the answered ones are extracted. NEWS2 needs all seven.
* item[+].linkId = "vitals"
* item[=].type = #group
* item[=].text = "Vital parameters"

* item[=].item[+].linkId = "respiratory-rate"
* item[=].item[=].type = #integer
* item[=].item[=].text = "Respiratory rate"
* item[=].item[=] insert Unit(/min, /min)
* item[=].item[=] insert IntegerRange(0, 80)
* item[=].item[=] insert ExtractWith(respiratory-rate-template)
* item[=].item[=] insert HelpText(respiratory-rate-help, [[Breaths per minute, counted over a full minute. NEWS2: 12-20 scores 0, 9-11 scores 1, 21-24 scores 2, 8 or less or 25 or more scores 3.]])

* item[=].item[+].linkId = "oxygen-saturation"
* item[=].item[=].type = #integer
* item[=].item[=].text = "Oxygen saturation (SpO2)"
* item[=].item[=] insert Unit(%, %)
* item[=].item[=] insert IntegerRange(0, 100)
* item[=].item[=] insert ExtractWith(oxygen-saturation-template)
* item[=].item[=] insert HelpText(oxygen-saturation-help, [[Peripheral oxygen saturation in %, measured with a pulse oximeter, with or without the supplemental oxygen below. Scale 1, for most patients: 96 or more scores 0, 94-95 scores 1, 92-93 scores 2, 91 or less scores 3. Use scale 2 only for known respiratory failure on a physician's order (see the assessment).]])

* item[=].item[+].linkId = "oxygen-flow"
* item[=].item[=].type = #decimal
* item[=].item[=].text = "Supplemental oxygen"
* item[=].item[=] insert Unit(L/min, L/min)
* item[=].item[=] insert DecimalRange(0, 60)
* item[=].item[=] insert ExtractWith(supplemental-oxygen-template)
* item[=].item[=] insert HelpText(oxygen-flow-help, [[Oxygen flow the patient receives, in litres per minute. Enter 0 when the patient breathes room air. NEWS2: air scores 0, any supplemental oxygen scores 2.]])

// The blood pressure is one Observation with two components, extracted from the systolic
// item; the diastolic pressure is asked as soon as the systolic one is answered.
* item[=].item[+].linkId = "systolic"
* item[=].item[=].type = #integer
* item[=].item[=].text = "Systolic blood pressure"
* item[=].item[=] insert Unit("mm[Hg]", mm[Hg])
* item[=].item[=] insert IntegerRange(0, 300)
* item[=].item[=] insert ExtractWith(blood-pressure-template)
* item[=].item[=] insert HelpText(systolic-help, [[Systolic pressure in mmHg. NEWS2: 111-219 scores 0, 101-110 scores 1, 91-100 scores 2, 90 or less or 220 or more scores 3.]])

* item[=].item[+].linkId = "diastolic"
* item[=].item[=].type = #integer
* item[=].item[=].text = "Diastolic blood pressure"
* item[=].item[=].required = true
* item[=].item[=].enableWhen[0].question = "systolic"
* item[=].item[=].enableWhen[0].operator = #exists
* item[=].item[=].enableWhen[0].answerBoolean = true
* item[=].item[=] insert Unit("mm[Hg]", mm[Hg])
* item[=].item[=] insert IntegerRange(0, 200)
* item[=].item[=] insert HelpText(diastolic-help, [[Diastolic pressure in mmHg, measured together with the systolic pressure. NEWS2 does not score it.]])

* item[=].item[+].linkId = "heart-rate"
* item[=].item[=].type = #integer
* item[=].item[=].text = "Heart rate or pulse"
* item[=].item[=] insert Unit(/min, /min)
* item[=].item[=] insert IntegerRange(0, 300)
* item[=].item[=] insert ExtractWith(heart-rate-template)
* item[=].item[=] insert HelpText(heart-rate-help, [[Beats per minute. Enter the heart rate when it is measured (ECG or auscultation), otherwise the pulse. NEWS2: 51-90 scores 0, 41-50 or 91-110 scores 1, 111-130 scores 2, 40 or less or 131 or more scores 3.]])

* item[=].item[+].linkId = "consciousness"
* item[=].item[=].type = #choice
* item[=].item[=].text = "Level of consciousness (ACVPU)"
* item[=].item[=].answerValueSet = Canonical(AcvpuVS)
* item[=].item[=] insert ItemControl(radio-button)
* item[=].item[=] insert ExtractWith(consciousness-template)
* item[=].item[=] insert HelpText(consciousness-help, [[Alert, new Confusion, responds to Voice, responds to Pain, or Unresponsive. NEWS2: alert scores 0, anything else scores 3. Choose C only for confusion that is new.]])

* item[=].item[+].linkId = "temperature"
* item[=].item[=].type = #decimal
* item[=].item[=].text = "Body temperature"
* item[=].item[=] insert Unit(Cel, Cel)
* item[=].item[=] insert DecimalRange(25, 45)
* item[=].item[=] insert ExtractWith(body-temperature-template)
* item[=].item[=] insert HelpText(temperature-help, [[Temperature in °C, to one decimal. NEWS2: 36.1-38.0 scores 0, 35.1-36.0 or 38.1-39.0 scores 1, 39.1 or more scores 2, 35.0 or less scores 3.]])

// Triage assessment (pp. 3-5, 8, 46-48): the input of the WEST-A Triage guideline.
// A follow-up question on the chief complaint, such as a subcategory, goes right after
// chief-complaint, with an enableWhen on it.
* item[+].linkId = "assessment"
* item[=].type = #group
* item[=].text = "Triage assessment"

* item[=].item[+].linkId = "chief-complaint"
* item[=].item[=].type = #choice
* item[=].item[=].text = "Chief complaint (sökorsak)"
* item[=].item[=].required = true
* item[=].item[=].answerValueSet = Canonical(ChiefComplaintVS)
* item[=].item[=] insert ItemControl(drop-down)
* item[=].item[=] insert HelpText(chief-complaint-help, [[The main reason the patient seeks care. Each chief complaint is one WEST-A complaint algorithm, with its own red, orange and yellow warning symptoms.]])

// The triage criteria, codes from the WEST-A triage criterion value set: the warning symptoms
// of the chosen complaint, "No warning symptoms", and the needs and processes. Generated by
// generate-triage-criteria.mjs into TriageCriteriaItems.fsh; the guideline takes all of them,
// from every item whose linkId starts with triage-criteria, as its Triage Criteria.
* item[=].item[+].linkId = "triage-criteria"
* item[=].item[=].type = #group
* item[=].item[=].text = "Triage criteria"
* item[=].item[=].enableWhen[0].question = "chief-complaint"
* item[=].item[=].enableWhen[0].operator = #exists
* item[=].item[=].enableWhen[0].answerBoolean = true
* item[=].item[=] insert HelpText(triage-criteria-help, [[Tick every warning symptom (varningssymtom) of the complaint algorithm that the patient has; the most urgent one gives the priority. Tick No warning symptoms when none of them applies. Tick the needs and processes that apply: each gives yellow (Gul) as the lowest priority.]])
* item[=].item[=] insert TriageCriteriaItems

* item[=].item[+].linkId = "complaint-priority"
* item[=].item[=].type = #choice
* item[=].item[=].text = "Priority of the warning symptoms (manual override)"
* item[=].item[=].answerValueSet = Canonical(TriagePriorityVS)
* item[=].item[=] insert ItemControl(radio-button)
* item[=].item[=] insert HelpText(complaint-priority-help, [[Optional. Choose a colour only when the triage criteria above do not express the urgency of the warning symptoms, such as for a warning symptom that is not coded: the guideline takes the more urgent of this colour and the triage criteria, so it never lowers their priority.]])

* item[=] insert BooleanItem(frail-elderly, Frail elderly)
* item[=].item[=] insert HelpText(frail-elderly-help, [[Frail elderly patient (sköra äldre, WEST-A p. 46): gives yellow (Gul) as the lowest priority.]])
* item[=] insert BooleanItem(likely-admission, Likely admission)
* item[=].item[=] insert HelpText(likely-admission-help, [[The patient will probably be admitted (trolig inläggning, WEST-A p. 47): gives yellow (Gul) as the lowest priority.]])
* item[=] insert BooleanItem(violence-or-assault, Violence or sexual assault)
* item[=].item[=] insert HelpText(violence-or-assault-help, [[The patient has been exposed to violence or sexual assault (WEST-A p. 48): gives yellow (Gul) as the lowest priority.]])
* item[=] insert BooleanItem(oxygen-scale-2, Use oxygen saturation scale 2)
* item[=].item[=] insert HelpText(oxygen-scale-2-help, [[Only for a patient with known respiratory failure (hypercapnia), on a physician's order: NEWS2 then scores the oxygen saturation on scale 2, where 88-92% scores 0.]])

// The extraction templates. Each one is a WEST-A vital sign Observation without the
// measurement: the FHIRPath expressions fill it in from the QuestionnaireResponse, with the
// answer of the item that refers to the template as their context.

Instance: respiratory-rate-template
InstanceOf: Observation
Usage: #inline
* insert VitalSignTemplate(west-a-respiratory-rate)
* category[0] = $observation-category#vital-signs "Vital Signs"
* code.coding[0] = $loinc#9279-1 "Respiratory rate"
* code.coding[+] = $sct#86290005 "Respiratory rate"
* insert TemplateExtractValue(valueQuantity.value, answer.value)
* valueQuantity.unit = "/min"
* valueQuantity.system = $ucum
* valueQuantity.code = #/min

Instance: oxygen-saturation-template
InstanceOf: Observation
Usage: #inline
* insert VitalSignTemplate(west-a-oxygen-saturation)
* category[0] = $observation-category#vital-signs "Vital Signs"
* code.coding[0] = $loinc#2708-6 "Oxygen saturation in Arterial blood"
* code.coding[+] = $sct#431314004 "Peripheral oxygen saturation"
* insert TemplateExtractValue(valueQuantity.value, answer.value)
* valueQuantity.unit = "%"
* valueQuantity.system = $ucum
* valueQuantity.code = #%

Instance: supplemental-oxygen-template
InstanceOf: Observation
Usage: #inline
* insert VitalSignTemplate(west-a-supplemental-oxygen)
* category[0] = $observation-category#therapy "Therapy"
* code = $sct#427081008 "Delivered oxygen flow rate"
* insert TemplateExtractValue(valueQuantity.value, answer.value)
* valueQuantity.unit = "L/min"
* valueQuantity.system = $ucum
* valueQuantity.code = #L/min

// The systolic item refers to this template, so the systolic answer is the context; the
// diastolic answer is found from the root of the QuestionnaireResponse.
Instance: blood-pressure-template
InstanceOf: Observation
Usage: #inline
* insert VitalSignTemplate(west-a-blood-pressure)
* category[0] = $observation-category#vital-signs "Vital Signs"
* code.coding[0] = $loinc#85354-9 "Blood pressure panel with all children optional"
* code.coding[+] = $sct#75367002 "Blood pressure"
* component[0].code.coding[0] = $loinc#8480-6 "Systolic blood pressure"
* component[0].code.coding[+] = $sct#271649006 "Systolic blood pressure"
* insert TemplateExtractValue(component[0].valueQuantity.value, answer.value)
* component[0].valueQuantity.unit = "mmHg"
* component[0].valueQuantity.system = $ucum
* component[0].valueQuantity.code = #mm[Hg]
* component[1].code.coding[0] = $loinc#8462-4 "Diastolic blood pressure"
* component[1].code.coding[+] = $sct#271650006 "Diastolic blood pressure"
* insert TemplateExtractValue(component[1].valueQuantity.value, [[%resource.repeat(item).where(linkId = 'diastolic').answer.value]])
* component[1].valueQuantity.unit = "mmHg"
* component[1].valueQuantity.system = $ucum
* component[1].valueQuantity.code = #mm[Hg]

Instance: heart-rate-template
InstanceOf: Observation
Usage: #inline
* insert VitalSignTemplate(west-a-heart-rate)
* category[0] = $observation-category#vital-signs "Vital Signs"
* code.coding[0] = $loinc#8867-4 "Heart rate"
* code.coding[+] = $sct#364075005 "Heart rate"
* insert TemplateExtractValue(valueQuantity.value, answer.value)
* valueQuantity.unit = "/min"
* valueQuantity.system = $ucum
* valueQuantity.code = #/min

Instance: consciousness-template
InstanceOf: Observation
Usage: #inline
* insert VitalSignTemplate(west-a-consciousness)
* category[0] = $observation-category#exam "Exam"
* code = $sct#1104441000000107 "Alert Confusion Voice Pain Unresponsive scale score"
// The code of the answer, in the edition of the WEST-A ACVPU value set, replacing the
// placeholder code (alert). The display of the answer is left out: it is in the language of
// the form, which the Observation may not share.
* valueCodeableConcept.coding[0].system = $sct
* valueCodeableConcept.coding[0].version = "http://snomed.info/sct/45991000052106"
* valueCodeableConcept.coding[0].code = #248234008
* insert TemplateExtractValue(valueCodeableConcept.coding[0].code, answer.value.code)

Instance: body-temperature-template
InstanceOf: Observation
Usage: #inline
* insert VitalSignTemplate(west-a-body-temperature)
* category[0] = $observation-category#vital-signs "Vital Signs"
* code.coding[0] = $loinc#8310-5 "Body temperature"
* code.coding[+] = $sct#386725007 "Body temperature"
* insert TemplateExtractValue(valueQuantity.value, answer.value)
* valueQuantity.unit = "°C"
* valueQuantity.system = $ucum
* valueQuantity.code = #Cel

// The triage of the example patient: the vital signs of the example Observations
// (NEWS2 5, medium clinical risk), chest pain without warning symptoms, and no needs.
Instance: example-triage-questionnaire-response
InstanceOf: $sdc-questionnaireresponse
Usage: #example
Title: "Example WEST-A Triage QuestionnaireResponse - Chest pain, orange"
Description: "WEST-A triage form filled in by the triage nurse for the example patient: respiratory rate 22, SpO2 95% on room air, blood pressure 105/70, heart rate 95, alert, temperature 37.5 °C (NEWS2 5, medium clinical risk); chief complaint chest pain with the orange warning symptom of ongoing chest pain with suspected acute coronary syndrome (triage criterion 15), and no needs that give yellow"
* language = #sv
* questionnaire = "https://vadi2.github.io/west-a-triage-ig/Questionnaire/west-a-triage-questionnaire|0.1.0"
* status = #completed
* subject = Reference(Patient/example-patient-personnummer)
* encounter = Reference(Encounter/example-encounter-emergency)
* author = Reference(Practitioner/example-practitioner-triage-nurse)
* authored = "2026-11-19T08:38:00+01:00"
* item[+].linkId = "vitals"
* item[=].item[+].linkId = "respiratory-rate"
* item[=].item[=].answer[0].valueInteger = 22
* item[=].item[+].linkId = "oxygen-saturation"
* item[=].item[=].answer[0].valueInteger = 95
* item[=].item[+].linkId = "oxygen-flow"
* item[=].item[=].answer[0].valueDecimal = 0
* item[=].item[+].linkId = "systolic"
* item[=].item[=].answer[0].valueInteger = 105
* item[=].item[+].linkId = "diastolic"
* item[=].item[=].answer[0].valueInteger = 70
* item[=].item[+].linkId = "heart-rate"
* item[=].item[=].answer[0].valueInteger = 95
* item[=].item[+].linkId = "consciousness"
* item[=].item[=].answer[0].valueCoding = $sct-se#248234008 "psykiskt klar"
* item[=].item[+].linkId = "temperature"
* item[=].item[=].answer[0].valueDecimal = 37.5
* item[+].linkId = "assessment"
* item[=].item[+].linkId = "chief-complaint"
* item[=].item[=].answer[0].valueCoding = ChiefComplaintCS#4 "Bröstsmärta"
* item[=].item[+].linkId = "triage-criteria"
* item[=].item[=].item[+].linkId = "triage-criteria-4"
* item[=].item[=].item[=].answer[0].valueCoding = $west-a-triage-criterion#15 "Bröstsmärta, pågående med misstanke om AKS eller annan allvarlig orsak"
* item[=].item[+].linkId = "frail-elderly"
* item[=].item[=].answer[0].valueBoolean = false
* item[=].item[+].linkId = "likely-admission"
* item[=].item[=].answer[0].valueBoolean = false
* item[=].item[+].linkId = "violence-or-assault"
* item[=].item[=].answer[0].valueBoolean = false
* item[=].item[+].linkId = "oxygen-scale-2"
* item[=].item[=].answer[0].valueBoolean = false
