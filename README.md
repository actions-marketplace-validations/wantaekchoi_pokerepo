# PokeRepo

One Pokémon per repository. Commits level it up, merged pull requests add it to your Dex.

## Setup

[**Open the setup page**](https://wantaekchoi.github.io/pokerepo/#setup) and enter your username. It opens both files already filled in.

<details>
<summary>By hand</summary>

**1.** Create a public repository named exactly your username. Its README is what GitHub shows on your profile.

**2.** Put these two lines in that README where the card should go.

```html
<!-- POKEREPO:START -->
<!-- POKEREPO:END -->
```

**3.** In that same repository, add `.github/workflows/pokerepo.yml`.

```yaml
name: pokerepo
on:
  schedule: [{ cron: "0 21 * * *" }]
  workflow_dispatch:
permissions: { contents: write }
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: wantaekchoi/pokerepo@v1
```

**4.** Actions tab → `pokerepo` → Run workflow.

</details>

Options are on the [Marketplace page](https://github.com/marketplace/actions/pokerepo-dex).

## Notice

Code is [MIT](LICENSE), covering this project's own source only.

Unofficial, non-commercial fan project, not affiliated with or endorsed by Nintendo, Game Freak, Creatures Inc. or The Pokémon Company. Pokémon names and imagery belong to their respective owners.

No Pokémon artwork is stored here or in any release; sprites are referenced at the addresses [PokéAPI](https://pokeapi.co) reports. Species data comes from PokéAPI under BSD-3-Clause. Rights holders with a concern can open an issue.
