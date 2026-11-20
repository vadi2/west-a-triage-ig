// More than 100 codes: SUSHI does not read this file. The IG uses the JSON in
// input/vocabulary/CodeSystem-west-a-triage-criterion-cs.json, which is this code system
// as SUSHI generates it (modelling guidelines 5.1, large CodeSystems).
CodeSystem: TriageCriterionCS
Id: west-a-triage-criterion-cs
Title: "WEST-A triage criterion"
Description: "Triage criteria of WEST-A: the warning symptoms (varningssymtom) of each complaint algorithm, and the needs and processes that give yellow as the lowest priority. Each criterion names the chief complaint whose algorithm lists it and the triage priority it gives. Grouping concepts, which cannot be selected, hold the gynecology and trauma subgroups and the needs."
* insert OriginalCodeSystemDraft
* ^hierarchyMeaning = #grouped-by
* ^copyright = "WEST-A is developed by Västra Götalandsregionen. This code system is an unofficial representation of its warning symptoms and needs. Its structure was checked against the WEST-A 2025 decision support definition of the open-triage project."
* ^property[0].code = #parent
* ^property[=].uri = "http://hl7.org/fhir/concept-properties#parent"
* ^property[=].description = "The group the criterion belongs to"
* ^property[=].type = #code
* ^property[+].code = #notSelectable
* ^property[=].uri = "http://hl7.org/fhir/concept-properties#notSelectable"
* ^property[=].description = "A group of criteria, which cannot be recorded itself"
* ^property[=].type = #boolean
* ^property[+].code = #complaint
* ^property[=].description = "The chief complaint (WEST-A chief complaint code system) whose complaint algorithm lists the criterion"
* ^property[=].type = #Coding
* ^property[+].code = #priority
* ^property[=].description = "The triage priority (WEST-A triage priority code system) that the criterion gives"
* ^property[=].type = #Coding

* #AAA "Gyn: gravid t.o.m. vecka 17+6"
  * ^definition = "Group of the gynecological criteria for a patient who is pregnant up to week 17+6 (WEST-A pages 21-22)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Gynecology: pregnant up to week 17+6"
  * ^property[0].code = #notSelectable
  * ^property[=].valueBoolean = true
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
* #AAB "Gyn: graviditetsillamående/kräkningar"
  * ^definition = "Group of the gynecological criteria for nausea and vomiting of pregnancy (WEST-A pages 21-22)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Gynecology: nausea and vomiting of pregnancy"
  * ^property[0].code = #notSelectable
  * ^property[=].valueBoolean = true
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
* #AAC "Gyn: ej gravid, buksmärta/blödning"
  * ^definition = "Group of the gynecological criteria for abdominal pain or bleeding in a patient who is not pregnant (WEST-A pages 21-22)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Gynecology: not pregnant, abdominal pain/bleeding"
  * ^property[0].code = #notSelectable
  * ^property[=].valueBoolean = true
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
* #AAD "Gyn: postoperativt"
  * ^definition = "Group of the gynecological criteria after a gynecological operation (WEST-A pages 21-22)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Gynecology: postoperative"
  * ^property[0].code = #notSelectable
  * ^property[=].valueBoolean = true
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
* #AAE "Gyn: urinstämma"
  * ^definition = "Group of the gynecological criteria for urinary retention (WEST-A pages 21-22)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Gynecology: urinary retention"
  * ^property[0].code = #notSelectable
  * ^property[=].valueBoolean = true
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
* #AAF "Gyn: bartolinit/vulvaabscess och lokal infektion"
  * ^definition = "Group of the gynecological criteria for bartholinitis, vulvar abscess or another local infection (WEST-A pages 21-22)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Gynecology: bartholinitis/vulvar abscess and local infection"
  * ^property[0].code = #notSelectable
  * ^property[=].valueBoolean = true
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
* #AAG "Traumalarm nivå 1"
  * ^definition = "Group of the national trauma alert criteria of level 1, which are red (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Trauma alert level 1"
  * ^property[0].code = #notSelectable
  * ^property[=].valueBoolean = true
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
* #AAH "Traumalarm nivå 2"
  * ^definition = "Group of the national trauma alert criteria of level 2: the mechanism of injury suggests high-energy trauma to an unprotected patient, with a risk of severe injury despite stable vital parameters. They are red (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Trauma alert level 2"
  * ^property[0].code = #notSelectable
  * ^property[=].valueBoolean = true
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
* #AAI "Traumalarm nivå 3"
  * ^definition = "Group of the national trauma alert criteria of level 3, which are yellow (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Trauma alert level 3"
  * ^property[0].code = #notSelectable
  * ^property[=].valueBoolean = true
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
* #AAJ "Trauma/skador som inte uppfyller traumalarmskriterierna"
  * ^definition = "Group of the trauma warning symptoms for a patient who does not meet the trauma alert criteria (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Trauma/injuries not meeting the trauma alert criteria"
  * ^property[0].code = #notSelectable
  * ^property[=].valueBoolean = true
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
* #AAK "Behov och processer"
  * ^definition = "Group of the needs and processes that give yellow as the lowest priority, whatever the chief complaint (WEST-A pages 46-48)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Needs and processes"
  * ^property[0].code = #notSelectable
  * ^property[=].valueBoolean = true
