# IRON DOMINION — 1942

## 개발 현황 · 2026-10-04

이 `main`은 v0.1.0 프로토타입입니다. 현재 v0.22.0 확장 개발은 [agent/expand-campaign-depth](https://github.com/junlee122-bot/fas/tree/agent/expand-campaign-depth)에서 진행하며, [확장 PR #1](https://github.com/junlee122-bot/fas/pull/1)은 draft·미병합 상태입니다. 아래 기능 설명은 main 프로토타입 기준입니다.

[Pages 체험](https://junlee122-bot.github.io/fas/) · [배포 이력](https://github.com/junlee122-bot/fas/actions/workflows/deploy-pages.yml) · [확인한 성공 실행](https://github.com/junlee122-bot/fas/actions/runs/35969422163). 해당 실행은 확장 브랜치의 배포 기록이며 main 병합이나 현재 서비스의 정확한 SHA를 증명하지 않습니다.

현재 main에는 배포 workflow가 없습니다. 따라서 이 README-only 변경은 확장 브랜치에만 있는 workflow를 실행하지 않으며, 제안된 전체 CI/배포 게이트도 게시 브랜치에 승인·병합되기 전까지 활성화되지 않습니다.

제2차 세계대전을 배경으로 한 대규모 국가·전선 지휘 전략 게임 프로토타입입니다. 국가 자원과 산업을 관리하고, 장군과 사단을 배치하며, 연구·외교·정보전을 조율해 연합군을 승리로 이끄세요.

## 실행

```bash
npm install
npm run dev
```

프로덕션 빌드는 `npm run build`로 생성합니다.

## 현재 플레이 가능한 시스템

- 유럽·지중해·북아프리카 전략 지도와 27개 지역
- 주간 단위 전략 턴 및 자동 전선 이벤트
- 인접 지역 공세 계획과 전투 해결
- 장군·사단 로스터, 능력치, 피로도, 보급 및 조직력
- 군수 공장 배분과 생산 효율
- 6개 연구 프로젝트와 연구 슬롯
- 외교 관계 및 국가별 영향력 행동
- 정보 작전, 작전 위험도, 암호 해독
- 전쟁 내각 결정, 국가 지표, 전쟁 일지
- 자동 저장 및 이어하기

## 방향

이 저장소의 첫 버전은 전체 게임의 플레이 가능한 수직 슬라이스입니다. 지도 데이터, AI 국가, 해전·공중전, 멀티 시나리오, 장기 캠페인을 독립 모듈로 확장할 수 있도록 데이터 중심 구조로 구성했습니다.
