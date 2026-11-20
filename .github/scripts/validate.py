"""Validate FHIR JSON files in one run of the HL7 FHIR validator.

Starting the validator and loading its packages takes most of the time of a
run, so the files are validated together, each against the profiles in its
meta.profile, and the results of each file are read from the -output bundle.

Usage: python3 validate.py [--info] [--validator JAR] [--ig PACKAGE]... [FILE...] [--invalid FILE...]

Each FILE must have a meta.profile that the validator knows, and no errors.
Each file after --invalid must have at least one error.
The issues of each file are written to FILE.txt, and the validator's own
output and its bundle to a validator/ folder next to the first file.
"""
import argparse
import json
import os
import pathlib
import subprocess
import sys

EXT = "http://hl7.org/fhir/StructureDefinition/operationoutcome-"
UNKNOWN_PROFILE = ("unknown", "could not be found", "could not be resolved",
                   "unable to resolve", "unable to find", "unable to locate")

parser = argparse.ArgumentParser()
parser.add_argument("files", nargs="*")
parser.add_argument("--invalid", nargs="+", action="extend", default=[], metavar="FILE",
                    help="files that must fail validation")
parser.add_argument("--info", action="store_true", help="also print the information issues")
parser.add_argument("--validator", default="input-cache/validator_cli.jar")
parser.add_argument("--ig", action="append", help="default: output/package.tgz")
args = parser.parse_args()

missing = [f for f in args.files + args.invalid if not os.path.isfile(f) and "*" not in f]
for f in missing:
    print(f"::error file={f}::no such file")
invalid = {f for f in args.invalid if os.path.isfile(f)}
files = [f for f in args.files if os.path.isfile(f) and f not in invalid] + sorted(invalid)
status = 1 if missing else 0
if not files:
    print("No files to validate")
    sys.exit(status)

out_dir = pathlib.Path(files[0]).parent / "validator"
out_dir.mkdir(exist_ok=True)
bundle_path = out_dir / "output.json"
log_path = out_dir / "validator.log"
bundle_path.unlink(missing_ok=True)

cmd = ["java", "-jar", args.validator, *files, "-version", "4.0.1", "-sct", "se"]
for ig in args.ig or ["output/package.tgz"]:
    cmd += ["-ig", ig]
cmd += ["-output", str(bundle_path)]
with open(log_path, "w", encoding="utf-8") as log:
    subprocess.run(cmd, stdout=log, stderr=subprocess.STDOUT)
log_lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
print(next((l.strip() for l in log_lines if l.startswith("Done. Times")), "The validator did not finish"))

outcomes = {}
try:
    result = json.loads(bundle_path.read_text(encoding="utf-8"))
    entries = [e["resource"] for e in result.get("entry", [])] if result.get("resourceType") == "Bundle" else [result]
    for oo in entries:
        name = next((x.get("valueString") for x in oo.get("extension", []) if x.get("url") == EXT + "file"), None)
        if name is None and len(files) == 1:
            name = files[0]
        if name is not None:
            outcomes[os.path.realpath(name)] = oo
except (OSError, ValueError, KeyError) as e:
    print(f"::error::no validator results in {bundle_path}: {e}")
    print("\n".join(log_lines[-40:]))


def ext(issue, name):
    return next((x for x in issue.get("extension", []) if x.get("url") == EXT + name), {})


def describe(issue):
    severity = {"fatal": "Fatal", "error": "Error", "warning": "Warning"}.get(issue["severity"], "Information")
    where = (issue.get("expression") or issue.get("location") or ["?"])[0]
    line, col = ext(issue, "issue-line").get("valueInteger"), ext(issue, "issue-col").get("valueInteger")
    at = f" (line {line}, col{col})" if line is not None else ""
    text = issue.get("details", {}).get("text") or issue.get("diagnostics", "")
    return f"  {severity} @ {where}{at}: {text}"


def unknown_profile(issue, profile):
    message_id = ext(issue, "message-id").get("valueCode", "") or ext(issue, "message-id").get("valueString", "")
    if "PROFILE_UNKNOWN" in message_id or "UNKNOWN_PROFILE" in message_id:
        return True
    text = (issue.get("details", {}).get("text") or issue.get("diagnostics", "")).lower()
    return profile.split("|")[0].lower() in text and any(p in text for p in UNKNOWN_PROFILE)


for f in files:
    expect_invalid = f in invalid
    try:
        profile = (json.loads(pathlib.Path(f).read_text(encoding="utf-8")).get("meta", {}).get("profile") or [""])[0]
    except ValueError:
        profile = ""
    print(f"Validate {f} against {profile or 'no meta.profile'}")
    if not expect_invalid and not profile:
        print(f"::error file={f}::no meta.profile")
        status = 1
        continue
    oo = outcomes.get(os.path.realpath(f))
    if oo is None:
        print(f"::error file={f}::the validator gave no result")
        status = 1
        continue
    issues = oo.get("issue", [])
    unknown = [i for i in issues if profile and unknown_profile(i, profile)]
    errors = sum(1 for i in issues if i["severity"] in ("fatal", "error")) + sum(1 for i in unknown if i["severity"] not in ("fatal", "error"))
    warnings = sum(1 for i in issues if i["severity"] == "warning" and i not in unknown)
    notes = sum(1 for i in issues if i["severity"] == "information")
    summary = f"{'*FAILURE*' if errors else 'Success'}: {errors} errors, {warnings} warnings, {notes} notes"
    lines = [summary] + [describe(i) for i in issues]
    pathlib.Path(f + ".txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(summary)
    for i in issues:
        if args.info or i["severity"] != "information":
            print(describe(i))
    if unknown:
        print(f"::{'warning' if expect_invalid else 'error'} file={f}::the validator does not know the profile {profile}")
    if expect_invalid and not errors:
        print(f"::error file={f}::expected validation to fail, but it passed")
        status = 1
    elif not expect_invalid and errors:
        print(f"::error file={f}::failed validation against {profile}")
        status = 1

sys.exit(status)
