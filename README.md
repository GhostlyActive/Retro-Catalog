# Retro-Sammlung

A curated catalogue of 1257 retro games across 14 systems. Single HTML file,
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
GAPS.md                      generated: what is missing, per title
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
