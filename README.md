# Retro-Sammlung

A curated catalogue of 1196 retro games across 14 systems. Single HTML file,
no dependencies — open `index.html` directly or serve it from GitHub Pages.

Personal project. Ratings, release data, descriptions and artwork come from
ScreenScraper via Batocera gamelists. The tiers (Pflicht / Stark / Solide), the
short verdicts and the grouping are mine.

## Layout

```
index.html                    the page: curated data by hand + a generated block
daten/gamelist-<console>.xml  the scraped data, one file per console
bilder/klein|gross|szene      thumbnails, covers, screenshots — generated
werkzeuge/build.mjs           rebuilds the generated block and the images
```

## Rebuilding

Drop a replacement into `daten/` and run:

```bash
node werkzeuge/build.mjs
```

It matches gamelist entries against the curated titles, rewrites the data block
in `index.html` and converts any missing artwork. Existing images are skipped,
so the original scrape folder is only needed for games that are new:

```bash
node werkzeuge/build.mjs --quelle /path/to/information
```

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
