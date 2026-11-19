// The Swedish patient identifier systems defined by the HL7 Sweden SE Base profiles.
// SE Base (FHIR R4) does not publish NamingSystems for them, so this guide describes them,
// keeping the SE Base URIs unchanged.

Instance: personnummer
InstanceOf: NamingSystem
Usage: #definition
Title: "Personnummer"
Description: "Swedish personal identity number, assigned by the Swedish Tax Agency (Skatteverket) to people registered in Sweden"
* name = "Personnummer"
* status = #active
* kind = #identifier
* date = "2026-11-19"
* responsible = "Skatteverket"
* type = http://terminology.hl7.org/CodeSystem/v2-0203#NI
* jurisdiction = urn:iso:std:iso:3166#SE "Sweden"
* uniqueId[0].type = #uri
* uniqueId[=].value = "http://electronichealth.se/identifier/personnummer"
* uniqueId[=].preferred = true

Instance: samordningsnummer
InstanceOf: NamingSystem
Usage: #definition
Title: "Samordningsnummer"
Description: "Swedish coordination number, assigned by the Swedish Tax Agency (Skatteverket) to people who are not, or have not been, registered in Sweden"
* name = "Samordningsnummer"
* status = #active
* kind = #identifier
* date = "2026-11-19"
* responsible = "Skatteverket"
* jurisdiction = urn:iso:std:iso:3166#SE "Sweden"
* uniqueId[0].type = #uri
* uniqueId[=].value = "http://electronichealth.se/identifier/samordningsnummer"
* uniqueId[=].preferred = true

Instance: nationellt-reservnummer
InstanceOf: NamingSystem
Usage: #definition
Title: "Nationellt reservnummer"
Description: "Swedish national reserve number, a temporary identifier for a patient who has no personnummer or samordningsnummer, or whose identity is not known"
* name = "NationelltReservnummer"
* status = #active
* kind = #identifier
* date = "2026-11-19"
* jurisdiction = urn:iso:std:iso:3166#SE "Sweden"
* uniqueId[0].type = #uri
* uniqueId[=].value = "http://electronichealth.se/identifier/nationelltReservnummer"
* uniqueId[=].preferred = true
