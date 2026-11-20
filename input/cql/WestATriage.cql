/*
@description: The parts of the WEST-A triage priority that can be calculated (WEST-A VGR 2025):
 the priority from the vital parameters (NEWS2 clinical risk, p. 6), and the proposed priority,
 which is the most urgent of that, the priority of the warning symptoms of the chief complaint
 algorithm (pp. 3-48), and yellow as the lowest priority for some needs and processes (pp. 46-48).
 The triage nurse assesses the warning symptoms and the needs, and the criteria found are passed
 as codes from the WEST-A triage criterion code system; this logic gives each its priority, and
 proposes a priority only when NEWS2 is calculated and the warning symptoms are assessed. While the
 triage is under way, it gives a provisional priority from what is known so far, a lower bound.
 The clinical assessment can raise the priority, but never lowers a red or orange patient (p. 8);
 that is the nurse's decision, so it is not calculated.
*/
library WestATriage version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers
include WestANEWS2 version '0.1.0' called NEWS2

codesystem "WEST-A Triage Priority": 'https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-triage-priority-cs'

code "Red": '1' from "WEST-A Triage Priority" display 'Red'
code "Orange": '2' from "WEST-A Triage Priority" display 'Orange'
code "Yellow": '3' from "WEST-A Triage Priority" display 'Yellow'
code "Green": '4' from "WEST-A Triage Priority" display 'Green'

codesystem "WEST-A Triage Criterion": 'https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-triage-criterion-cs'

code "No Warning Symptoms": '163' from "WEST-A Triage Criterion" display 'No warning symptoms'

// The triage criteria the nurse found, codes from the WEST-A triage criterion code system: the
// warning symptoms of the chief complaint algorithm (or "No Warning Symptoms" when none applies),
// and the needs and processes. Null when not yet assessed.
parameter "Triage Criteria" List<System.Code>

// The priority of the most urgent warning symptom the nurse found in the chief complaint
// algorithm, a code from the WEST-A triage priority code system: 4 (green) when the patient
// has none of its warning symptoms, null when not yet assessed. For a client that does not
// code the warning symptoms in "Triage Criteria", or for one that is not coded; the most
// urgent of the two counts, so it never lowers the priority of a coded warning symptom.
parameter "Complaint Priority" System.Code

// Frail elderly (p. 46), likely admission (p. 47), or violence or sexual assault (p. 48), for a
// client that does not pass them as triage criteria
parameter "Yellow As Lowest Priority" Boolean default false

// NEWS2 oxygen saturation scale 2, for a patient with known respiratory failure, on a
// physician's order (see WestANEWS2)
parameter "Use Oxygen Saturation Scale 2" Boolean default false

context Patient

// This library's code for a priority code from a client, which may lack the display or
// carry another one; null for a code that is not a WEST-A triage priority
define function "Priority Code"(priority System.Code):
  if priority.system != 'https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-triage-priority-cs' then null
  else case priority.code
    when '1' then "Red"
    when '2' then "Orange"
    when '3' then "Yellow"
    when '4' then "Green"
    else null
  end

// The codes of the triage priority code system sort from most urgent (1) to least urgent (4)
define function "Most Urgent"(priorities List<System.Code>):
  First(
    priorities P
      where P is not null
      sort by code
  )

// The codes of the WEST-A triage criterion code system by the priority they give; the
// build's tests check them against the priority property of every concept of the code system.
// Green criteria apply from 07:00 to 16:00 (gynecology, p. 22); the logic does not check the time.
define "Red Warning Symptom Codes":
  { '1', '4', '7', '11', '14', '18', '21', '23', '25', '30', '32', '35', '37', '40', '53', '72',
    '74', '76', '80', '84', '86', '88', '90', '93', '95', '96', '97', '115', '116', '117', '118',
    '119', '120', '121', '122', '123', '124', '125', '126', '127', '128', '129', '130', '131',
    '132', '133', '139', '140', '141', '142', '143', '144', '145', '156' }

define "Orange Warning Symptom Codes":
  { '2', '5', '8', '10', '12', '15', '19', '22', '24', '26', '27', '31', '33', '36', '38', '39',
    '41', '42', '54', '63', '64', '71', '73', '75', '77', '78', '81', '82', '83', '94', '98', '99',
    '100', '101', '102', '111', '112', '113', '146', '147', '148', '149', '150', '157' }

