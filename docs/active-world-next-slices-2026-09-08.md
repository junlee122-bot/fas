# 액티브 월드 후속 구현 계약 — 작전·회의·지역 생산

> 구현 상태 갱신 (2026-09-08): 아래는 작성 당시의 설계 제안 원문이다. 이후 A1·A2·B1·C1·C2를 로컬 엔진과 화면에 연결했다. 실제 API·검증 범위·남은 제약은 [구현 결과](active-slices-implementation-2026-09-08.md)를 우선한다. B2와 다중 경유 물류망은 아직 후속이다.

작성일: 2026-09-08. 문서만 작성했으며 아래 신규 타입·함수·상태는 **구현 제안**이다. 기존 코드의 실제 API와 제안을 구분한다. 근거는 [기존 조사](active-world-design-research-2026-09-08.md), [1차 개선 보고](active-world-remediation-2026-09-08.md), 작성 시점 로컬 코드다. 동시 구현 때문에 줄 번호와 선행 API의 세부 필드는 바뀔 수 있다.

## 0. 먼저 완성할 기반과 이번 문서의 결정

순서는 **전후 군수 납품·비용·영수증 → 작전 현장 → 인물 회의장 → 지역 생산·수송**으로 한다. 세 후속 기능은 새 시뮬레이션을 나란히 돌리는 것이 아니라, 동일 명령·자원·결산의 다른 접점이어야 한다.

현재 `LivingWorldScene.tsx`는 국가 모식도에서 공장 전환과 기존 화면 이동을 제공한다. `livingWorld.ts`는 실제 생산 배정을 변경하고 국가 범위의 최근 명령/결산을 선택한다. 개선 보고 시점에는 국정 군수 납품이 미구현이라고 명시되어 있다. **아래 설계의 시작 조건은 현재 진행 중인 납품 구현이 실제 주간 결산과 저장까지 검증되는 것**이다. 문서 작성 자체로 해당 조건을 통과했다고 간주하지 않는다.

### 0.1 진행 중 선행 API에 접속하는 경계

주 담당자가 공유한 계약과 작성 중 새로 생성된 `postwarIndustry.ts`, `postwarIndustrySettlement.ts`를 대조했다. 아래 핵심 export와 타입은 로컬 파일에서 확인했지만, App 연결·전체 검증 완료 여부는 선행 구현 보고에서 별도로 확인한다.

| 항목 | 공유된 선행 계약 | 후속 슬라이스의 사용 규칙 |
| --- | --- | --- |
| 미리 보기 | `postwarIndustry.ts`의 `forecastPostwarIndustry(input)` | 결재 전 계획/가능 납품/병목만 표시. 결과를 재고에 적용하지 않음 |
| 주간 실행 | `advancePostwarIndustryWeek(state, input)` | 단일 주간 처리 경로에서만 호출. 화면 열기·회의·수송이 다시 호출하지 않음 |
| 입력 | `nationId`, 도착/결산 주 `week`, `production`, 공장·연료·철강·국고, `stockpile`, 지출 수준, 안보 예산 비율, 정책, `extraTreasuryAllowance` | 같은 주의 확정 입력 묶음을 사용. 예측 시점과 결산 시점이 다르면 차이 이유 표시 |
| 상태 | `version`, `nationId`, `lastSettledWeek`, `lastReport` | 국가 이동과 재실행 방어의 원본. 과거 주차의 누락 납품을 소급 생성하지 않음 |
| 반환 | 상태/보고서/`applied`/`gameDelta`(연료·철강·국고)/`stockpileDelta` | `applied`가 참인 최초 실행만 적용. 제안 영수증은 반환된 실제 적용분에서 생성 |
| 보고서 | 기본 국방 예산 안의 추정 군수 몫, 추가 국고 집행, 필요/실제 재료, 라인별 계획/납품, 병목, 결산 주 | **기본 예산 몫은 설명용이며 재차 국고 차감하지 않음.** 추가 집행과 재료 소모만 실제 장부 규칙대로 표시 |

확인한 구체 타입은 `PostwarIndustryInput`, `PostwarIndustryReport`, `PostwarIndustryLineReport`, `PostwarIndustryState`, `PostwarIndustryAdvanceResult`다. 보고서의 `perLine`에는 `lineId`, `stockpileKey`, `planned`, `delivered`, `fuelUsed`, `steelUsed`, `manufacturingCost`, `operatingCost`가 있다. 라인별 납품/비용 근거는 이 숫자를 사용한다. 정책의 `maintenance`는 **설비 보존 운용**이며 무기 정비·준비도를 올리는 기능이 아니다.

`postwarIndustrySettlement.ts`의 `reservePostwarIndustryResources`는 기존 재정/보건과 네 번째 인수 `pendingDelta`에 전달한 선행 국가 프로그램 약정 후 가용 재료·추가 현금 한도를 준비하고, `mergePostwarIndustrySettlement`는 기본 국정 결산에 군수의 추가 국고/재료 변화와 설명을 합친다. 후속 코드는 **병합된 gameDelta와 원 군수 gameDelta를 동시에 적용하면 안 된다.** `stockpileDelta`의 최초 적용도 별도로 한 번만 한다. 명시적 원료 구매는 `purchasePostwarMaterial`의 기존 검증/가격을 재사용하되, 현재 즉시 구매와 미래 지역 배송 주문을 같은 거래처럼 표시하지 않는다.

