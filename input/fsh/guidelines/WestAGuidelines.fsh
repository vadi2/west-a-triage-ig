// WEST-A as a computable guideline (HL7 Clinical Practice Guidelines, CPG on FHIR):
// CQL logic libraries, the PlanDefinitions that run them, and the ActivityDefinitions
// that propose what to record. The Library ids are the CQL library names, because
// CQL tooling resolves an included library at [canonical]/Library/[CQL name].

RuleSet: WestALogicLibrary(name)
* name = "{name}"
* version = "0.1.0"
* status = #draft
* experimental = true
* type = $library-type#logic-library
* subjectCodeableConcept = $resource-types#Patient
* content.id = "ig-loader-{name}.cql"

RuleSet: WestAGuidelineHeader
* version = "0.1.0"
* status = #draft
* experimental = true
* subjectCodeableConcept = $resource-types#Patient
// The source, WEST-A triage manual for adults without referral support (WEST A utan
// hänvisningsstöd), VGR version 2025:02:01, is in the description and the guideline page:
// a relatedArtifact citation without a url renders as an empty link.
* purpose = "Source: the WEST-A triage manual for adults without referral support (WEST A utan hänvisningsstöd), Västra Götalandsregionen, version 2025:02:01"

// One trigger per vital sign: the data requirements of one trigger must all be met together
RuleSet: WestATriggerVitalSign(profile)
* action[0].trigger[+].type = #data-added
* action[0].trigger[=].data[0].type = #Observation
* action[0].trigger[=].data[0].profile = Canonical({profile})

RuleSet: WestAPriorityAction(index, code, title, display, description, condition)
* action[1].action[{index}].title = "{title}"
* action[1].action[{index}].description = "{description}"
* action[1].action[{index}].code = TriagePriorityCS#{code} "{display}"
* action[1].action[{index}].condition.kind = #applicability
* action[1].action[{index}].condition.expression.language = #text/cql-identifier
* action[1].action[{index}].condition.expression.expression = "{condition}"
* action[1].action[{index}].definitionCanonical = Canonical(west-a-record-triage-priority)

Instance: FHIRHelpers
InstanceOf: Library
Usage: #definition
Title: "FHIRHelpers"
Description: "The FHIRHelpers 4.0.1 library of the CQL project, which converts FHIR R4 data types to CQL types; the WEST-A logic includes it"
* name = "FHIRHelpers"
* title = "FHIRHelpers"
* version = "4.0.1"
* status = #active
* experimental = false
* type = $library-type#logic-library
* description = "The FHIRHelpers 4.0.1 library of the CQL project (https://github.com/cqframework/clinical_quality_language), which converts FHIR R4 data types to CQL types. It is included here unchanged so that the WEST-A logic can be translated and run."
* content.id = "ig-loader-FHIRHelpers.cql"

Instance: WestANEWS2
InstanceOf: Library
Usage: #definition
Title: "WEST-A NEWS2 Logic"
Description: "CQL logic that calculates NEWS2 from the WEST-A vital signs: the score of each parameter, the total and the clinical risk (WEST-A p. 6)"
* insert WestALogicLibrary(WestANEWS2)
* title = "WEST-A NEWS2 Logic"
* description = "Calculates NEWS2 (National Early Warning Score 2) as WEST-A uses it (p. 6) from the latest final vital sign observations of the patient: the score of each of the seven parameters, the total when all seven are measured, and the clinical risk (low, low-medium, medium or high). The thresholds are those of the Royal College of Physicians NEWS2 chart. The parameter `Use Oxygen Saturation Scale 2` selects scale 2 for a patient with known respiratory failure, on a physician's order."

Instance: WestATriage
InstanceOf: Library
Usage: #definition
Title: "WEST-A Triage Logic"
Description: "CQL logic that proposes a WEST-A triage priority from NEWS2, the warning symptoms of the chief complaint and the needs that give yellow as the lowest priority"
* insert WestALogicLibrary(WestATriage)
* title = "WEST-A Triage Logic"
* description = "Proposes a WEST-A triage priority. The priority from the vital parameters is the colour of the NEWS2 clinical risk (p. 6): high red, medium orange, low-medium yellow, low green. The proposed priority is the most urgent of that, the priority of the warning symptoms of the chief complaint algorithm (parameter `Complaint Priority`), and yellow for frail elderly, likely admission, or violence or sexual assault (parameter `Yellow As Lowest Priority`, pp. 46-48). The triage nurse assesses the warning symptoms and the needs, and decides the final priority: the clinical assessment can raise it, but never lowers a red or orange patient (p. 8)."

Instance: west-a-news2-calculation
InstanceOf: $cpg-computableplandefinition
Usage: #definition
Title: "WEST-A NEWS2 Calculation"
Description: "Event-condition-action rule that calculates NEWS2 when a vital sign is recorded and all seven NEWS2 parameters are measured"
* insert WestAGuidelineHeader
* name = "WestANEWS2Calculation"
* title = "WEST-A NEWS2 Calculation"
* type = $plan-definition-type#eca-rule
* description = "When a WEST-A vital sign observation is recorded and all seven NEWS2 parameters have been measured, proposes to record a WEST-A NEWS2 Observation with the scores that the WEST-A NEWS2 logic calculates."
* library = Canonical(WestANEWS2)
* action[0].title = "Calculate NEWS2"
* action[0].description = "Calculate the NEWS2 parameter scores, the total and the clinical risk from the latest vital signs, and record them as a WEST-A NEWS2 Observation"
* insert WestATriggerVitalSign(WestARespiratoryRate)
* insert WestATriggerVitalSign(WestAOxygenSaturation)
* insert WestATriggerVitalSign(WestASupplementalOxygen)
* insert WestATriggerVitalSign(WestABloodPressure)
* insert WestATriggerVitalSign(WestAHeartRate)
* insert WestATriggerVitalSign(WestAConsciousness)
* insert WestATriggerVitalSign(WestABodyTemperature)
* action[0].condition.kind = #applicability
* action[0].condition.expression.language = #text/cql-identifier
* action[0].condition.expression.expression = "Has All Parameters"
* action[0].definitionCanonical = Canonical(west-a-record-news2)

