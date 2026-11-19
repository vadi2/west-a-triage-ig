/*
@description: The parts of the WEST-A triage priority that can be calculated (WEST-A VGR 2025):
 the priority from the vital parameters (NEWS2 clinical risk, p. 6), and the proposed priority,
 which is the most urgent of that, the priority of the warning symptoms of the chief complaint
 algorithm (pp. 3-48), and yellow as the lowest priority for some needs and processes (pp. 46-48).
 The triage nurse assesses the warning symptoms and the needs; this logic takes them as parameters.
 The clinical assessment can raise the priority, but never lowers a red or orange patient (p. 8);
 that is the nurse's decision, so it is not calculated.
*/
library WestATriage version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers
include WestANEWS2 version '0.1.0' called NEWS2

codesystem "WEST-A Triage Priority": 'https://vadi2.github.io/west-a-triage-ig/CodeSystem/west-a-triage-priority-cs'

code "Red": '1' from "WEST-A Triage Priority" display 'Röd'
code "Orange": '2' from "WEST-A Triage Priority" display 'Orange'
code "Yellow": '3' from "WEST-A Triage Priority" display 'Gul'
code "Green": '4' from "WEST-A Triage Priority" display 'Grön'

// The priority of the most urgent warning symptom the nurse found in the chief complaint
// algorithm, a code from the WEST-A triage priority code system; null when not yet assessed
parameter "Complaint Priority" System.Code

// Frail elderly (p. 46), likely admission (p. 47), or violence or sexual assault (p. 48)
parameter "Yellow As Lowest Priority" Boolean default false

context Patient

// The codes of the triage priority code system sort from most urgent (1) to least urgent (4)
define function "Most Urgent"(priorities List<System.Code>):
  First(
    priorities P
      where P is not null
      sort by code
  )

// WEST-A p. 6: the colour of each NEWS2 clinical risk band
define "Vital Parameter Priority":
  case NEWS2."NEWS2 Clinical Risk"
    when 'high' then "Red"
    when 'medium' then "Orange"
    when 'low-medium' then "Yellow"
    when 'low' then "Green"
    else null
  end

define "Lowest Priority From Needs":
  if "Yellow As Lowest Priority" then "Yellow" else null

define "Proposed Priority":
  "Most Urgent"({ "Vital Parameter Priority", "Complaint Priority", "Lowest Priority From Needs" })

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

// The description of the task that proposes the triage priority
define "Proposed Priority Summary":
  if "Proposed Priority" is null then null
  else 'Proposed WEST-A priority: ' + "Proposed Priority".display