후속 기능이 요구하는 공통 연결은 `commandId → sourceReceiptId → actualDelta`다. 라인 ID는 이미 제공되며, 개별 명령/결산 ID는 adapter를 추가할 때 보강해야 한다. 최근 승인 이후 결산이 있다는 사실만으로 “그 승인이 이 산출 전체를 만들었다”고 단정하지 않는다. **시간상 후속**, **해당 라인 결산**, **명령의 한계 기여분**은 서로 다르다. 한계 기여분은 별도 반사실 계산을 검증하지 않았다면 제공하지 않는다.

### 0.2 공통 최소 계약: 식별·명령·결산, 세 가지만 공유

아래는 제안이며 범용 동적 효과 스크립트가 아니다. 도메인별 처리기가 실제 상태의 소유권을 유지한다.

```ts
type WorldScope = {
  campaignId: string;
  serviceId: string;       // 같은 국가에 재취임해도 구분되는 근무 구간
  nationId: NationId;
};
type SourceRef = {
  domain: 'land-order' | 'joint-operation' | 'staff-story'
    | 'industry-settlement' | 'production-site' | 'shipment';
  id: string;
};
type FieldReceiptRef = WorldScope & {
  id: string;
  source: SourceRef;
  commandId?: string;
  settledWeek: number;     // 엔진의 0 기반 주차; 표시는 +1 한 곳에서만
  sourceReceiptId: string;
  status: 'applied' | 'rejected' | 'cancelled';
};
```

`FieldReceiptRef`는 원본 결산을 가리키는 참조다. 수량·비용을 또 저장하는 두 번째 장부가 아니다. 회의의 정치력, 생산의 국고, 작전의 연료 등 **서로 다른 단위는 도메인별 숫자 타입/라벨로 유지**한다. `WarEventTrace.effects[].value` 같은 자유문장을 파싱해 계산 근거로 쓰지 않는다.

새 명령은 `{commandId, sourceRef, expectedWeek, expectedRevision, payload}`를 받는 도메인별 함수로 제안한다. `expectedRevision`은 새 단조 증가 도메인 revision이며 저장 포맷 `version`과 다르다. 최신 권한·대상·가용 자원으로 재검증 후 전체 변경을 한 번 확정한다. 같은 `commandId` 재전송은 기존 결과를 돌려주고 재차 지출하지 않는다. 거절도 구체적인 이유를 반환한다. 현장과 기존 목록 UI는 이 함수를 공유해야 한다.

## 1. 슬라이스 A — 작전 현장: 한 목표를 끝까지 따라가기

### 1.1 현재 사용할 수 있는 코드와 메워야 할 틈

| 현재 코드 | 실제 역할 | 후속 계약 |
| --- | --- | --- |
| `types.ts`: `Order`, `BattleReport`, `Division`, `Territory` | 지상 명령/주간 교전/부대/목표 | `Order`에 고유 ID가 없다. `BattleReport`에도 `orderId`가 없다. 안정적 연결 ID부터 추가 |
| `operations.ts`: `createOperationOrder`, `normalizeOperationOrder`, `getOperationProgress`, `advanceOperationWeek` | 작전 유형·다주간 진척·종결 판정 | 기존 기간과 결과 그대로 사용. 장면 자체의 진행 막대/성공 판정을 새로 만들지 않음 |
| `landOperations.ts`: `resolveLandOrdersWeek` | 동일 시작 스냅샷에서 유효 지상 명령을 모두 해결 | 반환 `entries`별 실제 지원과 결과를 receipt adapter에 전달 |
| `jointOperations.ts`: `forecastJointOperation`, `launchJointOperation`, `advanceJointOperationsWeek`, `getCompletedCloseAirSupport` | 합동 임무·전력·결과·당주 성공 CAS | 해·공군 목표 ID와 지상 영토 ID를 구분. 당주 실제 배분된 CAS만 지상 결과에 연결 |
| App의 `confirmOffensivePlan`, `launchCombinedOperation` | 승인 및 비용/배속 적용 | 처리 로직을 도메인 command adapter로 추출하고 현장/기존 화면 모두 호출 |
| App의 `cancelOffensivePlan` | 승인 전 계획 보류 | **진행 중 명령 취소가 아니다.** 아래 `requestLandOperationStop`은 신규 구현 필요 |

`BattleReport.phases`는 이미 결산된 교전의 계산 단계다. 이를 현재 부대가 실제로 “교두보 확대 단계에 있다”는 실시간 위치 증거로 해석하지 않는다. 최초 현장에는 승인/진행/중단/종결 상태, 경과 주, 실제 누적 진척과 마지막 교전 단계만 표시한다.

### 1.2 필요한 타입과 소유권

제안 추가: `Order.id`, `Order.commandId`, `Order.stopRequestedWeek?`, `BattleReport.orderId?`. 합동 `JointOperationRecord`에는 명시적 `operationId?`를 추가해 문자열 `record-...` 규칙에 대한 외부 의존을 줄인다. `BattleReport`의 기존 `commanderId?`를 신규 결산에서 채워 이름 재매칭을 피한다.

