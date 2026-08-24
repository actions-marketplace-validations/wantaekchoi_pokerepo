// The card is plain markup: an image per repository, wrapped in a link to it.
// No artwork is embedded — every sprite is referenced where PokéAPI reports it.
import { sprite, spriteBox } from './config.mjs';

const cap = (n) => n.replace(/(^|-)([a-z])/g, (_, a, b) => a + b.toUpperCase());
const WIDTH = 880; // roughly the readable width of a rendered README

const monUrlOf = (p, dexUrl) =>
  (dexUrl ? `${dexUrl}&m=${p.mon.id}` : `https://github.com/${p.upstream}`);

// Sprites and names live in separate rows. Sharing a cell made the name sit wherever
// that sprite happened to end, so a row of six put its names at six different heights —
// the animated sets are trimmed to their subject and almost none of them are square.
// A row of its own gives every sprite the same square slot, and the names below line up
// because table rows do. Bottom, not middle: these stand on ground, and centring makes
// the short ones (Diglett, Onix) hover.
const spriteCell = (p, width, dexUrl) => {
  const { url: src, width: w, height: h } = sprite(p.mon);
  const box = spriteBox();
  return (
    `<td align="center" valign="bottom" width="${width}" height="${box}">` +
    `<a href="${monUrlOf(p, dexUrl)}" title="${cap(p.mon.name)} in the Dex">` +
    `<img src="${src}" width="${w}" height="${h}" alt="${p.mon.name}"></a></td>`
  );
};

// A README strips style and script, so a cell cannot be made clickable as a block.
// The sprite and the two names carry the links; the level stays plain, because a
// measurement rendered in link blue stops reading as a measurement.
const textCell = (p, dexUrl) => {
  const repoUrl = `https://github.com/${p.upstream}`;
  const repo = p.upstream.split('/')[1];
  // Repository names run from six characters to thirty-five; untrimmed they stretch their column.
  // Hyphens are where a browser breaks a line, and repository names are full of them, so
  // egovframe-msa-common came out over two lines while kbotop took one and the row of
  // labels went ragged. A non-breaking hyphen keeps each label whole; the title attribute
  // and the link still carry the real name.
  const trimmed = repo.length > 12 ? `${repo.slice(0, 11)}…` : repo;
  const label = trimmed.replaceAll('-', '‑');
  const parked = p.alive ? '' : ' · parked';
  return (
    `<td align="center" valign="top">` +
    `<a href="${monUrlOf(p, dexUrl)}"><b>${cap(p.mon.name)}</b></a><br>` +
    `<sub>Lv.${p.level}${parked}</sub><br>` +
    `<sub><a href="${repoUrl}" title="${p.upstream}">${label}</a></sub></td>`
  );
};

export function card(lineup, columns, dexUrl, login) {
  // 0 keeps everything on one row; GitHub wraps wide tables in a scrolling container.
  const per = columns || lineup.length || 1;
  const width = Math.floor(WIDTH / Math.min(per, lineup.length || 1));
  const rows = lineup.reduce((acc, p, i) => (i % per ? acc : [...acc, lineup.slice(i, i + per)]), []);
  const table = ['<table>', ...rows.flatMap((r) => [
    `<tr>\n${r.map((p) => spriteCell(p, width, dexUrl)).join('\n')}\n</tr>`,
    `<tr>\n${r.map((p) => textCell(p, dexUrl)).join('\n')}\n</tr>`,
  ]), '</table>'];
  // The card shows a party; the Dex holds every entry and every repository. Naming the
  // owner says whose it is on a profile a stranger is reading.
  const label = login ? `${login}'s Dex` : 'Dex';
  return [...table, ...(dexUrl ? ['', `<sub><a href="${dexUrl}">${label}</a></sub>`] : [])].join('\n');
}
