// Pulls species, evolutions, experience tables and sprite addresses from PokéAPI
// and freezes them into data/species.json. No generation cutoff is written down,
// so a new generation only needs this script to run again.
import { writeFile } from 'node:fs/promises';

const EP = 'https://beta.pokeapi.co/graphql/v1beta';
const ask = async (query) => {
  const r = await fetch(EP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  const { data, errors } = await r.json();
  if (errors) throw new Error(JSON.stringify(errors));
  return data;
};

const data = await ask(`{
  species: pokemon_v2_pokemonspecies(order_by:{id:asc}) {
    id name capture_rate is_legendary is_mythical is_baby generation_id
    evolution_chain_id evolves_from_species_id
    pokemon_v2_growthrate { id name }
  }
  evolution: pokemon_v2_pokemonevolution {
    evolved_species_id min_level min_happiness time_of_day
    pokemon_v2_evolutiontrigger { name }
    pokemon_v2_item { name }
  }
  exp: pokemon_v2_experience(order_by:{level:asc}) { level experience growth_rate_id }
  forms: pokemon_v2_pokemon(where:{is_default:{_eq:true}}) {
    pokemon_species_id
    pokemon_v2_pokemonsprites { sprites }
  }
}`);

// PokéAPI reports sprite addresses itself. Nothing is scraped and no URL is assembled here.
const dig = (o, ...path) => path.reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), o);
const sprites = {};
for (const f of data.forms) {
  let s = f.pokemon_v2_pokemonsprites[0]?.sprites;
  if (typeof s === 'string') s = JSON.parse(s);
  sprites[f.pokemon_species_id] = {
    animated: dig(s, 'versions', 'generation-v', 'black-white', 'animated', 'front_default') ?? null,
    artwork: dig(s, 'other', 'official-artwork', 'front_default') ?? null,
    home: dig(s, 'other', 'home', 'front_default') ?? null,
    front: dig(s, 'front_default') ?? null,
  };
}

// Only the animated set varies in size — artwork, home and front are square and uniform.
// Ten bytes of the GIF header carry the dimensions, so a ranged request is enough.
const gifSize = async (url) => {
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=0-9' } });
    const b = new Uint8Array(await r.arrayBuffer());
    if (b.length < 10 || b[0] !== 0x47 || b[1] !== 0x49 || b[2] !== 0x46) return null;
    return [b[6] | (b[7] << 8), b[8] | (b[9] << 8)];
  } catch {
    return null;
  }
};

const animated = Object.entries(sprites).filter(([, v]) => v.animated);
for (let i = 0; i < animated.length; i += 32) {
  const batch = animated.slice(i, i + 32);
  const sizes = await Promise.all(batch.map(([, v]) => gifSize(v.animated)));
  batch.forEach(([id], j) => { if (sizes[j]) sprites[id].animatedSize = sizes[j]; });
}

const curves = {};
for (const e of data.exp) (curves[e.growth_rate_id] ??= {})[e.level] = e.experience;

const evo = {};
for (const e of data.evolution) {
  evo[e.evolved_species_id] = {
    trigger: e.pokemon_v2_evolutiontrigger?.name ?? 'other',
    minLevel: e.min_level ?? null,
    minHappiness: e.min_happiness ?? null,
    timeOfDay: e.time_of_day || null,
    item: e.pokemon_v2_item?.name ?? null,
  };
}

const species = data.species.map((s) => ({
  id: s.id, name: s.name, captureRate: s.capture_rate,
  growthRateId: s.pokemon_v2_growthrate.id, growthRate: s.pokemon_v2_growthrate.name,
  chainId: s.evolution_chain_id, from: s.evolves_from_species_id ?? null, gen: s.generation_id,
  legendary: s.is_legendary, mythical: s.is_mythical, baby: s.is_baby,
  sprites: sprites[s.id] ?? {},
  evo: evo[s.id] ?? null,
}));

await writeFile(new URL('../data/species.json', import.meta.url),
  JSON.stringify({ source: 'PokeAPI GraphQL (BSD-3-Clause data)', builtFrom: species.length, curves, species }));

// What the Dex page draws, plus what an entry needs to work out its next evolution.
// Positional so the file stays small: the page names the columns when it reads them.
const flags = (s) => (s.legendary ? 1 : 0) | (s.mythical ? 2 : 0) | (s.baby ? 4 : 0);
await writeFile(new URL('../docs/dex.json', import.meta.url), JSON.stringify({
  curves,
  species: species.map((s) => [
    s.id, s.name,
    s.sprites.animated ?? s.sprites.artwork ?? s.sprites.front ?? null,
    s.sprites.front ?? null,
    s.gen, s.growthRateId, s.from,
    s.evo?.trigger ?? null, s.evo?.minLevel ?? null, s.evo?.item ?? null,
    flags(s),
    s.sprites.animatedSize ?? null,
  ]),
}));

console.log(`species ${species.length} (max id ${Math.max(...species.map((s) => s.id))}) · evolutions ${Object.keys(evo).length} · animated ${species.filter((s) => s.sprites.animated).length} · artwork ${species.filter((s) => s.sprites.artwork).length}`);