```ts
type OperationFocus =
  | { kind: 'land'; orderId: string; targetTerritoryId: string }
  | { kind: 'joint'; operationId: string; objectiveId: string };

type AppliedSupport = {
  supportingOperationId: string;
  targetOrderId: string;
  settledWeek: number;
  allocatedPoints: number;
  appliedPoints: number;
  finalForceStrength: number;
};
```

`OperationFocus`는 선택 상태이고 저장할 게임 진척이 아니다. 진척은 기존 명령에만 있다. 새 `AppliedSupport`는 결산 시 생성되는 설명 기록이며, 이를 다시 전투에 적용하지 않는다. 현재 `LandOrderResolution.airSupport`는 합계만 제공하므로 **지원 작전별 연결선은 배분기의 원본별 결과 export가 추가된 후에만** 제공한다. 합계만 아는 동안은 “당주 지원 +N”까지만 표시한다.

추가 제안 API:

- `deriveOperationFieldView(focus, snapshot, receipts)`: 순수 조회. 목표/배속/잔여 전력/보급/진척/가용 명령/마지막 확정 결산을 반환.
- `confirmLandOperation(command, context)`: 기존 승인 조건·비용을 재사용. 부대당 활성 명령 하나, 목표와 출발지 존재, 전시/권한/준비 상태 재검증.
- `requestLandOperationStop(command, context)`: 활성 지상 명령의 다음 교전 중단 요청. UI의 `setOrders(filter...)` 직접 삭제로 구현하지 않음.
- `deriveOperationSettlementReceipt(entry, actuallyAppliedDelta)`: App에서 실제 반영한 손실/통제/보급 변화까지 받은 뒤 원본 결산과 연결. 보고서상의 요구 손실과 0 경계 적용 후 실제 손실을 구분.

### 1.3 상태 머신과 중단의 정확한 의미

```text
초안(로컬 UI) ─승인/재검증→ 승인됨 ─첫 주 결산→ 진행 중
      └취소→ 종료(지출 없음)                  ├다음 결산→ 진행 중
                                            ├판정→ 승리/패배
                                            └중단 요청→ 중단 대기
중단 대기 ─다음 주 교전 전에 처리→ 중단 완료
어느 활성 상태든 대상/부대 소실 ─검증→ 집행 불가 종료
```

첫 중단 구현은 **다음 교전 전에 공세를 멈추는 지상 명령**으로 제한한다. 이미 결산된 피해·연료·승인 비용은 환급하지 않고 점령하지 않은 목표도 얻지 않는다. 현재 지상 위치 모델에 맞춰 이미 저장된 위치를 유지하며 가짜 철수 경로/도착 시간을 만들지 않는다. 부대 상태 해제 후에도 실제 전력·조직·보급이 다음 출격 가능성을 결정한다. 주간 결산이 시작됐으면 그 주 결과를 먼저 확정하고 다음 처리 경계로 중단을 예약한다.

합동 임무는 현재 취소 API가 없으므로 첫 슬라이스에서 중단 버튼을 제공하지 않는다. 다음 단계에 별도 abort 결과·배속 해제·소모품 처리 규칙을 구현한 뒤 노출한다. 지상 공세를 멈추었다고 이미 승인된 CAS를 자동 취소/환불하지 않는다. 지원 대상이 사라지면 이번 지상 적용량은 0일 수 있다.

### 1.4 첫 수직 슬라이스와 실패 조건

**한 개 유효 공세:** 지도에서 내 지휘 범위의 준비 부대와 인접 적 목표 선택 → 기존 예측 → 승인 → 같은 목표 현장에 배속/보급/경과 주 표시 → 다음 주 실제 지원/손실 receipt 확인 → 공세 중단 요청 → 다음 주 중단 완료 확인. 기존 군사 패널과 지도에서 같은 `orderId`가 열린다. 시작부터 끝까지 새로운 지역 물류 모델은 요구하지 않는다.

출시 차단 조건: 같은 부대 중복 집행, 재공세가 과거 receipt를 참조, 다른 전구 CAS 적용, 목표별 지원 중복, 0대 편대 표시상 출격, 중단 후 추가 지상 교전, 이름이 같은 타 인물에게 책임 연결, 예측/진행 중 교전을 최종 승리로 표시, 사용자에게 보이지 않는 적 상세 전력 노출.

### 1.5 저장 migration과 테스트

- 기존 활성 `Order`에는 불변 필드와 원래 배열 위치를 이용해 결정적 legacy ID를 한 번 부여하고 저장한다. 동일 부대 중복 명령은 기존 scheduler 검증과 일치하게 별도 정리 기록을 남긴다. 정리 과정에서 부대/자원을 새로 만들지 않는다.
- 구 `BattleReport`는 부대/목표/주차가 유일하게 대응할 때만 연결하고, 애매하면 `orderId` 없이 “구기록·작전 연결 미확인”으로 둔다. 과거 기록에서 시작 주를 추측해 신규 승리를 만들지 않는다.
- 구 활성 명령은 기존 진척을 보존한다. normalize 과정에서 일부 필드가 없다는 이유로 진행도를 0으로 덮어쓰지 않는 회귀 테스트가 필요하다. 없는 단계 수치는 근거 있는 기존 기본값만 보충한다.
- 필수 테스트: 정상/반토막/0 전력 CAS, 같은 목표 다부대, 서로 다른 전구, 무효/미래/아군 목표가 지원을 가져가지 않음, 동일 `commandId` 재전송, 승인 뒤 권한 변경, 진행 중 저장/불러오기, 완료 직전 중단, 주간 결산 중 중단 경합, 음수 손실 방지, 렌더/재생 100회 후 상태 불변.

