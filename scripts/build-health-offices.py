"""Build src/content/health-offices.json.gz from the MOPH health-office registry (health_office.xlsx).

Usage:  python scripts/build-health-offices.py <path/to/health_office.xlsx>

Keeps only what the report form needs, keyed by the 5-digit unit code:
  { "06157": ["<name>", "<tambon>", "<amphoe>", "<province>", <active 1/0>], ... }
When a code appears more than once, an active record wins over a cancelled one.
Re-run after downloading a newer registry; commit the regenerated .json.gz.
"""
import gzip
import json
import sys
from pathlib import Path

from openpyxl import load_workbook

src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / "src" / "content" / "health-offices.json.gz"

wb = load_workbook(src, read_only=True, data_only=True)
rows = wb.worksheets[0].iter_rows(values_only=True)
header = [str(h).strip() if h is not None else "" for h in next(rows)]
col = {name: header.index(name) for name in header}


def cell(row, name):
    value = row[col[name]]
    return "" if value is None else str(value).strip()


units = {}
for row in rows:
    code = cell(row, "รหัส 5 หลัก")
    if not code.isdigit():
        continue
    code = code.zfill(5)
    name = " ".join(cell(row, "ชื่อ").split())
    if not name:
        continue
    active = 1 if cell(row, "สถานะการใช้งาน") == "กำลังใช้งาน" else 0
    record = [name, cell(row, "ตำบล/แขวง"), cell(row, "อำเภอ/เขต"), cell(row, "จังหวัด"), active]
    if code not in units or (active and not units[code][4]):
        units[code] = record

data = json.dumps(dict(sorted(units.items())), ensure_ascii=False, separators=(",", ":"))
out.write_bytes(gzip.compress(data.encode("utf-8"), compresslevel=9, mtime=0))
print(f"{len(units)} units -> {out} ({out.stat().st_size / 1_000_000:.1f} MB)")
