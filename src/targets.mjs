// Everything the card can draw from: your repositories and anywhere your work was merged.
// A card is public, so anything the API does not report as public is dropped here and nowhere else.
import { myRepos, mergedRepos, repoInfo } from './sources.mjs';

export async function targets(login) {
  const merged = await mergedRepos(login);
  const own = await myRepos(login);

  const found = new Map(own.map((r) => [r.upstream, !r.isFork || merged.has(r.upstream)]));
  for (const up of merged.keys()) found.set(up, true);

  const checked = await Promise.all(
    [...found].map(async ([upstream, caught]) => ({
      upstream,
      caught,
      merges: merged.get(upstream) ?? 0,
      info: await repoInfo(upstream),
    }))
  );
  return checked.filter((t) => t.info && !t.info.private);
}
