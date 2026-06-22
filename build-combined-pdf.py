#!/usr/bin/env python3
"""Generate one landscape PDF with all 4 sheets, one per page.

Reuses parse_checklists() and draw_sheet() from build-pdfs.py so the
layout stays in lockstep with the per-sheet PDFs — this only changes the
page orientation (landscape) and bundles the four sheets into one file.

Output: pdfs/all-sheets-landscape.pdf
"""
import importlib.util
from pathlib import Path
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas

ROOT = Path(__file__).parent
OUT_DIR = ROOT / "pdfs"
OUT_DIR.mkdir(exist_ok=True)

# build-pdfs.py isn't a valid module name (hyphen) — load it by path.
spec = importlib.util.spec_from_file_location("build_pdfs", ROOT / "build-pdfs.py")
bp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp)

LANDSCAPE = landscape(A4)


def build():
    cl = bp.parse_checklists()

    sheets = [
        {
            "title": "Auction Checklist",
            "sections": [
                {"label": None, "data": cl["auction"]},
            ],
        },
        {
            "title": "Declarer Sheet — Notrump",
            "sections": [
                {"label": "Plan — discipline & lead", "data": cl["declarerCommon"]},
                {"label": "Plan — Notrump", "data": cl["declarerNT"]},
            ],
        },
        {
            "title": "Declarer Sheet — Suit",
            "sections": [
                {"label": "Plan — discipline & lead", "data": cl["declarerCommon"]},
                {"label": "Plan — Suit", "data": cl["declarerSuit"]},
            ],
        },
        {
            "title": "Defender Sheet",
            "sections": [
                {"label": "Defense plan", "data": cl["defender"]},
            ],
        },
    ]

    out = OUT_DIR / "all-sheets-landscape.pdf"
    c = canvas.Canvas(str(out), pagesize=LANDSCAPE)
    c.setTitle("Bridge Habit Map — All Sheets")
    for sheet in sheets:
        bp.draw_sheet(c, sheet["title"], sheet["sections"], page_size=LANDSCAPE)
    c.save()
    print(f"  → {out.relative_to(ROOT)}")


if __name__ == "__main__":
    print("Building combined landscape PDF from web/checklists.js …")
    build()
    print("Done.")
