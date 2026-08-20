# Retro-Sammlung

A curated catalogue of 1195 retro games across 14 systems. Single HTML file,
no dependencies — open `index.html` directly or serve it from GitHub Pages.

Personal project. Ratings, release data, descriptions and artwork come from
ScreenScraper via Batocera gamelists. The tiers (Pflicht / Stark / Solide), the
short verdicts and the grouping are mine.

## Layout

```
index.html                   the page: curated data by hand + a generated block
data/gamelist-<console>.xml  the scraped data, one file per console
data/texte.js                the long descriptions, loaded after first paint
images/small                 128 px cover — the box in each list row
images/large                 400 px cover — the detail sheet
images/screenshot            480 px screenshot — the detail sheet
tools/build.mjs              rebuilds the generated block, the texts and the images
LUECKEN.md                   generated: what is missing, per title
```

The long descriptions are two thirds of the payload but are only ever read one at
a time, so they sit in `data/texte.js` and load once the list is up. That keeps
the first request at 103 KB instead of 391 KB. They arrive as a classic script
rather than a fetch, so opening `index.html` straight from the folder still works.

## Rebuilding

Drop a replacement into `data/` and run:

```bash
node tools/build.mjs
```

It matches gamelist entries against the curated titles, rewrites the data block
in `index.html` and converts any missing artwork. Existing images are skipped,
so the original scrape folder is only needed for games that are new:

```bash
node tools/build.mjs --quelle /path/to/information
```

The build also strips `path`, `md5`, `cheevosHash`, `video`, `multidisk` and the
play counters out of the gamelists as it reads them. `data/` is served publicly
by GitHub Pages, and ROM filenames with checksums have no business being there.
Nothing the build needs is lost, and a freshly dropped gamelist is cleaned on the
next run.

It also keeps the title count in sync — the number appears in the page's meta
description and in the first line of this file, and both are rewritten on every
run. Never edit those by hand.

Two things worth remembering:

- **New games in a gamelist do not appear on their own.** They need an entry in
  `DATA` inside `index.html`. The build lists them in `LUECKEN.md` under
  "Gescrapt, aber nicht im Katalog".
- **Titles that don't match by name** are resolved by subtitle or similarity.
  Japanese originals and odd localisations sit in the `HANDZUORDNUNG` table at
  the top of the script; everything resolved by guesswork is listed in
  `LUECKEN.md` for checking.

## Known gaps

`LUECKEN.md` is written on every build and is the authority: what has no rating,
no year, no cover, no screenshot, no description, plus the titles that could not
be matched and the ones that were matched by similarity. It also flags two titles
of the same console sharing a description — that is nearly always two discs of one
game sitting in the catalogue as two entries.

The long-standing ones: `pce | Dragon Spirit` and `pce | Power Drift` were never
scraped at all, and 19 titles carry no rating because ScreenScraper has none,
mostly Atari 2600.

## URL state

The address bar carries the full view: search, filters, sort order, collapsed
consoles, and the open detail sheet (`#spiel=<console>|<title>`). A link therefore
restores exactly what was on screen, and the back gesture closes the sheet instead
of leaving the page. Clicking the site title goes back to the bare address — no
filters, everything expanded, scrolled to the top — without reloading.

A search term with no explicit `sortierung=` ranks by best match: word in the title
beats word in the description, and among title matches the tier and rating decide.
That ordering is `sortierung=rel`, and it is what the sort dropdown switches to on
its own when you start typing.

## Looks

The palette, radii and shadows are the tokens from
[ghostlyactive.github.io](https://ghostlyactive.github.io) so the two sites read as
one family: neutral near-black, amber accent, cyan as the secondary. Dark uses those
values verbatim; light mirrors the roles at inverted brightness. Where a token had to
move it was for contrast — `--tx3` carries labels and counts here, not just incidental
text, so it sits a step brighter than the source and clears 4.5:1 in both themes.

Two views. The list is dense and carries the verdicts. The shelf (`#ansicht=regal`)
puts the box art on a stage of its own — each console gets its own aspect ratio,
because a SNES box is landscape at 1.37 and a Mega Drive box is portrait at 0.71.
`KVERHAELTNIS` in `index.html` holds the median ratio per system.

## Touch

In the detail sheet, swipe sideways to page through the result list and swipe down
from the top to close. In the shelf, the arrow keys move by one card sideways and by
a full grid row up and down. Both are touch only — with a mouse and keyboard the buttons
and arrow keys do the same. The sheet declares `touch-action: pan-y pinch-zoom`, so
vertical scrolling and pinch-zoom stay with the browser and only the horizontal
gesture is ours.
