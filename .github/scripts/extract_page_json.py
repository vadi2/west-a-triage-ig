"""Write every ```json block of the profile intro/notes pages to its own file.

The IG Publisher does not validate JSON shown in markdown pages, so CI
validates these files against the built package instead.

Usage: python3 extract_page_json.py input/pagecontent out-dir
"""
import json
import pathlib
import re
import sys

src = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)

block = re.compile(r"```json\n(.*?)\n```", re.S)
count = 0
for page in sorted(src.glob("StructureDefinition-*.md")):
    for i, text in enumerate(block.findall(page.read_text(encoding="utf-8")), 1):
        json.loads(text)  # fail early on malformed JSON
        name = f"{page.stem}-{i}.json"
        (out / name).write_text(text, encoding="utf-8")
        print(f"{page.name} block {i} -> {name}")
        count += 1

if count == 0:
    print("No JSON blocks found")