Instance: west-a-record-news2
InstanceOf: $cpg-recordinferenceactivity
Usage: #definition
Title: "WEST-A Record NEWS2"
Description: "Proposes to record the calculated NEWS2 as a WEST-A NEWS2 Observation"
* insert WestAGuidelineHeader
* name = "WestARecordNEWS2"
* title = "WEST-A Record NEWS2"
* description = "Proposes a task to record a WEST-A NEWS2 Observation. The description of the task gives the total and the clinical risk; the CDS service records the Observation from the parameter scores and the total that the WEST-A NEWS2 logic calculates, with the vital sign observations in derivedFrom."
* library = Canonical(WestANEWS2)
* kind = #Task
* profile = $cpg-recordinferencetask
* code = $cpg-activity-type#record-inference
* intent = #proposal
* doNotPerform = false
* dynamicValue[+].path = "description"
* dynamicValue[=].expression.language = #text/cql-identifier
* dynamicValue[=].expression.expression = "NEWS2 Summary"

Instance: west-a-triage
InstanceOf: $cpg-computableplandefinition
Usage: #definition
Title: "WEST-A Triage"
Description: "WEST-A triage of an adult at the emergency department: calculate NEWS2, then propose the triage priority"
* insert WestAGuidelineHeader
* name = "WestATriage"
* title = "WEST-A Triage"
* type = $plan-definition-type#clinical-protocol
* description = "The calculable part of a WEST-A triage. First NEWS2 is calculated from the vital signs; then, once the nurse has assessed the warning symptoms of the chief complaint, a triage priority is proposed, which is the most urgent of the colour of the NEWS2 clinical risk, the priority of the warning symptoms, and yellow for the needs and processes that give yellow as the lowest priority. The triage nurse records the final priority as a WEST-A Triage Observation."
* library = Canonical(WestATriage)
* action[0].id = "calculate-news2"
* action[0].title = "Calculate NEWS2"
* action[0].description = "Calculate NEWS2 from the vital signs measured at triage"
* action[0].definitionCanonical = Canonical(west-a-news2-calculation)
* action[1].title = "Propose the triage priority"
* action[1].id = "propose-priority"
* action[1].description = "When NEWS2 has been calculated and the warning symptoms of the chief complaint have been assessed, propose the most urgent of the priority from the vital parameters, the priority of the warning symptoms, and yellow for frail elderly, likely admission, or violence or sexual assault"
* action[1].relatedAction[0].actionId = "calculate-news2"
* action[1].relatedAction[0].relationship = #after-end
* action[1].trigger[0].type = #data-added
* action[1].trigger[0].data[0].type = #Observation
* action[1].trigger[0].data[0].profile = Canonical(WestANews2Observation)
* action[1].condition.kind = #applicability
* action[1].condition.expression.language = #text/cql-identifier
* action[1].condition.expression.expression = "Has Proposed Priority"
* action[1].selectionBehavior = #exactly-one
* insert WestAPriorityAction(0, 1, Röd, Red, NEWS2 7 or more (high clinical risk\)\, or a red warning symptom, Proposed Priority Is Red)
* insert WestAPriorityAction(1, 2, Orange, Orange, NEWS2 5-6 (medium clinical risk\)\, or an orange warning symptom, Proposed Priority Is Orange)
* insert WestAPriorityAction(2, 3, Gul, Yellow, A single NEWS2 parameter scoring 3 (low-medium clinical risk\)\, a yellow warning symptom\, or a need that gives yellow as the lowest priority, Proposed Priority Is Yellow)
* insert WestAPriorityAction(3, 4, Grön, Green, NEWS2 0-4 (low clinical risk\) and nothing more urgent, Proposed Priority Is Green)

Instance: west-a-record-triage-priority
InstanceOf: $cpg-recordinferenceactivity
Usage: #definition
Title: "WEST-A Record Triage Priority"
Description: "Proposes to record the proposed WEST-A triage priority as a WEST-A Triage Observation"
* insert WestAGuidelineHeader
* name = "WestARecordTriagePriority"
* title = "WEST-A Record Triage Priority"
* description = "Proposes a task to record a WEST-A Triage Observation. The description of the task gives the proposed priority, which the WEST-A triage logic calculates; the triage nurse confirms or raises it, and records it with the chief complaint and the WEST-A NEWS2 Observation in derivedFrom."
* library = Canonical(WestATriage)
* kind = #Task
* profile = $cpg-recordinferencetask
* code = $cpg-activity-type#record-inference
* intent = #proposal
* doNotPerform = false
* dynamicValue[+].path = "description"
* dynamicValue[=].expression.language = #text/cql-identifier
* dynamicValue[=].expression.expression = "Proposed Priority Summary"