define "Yellow Warning Symptom Codes":
  { '3', '6', '9', '13', '16', '17', '20', '28', '29', '34', '43', '44', '45', '46', '51', '55',
    '56', '59', '60', '61', '65', '67', '68', '79', '85', '87', '89', '91', '92', '103', '104',
    '105', '106', '107', '108', '109', '110', '114', '134', '135', '136', '137', '138', '151',
    '152', '153', '154', '155', '158' }

define "Green Warning Symptom Codes":
  { '47', '48', '49', '50', '52', '57', '58', '62', '66', '69', '70' }

define "Need Codes":
  { '159', '160', '161', '162' }

// The priority of a warning symptom, Green for "No Warning Symptoms"; null for a need, a group
// of criteria, or a code that is not a WEST-A triage criterion
define function "Warning Symptom Priority Of"(criterion System.Code):
  if criterion.system != 'https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-triage-criterion-cs' then null
  else if criterion.code in "Red Warning Symptom Codes" then "Red"
  else if criterion.code in "Orange Warning Symptom Codes" then "Orange"
  else if criterion.code in "Yellow Warning Symptom Codes" then "Yellow"
  else if criterion.code in "Green Warning Symptom Codes" or criterion.code = "No Warning Symptoms".code then "Green"
  else null

// The most urgent priority of the warning symptoms found; null when none was passed
define "Warning Symptom Priority":
  "Most Urgent"(("Triage Criteria") C return "Warning Symptom Priority Of"(C))

define "Needs Found":
  ("Triage Criteria") C
    where C.system = 'https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-triage-criterion-cs'
      and C.code in "Need Codes"

// The warning symptoms are assessed when the nurse passed a warning symptom, "No Warning
// Symptoms", or a Complaint Priority
define "Assessed Complaint Priority":
  "Most Urgent"({ "Priority Code"("Complaint Priority"), "Warning Symptom Priority" })

// WEST-A p. 6: the colour of each NEWS2 clinical risk band
define function "Priority For Risk"(risk String):
  case risk
    when 'high' then "Red"
    when 'medium' then "Orange"
    when 'low-medium' then "Yellow"
    when 'low' then "Green"
    else null
  end

define "Vital Parameter Priority":
  "Priority For Risk"(NEWS2."Clinical Risk For"("Use Oxygen Saturation Scale 2"))

// The colour of the provisional NEWS2 clinical risk: a lower bound until all seven
// parameters are measured
define "Provisional Vital Parameter Priority":
  "Priority For Risk"(NEWS2."Provisional Clinical Risk For"("Use Oxygen Saturation Scale 2"))

// A need from the triage criteria, or the parameter for a client that does not code them
define "Lowest Priority From Needs":
  if "Yellow As Lowest Priority" or exists "Needs Found" then "Yellow" else null

// Proposed only when NEWS2 is calculated and the warning symptoms are assessed: without
// either, the logic cannot know that nothing more urgent applies
define "Proposed Priority":
  if "Vital Parameter Priority" is null or "Assessed Complaint Priority" is null then null
  else "Most Urgent"({ "Vital Parameter Priority", "Assessed Complaint Priority", "Lowest Priority From Needs" })

define "Proposed Priority Is Red":
  "Proposed Priority" ~ "Red"

define "Proposed Priority Is Orange":
  "Proposed Priority" ~ "Orange"

define "Proposed Priority Is Yellow":
  "Proposed Priority" ~ "Yellow"

define "Proposed Priority Is Green":
  "Proposed Priority" ~ "Green"

define "Has Proposed Priority":
  "Proposed Priority" is not null

// While the triage is under way: the most urgent of what is known so far, the colour of the
// provisional NEWS2, the warning symptoms found and the Complaint Priority, and yellow for the
// needs; null only when nothing is known. Every part can only become more urgent as the vital
// signs and the warning symptoms come in, so this is a lower bound: it is never more urgent
// than the Proposed Priority that follows, and it is the Proposed Priority once that is proposed.
// Green means only that nothing more urgent is known yet.
define "Provisional Proposed Priority":
  "Most Urgent"({ "Provisional Vital Parameter Priority", "Assessed Complaint Priority", "Lowest Priority From Needs" })

// The description of the task that proposes the triage priority
define "Proposed Priority Summary":
  if "Proposed Priority" is null then null
  else 'Proposed WEST-A priority: ' + "Proposed Priority".display
