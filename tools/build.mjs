#!/usr/bin/env node
// Liest die gamelist-Dateien aus data/, ordnet sie der Kuratierung in index.html zu,
// erzeugt daraus den Datenblock der Seite und wandelt die Cover in zwei Größen um.
//
//   node tools/build.mjs [--quelle <pfad>] [--nurdaten]
//
// --quelle   Wurzel der Batocera-Ordner mit den Originalbildern.
//            Nur nötig, solange Cover fehlen. Vorgabe: ~/Desktop/information
// --nurdaten Bildumwandlung überspringen.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const ausfuehren = promisify(execFile);
const WURZEL = path.resolve(import.meta.dirname, '..');

// Konsolen-Kürzel -> Ordnername in der Batocera-Quelle. Die gamelist-Dateien in
// data/ heißen bereits nach dem Kürzel; diese Tabelle betrifft nur die Bildquelle.
const QUELLORDNER = {
  snes: 'snes', nes: 'nes', md: 'megadrive', sms: 'mastersystem', gg: 'gamegear',
  n64: 'n64', gb: 'gameboy', gbc: 'gameboy_color', gba: 'gameboyadvance',
  pce: 'pcengine', ngpc: 'neogeopocket', a26: 'atari2600', ps1: 'ps1', ps2: 'ps2'
};

// Titel, die sich nicht über den Namen finden lassen: Untertitel, japanische
// Originalfassungen, Lokalisierungen. Schlüssel ist der kuratierte Titel.
const HANDZUORDNUNG = {
  'snes|Trials of Mana': 'Seiken Densetsu 3',
  'snes|SimCity 2000': 'SimCity 2000 : The Ultimate City Simulator',
  'nes|S.C.A.T.': 'S.C.A.T. : Special Cybernetic Attack Team',
  'nes|EarthBound Beginnings': 'Mother',
  'sms|The Smurfs': 'Die Schlümpfe',
  'sms|Aztec Adventure': 'Aztec Adventure : The Golden Road to Paradise',
  'sms|Sensible Soccer': 'Sensible Soccer : European Champions',
  'pce|Parasol Stars': 'Parasol Stars : The Story of Bubble Bobble III',
  'ngpc|Fatal Fury F-Contact': 'Garou Densetsu : First Contact',
  'ngpc|Dark Arms — Beast Buster 1999': 'Beast Busters: Yami no Seitai Heiki',
  'a26|MegaMania': 'MegaMania : A Space Nightmare',
  'ps1|Tomb Raider III': 'Tomb Raider III : Adventures of Lara Croft',
  'snes|Star Fox 2': 'StarWing 2',
  "md|Ghouls'n Ghosts": 'Dai-Makaimura',
  'md|Altered Beast': 'Juuouki',
  'md|Puyo Puyo Tsuu': 'Puyo Puyo 2',
  'md|Sonic 3D Blast': "Sonic 3D Flickies' Island",
  'gb|Pokemon — Yellow Version': 'Pokémon Yellow Special Pikachu Edition',
  'ngpc|SNK vs. Capcom — The Match of the Millennium': 'Choujou Kessen Saikyou Fighters : SNK vs. Capcom',
  'ngpc|Samurai Shodown! 2': 'Samurai Spirits! 2',
  'ngpc|Puyo Pop': 'Puyo Puyo Tsuu',
  'ngpc|Neo Turf Masters': 'Big Tournament Golf'
};

// Die Kästchen sind 44x58 (Liste) und 124x166 (Detailblatt) groß, also reicht
// rechnerisch die doppelte Kantenlänge für 2x-Bildschirme.
// Zur Qualitätszahl: sips ist anders geeicht als übliche JPEG-Encoder und
// liefert bei gleicher Zahl rund doppelt so große Dateien. Q45 entspricht hier
// etwa dem, was anderswo Q60 heißt — sichtbar ist der Unterschied nicht.
const BREITE = { small: 128, large: 400, screenshot: 480 };
const QUALITAET = { small: 50, large: 45, screenshot: 45 };

