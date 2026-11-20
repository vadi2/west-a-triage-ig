### In development

#### Added

- [WEST-A ACVPU](ValueSet-west-a-acvpu-vs.html) value set for the levels of consciousness, coded in SNOMED CT
- [WEST-A Blood Pressure](StructureDefinition-west-a-blood-pressure.html) profile, based on the FHIR core blood pressure profile
- [WEST-A Body Temperature](StructureDefinition-west-a-body-temperature.html) profile, based on the FHIR core body temperature profile
- [WEST-A chief complaint](CodeSystem-west-a-chief-complaint-cs.html) code system and [value set](ValueSet-west-a-chief-complaint-vs.html) for the 31 WEST-A complaint algorithms
- [WEST-A Computable Guidelines](west-a-computable-guidelines.html) page, with the CQL logic, PlanDefinitions and ActivityDefinitions that calculate NEWS2 and propose a triage priority from NEWS2 and the triage criteria, tested in every build
- [WEST-A Consciousness](StructureDefinition-west-a-consciousness.html) profile for the ACVPU level of consciousness
- [WEST-A Heart Rate](StructureDefinition-west-a-heart-rate.html) profile, based on the FHIR core heart rate profile
- [WEST-A NEWS2 Logic](Library-WestANEWS2.html) and [WEST-A Triage Logic](Library-WestATriage.html) CQL libraries
- [WEST-A NEWS2 Observation](StructureDefinition-west-a-news2-observation.html) profile for the NEWS2 total and parameter scores, calculated from the vital sign observations it references
- [WEST-A observation code](CodeSystem-west-a-observation-code-cs.html) code system for the observation elements that SNOMED CT has no concept for, such as the triage criterion
- [WEST-A Oxygen Saturation](StructureDefinition-west-a-oxygen-saturation.html) profile, based on the FHIR core oxygen saturation profile
- [WEST-A Patient](StructureDefinition-west-a-patient.html) profile for the patient administrative data that WEST-A uses, based on the VGR Base Patient
- [WEST-A Patient Mapping](west-a-patient-mapping.html) page
- [WEST-A Respiratory Rate](StructureDefinition-west-a-respiratory-rate.html) profile, based on the FHIR core respiratory rate profile
- [WEST-A Supplemental Oxygen](StructureDefinition-west-a-supplemental-oxygen.html) profile for the oxygen flow the patient receives
- [WEST-A triage criterion](CodeSystem-west-a-triage-criterion-cs.html) code system and [value set](ValueSet-west-a-triage-criterion-vs.html) for the warning symptoms of the complaint algorithms, each with its priority, and the needs and processes that give yellow as the lowest priority
- [WEST-A Triage Mapping](west-a-triage-mapping.html) page
- [WEST-A Triage Observation](StructureDefinition-west-a-triage-observation.html) profile for the triage priority, the chief complaint and the triage criteria found
- [WEST-A triage priority](CodeSystem-west-a-triage-priority-cs.html) code system and [value set](ValueSet-west-a-triage-priority-vs.html) for the Röd, Orange, Gul and Grön priorities
