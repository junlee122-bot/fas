# Higgsfield 방향 첫 적용: 지휘 데스크와 정부·행정

> 아래는 최초 UI 적용 시점의 기록이다. 이후 실제 Higgsfield 삽화 3장을 생성해
> 연결한 결과는 [생성·적용 보고서](higgsfield-assets-2026-09-17.md)를 참고한다.

## 반영 범위

- 기존 다크 청회색·금색 UI와 메뉴를 유지했다. 별도 시안이나 새 호스팅 게임을 만들지 않았다.
- 지휘 데스크 제목은 실제 보직, 권한은 간결한 띠, 주요 결정은 어두운 결재 문서로 구성했다.
- 추가 안건과 진행 중 업무는 목록으로, 임무·실제 최근 기록은 오른쪽 열로 구분했다.
- 기존 군사·정치·정보 분야 삽화 3개를 소량 재사용했다. 분위기 삽화라는 설명을 붙이고 실존 인물·실제 사건 증거로 사용하지 않았다.
- 삽화는 1936-1959년에만 표시한다. 이후 시대·알 수 없는 연도에는 본문 UI만 남는다.
- 정부·행정은 기록 목록, 대상 선택, 현재 조건, 검토 순서로 편집했다. 승인과 현지 행정을 순차 단계로 잘못 표현하지 않는다.
- 조건 경계값을 반올림하여 요건 충족으로 오인하는 표시 문제를 수정했다.
- 아이콘의 예전 녹색 내부색을 표면별 변수로 분리하고 기존 다크 UI의 그림자 혼용을 줄였다.
- 국가원수의 직접 군사 안건이 분야 필터에 가려지는 표시 버그를 공통 표시 함수로 수정했다. 기존 권한 모델의 최고 보직 조건을 그대로 사용하며, locked/report/request를 direct로 바꾸지 않는다.

## 보존한 계약

게임 엔진·경제 비용·저장 형식·권한 모델·결재 흐름은 변경하지 않았다.
화면 열람이나 삽화 표시는 조치 증거나 보상을 만들지 않는다. 검토, 취소,
기록 선택은 집행이 아니다. 집행 전 fingerprint 재검증과 단일 집행 gate는
유지한다. 작전/참모/해상수송/군수수송의 원래 ID와 목적지를 그대로 전달한다.

## 도구와 아트 상태

Higgsfield의 공통 미술 규칙·소량 파일럿·실제 상태를 통한 피드백 원칙을
적용했다. 이 세션에는 Higgsfield 생성·카탈로그 실행 도구가 노출되지 않았다.
따라서 신규 Higgsfield 이미지나 영상은 생성하지 않았고, 다른 생성기를
대신 사용하거나 크레딧을 소비하지 않았다. 기존 자산의 원래 생성자·라이선스
기록이 없으므로 이를 새로 확인한 것처럼 표시하지 않았다.

미술 방향 초안과 자산 목록은 `design/command-desk-art-direction.md`,
`design/command-desk-assets.csv`에 분리했다. 새로운 전후·현대 삽화, 실존 인물
초상, 사건별 영상, 다른 모든 업무 화면의 미술 확장은 이번 적용에 포함되지 않는다.

## 검증

- 앱·설정 TypeScript 검사 통과.
- 관련 회귀 19개 파일, 703개 테스트 통과. 장기 조합을 포함한 전체 suite 재실행은 아님.
- 마지막 표시 수정 후 CommandDesk/access/art 3개 파일 64개 테스트 재검증 통과.
- `npm run build` 통과. 기존 대형 청크 경고 존재: 주 JS 약 3.46 MB, gzip 약 1.09 MB.
- `git diff --check` 변경 대상 검사 통과. Windows LF/CRLF 안내만 있음.
- 별도 브라우저 세션에서 영국 군사 4성·정치 5성으로 시작하여 실제 화면 검증.
- 지휘 데스크 1920x1080, 2560x1440, 3840x2160에서 가로 페이지 넘침 0,
  주요 제목·버튼의 내부 가로 잘림 0. 삽화 로딩 정상.
- PC 확대 대응의 보조 검사로 CSS 1280x720도 확인: 가로 넘침/주요 글자 잘림 없음.
  낮은 가용 높이에서는 핵심 버튼까지 세로 스크롤이 필요하며, 이를 무스크롤 완료로 기록하지 않는다.
- 부대 지휘 버튼이 실제 합동군 업무 화면으로 연결되고, 주간 브리핑 열기/닫기가 유지됨.
- 정부·행정에서 공표 검토→취소→재검토, 비용 확인 후 공표,
  승인 요청 검토→요청 접수→심사 중 기록 표시 확인.
- 행정 인수안을 검토 중에 국가 기록 행을 선택하면 이전 검토안이 폐기됨
  (`reviewCount: 0`), 선택 기록이 갱신됨. 행정 인수는 집행하지 않음.
- 정부·행정 1080p/1440p/4K에서 가로 넘침과 주요 버튼·제목 잘림 0.
- 두 브라우저 세션에서 JS 오류 및 Vite 오류 overlay 없음.

재현 가능한 빠른 회귀:

```powershell
node node_modules/vitest/vitest.mjs run src/CommandDesk.test.tsx src/commandDeskAccess.test.ts src/commandDeskArt.test.ts
node node_modules/typescript/bin/tsc -b --pretty false
npm run build
```

## 화면 기록

- `higgsfield-direction-desk-1080p.png`
- `higgsfield-direction-desk-1440p.png`
- `higgsfield-direction-desk-4k.png`
- `higgsfield-direction-desk-pc-scaled.png`
- `higgsfield-direction-government-1080p.png`
- `higgsfield-direction-government-records-1080p.png`
- `higgsfield-direction-government-1440p.png`
- `higgsfield-direction-government-4k.png`

로컬 확인 주소: http://127.0.0.1:4197/ . 프시케의 4173은 변경하지 않았다.
커밋·외부 배포는 이번 요청에서 수행하지 않았다.