* #1 "Luftväg: stridor, hotad eller ofri luftväg, intuberad/larynxmask"
  * ^definition = "Red warning symptom of the allergy, cardiac arrest/airway obstruction and poisoning algorithms (WEST-A pages 10, 24 and 28)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Airway: stridor, threatened or obstructed airway, intubated/laryngeal mask"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#1 "Allergi"
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#13 "Hjärtstopp/luftvägshinder"
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#17 "Intox"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #2 "Allergisk reaktion: akut och potentiellt allvarlig"
  * ^definition = "Orange warning symptom of the allergy algorithm (WEST-A page 10)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Allergic reaction: acute and potentially serious"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#1 "Allergi"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #3 "Bett av giftigt djur"
  * ^definition = "Yellow warning symptom of the allergy algorithm (WEST-A page 10)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Bite of a venomous animal"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#1 "Allergi"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #4 "Blödning: stor och okontrollerad"
  * ^definition = "Red warning symptom of the bleeding/anemia algorithm (WEST-A page 12)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Bleeding: major and uncontrolled"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#3 "Blödning/anemi"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #5 "Hematemes/pågående melena"
  * ^definition = "Orange warning symptom of the bleeding/anemia algorithm (WEST-A page 12)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Hematemesis/ongoing melena"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#3 "Blödning/anemi"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #6 "Blödning: stor men kontrollerad"
  * ^definition = "Yellow warning symptom of the bleeding/anemia algorithm (WEST-A page 12)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Bleeding: major but controlled"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#3 "Blödning/anemi"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #7 "Hematemes/pågående melena med puls >120"
  * ^definition = "Red warning symptom of the bleeding/anemia algorithm (WEST-A page 12)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Hematemesis/ongoing melena with pulse >120"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#3 "Blödning/anemi"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #8 "Bakre näsblödning/postop tonsillblödning"
  * ^definition = "Orange warning symptom of the bleeding/anemia algorithm (WEST-A page 12)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Posterior nosebleed/postoperative tonsil bleeding"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#3 "Blödning/anemi"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #9 "Hb <60 utan pågående blödning"
  * ^definition = "Yellow warning symptom of the bleeding/anemia algorithm (WEST-A page 12)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Hb <60 g/L without ongoing bleeding"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#3 "Blödning/anemi"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #10 "Riklig vaginalblödning: blöder genom flera nattbindor/tim"
  * ^definition = "Orange warning symptom of the bleeding/anemia and gynecology algorithms (WEST-A pages 12 and 21). Page 21 gives this criterion yellow in the gynecology group for a patient who is not pregnant; page 12 gives it orange. It is orange in both, as the more urgent."
  * ^designation[0].language = #en
  * ^designation[=].value = "Heavy vaginal bleeding: soaking several night pads an hour"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAC
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#3 "Blödning/anemi"
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #11 "Bröstsmärta med ST-höjning/nytillkommet grenblock"
  * ^definition = "Red warning symptom of the chest pain algorithm (WEST-A page 13)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Chest pain with ST elevation/new bundle branch block"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#4 "Bröstsmärta"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #12 "Bröstsmärta med nytillkomna EKG-förändringar"
  * ^definition = "Orange warning symptom of the chest pain algorithm (WEST-A page 13)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Chest pain with new ECG changes"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#4 "Bröstsmärta"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #13 "Bröstsmärta pågående men med låg misstanke om allvarlig orsak och utan tydlig palpömhet"
  * ^definition = "Yellow warning symptom of the chest pain algorithm (WEST-A page 13)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Ongoing chest pain with low suspicion of a serious cause and without clear tenderness on palpation"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#4 "Bröstsmärta"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #14 "Bröstsmärta med svimning eller pågående vegetativa symtom"
  * ^definition = "Red warning symptom of the chest pain algorithm (WEST-A page 13)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Chest pain with fainting or ongoing autonomic symptoms"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#4 "Bröstsmärta"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #15 "Bröstsmärta, pågående med misstanke om AKS eller annan allvarlig orsak"
  * ^definition = "Orange warning symptom of the chest pain algorithm (WEST-A page 13)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Ongoing chest pain with suspected acute coronary syndrome or another serious cause"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#4 "Bröstsmärta"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #16 "Bröstsmärta senaste 24 tim, ej pågående men med misstanke om AKS eller annan allvarlig orsak"
  * ^definition = "Yellow warning symptom of the chest pain algorithm (WEST-A page 13)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Chest pain in the last 24 hours, not ongoing, with suspected acute coronary syndrome or another serious cause"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#4 "Bröstsmärta"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #17 "Bröstsmärta andningskorrelerad med misstanke om allvarlig orsak"
  * ^definition = "Yellow warning symptom of the chest pain algorithm (WEST-A page 13)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Breathing-related chest pain with suspected serious cause"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#4 "Bröstsmärta"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #18 "Buksmärta: plötsligt påkommen, svår (nivå 3) och konstant med SBT <90 och/eller puls >120"
  * ^definition = "Red warning symptom of the abdominal pain algorithm (WEST-A page 14)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Abdominal pain: sudden, severe (level 3) and constant, with systolic blood pressure <90 and/or pulse >120"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#5 "Buksmärta"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #19 "Buksmärta: plötsligt påkommen och svår (nivå 3) eller vegetativa symtom"
  * ^definition = "Orange warning symptom of the abdominal pain algorithm (WEST-A page 14)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Abdominal pain: sudden and severe (level 3), or autonomic symptoms"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#5 "Buksmärta"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #20 "Kräkningar: pågående"
  * ^definition = "Yellow warning symptom of the abdominal pain and diarrhea/vomiting algorithms (WEST-A pages 14 and 16)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Vomiting: ongoing"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#5 "Buksmärta"
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#7 "Diarré/kräkningar"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #21 "Hypoglykemi: Glc <2,5"
  * ^definition = "Red warning symptom of the diabetes algorithm (WEST-A page 15)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Hypoglycemia: glucose <2.5 mmol/L"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#6 "Diabetes"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #22 "Hyperglykemi: Glc >11 + AF ≥22 eller metabol acidos"
  * ^definition = "Orange warning symptom of the diabetes algorithm (WEST-A page 15)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Hyperglycemia: glucose >11 mmol/L with respiratory rate ≥22, or metabolic acidosis"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#6 "Diabetes"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #23 "Dyspné med skummande andning"
  * ^definition = "Red warning symptom of the dyspnea algorithm (WEST-A page 17)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Dyspnea with foaming breathing"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#8 "Dyspné"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #24 "Dyspné: akut svår/synligt ansträngd andning/cyanos/utmattad patient"
  * ^definition = "Orange warning symptom of the dyspnea algorithm (WEST-A page 17)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Dyspnea: acute and severe/visibly labored breathing/cyanosis/exhausted patient"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#8 "Dyspné"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #25 "Dyspné: kraftig med ST-höjning/nytillkommet grenblock"
  * ^definition = "Red warning symptom of the dyspnea algorithm (WEST-A page 17)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Dyspnea: severe, with ST elevation/new bundle branch block"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#8 "Dyspné"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #26 "Dyspné: nytillkommen med nytillkomna EKG-förändringar"
  * ^definition = "Orange warning symptom of the dyspnea algorithm (WEST-A page 17)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Dyspnea: new, with new ECG changes"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#8 "Dyspné"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #27 "Akut ischemi (blek och kall extremitet)"
  * ^definition = "Orange warning symptom of the limb problem algorithm (WEST-A page 18)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Acute ischemia (pale and cold limb)"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#9 "Extremitetsproblem"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #28 "Extremitetssmärta/-svullnad med nytillkommen dyspné"
  * ^definition = "Yellow warning symptom of the limb problem algorithm (WEST-A page 18)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Limb pain/swelling with new dyspnea"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#9 "Extremitetsproblem"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #29 "Intraartikulär svullnad, rodnad led (en led) med feber/misstänkt infektion"
  * ^definition = "Yellow warning symptom of the limb problem algorithm (WEST-A page 18)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Intra-articular swelling, red joint (one joint) with fever/suspected infection"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#9 "Extremitetsproblem"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #30 "Gravid med kraftig vaginal blödning (blöder genom flera nattbindor/tim)"
  * ^definition = "Red warning symptom of the pregnancy from week 18+0/postpartum algorithm (WEST-A page 19)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Pregnant with heavy vaginal bleeding (soaking several night pads an hour)"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#10 "Graviditet fr.o.m. 18+0/postpartum"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #31 "Gravid med måttlig vaginal blödning (mer än kraftig mens)"
  * ^definition = "Orange warning symptom of the pregnancy from week 18+0/postpartum algorithm (WEST-A page 19)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Pregnant with moderate vaginal bleeding (more than a heavy period)"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#10 "Graviditet fr.o.m. 18+0/postpartum"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #32 "Gravid med pågående eller genomgånget krampanfall (t.o.m. 2 v efter födsel)"
  * ^definition = "Red warning symptom of the pregnancy from week 18+0/postpartum algorithm (WEST-A page 19)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Pregnant with an ongoing or past seizure (up to 2 weeks after delivery)"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#10 "Graviditet fr.o.m. 18+0/postpartum"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #33 "Gravid med kraftig buksmärta, ihållande eller intervallsmärta"
  * ^definition = "Orange warning symptom of the pregnancy from week 18+0/postpartum algorithm (WEST-A page 19)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Pregnant with severe abdominal pain, constant or intermittent"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#10 "Graviditet fr.o.m. 18+0/postpartum"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #34 "Gravid, planerad eller spontan abort med misstänkt infektion, gynkonsult"
  * ^definition = "Yellow warning symptom of the pregnancy from week 18+0/postpartum algorithm (WEST-A page 19)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Pregnant, planned or spontaneous abortion with suspected infection; gynecology consultation"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#10 "Graviditet fr.o.m. 18+0/postpartum"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #35 "Gravid med snabbt insättande starka buksmärtor"
  * ^definition = "Red warning symptom of the pregnancy from week 18+0/postpartum algorithm (WEST-A page 19)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Pregnant with rapid-onset severe abdominal pain"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#10 "Graviditet fr.o.m. 18+0/postpartum"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #36 "Gravid + huvudvärk el. buksmärta el. bröstsmärta el. kräkning + BT >140/90 (preeklampsi)"
  * ^definition = "Orange warning symptom of the pregnancy from week 18+0/postpartum algorithm (WEST-A page 19)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Pregnant with headache, abdominal pain, chest pain or vomiting, and blood pressure >140/90 (preeclampsia)"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#10 "Graviditet fr.o.m. 18+0/postpartum"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #37 "Gravid med SBT >160 eller DBT >110"
  * ^definition = "Red warning symptom of the pregnancy from week 18+0/postpartum algorithm (WEST-A page 19)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Pregnant with systolic blood pressure >160 or diastolic >110"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#10 "Graviditet fr.o.m. 18+0/postpartum"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #38 "Postpartum (inom 14 d) med feber >38"
  * ^definition = "Orange warning symptom of the pregnancy from week 18+0/postpartum algorithm (WEST-A page 19)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Postpartum (within 14 days) with fever >38 °C"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#10 "Graviditet fr.o.m. 18+0/postpartum"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #39 "Gravid och trauma mot buken"
  * ^definition = "Orange warning symptom of the pregnancy from week 18+0/postpartum algorithm (WEST-A page 19)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Pregnant with abdominal trauma"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#10 "Graviditet fr.o.m. 18+0/postpartum"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #40 "Plötsligt påkommen lågt sittande buksmärta och chock med/utan större vaginal blödning"
  * ^definition = "Red warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Sudden low abdominal pain and shock, with or without major vaginal bleeding"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAA
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #41 "Lågt sittande svår buksmärta och puls >120 trots given smärtlindring (med/utan större vaginal blödning)"
  * ^definition = "Orange warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Severe low abdominal pain and pulse >120 despite pain relief (with or without major vaginal bleeding)"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAA
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #42 "Feber med frossa"
  * ^definition = "Orange warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Fever with chills"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAA
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #43 "Lågt sittande buksmärta"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Low abdominal pain"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAA
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #44 "Pågående missfall >v 10 enl. ultraljud"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Ongoing miscarriage beyond week 10 by ultrasound"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAA
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #45 "Feber/CRP och lågt sittande buksmärta/blödning"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Fever/raised CRP and low abdominal pain/bleeding"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAA
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #46 "Buksvullnad, buksmärta och ökad AF i samband med inledd IVF-behandling"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21). Suspected ovarian hyperstimulation syndrome (OHSS)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Abdominal swelling, abdominal pain and raised respiratory rate after starting IVF treatment"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAA
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #47 "Remiss från gynekolog med misstanke om extrauterin graviditet utan ovanstående symtom"
  * ^definition = "Green criterion of the gynecology algorithm (WEST-A page 22), which applies from 07:00 to 16:00 (\"GRÖN 07-16\")."
  * ^designation[0].language = #en
  * ^designation[=].value = "Referral from a gynecologist for suspected ectopic pregnancy, without the symptoms above"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAA
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#4 "Grön"
* #48 "Lågt sittande, sidoförskjutet bukobehag med eller utan mindre vaginal blödning där intrauterin graviditet ej konstaterats"
  * ^definition = "Green criterion of the gynecology algorithm (WEST-A page 22), which applies from 07:00 to 16:00 (\"GRÖN 07-16\")."
  * ^designation[0].language = #en
  * ^designation[=].value = "Low, one-sided abdominal discomfort with or without minor vaginal bleeding, where intrauterine pregnancy has not been confirmed"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAA
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#4 "Grön"
* #49 "Lågt sittande centralt bukobehag med avtagande graviditetssymtom >v 10"
  * ^definition = "Green criterion of the gynecology algorithm (WEST-A page 22), which applies from 07:00 to 16:00 (\"GRÖN 07-16\")."
  * ^designation[0].language = #en
  * ^designation[=].value = "Low central abdominal discomfort with fading pregnancy symptoms beyond week 10"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAA
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#4 "Grön"
* #50 "Övrig blödning i tidig graviditet"
  * ^definition = "Green criterion of the gynecology algorithm (WEST-A page 22), which applies from 07:00 to 16:00 (\"GRÖN 07-16\")."
  * ^designation[0].language = #en
  * ^designation[=].value = "Other bleeding in early pregnancy"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAA
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#4 "Grön"
* #51 "PUQE-score 13-15 p trots behandling, som ej kan anstå till nästa dag"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "PUQE score 13-15 despite treatment, which cannot wait until the next day"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAB
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #52 "PUQE-score <13 p: råd i triage och hänvisning till vårdcentral"
  * ^definition = "Green criterion of the gynecology algorithm (WEST-A page 22), which applies from 07:00 to 16:00 (\"GRÖN 07-16\")."
  * ^designation[0].language = #en
  * ^designation[=].value = "PUQE score <13: advice at triage and referral to primary care"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAB
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#4 "Grön"
* #53 "Blödning och chock"
  * ^definition = "Red warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Bleeding and shock"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAC
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #54 "Puls >120 eller svår smärta trots given smärtlindring"
  * ^definition = "Orange warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Pulse >120 or severe pain despite pain relief"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAC
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #55 "Feber och lågt sittande bukbesvär med förhöjt CRP"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Fever and low abdominal complaints with raised CRP"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAC
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #56 "Känd endometrios eller under utredning för svår dysmenorré (när andra orsaker till smärtan är uteslutna) som inte klarar sig på åtgärder patienten har hemma"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Known endometriosis, or under investigation for severe dysmenorrhea (other causes of the pain excluded), not managing with the measures available at home"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAC
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #57 "Några dygns anamnes på lågt sittande buksmärta och flytningar/blödningar"
  * ^definition = "Green criterion of the gynecology algorithm (WEST-A page 22), which applies from 07:00 to 16:00 (\"GRÖN 07-16\")."
  * ^designation[0].language = #en
  * ^designation[=].value = "A few days' history of low abdominal pain and discharge/bleeding"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAC
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#4 "Grön"
* #58 "Prolapsring som trillat ut och orsakar handikappande framfall"
  * ^definition = "Green criterion of the gynecology algorithm (WEST-A page 22), which applies from 07:00 to 16:00 (\"GRÖN 07-16\")."
  * ^designation[0].language = #en
  * ^designation[=].value = "Prolapse ring that has fallen out, causing disabling prolapse"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAC
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#4 "Grön"
* #59 "Blödning från plats för suturer"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Bleeding from the suture site"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAD
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #60 "Vaginaltoppsruptur"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21). After a hysterectomy the top of the vagina is sutured, and can rupture; it rarely bleeds or hurts, but needs assessment because of the risk of bowel prolapse and infection."
  * ^designation[0].language = #en
  * ^designation[=].value = "Vaginal cuff rupture"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAD
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #61 "Smärta trots smärtlindring som ej kan anstå till nästa dag"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Pain despite pain relief that cannot wait until the next day"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAD
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #62 "Komplikation med obehag, lättare smärta relaterat till operationen"
  * ^definition = "Green criterion of the gynecology algorithm (WEST-A page 22), which applies from 07:00 to 16:00 (\"GRÖN 07-16\")."
  * ^designation[0].language = #en
  * ^designation[=].value = "Complication with discomfort or mild pain related to the operation"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAD
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#4 "Grön"
* #63 "Svår buksmärta"
  * ^definition = "Orange warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Severe abdominal pain"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAE
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #64 "Ej kissat på 6 timmar"
  * ^definition = "Orange warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Has not passed urine for 6 hours"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAE
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #65 "Svårighet att tömma blåsan (med eller utan prolapsring)"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Difficulty emptying the bladder (with or without a prolapse ring)"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAE
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #66 "Ring som trillat ut och orsakar funktionshindrande framfall"
  * ^definition = "Green criterion of the gynecology algorithm (WEST-A page 22), which applies from 07:00 to 16:00 (\"GRÖN 07-16\")."
  * ^designation[0].language = #en
  * ^designation[=].value = "Ring that has fallen out, causing prolapse that impairs function"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAE
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#4 "Grön"
* #67 "Uttalad smärta, svårt att sitta/röra sig, feber"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Marked pain, difficulty sitting/moving, fever"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAF
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #68 "Svårt att kissa"
  * ^definition = "Yellow warning symptom of the gynecology algorithm (WEST-A page 21)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Difficulty passing urine"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAF
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #69 "Bartolinit/vulvaabscess utan uttalade besvär enligt ovan"
  * ^definition = "Green criterion of the gynecology algorithm (WEST-A page 22), which applies from 07:00 to 16:00 (\"GRÖN 07-16\")."
  * ^designation[0].language = #en
  * ^designation[=].value = "Bartholinitis/vulvar abscess without the marked complaints above"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAF
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#4 "Grön"
* #70 "Wordkateter som trillat ut <6 tim efter insättning"
  * ^definition = "Green criterion of the gynecology algorithm (WEST-A page 22), which applies from 07:00 to 16:00 (\"GRÖN 07-16\")."
  * ^designation[0].language = #en
  * ^designation[=].value = "Word catheter that has fallen out less than 6 hours after insertion"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAF
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#11 "Gynekologiska sökorsaker (från 16 år)"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#4 "Grön"
* #71 "Takykardi: breddökad (som orsak till vårdtillfället)"
  * ^definition = "Orange warning symptom of the heart rhythm algorithm (WEST-A page 23)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Tachycardia: wide-complex (as the reason for the visit)"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#12 "Hjärtrytm"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #72 "Hjärtstopp: pågående/åtgärdat"
  * ^definition = "Red warning symptom of the cardiac arrest/airway obstruction algorithm (WEST-A page 24)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Cardiac arrest: ongoing/treated"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#13 "Hjärtstopp/luftvägshinder"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #73 "Huvudvärk: urakut debut och intensiv"
  * ^definition = "Orange warning symptom of the headache algorithm (WEST-A page 26)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Headache: thunderclap onset and intense"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#15 "Huvudvärk"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #74 "Infektion: misstänkt + NEWS2 ≥7"
  * ^definition = "Red warning symptom of the infection/fever/sepsis algorithm (WEST-A page 27)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Infection: suspected, with NEWS2 ≥7"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#16 "Infektion/feber/sepsis"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #75 "Infektion: misstänkt samt NEWS2 5-6"
  * ^definition = "Orange warning symptom of the infection/fever/sepsis algorithm (WEST-A page 27)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Infection: suspected, with NEWS2 5-6"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#16 "Infektion/feber/sepsis"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #76 "Infektion med feber, påverkad och nackstel/meningism/petekier"
  * ^definition = "Red warning symptom of the infection/fever/sepsis algorithm (WEST-A page 27)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Infection with fever, affected general condition and neck stiffness/meningism/petechiae"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#16 "Infektion/feber/sepsis"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #77 "Infektion: misstänkt med pågående cytostatikabehandling/immunsupprimerad"
  * ^definition = "Orange warning symptom of the infection/fever/sepsis algorithm (WEST-A page 27)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Infection: suspected, during chemotherapy or immunosuppression"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#16 "Infektion/feber/sepsis"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #78 "Intox: akut och allvarlig eller suicidal"
  * ^definition = "Orange warning symptom of the poisoning algorithm (WEST-A page 28)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Poisoning: acute and serious, or suicidal"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#17 "Intox"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #79 "Bett av giftig orm"
  * ^definition = "Yellow warning symptom of the poisoning algorithm (WEST-A page 28)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Bite of a venomous snake"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#17 "Intox"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #80 "Medvetslös"
  * ^definition = "Red warning symptom of the poisoning and altered consciousness algorithms (WEST-A pages 28 and 32)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Unconscious"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#17 "Intox"
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#21 "Medvetandepåverkan"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #81 "Sänkt medvetande: nytillkommet"
  * ^definition = "Orange warning symptom of the poisoning, altered consciousness and neurology/dizziness/seizures algorithms (WEST-A pages 28, 32 and 33)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Reduced consciousness: new"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#17 "Intox"
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#21 "Medvetandepåverkan"
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#22 "Neuro/yrsel/kramper"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #82 "Förvirring: nytillkommen"
  * ^definition = "Orange warning symptom of the poisoning and altered consciousness algorithms (WEST-A pages 28 and 32)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Confusion: new"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#17 "Intox"
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#21 "Medvetandepåverkan"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #83 "Inklämt ljumskbråck"
  * ^definition = "Orange warning symptom of the groin algorithm (WEST-A page 31)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Incarcerated inguinal hernia"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#20 "Ljumske"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #84 "Strokemisstanke med symtom ≤4,5 tim och mNIHSS ≥1 p"
  * ^definition = "Red warning symptom of the neurology/dizziness/seizures algorithm (WEST-A page 33)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Suspected stroke with symptoms for ≤4.5 hours and mNIHSS ≥1"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#22 "Neuro/yrsel/kramper"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #85 "Strokemisstanke med symtom >24 tim och mNIHSS ≥2 p"
  * ^definition = "Yellow warning symptom of the neurology/dizziness/seizures algorithm (WEST-A page 33)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Suspected stroke with symptoms for >24 hours and mNIHSS ≥2"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#22 "Neuro/yrsel/kramper"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #86 "Strokemisstanke med symtom 4,5-24 tim alt. okänd debut och mNIHSS ≥2 p"
  * ^definition = "Red warning symptom of the neurology/dizziness/seizures algorithm (WEST-A page 33)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Suspected stroke with symptoms for 4.5-24 hours or unknown onset, and mNIHSS ≥2"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#22 "Neuro/yrsel/kramper"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #87 "Strokemisstanke med symtom 4,5-24 tim alt. okänd debut och mNIHSS 1 p"
  * ^definition = "Yellow warning symptom of the neurology/dizziness/seizures algorithm (WEST-A page 33)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Suspected stroke with symptoms for 4.5-24 hours or unknown onset, and mNIHSS 1"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#22 "Neuro/yrsel/kramper"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #88 "Yrsel: akut påkommen med symtom ≤4,5 tim och mNIHSS ≥1 p"
  * ^definition = "Red warning symptom of the neurology/dizziness/seizures algorithm (WEST-A page 33)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Dizziness: acute, with symptoms for ≤4.5 hours and mNIHSS ≥1"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#22 "Neuro/yrsel/kramper"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #89 "Yrsel: akut påkommen med symtom >24 tim och mNIHSS ≥2 p"
  * ^definition = "Yellow warning symptom of the neurology/dizziness/seizures algorithm (WEST-A page 33)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Dizziness: acute, with symptoms for >24 hours and mNIHSS ≥2"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#22 "Neuro/yrsel/kramper"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #90 "Kramper: pågående"
  * ^definition = "Red warning symptom of the neurology/dizziness/seizures algorithm (WEST-A page 33)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Seizures: ongoing"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#22 "Neuro/yrsel/kramper"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #91 "Yrsel: akut påkommen med symtom 4,5-24 tim alt. okänd debut och mNIHSS 1 p"
  * ^definition = "Yellow warning symptom of the neurology/dizziness/seizures algorithm (WEST-A page 33)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Dizziness: acute, with symptoms for 4.5-24 hours or unknown onset, and mNIHSS 1"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#22 "Neuro/yrsel/kramper"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #92 "TIA: senaste 24 tim, nu symtomfri"
  * ^definition = "Yellow warning symptom of the neurology/dizziness/seizures algorithm (WEST-A page 33)."
  * ^designation[0].language = #en
  * ^designation[=].value = "TIA: in the last 24 hours, now symptom-free"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#22 "Neuro/yrsel/kramper"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #93 "Kalium ≥6,0 och EKG-förändringar"
  * ^definition = "Red warning symptom of the non-specific illness algorithm (WEST-A page 35)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Potassium ≥6.0 mmol/L with ECG changes"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#23 "Ospecifik sjukdom"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #94 "Känd Addisons sjukdom eller binjurebarkssvikt"
  * ^definition = "Orange warning symptom of the non-specific illness algorithm (WEST-A page 35)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Known Addison's disease or adrenal insufficiency"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#23 "Ospecifik sjukdom"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #95 "Pågående suicidförsök eller misstänkt allvarlig kroppsskada, mekanisk skada eller intag av substanser; ska bedömas på somatisk akutmottagning"
  * ^definition = "Red warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Ongoing suicide attempt, or suspected serious bodily harm from mechanical injury or ingested substances; to be assessed at a somatic emergency department"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #96 "Pågående våld eller agerande eller annat beteende som kräver fysiskt ingripande"
  * ^definition = "Red warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Ongoing violence, or acting out or other behavior that requires physical intervention"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #97 "Delirium tremens"
  * ^definition = "Red warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Delirium tremens"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #98 "Överhängande pågående suicidavsikt"
  * ^definition = "Orange warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Imminent ongoing suicidal intent"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #99 "Fysiskt hotfull"
  * ^definition = "Orange warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Physically threatening"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #100 "Ätstörning i verifierat metabolt tillstånd (blodgas pH, BE eller laktat) eller sjunkande medvetande inom de senaste 12 timmarna"
  * ^definition = "Orange warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Eating disorder with a verified metabolic disturbance (blood gas pH, base excess or lactate), or falling consciousness in the last 12 hours"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #101 "Katatoni"
  * ^definition = "Orange warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Catatonia"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #102 "Abstinens med risk för EP och DT (somatisk påverkan)"
  * ^definition = "Orange warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Withdrawal with risk of seizures and delirium tremens (somatically affected)"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #103 "Pågående självskada"
  * ^definition = "Yellow warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Ongoing self-harm"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #104 "Övrig suicidalitet, steg 5 eller mer på suicidstegen"
  * ^definition = "Yellow warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Other suicidality, step 5 or higher on the suicide ladder"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #105 "Verbalt hotfull"
  * ^definition = "Yellow warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Verbally threatening"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #106 "Ätstörning, ny eller försämrad, och inte i stånd att ta hand om sig själv"
  * ^definition = "Yellow warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Eating disorder, new or worse, and unable to take care of oneself"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #107 "Frihetsberövad"
  * ^definition = "Yellow warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Deprived of liberty"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #108 "Nytillkommen avvikande verklighetsuppfattning/beteende"
  * ^definition = "Yellow warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "New abnormal perception of reality or behavior"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #109 "Påtagliga hämningar"
  * ^definition = "Yellow warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Marked inhibition"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #110 "Konfusion/dissociation"
  * ^definition = "Yellow warning symptom of the mental health problems algorithm (WEST-A page 36)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Confusion/dissociation"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#24 "Psykiska besvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #111 "Ryggsmärta med nytillkommen ridbyxanestesi eller inkontinens"
  * ^definition = "Orange warning symptom of the back pain algorithm (WEST-A page 39)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Back pain with new saddle anesthesia or incontinence"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#26 "Ryggsmärta"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #112 "Svimning: helt utan förkänning"
  * ^definition = "Orange warning symptom of the fainting algorithm (WEST-A page 40)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Fainting: without any warning"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#27 "Svimning"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #113 "Underlivssmärtor/skrotumsmärtor: hastigt påkommande, kraftiga och ihållande"
  * ^definition = "Orange warning symptom of the male genital problems algorithm (WEST-A page 41)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Genital or scrotal pain: sudden, severe and persistent"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#28 "Underlivsbesvär män"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #114 "Urostopp"
  * ^definition = "Yellow warning symptom of the urinary tract problems algorithm (WEST-A page 42)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Urinary retention"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#29 "Urinvägsbesvär"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #115 "Behov av ventilationsstöd"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Needs ventilatory support"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #116 "AF <10 eller >29"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Respiratory rate <10 or >29"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #117 "BT <90 eller ej palpabel radialispuls"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Blood pressure <90 or no palpable radial pulse"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #118 "RLS ≥3 eller GCS ≤13"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "RLS ≥3 or GCS ≤13"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #119 "Penetrerande våld mot huvud, hals, bål, extremiteter ovan armbåge/knä (inte ytliga skärsår)"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Penetrating injury to the head, neck, trunk, or limbs above the elbow/knee (not superficial cuts)"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #120 "Öppen skallskada/impressionsfraktur"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Open skull injury/depressed skull fracture"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #121 "Ansikts-/halsskada med hotad luftväg"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Face or neck injury with threatened airway"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #122 "Instabil/deformerad bröstkorg"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Unstable/deformed chest wall"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #123 "Svår smärta i bäckenet (misstänkt bäckenfraktur)"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Severe pelvic pain (suspected pelvic fracture)"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #124 "Misstänkt ryggmärgsskada"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Suspected spinal cord injury"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #125 "≥2 frakturer på långa rörben"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Fractures of ≥2 long bones"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #126 "Amputation ovan hand/fot"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Amputation above the hand/foot"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #127 "Stor yttre blödning"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Major external bleeding"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #128 "Brännskada ≥18 % eller inhalationsskada"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Burn ≥18% or inhalation injury"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAG
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #129 "Bilolycka >50 km/tim utan bilbälte"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Car crash >50 km/h without a seat belt"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAH
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #130 "Utkastad ur fordon"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Ejected from a vehicle"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAH
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #131 "Fastklämd med losstagning >20 min"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Trapped, with extrication taking >20 minutes"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAH
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #132 "MC-olycka (eller motsvarande) >35 km/tim"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Motorcycle crash (or similar) >35 km/h"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAH
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #133 "Fall >5 m"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Fall from >5 m"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAH
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #134 "Fall >3 m"
  * ^definition = "Yellow warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Fall from >3 m"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAI
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #135 "Trafikolycka med misstanke om högenergivåld"
  * ^definition = "Yellow warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Traffic accident with suspected high-energy trauma"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAI
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #136 "MC-/mopedolycka >35 km/tim"
  * ^definition = "Yellow warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Motorcycle or moped crash >35 km/h"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAI
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #137 "Hästolycka"
  * ^definition = "Yellow warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Horse-related accident"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAI
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #138 "Oskyddad trafikant"
  * ^definition = "Yellow warning symptom of the trauma/injuries algorithm (WEST-A page 43)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Unprotected road user"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAI
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #139 "Hängning/strypning"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Hanging/strangulation"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #140 "Ögonskada: penetrerande eller frätande"
  * ^definition = "Red warning symptom of the trauma/injuries and eyes and ears algorithms (WEST-A pages 44 and 45)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Eye injury: penetrating or corrosive"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#31 "Ögon och öron"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #141 "Buk-/thoraxtrauma med tilltagande smärta/omfång, urostopp eller hematuri"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Abdominal or chest trauma with increasing pain or girth, urinary retention or hematuria"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #142 "Fraktur med misstänkt kärlskada (nedsatt cirkulation distalt, blek och kall extremitet) eller nervskada"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Fracture with suspected vascular injury (reduced distal circulation, pale and cold limb) or nerve injury"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #143 "Drunkning/dykolycka"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Drowning/diving accident"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #144 "Kemolycka/strålskada"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Chemical accident/radiation injury"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #145 "Elolycka: högspänning/blixt"
  * ^definition = "Red warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Electrical injury: high voltage/lightning"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #146 "Skalltrauma med GCS ≤14, eller GCS 15 och 1 av: blödningsrisk (Waran/NOAK, dubbel trombocythämmare eller blödarsjuka), krampanfall, neurologiska avvikelser, shuntbehandling"
  * ^definition = "Orange warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Head injury with GCS ≤14, or GCS 15 and one of: bleeding risk (warfarin/DOAC, dual antiplatelet therapy or bleeding disorder), seizure, neurological abnormality, shunt"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #147 "Buk-/thoraxtrauma med vegetativa symtom"
  * ^definition = "Orange warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Abdominal or chest trauma with autonomic symptoms"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #148 "Ledluxation (ej fingrar/tår), protesluxation eller luxationsfraktur"
  * ^definition = "Orange warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Joint dislocation (not fingers or toes), prosthesis dislocation or fracture-dislocation"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #149 "Fraktur: öppen, felställd eller höftnära"
  * ^definition = "Orange warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Fracture: open, displaced or of the hip"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #150 "Brännskada/frätskada 5-18 % eller cirkumferent"
  * ^definition = "Orange warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Burn or corrosive injury of 5-18%, or circumferential"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #151 "Skalltrauma: GCS 15 och varit avsvimmad el. amnesi el. upprepade kräkningar"
  * ^definition = "Yellow warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Head injury: GCS 15 with loss of consciousness, amnesia or repeated vomiting"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #152 "GCS 15 och ≥65 år med trombocythämmare"
  * ^definition = "Yellow warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "GCS 15, age 65 or more, on antiplatelet therapy"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #153 "Nackskada: med palpömhet över kotpelaren"
  * ^definition = "Yellow warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Neck injury with tenderness over the spine"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #154 "Skada: med oproportionerlig smärtnivå"
  * ^definition = "Yellow warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Injury with disproportionate pain"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #155 "Fraktur: stark misstanke, aktuell (<48 tim efter skadetillfället)"
  * ^definition = "Yellow warning symptom of the trauma/injuries algorithm (WEST-A page 44)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Fracture: strongly suspected, recent (<48 hours after the injury)"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAJ
  * ^property[+].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#30 "Trauma/skador"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #156 "Ofri eller hotad luftväg"
  * ^definition = "Red warning symptom of the eyes and ears algorithm (WEST-A page 45). With an injury, see trauma."
  * ^designation[0].language = #en
  * ^designation[=].value = "Obstructed or threatened airway"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#31 "Ögon och öron"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#1 "Röd"
