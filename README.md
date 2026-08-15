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
  klein/<konsole>/…jpg   128 px — die Kästchen in der Liste
  gross/<konsole>/…jpg   400 px — das Cover im Detailblatt
  szene/<konsole>/…jpg   480 px — das Bildschirmfoto im Detailblatt
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
RetroAchievements-Kennung, Langbeschreibung, Spielreihe, Cover und
Bildschirmfoto. Kommt vollständig aus `daten/` und wird bei jedem Build
überschrieben.

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

## Spielreihen

Das Feld `<family>` der gamelist gruppiert Titel zu Reihen — auch dann, wenn die
Namen auseinandergehen: `Dragon Quest` fasst die westlichen „Dragon Warrior“-
Ausgaben zusammen, `Kunio-Kun` verbindet River City Ransom mit Crash 'n' the
Boys. Das Detailblatt zeigt die Reihe mit Anzahl und Systemen; ein Klick filtert
die Liste darauf und legt `#reihe=…` in die Adresse.

Reihen mit nur einem Titel werden verworfen. Derzeit bleiben 168 Reihen mit
zusammen 700 Spielen.

## Bilder

Cover stammen aus `<thumbnail>`, Bildschirmfotos aus `<image>`. Beide teilen
sich den Kurznamen des kuratierten Titels, nicht den ROM-Namen — ein Wechsel des
Dateinamens in der gamelist ändert die Bilder also nicht. Ohne Cover bleibt auch
das Bildschirmfoto ungenutzt, weil der Pfad am selben Kurznamen hängt; der Build
weist darauf hin, falls das je vorkommt.

Umgewandelt wird mit `sips` (auf macOS vorhanden). Zwei Eigenheiten sind
absichtlich so:

- **Die Qualitätszahl ist niedrig angesetzt.** `sips` ist anders geeicht als
  übliche JPEG-Encoder und liefert bei gleicher Zahl rund doppelt so große
  Dateien; Q45 entspricht hier etwa dem, was anderswo Q60 heißt.
- **Bildschirmfotos werden nie vergrößert.** Eine Game-Boy-Aufnahme ist nativ
  160x144. Auf 480 hochgerechnet kostet sie das Doppelte und die Pixel
  verwaschen. Die Seite skaliert stattdessen im Browser mit harten Kanten hoch
  (`image-rendering: pixelated`), was der Vorlage gerecht wird.

Bereits vorhandene Dateien werden übersprungen. Der Build braucht die
Originalbilder daher nur für **neue** Spiele:

```bash
node werkzeuge/build.mjs --quelle /Volumes/Platte/information
```

Vorgabe ist `~/Desktop/information`. Fehlt der Ordner, bleiben vorhandene Bilder
unangetastet und nur neue Titel gehen leer aus. Mit `--nurdaten` bleibt die
Bildumwandlung ganz aus; dann zählt für die Seite nur, was schon auf der Platte
liegt.

Die Liste holt ein Cover erst, wenn die Zeile in die Nähe des Sichtfelds kommt.
Beim ersten Aufruf werden dadurch rund zehn Bilder geladen statt 1194.

## Lücken im Bestand

Beides stammt aus der Quelle und lässt sich nur durch erneutes Scrapen beheben:

- **Ohne jede Angabe:** `pce | Dragon Spirit` und `pce | Power Drift` — für diese
  beiden ROMs wurde nie etwas abgerufen. Kein Text, keine Wertung, kein Cover.
- **Ohne Wertung:** 19 Titel, überwiegend Atari 2600. ScreenScraper führt dort
  keine Bewertung; die Seite zeigt an der Stelle einen Strich.

Alles andere ist vollständig: 1194 Beschreibungen, 1194 Cover, 1177 Wertungen.
