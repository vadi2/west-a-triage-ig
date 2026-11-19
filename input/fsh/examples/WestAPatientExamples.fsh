Instance: example-patient-personnummer
InstanceOf: WestAPatient
Usage: #example
Title: "Example WEST-A Patient - Identified by personnummer"
Description: "Adult patient identified by personnummer, as given in the SBAR handover. Uses Inera test identity 196101182803, which the HL7 Sweden SE Base profiles also use in their examples."
* language = #sv
* identifier[personnummer].system = $personnummer
* identifier[personnummer].value = "196101182803"
* name.use = #official
* name.family = "Ljungberg"
* name.given[0] = "Maria"
* name.given[+] = "Birgitta"
* name.text = "Maria Ljungberg"
* gender = #female
* birthDate = "1961-01-18"

Instance: example-patient-samordningsnummer
InstanceOf: WestAPatient
Usage: #example
Title: "Example WEST-A Patient - Identified by samordningsnummer"
Description: "Adult patient who is not registered in Sweden and is identified by a samordningsnummer. The number is fictitious, with a valid check digit."
* language = #sv
* identifier[samordningsnummer].system = $samordningsnummer
* identifier[samordningsnummer].value = "198503723135"
* name.use = #official
* name.family = "Haddad"
* name.given[0] = "Karim"
* name.text = "Karim Haddad"
* gender = #male
* birthDate = "1985-03-12"
