# Bridge Habit Map

**[Open the app →](https://theleeguy64-maker.github.io/Bridge-Habit-Map/)**

A checklist you tap through while playing a hand of bridge, so the thinking
becomes a habit instead of something you remember to do on the good days.

## The two sheets

Both start with the same **Auction** phase — Habits, Strategy, and Bids to
remember — run during the bidding. From there they split:

- **Declarer** — pause before calling from dummy, then work through Discipline,
  Pre-play evaluation, Design the play, and Playing it out. Counting and
  trick-source items branch depending on whether you're in notrump or a suit
  contract.
- **Defender** — don't rush trick 1. Count the points, picture the unseen
  hands, count declarer's tricks, decide active or passive, then the opening
  lead if you're on lead.

After each hand the app records how much of the list you actually ran, so you
can see the habit forming (or not).

## Install it on your phone

Open the link above in Safari on iOS or Chrome on Android, then use
**Share → Add to Home Screen**. It launches full-screen with no browser
chrome. There's no offline mode, so you need a signal at the table.

## Editing the checklists

The app has a built-in editor, reached from the sheet you're already on:
"Edit Auction sheet" on the auction screen, "Edit Declarer sheet" or "Edit
Defender sheet" on the plan screen. Move, reword, delete, or add items. Your changes are saved
as a patch layered over the shipped list, so "Reset all edits" always gets you
back to the original in one tap.

## Running it yourself

Everything is static — vanilla JavaScript, no build step, no backend, no
accounts. All state lives in your browser's `localStorage` and never leaves
your device.

```bash
git clone https://github.com/theleeguy64-maker/Bridge-Habit-Map.git
cd Bridge-Habit-Map
python3 server.py     # http://localhost:8791
```

Or just open `web/index.html` in a browser.

To host your own copy: fork the repo and turn on GitHub Pages. The workflow in
`.github/workflows/` publishes the `web/` directory on every push to `main`.

## Printable version

`pdfs/` holds A4 sheets of the same content for the table — one per sheet plus
a combined landscape file. Regenerate them after editing `web/checklists.js`:

```bash
python3 build-pdfs.py
python3 build-combined-pdf.py
```

## Licence

MIT — see [LICENSE](LICENSE).
