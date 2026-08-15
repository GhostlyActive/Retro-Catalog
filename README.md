# Retro-Sammlung

A curated catalogue of 1196 retro games across 14 systems. Single HTML file,
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
```

The long descriptions are two thirds of the payload but are only ever read one at
a time, so they sit in `data/texte.js` and load once the list is up. That keeps
the first request at 101 KB instead of 389 KB. They arrive as a classic script
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

Two things worth remembering:

- **New games in a gamelist do not appear on their own.** They need an entry in
  `DATA` inside `index.html`. The build lists them under "In gamelist, nicht im
  Katalog".
- **Titles that don't match by name** are resolved by subtitle or similarity,
  and the build prints every one of those for checking. Japanese originals and
  odd localisations sit in the `HANDZUORDNUNG` table at the top of the script.

## Known gaps

`pce | Dragon Spirit` and `pce | Power Drift` were never scraped — no text, no
rating, no artwork. Another 19 titles have no rating; ScreenScraper simply
doesn't carry one for them, mostly Atari 2600. Everything else is complete.
