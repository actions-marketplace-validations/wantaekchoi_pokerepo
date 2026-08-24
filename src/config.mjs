// Defaults live here, but nobody using this action edits files.
// The workflow overrides everything through environment variables (= action inputs).

const num = (k, d) => Number(process.env[k] ?? d);
const list = (k, d) => (process.env[k] ?? d).split(',').map((x) => x.trim());

/** Experience granted per contribution. */
export const EXP = {
  // Work that someone else accepted is worth more than work you pushed to yourself.
  commitOwn: num('POKEREPO_EXP_COMMIT', 250), // a commit in a repository you own
  commitExternal: num('POKEREPO_EXP_COMMIT_EXTERNAL', 600), // a commit that landed in someone else's
  mergeExternal: num('POKEREPO_EXP_MERGE', 3000), // a PR accepted into someone else's repository
  mergeOwn: num('POKEREPO_EXP_MERGE_OWN', 300), // a PR you merged into your own
  grassLevel: list('POKEREPO_EXP_GRASS', '0,100,250,450,700').map(Number),
};

/** Upstream stars decide rarity. Written as "stars:label"; any number of tiers works. */
export const TIERS = list('POKEREPO_TIERS', '10000:Rare,1000:Uncommon,100:Common,0:Everyday')
  .map((t) => {
    const [minStars, label] = t.split(':');
    return { minStars: Number(minStars), label };
  })
  .sort((a, b) => b.minStars - a.minStars);

/** Evolutions with no level requirement (stones, trades) get these instead. */
export const FALLBACK_LEVEL = { trade: 20, 'use-item': 25, other: 30 };

/**
 * Sprite address. Picked from what PokéAPI reported, falling through to the next set
 * when one is missing. Animated sprites stop after generation V, so later species
 * fall back to official artwork on their own.
 */
export function spriteUrl(species) {
  return sprite(species).url;
}

/** Square sets, so one number describes any of them. */
const SET_SIZE = { artwork: 475, home: 512, front: 96 };

/** The square each sprite is drawn to fit. POKEREPO_SPRITE_SIZE sets it. */
export const spriteBox = () => Number(process.env.POKEREPO_SPRITE_SIZE) || 64;

/**
 * Address plus the size to draw it at. Showdown's animated sprites are trimmed to their
 * subject, so they run from Swinub at 35x25 to Lugia at 153x94; drawn at a fixed width
 * they land at wildly different heights, and a tall one is drawn past that width
 * entirely. Each is scaled to fit a box instead, so the ratio holds and nothing exceeds
 * the box on either side.
 *
 * Only 16 of the 649 animated sets are square, so the drawn size reaches the box on one
 * axis and falls short on the other. Two species side by side therefore get different
 * heights — the card gives them a fixed square slot to stand in rather than letting each
 * one set its own.
 */
export function sprite(species) {
  const want = process.env.POKEREPO_SPRITE || 'animated';
  const box = spriteBox();
  for (const k of [want, 'animated', 'artwork', 'home', 'front']) {
    const url = species.sprites?.[k];
    if (!url) continue;
    const [w, h] = k === 'animated'
      ? (species.sprites.animatedSize ?? [box, box])
      : [SET_SIZE[k], SET_SIZE[k]];
    const scale = Math.min(box / w, box / h);
    return { url, width: Math.round(w * scale), height: Math.round(h * scale) };
  }
  return { url: null, width: box, height: box };
}