**제외:** 직접 조종 3D 전술, 실제 부대 행군 경로, 새 전장 타일, 공중전 미니게임, CAS 성공을 새로 재추첨하는 UI, 게임 전체 군령권 재설계.

## 2. 슬라이스 B — 인물 회의장: 결정과 나중의 책임을 연결

### 2.1 기존 호출을 유지한 회의 구조

원본은 `staffNarrative.ts`의 `StaffStoryline`, `StaffNarrativeHistory`, `bonds`, `consumedEvidenceIds`다. `getStaffNarrativeOptions`로 선택지를 읽고, App의 기존 `resolveStaffStoryline`과 같은 권한/정치력 검증을 거쳐 `resolveStaffNarrativeDecision`을 호출한다. 후속 검증은 `advanceStaffNarrativeWeek`가 담당한다. `deriveStaffPlayEvidence`는 현재 완료 전투의 유일한 지휘관 이름 매칭과 실제 합류 기록만 연결하므로, 회의장이 “모든 임무의 담당자 기억이 구현됐다”고 확대 표현해서는 안 된다.

권한은 `getRoleTabMandates` + `applyRoleDelegations`와 실제 인사 관리 범위를 함께 검사한다. 현안 관련 인물 중 실제 관리 범위인 사람이 있는지 확인하는 기존 조건을 보존한다. 탭 접근 권한만 있다고 모든 참모를 해임/통제할 수 있는 것으로 간주하지 않는다.

현재 `RoleAuthorityRequest`는 **탭 단위 권한 요청**이다. 의제의 금액·특정 인물·개별 명령을 승인한 기록이 아니다. “조직 탭 위임 승인”을 “이 정책 승인”으로 재해석하지 않는다. 첫 슬라이스의 권한 밖 의제는 기존 상신 경로로 이동한 뒤, 위임 획득 후 원 의제를 최신 상태로 다시 검토한다.

### 2.2 타입 계약: 회의 상태는 의제 참조와 발언 근거만

```ts
type MeetingCase = WorldScope & {
  id: string;
  source: { kind: 'staff-story'; storylineId: string };
  participantIds: string[];
  visibleEvidenceIds: string[];
  decisionCommandId?: string;
  verificationReceiptId?: string;
};
type Commitment = WorldScope & {
  id: string;
  sourceDecisionId: string;
  ownerStaffId: string;
  metric: 'delivered-equipment' | 'staff-workload';
  metricScopeId: string;
  baselineWeek: number;
  baselineValue: number;
  targetValue: number;
  dueWeek: number;
  evidenceIds: string[];
  status: 'open' | 'fulfilled' | 'missed' | 'void';
};
```

`MeetingCase`를 저장하지 않고 원본 현안에서 투영해도 된다. 저장한다면 참석자·권한은 재개 시 다시 검증한다. **정치력·신뢰·불만·현안 진행을 회의 케이스에 복제하지 않는다.**

`Commitment`는 기존 후속 검증만으로 표현할 수 없는 구체적 성과 약속을 추가할 때 필요한 제안이다. 첫 회의는 기존 `verificationWeek`/`verifiedWeek`를 사용한다. 군수 납품 약속은 선행 `postwarIndustry`의 라인별 확정 납품을 합산할 수 있을 때에만 다음 소슬라이스로 넣는다. 담당 참모와 라인의 공식 책임 배정도 필요하다. 이름이나 부서가 비슷하다는 이유로 자동 책임자를 만들지 않는다.

발언은 `evidenceId + 현재 상태 + 제한된 의견 템플릿`으로 만든다. 같은 사실에 대한 찬반 해석은 가능하지만 확인되지 않은 유출·배신·부패를 사실로 추가하지 않는다. 비밀 자료의 `knownToIds`/등급 모델이 없다면 정보업무 회의에서는 공개/배포 허용된 요약만 사용한다.

### 2.3 상태 머신과 처음 가능한 선택

```text
현안 발생 → 참석/권한/근거 검증 → 검토 가능
검토 가능 ├권한 밖→ 상신/보고(결정 미집행)
          ├보류→ 기존 현안 유지(시간은 실제 주간만 진행)
          └실제 선택/비용 검증→ 결정 적용 → 검증 대기
검증 대기 ─기존 verificationWeek 도달→ 결과 확인 → 기억/종결
참가자 소실·체제 이동 ─규칙 검증→ 이관 또는 검증 불가 종료
```

처음 구현할 행동은 기존 현안의 선택지 1회 결정과 근거 열람이다. 정책 재협상·정밀 성과 계약은 이후 추가한다. `resolveStaffNarrativeDecision` 반환값의 `gameDelta`에 기존 비용이 포함되는지 확인하고 UI/회의 wrapper가 `option.cost`를 다시 차감하지 않는다. 결과를 `recordSuccessfulRoleAction`에 기록하되 단순 회의 입장·발언 재생은 성공 행동이 아니다.

