// The card is plain markup: an image per repository, wrapped in a link to it.
// No artwork is embedded — every sprite is referenced where PokéAPI reports it.
import { sprite } from './config.mjs';

const cap = (n) => n.replace(/(^|-)([a-z])/g, (_, a, b) => a + b.toUpperCase());
const WIDTH = 880; // roughly the readable width of a rendered README

const cell = (p, width, dexUrl) => {
  const repoUrl = `https://github.com/${p.upstream}`;
  // The sprite is the species, so it opens the Dex entry; the name underneath opens the
  // repository. Without a Dex to link to, everything falls back to the repository.
  const monUrl = dexUrl ? `${dexUrl}&m=${p.mon.id}` : repoUrl;
  const repo = p.upstream.split('/')[1];
  // Repository names run from six characters to thirty-five; untrimmed they stretch their column.
  const label = repo.length > 12 ? `${repo.slice(0, 11)}…` : repo;
  const parked = p.alive ? '' : ' · parked';
  // A README strips style and script, so a cell cannot be made clickable as a block.
  // The sprite and the two names carry the links; the level stays plain, because a
  // measurement rendered in link blue stops reading as a measurement.
  const { url: src, width: w, height: h } = sprite(p.mon);
  return (
    `<td align="center" width="${width}">` +
    `<a href="${monUrl}" title="${cap(p.mon.name)} in the Dex">` +
    `<img src="${src}" width="${w}" height="${h}" alt="${p.mon.name}"></a><br>` +
    `<a href="${monUrl}"><b>${cap(p.mon.name)}</b></a><br>` +
    `<sub>Lv.${p.level}${parked}</sub><br>` +
    `<sub><a href="${repoUrl}" title="${p.upstream}">${label}</a></sub></td>`
  );
};

export function card(lineup, columns, dexUrl) {
  // 0 keeps everything on one row; GitHub wraps wide tables in a scrolling container.
  const per = columns || lineup.length || 1;
  const width = Math.floor(WIDTH / Math.min(per, lineup.length || 1));
  const rows = lineup.reduce((acc, p, i) => (i % per ? acc : [...acc, lineup.slice(i, i + per)]), []);
  const table = ['<table>', ...rows.map((r) => `<tr>\n${r.map((p) => cell(p, width, dexUrl)).join('\n')}\n</tr>`), '</table>'];
  return [...table, ...(dexUrl ? ['', `<sub><a href="${dexUrl}">Dex</a></sub>`] : [])].join('\n');
}