* #157 "Svalt knappcellsbatteri eller ≥2 magneter"
  * ^definition = "Orange warning symptom of the eyes and ears algorithm (WEST-A page 45)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Swallowed button battery or ≥2 magnets"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#31 "Ögon och öron"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#2 "Orange"
* #158 "Stopp i esofagus, kan inte svälja saliv"
  * ^definition = "Yellow warning symptom of the eyes and ears algorithm (WEST-A page 45)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Esophageal obstruction, cannot swallow saliva"
  * ^property[0].code = #complaint
  * ^property[=].valueCoding = ChiefComplaintCS#31 "Ögon och öron"
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #159 "Skör äldre enligt screening (FRESH)"
  * ^definition = "Need or process that gives yellow as the lowest priority (WEST-A page 46). Age 75 or more with 2 or more points on the modified FRESH screening: living in a care home (2 points), reduced endurance, general tiredness for less than 2 months, frequent falls or fear of falling, and needing help with shopping (1 point each). Prioritized first within its colour."
  * ^designation[0].language = #en
  * ^designation[=].value = "Frail elderly by screening (FRESH)"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAK
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #160 "Sannolikt slutenvårdsbehov"
  * ^definition = "Need or process that gives yellow as the lowest priority (WEST-A page 47)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Likely to need inpatient care"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAK
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #161 "Sexuellt övergrepp: påtalat eller misstänkt"
  * ^definition = "Need or process that gives yellow as the lowest priority (WEST-A page 48)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Sexual assault: reported or suspected"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAK
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #162 "Våld i nära relation: påtalat eller misstänkt"
  * ^definition = "Need or process that gives yellow as the lowest priority (WEST-A page 48)."
  * ^designation[0].language = #en
  * ^designation[=].value = "Intimate partner violence: reported or suspected"
  * ^property[0].code = #parent
  * ^property[=].valueCode = #AAK
  * ^property[+].code = #priority
  * ^property[=].valueCoding = TriagePriorityCS#3 "Gul"
* #163 "Inga varningssymtom"
  * ^definition = "The triage nurse has assessed the warning symptoms of the chief complaint algorithm, and none of them applies."
  * ^designation[0].language = #en
  * ^designation[=].value = "No warning symptoms"
