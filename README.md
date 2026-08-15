# Retro-Sammlung

Kuratierter Katalog von 1196 Retro-Spielen über 14 Systeme. Die Seite ist eine
einzige HTML-Datei ohne Abhängigkeiten und läuft auf GitHub Pages — oder per
Doppelklick direkt aus dem Ordner.

## Aufbau

```
index.html              Die Seite. Enthält beides:
                          · die Kuratierung (von Hand gepflegt)
                          · den erzeugten Datenblock (nicht von Hand ändern)
daten/
  gamelist-<konsole>.xml Die Batocera-/EmulationStation-Dateien, unverändert
bilder/
  klein/<konsole>/…jpg   96 px — die Kästchen in der Liste
  gross/<konsole>/…jpg   320 px — das Cover im Detailblatt
werkzeuge/
  build.mjs              Erzeugt Datenblock und Cover
```

Konsolen-Kürzel: `snes nes md sms gg n64 gb gbc gba pce ngpc a26 ps1 ps2`

## Die zwei Datenschichten

Der Katalog mischt zwei Quellen, die getrennt bleiben müssen:

**Kuratierung** — steht als `const DATA` in `index.html` und wird von Hand
gepflegt. Dazu gehören die Einstufung (Pflicht / Stark / Solide), der kurze
redaktionelle Text, die Genre-Zuordnung, die Gruppierung und die Systemtexte.
Der Titel in dieser Liste ist der Schlüssel, über den alles andere gefunden wird.

**Gamelist** — Wertung, Jahr, Entwickler, Verlag, Spielerzahl, Datenbank-Genre,
RetroAchievements-Kennung, Langbeschreibung und Cover. Kommt vollständig aus
`daten/` und wird bei jedem Build überschrieben.

Ein Austausch der gamelist lässt die Kuratierung also unberührt.

## Gamelist austauschen

1. Neue Datei nach `daten/gamelist-<konsole>.xml` legen (Name genau so).
2. `node werkzeuge/build.mjs` ausführen.
3. Ausgabe lesen — siehe unten.

Neue Spiele in der gamelist erscheinen **nicht** automatisch auf der Seite. Sie
tauchen unter „In gamelist, nicht im Katalog“ auf; erst ein Eintrag in `DATA`
nimmt sie auf. Umgekehrt meldet „Ohne gamelist-Eintrag“ kuratierte Titel, zu
denen nichts gefunden wurde — die stehen dann ohne Wertung und Cover da.

### Was die Ausgabe bedeutet

```
Kuratierte Spiele: 1196   zugeordnet: 1196
Nicht über den Namen zugeordnet — bitte prüfen:
  [snes] "Star Fox 2"  ->  "StarWing 2"  (Untertitel | ähnlich 0.91)
```

Der Zuordner probiert der Reihe nach: exakter Name → Name ohne Leerzeichen
(`Mega Man` = `Megaman`) → angehängter Untertitel → Ähnlichkeit ab 0,62.
Alles, was nicht über den exakten Namen lief, wird aufgelistet. Sitzt eine
Zuordnung falsch, gehört sie in die Tabelle `HANDZUORDNUNG` oben in
`werkzeuge/build.mjs` — dort steht der kuratierte Titel links, der gamelist-Name
rechts. Dort liegen bereits die japanischen Originaltitel (`Altered Beast` →
`Juuouki`) und die Lokalisierungen.

## Cover

Die Cover stammen aus `<thumbnail>` der gamelist — das ist die Verpackung, nicht
der Bildschirmfoto-Eintrag `<image>`. Der Build wandelt sie mit `sips` (macOS,
bereits vorhanden) in zwei JPEG-Größen um und legt sie unter dem Kurznamen des
kuratierten Titels ab, nicht unter dem ROM-Namen. Ein Wechsel des Dateinamens in
der gamelist ändert die Bilder also nicht.

Bereits vorhandene Dateien werden übersprungen. Der Build braucht die
Originalbilder daher nur für **neue** Spiele:

```bash
node werkzeuge/build.mjs --quelle /Volumes/Platte/information
```

Vorgabe ist `~/Desktop/information`. Fehlt der Ordner, bleiben vorhandene Cover
unangetastet und nur neue Titel gehen leer aus. Mit `--nurdaten` bleibt die
Bildumwandlung ganz aus.

Die Liste holt ein Cover erst, wenn die Zeile in die Nähe des Sichtfelds kommt.
Beim ersten Aufruf werden dadurch rund zehn Bilder geladen statt 1194.

## Lücken im Bestand

Beides stammt aus der Quelle und lässt sich nur durch erneutes Scrapen beheben:

- **Ohne jede Angabe:** `pce | Dragon Spirit` und `pce | Power Drift` — für diese
  beiden ROMs wurde nie etwas abgerufen. Kein Text, keine Wertung, kein Cover.
- **Ohne Wertung:** 19 Titel, überwiegend Atari 2600. ScreenScraper führt dort
  keine Bewertung; die Seite zeigt an der Stelle einen Strich.

Alles andere ist vollständig: 1194 Beschreibungen, 1194 Cover, 1177 Wertungen.