**첫 수직 슬라이스:** 실제 완료 전투 또는 합류 증거가 연결된 현안 → 현안에 실제 등장한 재직 참모만 착석 → 원본 증거 확인 → 현재 보직에서 허용된 중재 1개 → 즉시 적용 receipt → 기존 검증 주까지 진행 → 실제 사기/수용/관계 확인 → 같은 사람의 현안 이력에서 원 결정으로 돌아가기.

### 2.4 저장 migration·실패·테스트

- `StaffNarrativeState.version: 1` 원본을 유지하는 조회 UI부터 시작한다. 새 회의 세션이 없으면 활성 현안에서 재생성한다. 저장 시 UI 애니메이션 진행률은 불필요하다.
- 구 현안의 `cause.source === 'internal-state'`를 실제 사건으로 승격하지 않는다. 없는 참모를 기본 명단에서 다시 소환하지 않는다. 처리된 `history`와 `consumedEvidenceIds`를 유지해 이벤트/보상을 재생성하지 않는다.
- 새 정량 `Commitment`가 없는 세이브는 빈 배열로 시작한다. 기존 대사 “지원하겠다”에서 금액·납품 수량·기한을 추출하지 않는다. 이미 끝난 약속을 임의로 실패 판정하지 않는다.
- 검증 기간 중 담당자가 떠나면 삭제가 아니라 `void` 또는 명시적 인계 기록을 남긴다. 새 담당자에게 기존 실패 책임을 자동 전가하지 않는다. 같은 나라 재취임/국제 이동은 `serviceId` 경계를 지킨다.
- 필수 테스트: 첫/둘째 참가자 각각 관리 가능, 둘 다 권한 밖, 한 명 현안을 두 명으로 불리지 않음, 동명이인, 미래/오래된 근거, 처리된 의제 재클릭, 검증일 전/당일/이후 재접속, 결정 직전 정치력 감소, 담당자 퇴임, 비공개 자료 비노출, 후속 납품 합산 시 계획량 제외, 동일 납품 receipt 중복 제외.

출시 차단 조건: 회의 화면 열기만으로 비용·신뢰 변화, 기존 중재비 이중 차감, 오래된 국가 안건 재집행, 역사 인물을 근거 없이 참석시킴, 승인 권한과 정책 승인을 혼동, 나중 결산이 없는 상태에서 약속 이행 확정 표시.

**제외:** 모든 나라 공통 의회 의석, 자유문장에서 임의 정책 효과 생성, 연애/가문 시뮬레이션, 카드 설전, 역사적 발언으로 위장한 창작 대사, 별도 회의 전용 호감도.

## 3. 슬라이스 C — 지역 생산·수송: 국가 장부를 보존하면서 위치를 도입

### 3.1 가장 먼저 구분할 세 가지

1. `ProductionLine.assigned`와 `game.factories`는 국가 생산 역량이다. **미배정 국가 역량**은 “지리적 위치 미확인”이고 **민수 여력**은 “군수에 미배치”다. 같은 ‘미배정’ 단어로 합치면 안 된다.
2. `NationalSimulationSnapshot.goods[].availability`는 공급 지표이지 창고의 실물 수량이 아니다. 0~100 공급 지표를 차량 화물이나 장비 개수로 바꾸지 않는다.
3. 현재 `Stockpile`은 장비별 국가 수량이다. 지역 창고와 수송을 추가해도 이미 선행 결산이 더한 납품을 다시 더하지 않는다. 지역 수송 도입 전후에 국가 총보유량과 사용가능량의 의미를 명시적으로 전환해야 한다.

### 3.2 필요한 타입과 단위

```ts
type CapacityAccount = {
  id: string;
  nationId: NationId;
  territoryId: string | null; // null은 위치 미확인, 무료/유휴라는 뜻 아님
  installedCapacity: number;
  condition: number;         // 별도 정상화된 가동 계수
  allocations: Array<{ lineId: string; capacity: number }>;
};
type TransportEdge = {
  id: string;
  fromDepotId: string;
  toDepotId: string;
  mode: 'rail' | 'road' | 'sea';
  capacityCargoUnitsPerWeek: number;
  durationWeeks: number;
  accessRuleId: string;
  condition: number;
  activeFromWeek: number;
};
type Shipment = {
  id: string;
  nationId: NationId;
  commandId: string;
  sourceReceiptId: string;
  equipmentKey: keyof Stockpile;
  quantity: number;
  originDepotId: string;
  destinationDepotId: string;
  routeEdgeIds: string[];
  currentEdgeIndex: number;
  status: 'reserved' | 'in-transit' | 'held' | 'delivered' | 'lost' | 'cancelled';
  reservedWeek: number;
  expectedArrivalWeek: number;
};
```

추가로 `DepotInventory`, 장비별 `cargoUnitsPerItem`, 국가/조약별 `RouteAccess`, 거점 배치의 근거/시나리오 버전이 필요하다. 초기 cargo 단위는 게임 내부 수송 부하 단위라고 표시하고 사료상의 톤으로 부르지 않는다. `Territory.neighbors`는 후보 연결에만 쓰며 철도 존재의 증거가 아니다. `controller: Faction`이 같아도 `ownerId`가 다르면 자동 소유/접근 허가로 취급하지 않는다.

