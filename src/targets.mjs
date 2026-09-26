// Everything the card can draw from: your repositories and every repository you opened a pull
// request in. Whether each one is caught is decided later, once its landed commits are counted;
// a repository known only from a pull request is kept only if your work landed there.
// A card is public, so anything the API does not report as public is dropped here and nowhere else.
import { myRepos, pullRequests, closedByMyCommit, repoInfo } from './sources.mjs';
import { mergeCount } from './rules.mjs';

export async function targets(login) {
  const pulls = await pullRequests(login);
  const own = await myRepos(login);

  // Closed pull requests are checked one by one; merged and open ones need no extra call.
  for (const [full, list] of pulls) {
    for (const p of list) {
      if (p.state === 'closed' && !p.merged) p.closedByMyCommit = await closedByMyCommit(full, p.number, login);
    }
  }

  const found = new Map(own.map((r) => [r.upstream, { own: !r.isFork, pullOnly: false }]));
  for (const full of pulls.keys()) if (!found.has(full)) found.set(full, { own: false, pullOnly: true });

  const checked = await Promise.all(
    [...found].map(async ([upstream, { own, pullOnly }]) => ({
      upstream,
      own,
      pullOnly,
      merges: mergeCount(pulls.get(upstream) ?? []),
      info: await repoInfo(upstream),
    }))
  );
  return checked.filter((t) => t.info && !t.info.private);
}
