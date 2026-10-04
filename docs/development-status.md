# 개발 상태와 증거 · 2026-10-04

## 구현과 병합

| 구분 | 확인한 기준 | 의미 |
| --- | --- | --- |
| `main` | `212d887a22dbbbd43b3b3d97b5a2b188e556e8a1`, package v0.1.0 | 최초 프로토타입; 확장 기능의 병합 증거가 아님 |
| `agent/expand-campaign-depth` | `0b477e65cc55570bbc757dea4a11a7a1d3580030`, package v0.22.0 | 현재 확장 구현 기준 |
| [PR #1](https://github.com/junlee122-bot/fas/pull/1) | open, draft, unmerged | 확장 전체 검토 제안; 승인·출시 완료를 뜻하지 않음 |

이 문서와 [리뷰 지도](review-map.md)는 확장 기준에서 만든 별도 리뷰 브랜치의 변경입니다. [기능 목록](feature-inventory.md)은 기존 README를 상대 링크만 수정해 보존한 구현 설명이며, 모든 동작에 대한 최신 수동 검증 보고서가 아닙니다.

## CI와 배포

[확인한 기존 Pages 실행](https://github.com/junlee122-bot/fas/actions/runs/35969422163)은 확장 기준 SHA에서 build와 deploy가 성공했습니다. 당시 검사는 지리 회귀·감사와 Pages 빌드였으며 전체 Vitest 통과 증거는 아닙니다. [전체 배포 이력](https://github.com/junlee122-bot/fas/actions/workflows/deploy-pages.yml)과 [Pages 체험 주소](https://junlee122-bot.github.io/fas/)를 함께 확인하세요. 실행 이력만으로 현재 제공 중인 파일의 SHA를 단정하지 않습니다.

제안하는 게이트는 Node 22에서 `npm ci` 후 `npm run ci`를 실행합니다. 순서는 타입 검사(`lint` → `typecheck`), 전체 Vitest(단일 worker), 지리 회귀, 지리 감사, 프로덕션 빌드이며 앞 단계 실패 시 중단합니다. 별도 스타일 린터는 없습니다.

- 모든 PR(draft 포함)과 게시 브랜치 이외의 push에서 재사용 가능한 검증 workflow를 실행합니다.
- 게시 브랜치 push는 배포 workflow가 같은 검증을 호출합니다. 검증 성공 뒤에만 Pages build, 그 성공 뒤에만 deploy가 이어집니다.
- build의 허용 ref는 정확히 `refs/heads/main`, `refs/heads/agent/expand-campaign-depth`입니다. 다른 ref의 수동 실행은 검증만 수행합니다.
- 게시 ref는 `pages` concurrency를 공유합니다. 다른 ref는 ref별 별도 그룹을 사용해 실제 배포를 취소하지 못합니다.
- 기존 push/manual 트리거는 유지합니다. 이번 정리에서는 수동 배포·병합·기본 브랜치·보호 규칙 변경을 하지 않습니다.

**게이트가 게시 브랜치에 승인·병합되기 전에는 기존 배포에 적용되지 않습니다.** 확인한 `main`에는 `.github/workflows`가 없습니다. 따라서 main 대상 README-only PR은 확장에만 존재하는 workflow를 실행하지 않습니다. 해당 PR에 CI가 없다는 사실을 성공 판정으로 바꾸지 않습니다.

## 검증 기록의 읽는 법

이번 변경의 새 Node 22 검증 결과와 원격 head별 CI 결과는 해당 draft PR 본문과 연결된 Actions 실행에서 확인합니다. 이전 Node 24의 4,670개 테스트 결과는 비교용 기록이며 이번 실행을 대신하지 않습니다. 기존 빌드의 큰 chunk 경고는 알려진 제한으로 남습니다.

`docs/`의 스크린샷·장기 시뮬레이션·연구 보고서는 생성 당시의 증거입니다. 기존 보고서를 읽거나 artifact 보존 테스트를 통과했다고 장기 시뮬레이션 또는 PC 실조작을 새로 수행한 것은 아닙니다. 새 실행에는 정확한 head, Node 버전, 명령, 결과와 검증하지 못한 범위를 따로 기록해야 합니다.

`possibilityRemediationArtifacts.test.ts`와 `armsDiplomacyArtifacts.test.ts`가 참조하는 JSON, 국가별 Markdown/요약/압축 원본은 테스트 입력이므로 문서 정리에서 삭제하거나 이동하지 않습니다. PC 실조작 후속 항목은 [리뷰 지도](review-map.md)의 마지막 체크리스트에 있습니다.