### 3.3 기존 엔진 호출과 처리 순서

지역화 첫 단계에서는 전후 납품 엔진을 교체하지 않는다. 다음 두 모드를 명시적으로 분리한다.

- **귀속 검증 모드:** 국가 역량의 위치 계정만 정리한다. 기존 `forecastPostwarIndustry`/`advancePostwarIndustryWeek`의 산출과 비용은 동일하다. 거점 수송·중단 효과는 아직 제공하지 않으며 “귀속 검증”이라고 표시한다.
- **지역 수송 작동 모드:** 유효한 거점/창고/경로가 있는 제한된 시나리오에서만 활성화한다. 선행 납품 결과를 단일 재고 adapter가 생산 창고에 적립하고 국가 총계는 그 장부에서 산출한다. 기존 국가 `stockpileDelta`를 한 번 더 직접 적용하지 않는다. 국가 생산 엔진이 지역별 재료 제약까지 계산하도록 바꾸는 것은 별도 확장이다.

제안 API는 `normalizeRegionalIndustry`, `deriveCapacityAllocation`, `attributeIndustryReceipt`, `planShipment`, `advanceTransportWeek`, `reconcileNationalStockpile`이다. 기존 `reallocateFactory`의 국가 배치 변경은 지역 모드에서도 한 번만 호출하며, 대응 지역 역량 배정과 **같은 트랜잭션**에서 검증한다.

첫 지역 수송의 주간 순서는 **기존 배송 진행/도착 → 국가 납품 결산 → 신규 납품 창고 귀속 → 다음 배송 예약**으로 고정한다. 이번 주 생산품이 같은 처리 중 즉시 여러 경로를 통과해 전선에 도착하지 않는다. 전투 소비와 당주 도착의 선후 관계는 별도 경제/군사 통합 tick에서 명시하고, 초판은 “도착 다음 주 사용 가능”으로 일관되게 제한하는 안을 권장한다. 이는 신규 게임 규칙 제안이며 현재 엔진 규칙이라는 뜻이 아니다.

### 3.4 보존식과 경로 배분

```text
국가 설치 역량 = 위치 미확인 역량 + Σ 지역 설치 역량
라인 군수 배정 = 위치 미확인 라인 배정 + Σ 지역 라인 배정
민수 여력 = 국가 설치 역량 - Σ 군수 배정

국가 총보유 장비 = Σ 창고 현물 + Σ 수송 중 현물
출발지 예약량 ≤ 출발지 현물; 예약은 총보유량을 늘리지 않음
배송 도착: 수송 중에서 차감한 양 = 목적지 창고에 더한 양
재고 변화 = 신규 확정 납품 + 유효 유입 - 소비 - 확정 손실 - 유효 유출
```

`availableStockpile`은 실제 사용 가능한 창고 물량에서 예약량을 뺀 값으로 따로 정의한다. 수송 중/위치 미확인 재고의 사용 가능 범위는 migration 정책에 따라 명시한다. 기존 국가 지표 `Stockpile`을 갑자기 “전선에 도착한 재고”로 바꾸어 모든 기존 소비 코드가 같은 물건을 다른 뜻으로 읽게 해서는 안 된다.

경로는 유효 접근권과 현 상태를 검사하고, 공유 edge의 주간 사용량 총합이 용량을 넘지 않게 배분한다. 초기 우선순위는 플레이어의 명시적 우선순위와 동일 우선순위 내 안정적 ID 순으로 제안한다. 정확한 물량/정수 나머지 배분을 테스트한다. 순환 경로는 첫 planner에서 거부한다. 중간 edge가 끊기면 `held`로 남기며 목적지로 순간이동하거나 물량을 삭제하지 않는다.

### 3.5 상태 머신과 첫 수직 슬라이스

```text
국가 위치 미확인 계정 ─근거 있는 이전/배정→ 지역 거점
배송 초안 ─재고·접근·경로·용량 검증→ 예약
예약 ─출발 경계→ 운송 중 ─도착 경계→ 납품 완료
운송 중 ─경로 단절→ 보류 ─복구/재계획→ 운송 중
예약 ─취소→ 예약 해제; 운송 중 취소는 귀환 계획(즉시 환급 아님)
확정 손실은 소유 장부에서 한 번 차감; 미확인 실종은 별도 보류
```

**첫 플레이는 작은 fixture:** 지역 귀속 근거가 있는 두 창고와 검증된 연결 하나, 장비 한 종류만 사용한다. 국가 납품 receipt → 생산 창고 적립 → 물량/도착 주/가용 수송량 비교 → 배송 예약 → 다음 주 이동 → 도착 receipt → 국가 총계 보존을 확인한다. 지도 차량은 실제 배송 상태의 요약일 뿐 개별 차량 1대 모델이 아니다. 예술 자산보다 숫자/선택/receipt를 먼저 완성한다.

### 3.6 migration·실패·테스트

