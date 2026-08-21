// Contributions in, card out. Each repository holds one species and the work
// that landed there is its experience.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { makeDex } from '../src/dex.mjs';
import { EXP } from '../src/config.mjs';
import { targets } from '../src/targets.mjs';
import { myCommits } from '../src/sources.mjs';
import { emptyState, merge, record } from '../src/state.mjs';
import { card } from '../src/card.mjs';

const num = (k, d) => Number(process.env[k] ?? d);
const login = process.env.POKEREPO_LOGIN || process.env.GITHUB_REPOSITORY_OWNER;
if (!login) throw new Error('POKEREPO_LOGIN is required.');
const statePath = process.env.POKEREPO_STATE || 'trainer.json';
// Where this state can be read from, so the card can link to a Dex showing it.
const home = process.env.GITHUB_REPOSITORY;
const dexBase = process.env.POKEREPO_DEX ?? 'https://wantaekchoi.github.io/pokerepo/';
// A profile repository is <user>/<user>, so half of that is noise in the link.
const [owner, repo] = (home ?? '').split('/');
const short = owner === repo ? owner : home;
const dexUrl = dexBase && home
  ? `${dexBase}?u=${short}${statePath === 'trainer.json' ? '' : `&s=${statePath}`}`
  : '';
const readmePath = process.env.POKEREPO_README ?? 'README.md';
const [partySize, rotateSlots, columns] = [
  num('POKEREPO_PARTY', 0), num('POKEREPO_ROTATE', 0), num('POKEREPO_COLUMNS', 0),
];

const db = JSON.parse(await readFile(new URL('../data/species.json', import.meta.url), 'utf8'));
const dex = makeDex(db);
const byId = new Map(db.species.map((s) => [s.id, s]));

const state = { ...emptyState(login), ...JSON.parse(await readFile(statePath, 'utf8').catch(() => '{}')) };
state.login = login;
// A repository keeps the species it was first given, so those are held before any new draw.
Object.values(state.repos).forEach((r) => dex.reserve(r.species));

const observed = await Promise.all(
  (await targets(login)).map(async (t) => {
    const known = state.repos[t.upstream];
    const stars = known?.stars ?? t.info.stargazers_count ?? 0;
    const mine = t.upstream.startsWith(`${login}/`);
    const commits = await myCommits(t.upstream, login);
    return {
      upstream: t.upstream,
      caught: t.caught,
      commits,
      merges: t.merges,
      stars,
      speciesId: known?.species ?? dex.assign(t.upstream, stars).sp.id,
      exp: commits * (mine ? EXP.commitOwn : EXP.commitExternal)
        + t.merges * (mine ? EXP.mergeOwn : EXP.mergeExternal),
    };
  })
);
merge(state, observed);
state.trainer.grassExp = Object.values(await import('../src/sources.mjs').then((m) => m.grassDays(login)))
  .reduce((a, lv) => a + (EXP.grassLevel[lv] ?? 0), 0);

// Grow each species by its experience and record every stage it passed through.
const party = Object.entries(state.repos)
  .map(([upstream, r]) => {
    const line = dex.grow(byId.get(r.species), r.exp);
    line.forEach((s) => record(state, s.id, r.caught));
    const mon = line.at(-1);
    r.level = dex.levelOf(mon, r.exp);
    r.mon = mon.id;
    return { ...r, upstream, mon };
  })
  .sort((a, b) => b.level - a.level || b.exp - a.exp);

// Everything, highest first, unless a party size is asked for. Slots beyond the
// pinned ones rotate on a seed made from the date, so however many times this runs
// in a day it draws the same card.
const today = new Date().toISOString().slice(0, 10);
const take = partySize || party.length;
const pinned = Math.max(0, take - rotateSlots);
const pool = party.slice(pinned);
const draw = (i) => Number.parseInt(createHash('sha256').update(`${login}:${today}:${i}`).digest('hex').slice(0, 12), 16);
const lineup = [
  ...party.slice(0, pinned),
  ...Array.from({ length: Math.min(take - pinned, pool.length) }, (_, i) => pool.splice(draw(i) % pool.length, 1)[0]),
];

// The page recomputes "commits until it evolves", so it needs the rates this run used.
state.exp = { commitOwn: EXP.commitOwn, commitExternal: EXP.commitExternal,
  mergeOwn: EXP.mergeOwn, mergeExternal: EXP.mergeExternal };
state.updatedAt = today;
await writeFile(statePath, JSON.stringify(state, null, 2) + '\n');

const START = '<!-- POKEREPO:START -->', END = '<!-- POKEREPO:END -->';
const md = readmePath ? await readFile(readmePath, 'utf8').catch(() => '') : '';
const framed = md.includes(START) && md.includes(END);
if (framed) {
  await writeFile(readmePath,
    md.slice(0, md.indexOf(START) + START.length) + '\n' + card(lineup, columns, dexUrl, login) + '\n' + md.slice(md.indexOf(END)));
}

const caught = Object.values(state.dex).filter((c) => c.caught).length;
console.log(framed ? `Card written to ${readmePath}` : `No ${START} markers; card not written`);
console.log(`Party ${lineup.map((p) => `${p.mon.name} Lv.${p.level}`).join(', ')}`);
console.log(`Dex ${caught}/${Object.keys(state.dex).length} · repositories ${party.length}`);
