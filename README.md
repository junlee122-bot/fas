# IRON DOMINION — 1942

제2차 세계대전에서 출발해 국가·전선·인사·정책을 운영하는 대체역사 전략 게임입니다. 품질 기준은 **PC의 큰 화면과 마우스·키보드로 오래 플레이하는 전략 게임**입니다. 모바일 대응보다 조작 정확성, 정보 가독성, 시뮬레이션 일관성을 우선합니다.

## 개발 상태 · 2026-10-04

- `main`은 v0.1.0 프로토타입입니다. 현재 확장 개발은 [`agent/expand-campaign-depth`](https://github.com/junlee122-bot/fas/tree/agent/expand-campaign-depth)의 v0.22.0에서 진행합니다.
- 확장 전체를 제안한 [PR #1](https://github.com/junlee122-bot/fas/pull/1)은 draft이며 아직 병합되지 않았습니다. 구현, 병합, CI 통과, 배포는 각각 별도의 증거가 필요합니다.
- [브라우저 체험](https://junlee122-bot.github.io/fas/)과 [배포 이력](https://github.com/junlee122-bot/fas/actions/workflows/deploy-pages.yml)을 확인할 수 있습니다. 브랜치의 최신 코드와 현재 서비스가 항상 같다는 뜻은 아닙니다.

13개 진영의 캠페인·커리어, 육해공 작전, 외교·정치·경제와 전쟁 이후 국가 운영을 확장하고 있습니다. 기존 README의 전체 기능 목록과 역사 데이터 설명은 [기능 목록](docs/feature-inventory.md)에 보존했습니다. 상세한 증거 구분은 [개발 상태](docs/development-status.md), 의존성 순서의 검토 범위는 [리뷰 지도](docs/review-map.md)를 참고하세요.

## 실행과 검증

Node.js **22**와 npm을 사용합니다. 아래 명령은 이 리뷰 브랜치 기준입니다.

```bash
npm ci
npm run dev
```

```bash
npm run typecheck       # TypeScript 검사
npm run lint            # typecheck의 호환 별칭; 별도 스타일 린터 없음
npm run ci              # 타입 → 전체 테스트 → 지리 회귀/감사 → 프로덕션 빌드
npm run build:pages     # /fas/ 경로의 Pages 빌드
```

새 검증 게이트는 이 변경이 승인·병합되기 전까지 게시 브랜치의 배포를 보호하지 않습니다. 기존 `main`에는 배포 workflow가 없으므로 README만 변경하는 PR이 확장 브랜치에만 있는 workflow를 실행시키지는 않습니다. 저장은 현재 브라우저에 보관되며, 첫 실행에는 지도·게임 데이터 로딩 시간이 필요할 수 있습니다.
