Profile: WestAPatient
Parent: $VGRBasePatient
Id: west-a-patient
Title: "WEST-A Patient"
Description: "WEST-A Patient profile, used to identify the adult patient who is triaged with WEST-A in the emergency department"

// The identifier slices come from SE Base (personnummer, samordningsnummer, nationelltReservnummer)
// and VGR Base (LRID, GRID). Every patient at the emergency department gets an identifier,
// a reserve number when the identity is unknown.
* identifier 1..* MS

* identifier[personnummer]
  * ^short = "Personal identity number (personnummer)"
  * ^definition = "Personal identity number assigned by the Swedish Tax Agency (Skatteverket) to people registered in Sweden. Corresponds to \"eventuellt personnummer\" in the WEST-A SBAR handover."
  * system MS
  * value 1..1 MS
  * value obeys westa-pat-1

* identifier[samordningsnummer]
  * ^short = "Coordination number (samordningsnummer)"
  * ^definition = "Coordination number assigned by the Swedish Tax Agency to people who are not, or have not been, registered in Sweden."
  * system MS
  * value 1..1 MS
  * value obeys westa-pat-2

* identifier[nationelltReservnummer]
  * ^short = "National reserve number (nationellt reservnummer)"
  * system MS
  * value 1..1 MS

* identifier[LRID]
  * ^short = "VGR local reserve number (lokalt reservnummer, LRID)"
  * ^definition = "Reserve number that VGR assigns when the patient has neither a personnummer nor a samordningsnummer, or the identity is not known (for example an unconscious patient)."
  * value 1..1 MS

* identifier[GRID]
  * ^short = "Superseded VGR reserve number (gammalt reservnummer, GRID)"
  * value 1..1 MS

* name MS
  * ^short = "Patient's name (patientens namn)"
  * family MS
  * given MS
* gender MS
  * ^short = "Gender; chooses the sex-specific complaint pages of WEST-A"
* birthDate MS
  * ^short = "Date of birth; WEST-A uses the age calculated from it at triage"

Invariant: westa-pat-1
Description: "A personnummer has 12 digits without a hyphen: year with century, month and day of birth, then four digits (YYYYMMDDNNNC)"
Severity: #error
Expression: "matches('^(18|19|20)[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[0-9]{4}$')"

Invariant: westa-pat-2
Description: "A samordningsnummer has 12 digits without a hyphen, like a personnummer but with 60 added to the day of birth (YYYYMM[61-91]NNNC)"
Severity: #error
Expression: "matches('^(18|19|20)[0-9]{2}(0[1-9]|1[0-2])(6[1-9]|[78][0-9]|9[01])[0-9]{4}$')"
