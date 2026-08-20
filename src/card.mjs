// The card is plain markup: an image per repository, wrapped in a link to it.
// No artwork is embedded — every sprite is referenced where PokéAPI reports it.
import { spriteUrl } from './config.mjs';

const cap = (n) => n.replace(/(^|-)([a-z])/g, (_, a, b) => a + b.toUpperCase());
const WIDTH = 880; // roughly the readable width of a rendered README

const cell = (p, width) => {
  const url = `https://github.com/${p.upstream}`;
  const repo = p.upstream.split('/')[1];
  // Repository names run from six characters to thirty-five; untrimmed they stretch their column.
  const label = repo.length > 12 ? `${repo.slice(0, 11)}…` : repo;
  const parked = p.alive ? '' : ' · parked';
  return (
    `<td align="center" width="${width}">` +
    `<a href="${url}"><img src="${spriteUrl(p.mon)}" width="64" alt="${p.mon.name}"></a><br>` +
    `<b>${cap(p.mon.name)}</b><br><sub>Lv.${p.level}${parked}</sub><br>` +
    `<sub><a href="${url}" title="${p.upstream}">${label}</a></sub></td>`
  );
};

export function card(lineup, columns, dexUrl) {
  // 0 keeps everything on one row; GitHub wraps wide tables in a scrolling container.
  const per = columns || lineup.length || 1;
  const width = Math.floor(WIDTH / Math.min(per, lineup.length || 1));
  const rows = lineup.reduce((acc, p, i) => (i % per ? acc : [...acc, lineup.slice(i, i + per)]), []);
  const table = ['<table>', ...rows.map((r) => `<tr>\n${r.map((p) => cell(p, width)).join('\n')}\n</tr>`), '</table>'];
  return [...table, ...(dexUrl ? ['', `<sub><a href="${dexUrl}">Dex</a></sub>`] : [])].join('\n');
}
