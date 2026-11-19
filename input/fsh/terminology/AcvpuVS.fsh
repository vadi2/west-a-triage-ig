ValueSet: AcvpuVS
Id: west-a-acvpu-vs
Title: "WEST-A ACVPU"
Description: "Levels of consciousness on the ACVPU scale (Alert, new Confusion, Voice, Pain, Unresponsive) that NEWS2 and WEST-A use"
* ^status = #draft
* ^experimental = true
// One include per concept: the IG Publisher validates only the first SNOMED CT concept of an include
* ^compose.include[0].system = $sct
* ^compose.include[0].version = "http://snomed.info/sct/45991000052106"
* ^compose.include[0].concept[0].code = #248234008 // Mentally alert - A
* ^compose.include[1].system = $sct
* ^compose.include[1].version = "http://snomed.info/sct/45991000052106"
* ^compose.include[1].concept[0].code = #130987000 // Acute confusion - C, new confusion
* ^compose.include[2].system = $sct
* ^compose.include[2].version = "http://snomed.info/sct/45991000052106"
* ^compose.include[2].concept[0].code = #300202002 // Responds to voice - V
* ^compose.include[3].system = $sct
* ^compose.include[3].version = "http://snomed.info/sct/45991000052106"
* ^compose.include[3].concept[0].code = #450847001 // Responds to pain - P
* ^compose.include[4].system = $sct
* ^compose.include[4].version = "http://snomed.info/sct/45991000052106"
* ^compose.include[4].concept[0].code = #422768004 // Unresponsive - U
