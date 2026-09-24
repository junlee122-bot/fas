# 선택에 반응하는 현장판 — 1차 구현

## 의도와 참고

장식 영상이 아니라 `실제 상태 → 장면 변화 → 대상 선택 → 기존 명령 → 주간 검증`의 흐름을 만든다. 이번 범위는 지휘 본부의 **현장 보기**다. 실제 세계지도 전체를 3D로 바꾸거나 도시 건설 엔진을 추가한 것은 아니다.

- [삼국지14 공식 일체형 지도 설명](https://www.gamecity.ne.jp/sangokushi14/system-field.html): 도시의 확장이 시각 변화로 나타나고, 현장 시설이 전장 기능과 연결된다. 여기서는 ‘상태를 장소에서 읽고 대상으로 행동한다’는 원칙을 참고했다.
- [문명 VII 제국 관리 개발일지](https://civilization.2k.com/civ-vii/game-guide/dev-diary/managing-your-empire/): 도시 개발이 인접 타일에 펼쳐지며, 관리 복잡성을 줄이고 선택의 의미를 드러내려는 설계. 출시 전후 개발일지이며 현재 모든 규칙의 설명으로 취급하지 않는다.

## 현재 구현

네 개의 독립 카드 대신 하나의 지형 위에 생산 지구·생활 시장·보건 거점·참모 회의실을 배치한다. 지형 미술은 Higgsfield로 제작했지만, 화면 상태는 로컬 엔진의 현재 값에서 계산한다.

| 장소 | 근거 데이터 | 장면 표현 | 실제 행동 |
| --- | --- | --- | --- |
| 생산 지구 | 공장 총 역량, 생산 라인 배치 | 군수·민수 비중과 점등 | 기존 1개 공장 전환 결재 또는 상신 |
| 생활 시장 | 소비재·식량 공급 지수 | 공급 정도에 따른 물품 표식 | 재정·생활 정책 화면으로 이동 |
| 보건 거점 | 진행 유행, 병상 부담, 의약품 공급 | 유행 부담 표식과 경고 | 보건 보고·정책 화면으로 이동 |
| 참모 회의실 | 현재 권한 내 서사 현안 | 후속 대화 대기 표식 | 참모 회의실로 이동 |

표식은 제한된 수의 상징이며 실제 공장·재고·환자·참석자 수가 아니다. 이동 차량이나 환자가 임의로 생기는 식의 연출은 하지 않는다. 국가 집계 모식도이므로 생성 지형도 실재 도시나 시대별 도시의 복원을 주장하지 않는다. 유행이 없다고 약품 공급까지 충분하다고 판단하지 않는다.

**현재 상태 / 전환안 미리보기**를 분리한다. 미리보기는 승인 전의 계산 결과이며 실행하지 않는다. 공장 배치와 공급 전망만 바뀐다. 물가·신뢰·병상은 미래 결과로 위장하지 않는다. 확정은 기존 결재 버튼만 실행하고 사회 반응은 기존 주간 결산으로 검증한다. 직접 권한이 없는 보직에는 미리보기·결재를 노출하지 않는다.

## 기술 경계

- `livingWorldPresentation.ts`: 부작용 없는 표현 모델. 잘못된 숫자는 자료 없음으로 처리한다.
- `LivingWorldDiorama.tsx`: 하나의 SVG 입체 모형, HTML 선택 버튼, 상태 표식. 게임 시간을 진행하지 않는다.
- `LivingWorldScene.tsx`: 기존 상세·권한·전환 함수와 결산 기록을 보존하여 연결한다.
- 키보드 포커스, 상태의 글자 표시, 장면 움직임 끄기, reduced-motion을 지원한다.
- 저장 스키마·비용·생산·보건·승인 엔진에는 변경이 없다. 이전 접근성 작업은 보존한다.

## 자산 제작 기록

- 도구: Higgsfield `generate_image`, 모델 `gpt_image_2_5`.
- 작업 ID: `46a7a609-c270-4152-8e7b-717df633e00e`.
- 비용 사전 조회: 0.25 credits. 사전 추정값이며 별도 청구 내역 확인은 하지 않았다.
- 프로젝트 파일: `src/assets/world-scenes/living-district-terrain.png`.
- 생성물은 정적인 빈 지형이다. 현장의 상태 변화는 생성 이미지가 아니라 엔진 기반 SVG가 담당한다.

### 제작 프롬프트

Asset for IRON DOMINION, a serious PC historical grand strategy game. Create an original high-end hand-painted isometric terrain diorama background, 16:9 landscape, orthographic 35-degree top-down view, restrained painterly realism of museum scale models. A single continuous rectangular urban district terrain base with four EMPTY broad paved foundation plazas in a diamond arrangement: upper-left industrial brick ground, lower-left market cobblestones, upper-right pale stone institutional plaza, lower-right garden hospital courtyard. Connect the four empty plazas with a convincing narrow road and subtle railway siding along left edge. All four plazas must remain spacious EMPTY FLAT GROUND for dynamic game-rendered buildings to be overlaid. Only low retaining walls, grass, hedges, tiny trees at far outside perimeter. No buildings, no people, no vehicles, no smoke, no construction cranes, no visible active work. Warm gray limestone, desaturated moss green, muted ochre bricks, charcoal road. Soft late afternoon light from upper left, coherent soft shadows, exceptional surface detail, readable large shapes, premium mature strategy-game art, no toy plastic or glossy mobile look. Full terrain fits within frame with clean dark green-black vignette margins, no UI, no labels, no letters, no symbols, no borders, no logos, no flags, no political insignia. Terrain only, not a real geographic map.

## 다음 확장 순서

1. **실제 물류의 진행:** 기존 `RegionalShipment` 예약→수송→도착과 보류 이유를 노선과 연결한다. 출하·도착 기록 없는 장식 차량은 쓰지 않는다.
2. **해상 작전:** 이미 있는 승선·항해·상륙·귀항 단계를 함대 위치와 장면에 연결한다.
3. **도시 성장·피해·복구:** 도시별 건물·피해·복구 상태를 저장하는 모델을 먼저 정의한다. 지금의 보급 수치만으로 도시를 폐허로 그리지 않는다.
4. **시대·지역별 미술:** 실재 지리와 검증된 시대 변화에 맞는 별도 자산군을 만든다. 현재 배경은 어느 나라의 실제 모습도 대표하지 않는다.

이번 작업은 위 후속 4개 전체의 완료를 의미하지 않는다. 새 미술을 보여주는 데 그치지 않고, 실제 명령과 검증에 연결하는 작은 수직 구현이다.

## 검증 기록

- 표현 모델·장면·기존 공장 전환·국가 시뮬레이션·권한·플레이 안내 관련 9개 파일, 108개 테스트 통과.
- 별도 영국 캠페인의 실제 UI: 현재 군수 29/민수 1 → 미리보기 군수 28/민수 2. 미리보기를 닫으면 29/1로 복귀하며 날짜는 그대로다.
- 실제 결재 후에만 28/2로 확정되고 생산 역량 전환 기록이 남았다. 소비재 공급 전망 38.3→39.1, 다음 주 사회 반응 검증 안내 확인. 주간 결산 자체를 새로 구현하거나 이번 브라우저 검증에서 다음 주까지 완료한 것은 아니다.
- 시장 미리보기와 현재 상세를 별도 표시: 예상 39.9, 현재 39.1을 명확히 구분.
- 여섯 표식의 반올림으로 작은 변화가 사라지는 문제를 연속 비중 띠로 보완. 29/30→28/30은 군수 띠 길이 203→196, 민수 7→14로 표현된다.
- 1920×1080, 2560×1440, 3840×2160에서 가로 넘침 없음 확인. 4K 현장판 1198×684.56px로 원본 7:4 비율 유지.
- ‘장면 움직임 끄기’ 후 실제 computed animationName이 none인 것을 확인. 프레임워크 오류 오버레이 없음. 모든 브라우저 콘솔 오류를 수집한 검사는 아니다.
- 증거 화면: `living-world-diorama-current-1080p.png`, `living-world-diorama-market-1440p.png`, `living-world-diorama-4k.png`.
- 로컬 `http://127.0.0.1:4197/` → 지휘 본부 → 현장 보기. 커밋·배포는 이번 요청 범위에 포함하지 않았다.
