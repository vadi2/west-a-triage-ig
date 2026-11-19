"""Fail the build when the IG Publisher QA report has errors.

Usage: python3 check_qa.py output/qa.json
"""
import json
import sys

with open(sys.argv[1], encoding="utf-8") as f:
    qa = json.load(f)

errs = qa.get("errs")
warnings = qa.get("warnings")
hints = qa.get("hints")
if errs is None:
    print("qa.json has no 'errs' count; keys present:", sorted(qa))
    sys.exit(1)

summary = f"IG Publisher QA: {errs} errors, {warnings} warnings, {hints} hints"
print(summary)
with open("qa-summary.txt", "w", encoding="utf-8") as f:
    f.write(summary + "\n")
sys.exit(1 if errs else 0)