- 기존 세이브의 역량 전체를 `territoryId: null` 계정으로 옮기고 기존 라인 배정·효율·재고·국고를 그대로 보존한다. 임의 도시로 균등 분배하지 않는다. 누적 과거 납품을 지역에 소급 생성하지 않는다.
- 기존 재고는 명시적 국가 미위치 창고에 한 번 보존한다. 지역 수송을 켜기 전까지 기존 사용 규칙을 유지한다. 활성화는 물량 이전 계획·변경 후 가용 재고를 미리 보여주는 명시적 전환이며 불러오기만으로 전선을 굶기지 않는다.
- 버전/국가/유효 ID/유한 비음수 값/합계 검증을 하고, 위반 세이브는 조용히 균등 재분배하지 않는다. 기존 모드로 되돌릴 수 있는 migration 전 snapshot과 진단을 보존한다.
- 거점 영토가 없어지면 소유 현물은 보류 계정에 남겨 처리한다. 적 점령이 소유권 이전인지 접근 불가인지는 명시적 규칙으로 결정하고, 같은 faction이라는 이유로 압류를 무시하지 않는다.
- 필수 테스트: 미위치 계정+지역 합계 보존, 라인 배정 동시 변경, 재료/국고 부족으로 납품 감소, 국가 delta와 지역 귀속 이중 적용 방지, 두 배송 공유 edge 용량 초과 방지, 부분 배송 나머지, 같은 receipt 재수입, 예약 후 취소, 운송 중 저장, 노선 단절/복구, 지역 상실, 동맹 영토 접근 거부, 국제 이적, 0/NaN/음수 화물, 구세이브 불러오기 전후 자원 동일.

출시 차단 조건: 공장 위치를 사료 없이 사실처럼 표시, 기본 국방 예산 재차 차감, 지리적 미위치 역량을 민수 여력으로 오산, 국가 납품과 도착을 이중 생산, 수송 중 재고를 두 전선에서 사용, 경로/용량 없는 차량 애니메이션.

**제외:** 지역 인구/임금·원료 채굴 전체, 물품별 실시간 경매 시장, 도시 타일 건축, 항구별 역사 실물 톤수 단정, 전 세계 노선망 일괄 개방, 잠수함 공격/철도 폭격의 신규 상세 전투. 그런 효과는 기존 합동 목표와 실제 edge의 명시적 연결·손실 계약이 생긴 후 별도 검증한다.

## 4. 네 가지 선택 시나리오: 국가·보직별로 다른 행동

아래는 구현용 플레이 시나리오다. 제시된 새 약속/파견/지역 기능은 해당 슬라이스 이후에만 제공하며, 실제 역사 사건이나 현행 기능 완성 주장이 아니다. 시작 시 `NationProfile.status`, 보직/민간 여부, 전시·국정, 지도 보유 범위, 가용 인물과 업무로 노출을 결정한다.

| 맥락 | 현장과 구체적 선택 | 실제 비용/후속 확인 | 보여주지 않을 만능 UI |
| --- | --- | --- | --- |
| **전쟁: 영국 전구 지휘관** | 지휘권 내 공세 한 건의 보급 저하. 계속/지상 공세 중단/해당 구역 지원 검토 중 선택 | 기존 명령 비용과 실제 잔여 전력. 다음 주 같은 order receipt의 진척·지원·손실 확인. 생산 권한이 없으면 군수 확대는 상신 | 부대 지휘권 밖 병력 강제 이동, 0대 편대 출격, 국가 전체 재정 즉시 조절 |
| **정치: 망명정부의 조직 운영** | 실제 `government-in-exile` 상태에서 담당자 교체 또는 기존 업무 중재. 지원 약속 이행 근거를 두고 재직 참모가 이견 제시 | 기존 중재 선택의 정치력/관계 변화와 검증 주. 본국 거점을 소유하지 않으면 그 공장을 임의 증설할 수 없음 | 모든 나라 동일한 민선 의회/의석, 점령지 생산물 자동 징발, 없는 본국 장관 참석 |
| **정보: 비밀·저항 활동 보직** | 실제 가능한 정보 임무 한 건에 근거의 신뢰도 확인 후 진행/보류. 파견 모델 도입 후에는 가용 담당자 배치와 본부 공석 비교 | `strategicContinuity`의 `getAvailableStrategicOperations`/`canLaunchStrategicOperation` 또는 해당 전시 비밀업무 원본 경로를 사용. 결과 ID·공개 가능한 요약만 회의 근거로 전달 | 전구 전체 적 배치 공개, 시대 조건 밖 사이버/우주 임무, 익명 사건에 임의 담당자 지정 |
| **민간: 식민지 상태의 의사·교육자** | 국가 본부가 아닌 지역 활동 작업대에서 기존 민간 행동의 생계/전문성/인맥/감시 위험을 확인하고 활동/보류 선택 | `getCivilianActionAvailability`→`resolveCivilianAction`과 실제 행동 기록. 현장 결과는 그 행동이 원래 바꾸는 범위만 표시 | 국가 공장 전환 결재, 군대 동원, 실제 모델 없는 지역 병원 치료 수치, 국가 공급 개선을 개인의 독점 성과로 표시 |

국가마다 별도 화면을 무조건 만들지는 않는다. **공통 장면 구성 요소 + 역할별 작업대/허용 명령 + 국가 상태별 대상/권한/근거**를 조합한다. `colonized`, `government-in-exile`, `resistance-coalition`, 주권국을 색상과 국기만 다르게 한 동일 만능 콘솔로 처리하지 않는다. 민간 진입은 기존 국가 현장 숨김을 유지하고 민간 실제 행동을 위한 별도 작은 투영기를 사용한다.

