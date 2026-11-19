# WEST-A Triage FHIR Implementation Guide

Unofficial, draft FHIR R4 implementation guide for the data used in WEST-A (West coast System for Triage - Adult), the emergency department triage system of Västra Götalandsregionen. Not affiliated with or endorsed by VGR.

Current scope: the patient ([`WestAPatient`](input/fsh/profiles/WestAPatient.fsh), based on VGR Base), the vital signs measured at triage, the NEWS2 score and the triage result ([profiles](input/fsh/profiles/), [mapping](input/pagecontent/west-a-triage-mapping.md)).

Published build: https://build.fhir.org/ig/vadi2/west-a-triage-ig/

The IG is built by GitHub Actions on every push; download the `ig-output` artifact from a run to view the site and `qa.html`. See [AGENTS.md](AGENTS.md) for the modelling conventions.