// Screenshots werden nie vergrößert: eine Game-Boy-Aufnahme ist nativ 160x144,
// auf 480 hochgerechnet kostet sie das Doppelte und die Pixel verwaschen.
// Die Seite skaliert stattdessen im Browser mit harten Kanten hoch.
const NICHT_VERGROESSERN = new Set(['screenshot']);

// Felder, die aus den gamelists fliegen, bevor sie im Repo landen. data/ wird von
// GitHub Pages mit ausgeliefert; Prüfsummen und ROM-Dateinamen wären damit ein
// öffentliches Inventar, und die Spielstände gehen ohnehin niemanden etwas an.
// Der Build braucht keines davon.
const RAUSWERFEN = ['path', 'md5', 'cheevosHash', 'lastplayed', 'playcount',
  'gametime', 'favorite', 'video', 'multidisk'];

const ANFANG = '/* ---- Erzeugt von tools/build.mjs — nicht von Hand ändern ---- */';
const ENDE = '/* ---- Ende erzeugter Block ---- */';

// ---- Textwerkzeuge ----

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
const entschluesseln = s => s
  .replace(/&(amp|lt|gt|quot|apos);/g, m => ENTITIES[m])
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

const ohneAkzente = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// Absätze bleiben erhalten, Umbrüche innerhalb eines Absatzes werden zu Leerzeichen.
// Die Seite setzt jeden Absatz als eigenes <p>.
const fliesstext = s => s.split(/\n\s*\n/)
  .map(a => a.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n');

const normal = s => ohneAkzente(s).toLowerCase()
  .replace(/&/g, ' and ').replace(/[–—―−]/g, '-').replace(/['’`´]/g, '')
  .replace(/[:.,!?"()\[\]]/g, ' ').replace(/\s*-\s*/g, ' ')
  .replace(/\bthe\b/g, ' ').replace(/\s+/g, ' ').trim();

// „Mega Man“ und „Megaman“ sollen dieselbe Zeichenkette ergeben.
const engGeschrieben = s => normal(s).replace(/\s+/g, '');

export const kurzname = s => ohneAkzente(s).toLowerCase()
  .replace(/&/g, ' und ').replace(/['’`´]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// Dice-Koeffizient über Bigramme: robust gegen Wortdreher und Untertitel.
function aehnlichkeit(a, b) {
  const paare = s => { const o = new Set(); for (let i = 0; i < s.length - 1; i++) o.add(s.slice(i, i + 2)); return o; };
  const A = paare(a), B = paare(b);
  if (!A.size || !B.size) return a === b ? 1 : 0;
  let gleich = 0;
  A.forEach(x => { if (B.has(x)) gleich++; });
  return 2 * gleich / (A.size + B.size);
}

// ---- Einlesen ----

function kuratierungLesen() {
  const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
  const start = html.indexOf('const DATA = [');
  const stop = html.indexOf(ANFANG);
  if (start < 0 || stop < 0) throw new Error('DATA-Block oder Erzeugt-Marke in index.html nicht gefunden');
  const quelltext = html.slice(start + 'const DATA = '.length, stop).trim().replace(/;$/, '');
  return { html, data: new Function('return ' + quelltext)() };
}

// Beim Lesen gleich säubern und zurückschreiben. So kann eine frisch abgelegte
// gamelist ihre Prüfsummen gar nicht erst in einen Commit tragen.
function gamelistSaeubern(datei, xml) {
  const muster = new RegExp(`[ \\t]*<(${RAUSWERFEN.join('|')})>[\\s\\S]*?</\\1>\\r?\\n`, 'g');
  const sauber = xml.replace(muster, '');
  if (sauber === xml) return { xml, entfernt: 0 };
  const entfernt = (xml.match(muster) || []).length;
  fs.writeFileSync(datei, sauber);
  return { xml: sauber, entfernt };
}

let gesaeubert = 0;
function gamelistLesen(kid) {
  const datei = path.join(WURZEL, 'data', `gamelist-${kid}.xml`);
  if (!fs.existsSync(datei)) return [];
  const roh = fs.readFileSync(datei, 'utf8');
  const { xml, entfernt } = gamelistSaeubern(datei, roh);
  gesaeubert += entfernt;
  const feld = (blk, tag) => {
    const m = blk.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return m ? entschluesseln(m[1]).trim() : '';
  };
  return xml.split(/<game[\s>]/).slice(1).map(blk => ({
    name: feld(blk, 'name'), desc: feld(blk, 'desc'), genre: feld(blk, 'genre'),
    rating: feld(blk, 'rating'), releasedate: feld(blk, 'releasedate'),
    developer: feld(blk, 'developer'), publisher: feld(blk, 'publisher'),
    players: feld(blk, 'players'), cheevosId: feld(blk, 'cheevosId'),
    thumbnail: feld(blk, 'thumbnail'), image: feld(blk, 'image'),
    family: feld(blk, 'family')
  })).filter(g => g.name);
}

// ---- Zuordnung ----

// Ein angehängter Untertitel ist derselbe Titel: „Rayman 2“ und
// „Rayman 2 : The Great Escape“. Der Rest muss an einer Wortgrenze beginnen und
// darf keine Ziffer sein, sonst schluckt „Mega Man“ den freien „Mega Man 2“.
function istUntertitel(a, b) {
  const [kurz, lang] = a.length <= b.length ? [a, b] : [b, a];
  if (!lang.startsWith(kurz + ' ')) return false;
  return !/^\d/.test(lang.slice(kurz.length + 1));
}

function zuordnen(data) {
  const treffer = new Map();
  const offenGesamt = [];
  const uebrigGesamt = [];
  const unsicher = [];

  for (const konsole of data) {
    const kid = konsole.id;
    const eintraege = gamelistLesen(kid)
      .map(g => ({ ...g, _n: normal(g.name), _e: engGeschrieben(g.name) }));
    const frei = new Set(eintraege);
    const titel = konsole.games.flatMap(g => g.list.map(([t]) => t));

    const nimm = (t, g) => { treffer.set(kid + '|' + t, g); frei.delete(g); };
    let offen = [];

    for (const t of titel) {
      const hand = HANDZUORDNUNG[kid + '|' + t];
      const g = hand
        ? [...frei].find(x => x.name === hand)
        : [...frei].find(x => x._n === normal(t));
      if (g) nimm(t, g); else offen.push(t);
    }
    offen = offen.filter(t => {
      const g = [...frei].find(x => x._e === engGeschrieben(t));
      return g ? (nimm(t, g), false) : true;
    });
    offen = offen.filter(t => {
      const g = [...frei].find(x => istUntertitel(normal(t), x._n));
      if (!g) return true;
      unsicher.push({ kid, titel: t, name: g.name, weg: 'Untertitel' });
      nimm(t, g);
      return false;
    });
    offen = offen.filter(t => {
      let bester = null, wert = 0;
      frei.forEach(g => { const v = aehnlichkeit(engGeschrieben(t), g._e); if (v > wert) { wert = v; bester = g; } });
      if (!(bester && wert >= 0.62)) return true;
      unsicher.push({ kid, titel: t, name: bester.name, weg: 'ähnlich ' + wert.toFixed(2) });
      nimm(t, bester);
      return false;
    });

    offenGesamt.push(...offen.map(t => `${kid} | ${t}`));
    uebrigGesamt.push(...[...frei].map(g => `${kid} | ${g.name}`));
  }
  return { treffer, offen: offenGesamt, uebrig: uebrigGesamt, unsicher };
}

// ---- Bilder ----

// Kantenlänge aus dem Dateikopf lesen, statt sips ein zweites Mal je Bild zu starten.
function laengsteKante(datei) {
  let buf;
  try { buf = fs.readFileSync(datei); } catch { return 0; }
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47)
    return Math.max(buf.readUInt32BE(16), buf.readUInt32BE(20));
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    for (let i = 2; i + 9 < buf.length;) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marke = buf[i + 1];
      // SOF0–SOF15 tragen die Maße; DHT/DAC/RST/SOS sind keine Rahmenköpfe.
      if (marke >= 0xc0 && marke <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marke))
        return Math.max(buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5));
      if (marke === 0xd8 || (marke >= 0xd0 && marke <= 0xd9)) { i += 2; continue; }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return 0;
}

async function bilderUmwandeln(auftraege, quelle) {
  let erledigt = 0, uebersprungen = 0, fehler = 0;
  const warteschlange = auftraege.slice();
  const arbeiter = Array.from({ length: Math.max(2, os.cpus().length - 1) }, async () => {
    for (let a = warteschlange.pop(); a; a = warteschlange.pop()) {
      if (fs.existsSync(a.ziel)) { uebersprungen++; continue; }
      if (!fs.existsSync(a.von)) { fehler++; continue; }
      let breite = a.breite;
      if (NICHT_VERGROESSERN.has(a.art)) {
        const nativ = laengsteKante(a.von);
        if (nativ) breite = Math.min(breite, nativ);
      }
      fs.mkdirSync(path.dirname(a.ziel), { recursive: true });
      try {
        await ausfuehren('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(a.qualitaet),
          '-Z', String(breite), a.von, '--out', a.ziel]);
        erledigt++;
        if (erledigt % 400 === 0) process.stdout.write(`  … ${erledigt} umgewandelt\n`);
      } catch { fehler++; }
    }
  });
  await Promise.all(arbeiter);
  if (!quelle && fehler) process.stdout.write('  (Quellordner fehlt — vorhandene Bilder bleiben unberührt)\n');
  return { erledigt, uebersprungen, fehler };
}

// ---- Hauptlauf ----

const argumente = process.argv.slice(2);
const wert = name => { const i = argumente.indexOf(name); return i >= 0 ? argumente[i + 1] : null; };
const quelle = wert('--quelle') || path.join(os.homedir(), 'Desktop', 'information');
const nurDaten = argumente.includes('--nurdaten');

const { html, data } = kuratierungLesen();
const { treffer, offen, uebrig, unsicher } = zuordnen(data);

const spieleGesamt = data.reduce((n, k) => n + k.games.reduce((m, g) => m + g.list.length, 0), 0);
console.log(`Kuratierte Spiele: ${spieleGesamt}   zugeordnet: ${treffer.size}`);
if (gesaeubert) console.log(`\n${gesaeubert} Einträge aus den gamelists entfernt `
  + `(${RAUSWERFEN.join(', ')}) — data/ liegt öffentlich.`);
if (unsicher.length) {
  console.log('\nNicht über den Namen zugeordnet — bitte prüfen:');
  unsicher.forEach(u => console.log(`  [${u.kid}] "${u.titel}"  ->  "${u.name}"  (${u.weg})`));
}
if (offen.length) { console.log('\nOhne gamelist-Eintrag:'); offen.forEach(o => console.log('  ' + o)); }
if (uebrig.length) { console.log('\nIn gamelist, nicht im Katalog:'); uebrig.forEach(o => console.log('  ' + o)); }

const extra = {};
const texte = {};
const bildauftraege = [];
const belegt = {};
const ohneCoverAberSzene = [];
const zaehler = { desc: 0, rating: 0, jahr: 0, cover: 0, szene: 0, reihe: 0 };

for (const konsole of data) {
  const kid = konsole.id;
  for (const gruppe of konsole.games) {
    for (const [titel] of gruppe.list) {
      const g = treffer.get(kid + '|' + titel);
      const e = {};
      if (!g) { extra[kid + '|' + titel] = e; continue; }

      const bewertung = parseFloat(g.rating);
      if (bewertung > 0) { e.r = Math.round(bewertung * 100) / 10; zaehler.rating++; }
      const jahr = (g.releasedate || '').slice(0, 4);
      if (/^\d{4}$/.test(jahr)) { e.y = jahr; zaehler.jahr++; }
      if (g.developer) e.dev = g.developer;
      if (g.publisher) e.pub = g.publisher;
      if (g.players) e.pl = g.players;
      if (g.genre) e.g = g.genre;
      if (g.cheevosId) e.ch = 1;
      if (g.desc) { texte[kid + '|' + titel] = fliesstext(g.desc); zaehler.desc++; }
      if (g.family) { e.f = g.family; zaehler.reihe++; }

      // Ein Kurzname je Spiel, den sich Cover und Screenshot teilen. Er folgt dem
      // kuratierten Titel, nicht dem ROM-Namen — ein Wechsel des Dateinamens in der
      // gamelist lässt die Bilder dadurch unberührt.
      belegt[kid] ??= new Set();
      let name = kurzname(titel) || 'spiel';
      while (belegt[kid].has(name)) name += '-x';
      belegt[kid].add(name);

      const einplanen = (xmlPfad, arten, marke) => {
        if (!xmlPfad) return false;
        const von = path.join(quelle, QUELLORDNER[kid] || kid, xmlPfad.replace(/^\.\//, ''));
        const ziele = arten.map(art => ({ art, ziel: path.join(WURZEL, 'images', art, kid, name + '.jpg') }));
        const fertig = ziele.every(z => fs.existsSync(z.ziel));
        // Ohne Bildlauf zählt nur, was schon dasteht — sonst verweist die Seite
        // auf Dateien, die dieser Lauf gar nicht angelegt hat.
        if (!fertig && (nurDaten || !fs.existsSync(von))) return false;
        ziele.forEach(z => bildauftraege.push({
          ...z, von, breite: BREITE[z.art], qualitaet: QUALITAET[z.art]
        }));
        e[marke] = marke === 'c' ? name : 1;
        return true;
      };
      if (einplanen(g.thumbnail, ['small', 'large'], 'c')) zaehler.cover++;
      // Der Screenshot hängt am selben Kurznamen wie das Cover. Ohne Cover hat die
      // Seite keinen Pfad, an dem sie ihn suchen könnte — dann bleibt er weg.
      if (e.c && einplanen(g.image, ['screenshot'], 's')) zaehler.szene++;
      else if (!e.c && g.image) ohneCoverAberSzene.push(`${kid} | ${titel}`);

      extra[kid + '|' + titel] = e;
    }
  }
}

console.log(`\nAus den gamelists übernommen — Beschreibung ${zaehler.desc}, Wertung ${zaehler.rating}, `
  + `Jahr ${zaehler.jahr}, Cover ${zaehler.cover}, Screenshot ${zaehler.szene}, `
  + `Reihe ${zaehler.reihe}  (von ${spieleGesamt})`);
if (ohneCoverAberSzene.length)
  console.log('\nScreenshot vorhanden, aber kein Cover — bleibt ungenutzt:\n  '
    + ohneCoverAberSzene.join('\n  '));

if (!nurDaten && bildauftraege.length) {
  console.log(`\nBilder umwandeln (${bildauftraege.length} Dateien) …`);
  const r = await bilderUmwandeln(bildauftraege, fs.existsSync(quelle) ? quelle : null);
  console.log(`  neu ${r.erledigt}, vorhanden ${r.uebersprungen}, übersprungen ${r.fehler}`);
}

// Die Langbeschreibungen sind zwei Drittel der Nutzlast, werden aber immer nur
// einzeln im Detailblatt gelesen. Sie liegen deshalb in einer eigenen Datei, die
// die Seite erst nach dem ersten Aufbau nachlädt — als Skript, nicht per fetch,
// damit index.html auch per Doppelklick aus dem Ordner funktioniert.
const texteDatei = `window.TEXTE = ${JSON.stringify(texte)};\n`;
fs.writeFileSync(path.join(WURZEL, 'data', 'texte.js'), texteDatei);

const block = `${ANFANG}\nconst EXTRA = ${JSON.stringify(extra)};\n${ENDE}`;
const von = html.indexOf(ANFANG);
const bis = html.indexOf(ENDE) + ENDE.length;
fs.writeFileSync(path.join(WURZEL, 'index.html'), html.slice(0, von) + block + html.slice(bis));

const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log(`\nindex.html geschrieben — Datenblock ${kb(block.length)}`);
console.log(`data/texte.js geschrieben — ${Object.keys(texte).length} Beschreibungen, ${kb(texteDatei.length)}`);