## 5. 저장 통합·검증·실행 순서

### 저장 통합

현재 `save.ts`의 `CampaignSavePayload` 검사는 상위 구조 확인 수준이고 실제 복원은 App의 개별 normalize 경로에 있다. 신규 객체를 payload에 붙이는 것만으로 migration이 끝나지 않는다. 생성/저장/불러오기/새 캠페인/국제 이적/전후 전환을 모두 연결한다. 선행 납품 구현으로 상위 저장 버전은 **36**이 되었다. 검증 결과는 [전후 군수 개선 보고서](postwar-industry-remediation-2026-09-08.md)에 기록했으며, 후속 데이터 확장은 이 버전을 기준으로 추가 migration을 설계한다.

도메인별 version과 `lastSettledWeek`/처리 ID를 보존하고, 신규 `campaignId`·`serviceId`가 없는 구세이브는 한 번 만든 값을 다음 저장에 유지한다. 로드시 매번 임의 ID를 바꾸지 않는다. 국가가 바뀌면 이전 사람/재고/안건을 무조건 현재 국가 소유로 재해석하지 않는다. 이전 기록은 과거 경력 열람용으로 남기고 직접 집행은 차단한다.

### 작은 병합 단위

1. **S0 선행 완료 확인:** 전후 군수 필요/실제 재료·납품·추가 국고·기본 예산 설명, 당주 1회, 저장 재개, 현장 영수증. 선행 보고서의 정확한 타입을 본 문서 0.1과 대조한다.
2. **A1 ID/receipt:** 지상 명령 ID와 결산 연결, 기존 UI/현장 같은 선택, 실제 적용 손실/지원. 행동은 기존 승인만 사용.
3. **A2 중단 수직 흐름:** 단일 지상 공세 중단, 경합·재시도·저장 검증. 합동 중단은 별도 후속.
4. **B1 회의 투영:** 기존 현안 한 건, 실제 참가자/근거/권한/기존 선택/후속 검증. 정량 납품 약속은 B2에서 책임 배속과 함께 추가.
5. **C1 귀속 보존:** 미위치 계정과 지역 계정의 합계 검증. 수송 효과 없음.
6. **C2 한 경로 배송:** 한 장비·두 창고·한 연결, 실제 납품 귀속/예약/도착/가용 재고. 이후 노선 수를 늘린다.

각 단위에서 reducer/정규화 단위 시험 → 저장 왕복/중복 명령 통합 시험 → 실제 브라우저 한 흐름 순으로 검증한다. 브라우저에서는 국가·보직별 화면, 390px 폭, 키보드 선택/초점, 접기, 움직임 줄이기, 승인 연타, 다음 주 처리 중 입력, 뒤로 이동 후 receipt 재열람을 확인한다. 상태를 조작한 fixture와 실제 처음부터 진행한 캠페인은 보고서에서 구분한다.

**중단 기준:** 원본 결산·권한·ID가 없는데 장면부터 만들게 되거나, 별도의 신뢰/진척/재고 장부를 UI에 넣어야 성립하면 그 구현은 보류한다. 첫 성공 기준은 “예쁜 패널 세 개”가 아니라 **선택 한 번이 실제 비용과 결과를 남기고 다음 장면의 사람/물량/권한에 같은 기록으로 이어지는 것**이다.

## 6. 참고 설계의 사용 범위

이번 문서는 새로운 비교 게임 수치/역학을 추가 주장하지 않는다. 앞선 조사에서 실제 확인한 원리를 구현 계약으로 변환했다. 공식 자료의 코드·자산·대사·화면을 복사하지 않는다.

- 보급의 위치 제약은 [HOI4 공식 Trains and Supply](https://store.steampowered.com/news/posts/?appids=394360&enddate=1631106048&feed=steam_community_announcements)를 참고하되, 우리 경로/수량/가용성 규칙은 위에서 별도로 제안했다.
- 지도와 교전의 연결은 [Total War: ROME II 공식 Attacking the Enemy](https://r2enc.totalwar.com/en/manual/single-player/0016_enc_page_campaign_play_military_attack/)를 참고한다. 실시간 전술 구현을 약속하는 근거로 쓰지 않는다.
- 과거 경험의 관계 근거는 [CK3 공식 Friends & Foes](https://www.paradoxinteractive.com/games/crusader-kings-iii/add-ons/crusader-kings-iii-friends-and-foes), 조건 있는 목표와 약속은 [FM24 공식 Individual Player Targets](https://www.footballmanager.com/features/individual-player-targets-and-interaction-logic)를 참고한다. 실제 인물에 관한 역사 사실을 생성하는 허가는 아니다.
- 지속 현안은 [Stellaris 공식 Dev Diary #245](https://store.steampowered.com/news/posts/?appids=281990&enddate=1649934144&feed=steam_community_announcements)를 참고한다. 여기의 단계/주차/원본 소유 계약은 IRON DOMINION을 위한 제안이며 해당 게임의 정확한 현행 구현 명세가 아니다.
