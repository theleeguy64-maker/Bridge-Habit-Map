#!/usr/bin/env python3
"""Generate 4 print-friendly PDFs from web/checklists.js.

Sheets:
  auction.pdf       — shared auction checklist
  declarer-nt.pdf   — auction + declarer-common + declarer-NT
  declarer-suit.pdf — auction + declarer-common + declarer-Suit
  defender.pdf      — auction + defender

Each is one page, white bg, black text, big square checkboxes.
"""
import re
import json
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth

ROOT = Path(__file__).parent
CHECKLISTS_JS = ROOT / "web" / "checklists.js"
OUT_DIR = ROOT / "pdfs"
OUT_DIR.mkdir(exist_ok=True)


def parse_checklists():
    """Parse web/checklists.js into a Python dict by stripping JS wrapping."""
    src = CHECKLISTS_JS.read_text()
    # Pull the object literal between `const CHECKLISTS = ` and the trailing `;`.
    m = re.search(r"const\s+CHECKLISTS\s*=\s*(\{.*?\});\s*$", src, re.DOTALL | re.MULTILINE)
    if not m:
        raise SystemExit("Could not locate CHECKLISTS object in checklists.js")
    body = m.group(1)
    # JS → JSON: quote bare keys, drop trailing commas, swap single→double quotes.
    body = re.sub(r"(\{|,)\s*([A-Za-z_][A-Za-z0-9_]*)\s*:", r'\1"\2":', body)
    body = re.sub(r",\s*([}\]])", r"\1", body)
    # Strip // line comments
    body = re.sub(r"//[^\n]*", "", body)
    return json.loads(body)


def draw_sheet(c, title, sections, page_size=A4):
    page_w, page_h = page_size
    margin_x = 18 * mm
    margin_top = 18 * mm
    margin_bottom = 14 * mm
    content_w = page_w - 2 * margin_x
    gutter = 8 * mm
    col_w = (content_w - gutter) / 2

    # Title
    c.setFont("Helvetica-Bold", 18)
    c.drawString(margin_x, page_h - margin_top, title)
    c.setFont("Helvetica-Oblique", 9)
    c.setFillGray(0.35)
    c.drawString(margin_x, page_h - margin_top - 5 * mm, "Bridge Habit Map")
    c.setFillGray(0)

    # Build a flat list of (kind, text) tokens we'll flow into two columns:
    #   ('section', label) | ('group', title) | ('item', text)
    tokens = []
    for sec in sections:
        if sec.get("label"):
            tokens.append(("section", sec["label"]))
        for g in sec["data"]["groups"]:
            if g.get("title"):
                tokens.append(("group", g["title"]))
            for it in g["items"]:
                tokens.append(("item", it["text"]))

    # Vertical layout config
    sec_h = 6 * mm
    grp_h = 5.5 * mm
    item_line_h = 4.8 * mm
    item_pad_below = 2 * mm
    box_size = 3.5 * mm

    body_font = ("Helvetica", 10)
    grp_font = ("Helvetica-Bold", 10)
    sec_font = ("Helvetica-Bold", 11)

    def wrap(text, max_w, font_name, font_size):
        words = text.split()
        lines, cur = [], ""
        for w in words:
            cand = (cur + " " + w).strip()
            if stringWidth(cand, font_name, font_size) <= max_w:
                cur = cand
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    # Measure each token's height
    measured = []
    for kind, text in tokens:
        if kind == "section":
            measured.append((kind, text, sec_h, [text]))
        elif kind == "group":
            measured.append((kind, text, grp_h, [text]))
        else:
            text_w = col_w - box_size - 2 * mm
            lines = wrap(text, text_w, *body_font)
            h = max(1, len(lines)) * item_line_h + item_pad_below
            measured.append((kind, text, h, lines))

    # Greedy split into two columns of (near-)equal height
    total = sum(m[2] for m in measured)
    target = total / 2.0
    col1, col2 = [], []
    cum = 0
    for m in measured:
        if cum + m[2] / 2 <= target:
            col1.append(m)
            cum += m[2]
        else:
            col2.append(m)

    # Draw a column
    def draw_col(col_items, x_left):
        y = page_h - margin_top - 12 * mm
        for kind, text, h, lines in col_items:
            if kind == "section":
                if y - sec_h < margin_bottom:
                    break
                c.setFont(*sec_font)
                c.setFillGray(0.2)
                c.drawString(x_left, y - 4 * mm, text.upper())
                c.setFillGray(0)
                # underline
                c.setStrokeGray(0.7)
                c.setLineWidth(0.4)
                c.line(x_left, y - 4.8 * mm, x_left + col_w, y - 4.8 * mm)
                c.setStrokeGray(0)
                y -= sec_h
            elif kind == "group":
                if y - grp_h < margin_bottom:
                    break
                c.setFont(*grp_font)
                c.drawString(x_left, y - 4 * mm, text)
                y -= grp_h
            else:  # item
                if y - h < margin_bottom:
                    break
                # checkbox
                box_y = y - box_size - 0.6 * mm
                c.setLineWidth(0.6)
                c.rect(x_left, box_y, box_size, box_size, stroke=1, fill=0)
                # text
                c.setFont(*body_font)
                text_x = x_left + box_size + 2 * mm
                for i, ln in enumerate(lines):
                    c.drawString(text_x, y - 3.2 * mm - i * item_line_h, ln)
                y -= h

    draw_col(col1, margin_x)
    draw_col(col2, margin_x + col_w + gutter)

    c.showPage()


def build():
    cl = parse_checklists()

    sheets = [
        {
            "file": "auction.pdf",
            "title": "Auction Checklist",
            "sections": [
                {"label": None, "data": cl["auction"]},
            ],
        },
        {
            "file": "declarer-nt.pdf",
            "title": "Declarer Sheet — Notrump",
            "sections": [
                {"label": "Auction", "data": cl["auction"]},
                {"label": "Plan — discipline & lead", "data": cl["declarerCommon"]},
                {"label": "Plan — Notrump", "data": cl["declarerNT"]},
            ],
        },
        {
            "file": "declarer-suit.pdf",
            "title": "Declarer Sheet — Suit",
            "sections": [
                {"label": "Auction", "data": cl["auction"]},
                {"label": "Plan — discipline & lead", "data": cl["declarerCommon"]},
                {"label": "Plan — Suit", "data": cl["declarerSuit"]},
            ],
        },
        {
            "file": "defender.pdf",
            "title": "Defender Sheet",
            "sections": [
                {"label": "Auction", "data": cl["auction"]},
                {"label": "Defense plan", "data": cl["defender"]},
            ],
        },
    ]

    for sheet in sheets:
        out = OUT_DIR / sheet["file"]
        c = canvas.Canvas(str(out), pagesize=A4)
        c.setTitle(sheet["title"])
        draw_sheet(c, sheet["title"], sheet["sections"])
        c.save()
        print(f"  → {out.relative_to(ROOT)}")


if __name__ == "__main__":
    print("Building PDFs from web/checklists.js …")
    build()
    print("Done.")
