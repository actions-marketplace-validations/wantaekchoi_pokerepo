# PokeRepo

[English](README.md) · [한국어](README.ko.md)

저장소 하나에 포켓몬 하나. 커밋이 레벨을 올리고 머지된 풀 리퀘스트가 도감에 등록합니다.

## 설치

[**설치 페이지**](https://wantaekchoi.github.io/pokerepo/#setup)에서 사용자명을 넣으면 내용이 채워진 두 파일이 열립니다.

<details>
<summary>직접 하기</summary>

**1.** 사용자명과 똑같은 이름의 공개 저장소를 만듭니다. 그 README가 프로필에 표시됩니다.

**2.** 카드가 들어갈 자리에 두 줄을 넣습니다.

```html
<!-- POKEREPO:START -->
<!-- POKEREPO:END -->
```

**3.** 같은 저장소에 `.github/workflows/pokerepo.yml`을 추가합니다.

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

**4.** Actions 탭 → `pokerepo` → Run workflow.

</details>

설정 항목은 [마켓플레이스 페이지](https://github.com/marketplace/actions/pokerepo-dex)에 있습니다.

## 고지

코드는 [MIT](LICENSE)이며 이 프로젝트가 직접 작성한 소스에만 적용됩니다.

비공식 비영리 팬 프로젝트로, 닌텐도·게임프리크·크리처스·포켓몬 컴퍼니와 제휴 관계가 없으며 승인도 받지 않았습니다. 포켓몬 이름과 이미지의 권리는 각 권리자에게 있습니다.

포켓몬 이미지는 이 저장소에도 릴리스에도 저장하지 않습니다. 스프라이트는 [PokéAPI](https://pokeapi.co)가 알려주는 주소를 참조합니다. 종 데이터는 PokéAPI의 BSD-3-Clause를 따릅니다. 권리자께서 문제를 제기하실 일이 있으면 이슈를 열어 주십시오.
