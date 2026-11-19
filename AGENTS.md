# WEST-A Triage FHIR Implementation Guide

Unofficial HL7 FHIR R4 Implementation Guide for the data used in WEST-A, the adult emergency department triage system of Västra Götalandsregionen (VGR). Authored in FHIR Shorthand (FSH), built with SUSHI and the HL7 IG Publisher. The source is the WEST-A manual, VGR version 2025:02:01 (PDF, not committed).

## Modelling guidelines (required reading)

Before creating or changing any profile, extension, value set, code system, naming system or instance, read the UZ Core [`modelling-guidelines.en.md`](https://github.com/uzinfocom-org/digital-health-ig/blob/main/modelling-guidelines.en.md) in full and follow it, with these adaptations for Sweden:

| UZ Core rule | Here |
|---|---|
| `UZCore[Resource]`, Id `uz-core-[resource]`, Title "UZ Core [Resource]" | `WestA[Resource]`, Id `west-a-[resource]`, Title "WEST-A [Resource]", Description "WEST-A [Resource] profile, used to ..." |
| Invariants `uzcore-[abbr]-[n]` | `westa-[abbr]-[n]` |
| Canonical `https://dhp.uz/fhir/core` | `https://vadi2.github.io/west-a-triage-ig` (provisional) |
| Terminology on `https://terminology.dhp.uz` | Code systems and value sets use the IG canonical (SUSHI default), e.g. `.../CodeSystem/west-a-triage-priority-cs` |
| FHIR R5 | FHIR R4: the VGR Base and SE Base profiles are R4, and a profile can only derive from one of the same version |
| Profiles derive from base resources | Derive from VGR Base (`se.vgregion.fhir.base`) where it has a profile (Patient, Encounter), else SE Base, else the FHIR core profiles (vital signs), else the base resource |
| Identifier systems `https://dhp.uz/fhir/core/sid/...` | Reuse the SE Base and VGR Base systems and their NamingSystems. Create a NamingSystem only for a system this guide defines itself. |
| Prefer standard codes | SNOMED CT (Swedish edition) first; LOINC only where a FHIR profile requires it, with the SNOMED CT code as a second coding |
| Original code systems in Uzbek with ru/en designations | Swedish (`sv`) default, with `en` designations |
| Examples `language = uz` | `language = sv` |
| SNOMED CT International | Swedish edition, pinned in `expansion-params.json` (served by tx-nordics.fhir.org); CI validates page JSON with `-sct se` |
| ru/uz page translations | Not required yet |

New CodeSystems follow the [terminology quality checklist](https://github.com/uzinfocom-org/digital-health-ig/blob/main/terminology-quality-checklist.en.md).

## Mapping from WEST-A

Each modelled area gets a mapping page in `input/pagecontent/` with the columns `WEST-A (sv) | English | Source | FHIR path | Example`, citing the WEST-A page number, plus an out-of-scope table and open questions. See `west-a-patient-mapping.md` and `west-a-triage-mapping.md`.

## Building

Do not build locally. GitHub Actions (`.github/workflows/build.yml`) runs SUSHI and the IG Publisher on every push and pull request, fails on QA errors, and validates the JSON blocks of the `StructureDefinition-*-intro.md` / `-notes.md` pages against the built package. Download the `ig-output` artifact to read `qa.html`. The HL7 auto-builder also publishes every push at https://build.fhir.org/ig/vadi2/west-a-triage-ig/ (branches at `.../branches/<branch>/`).

## Conventions

- FSH: `input/fsh/` (`profiles/`, `examples/`, `terminology/`, `Aliases.fsh` in alphabetical order); text in FSH is English, except the Swedish displays of local codes.
- Pages: `input/pagecontent/`; every profile has `StructureDefinition-<id>-intro.md` and `-notes.md` (modelling guidelines §5.7).
- Changelog: add entries under `### In development` in `input/pagecontent/changelog.md`, in alphabetical order within each category.
