import { useMemo, useState } from 'react';
import { ArrowRight, Users, Check, Eye } from 'lucide-react';
import { deriveNationalSimulation } from './nationalSimulation';
import type { NationalSimulationInput, NationalSimulationSnapshot } from './nationalSimulation';
import type { RoleTabMandate } from './roleMandate';
import type { GameTab, Stockpile, WarEvent } from './types';
import { reallocateFactory } from './livingWorld';
import { forecastPostwarIndustry } from './postwarIndustry';
import type { PostwarIndustryInput } from './postwarIndustry';
import { WorldSiteArt } from './WorldSiteArt';
import { LivingWorldDiorama } from './LivingWorldDiorama';
import { deriveLivingWorldPresentation, type LivingWorldSite } from './livingWorldPresentation';
import livingTerrainArt from './assets/world-scenes/living-district-terrain.png';
import './LivingWorldScene.css';

const siteTitles = { industry: '생산 지구', market: '생활 시장', health: '보건 거점', council: '참모 회의실' };
const stockpileKeyByLineId: Record<string, keyof Stockpile> = { rifle: 'infantryEquipment', sherman: 'tanks', spitfire: 'aircraft', convoy: 'convoys', artillery: 'artillery', truck: 'trucks' };
export interface LivingWorldSceneProps {
  nationName: string;
  input: NationalSimulationInput;
  snapshot: NationalSimulationSnapshot;
  industryMandate: RoleTabMandate;
  postwarInput?: PostwarIndustryInput;
  routedEquipmentKey?: keyof Stockpile;
  staffIssues: number;
  lastSettlement?: WarEvent;
  lastOrder?: WarEvent;
  onNavigate: (tab: GameTab) => void;
  onReallocate: (lineId: string, amount: number) => void;
  onOpenBriefing: () => void;
}

export function LivingWorldScene({ nationName, input, snapshot, industryMandate, postwarInput, routedEquipmentKey, staffIssues, lastSettlement, lastOrder, onNavigate, onReallocate, onOpenBriefing }: LivingWorldSceneProps) {
  const [selected, setSelected] = useState<LivingWorldSite>('industry');
  const [showProjection, setShowProjection] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [lineId, setLineId] = useState(input.production[0]?.id ?? '');
  const [direction, setDirection] = useState<-1 | 1>(-1);
  const line = input.production.find((item) => item.id === lineId) ?? input.production[0];
  const consumer = snapshot.goods.find((good) => good.id === 'consumer');
  const nextProduction = useMemo(() => reallocateFactory(input.production, input.game.factories, line?.id ?? '', direction, industryMandate.mode === 'direct'), [input.production, input.game.factories, line?.id, direction, industryMandate.mode]);
  const preview = useMemo(() => nextProduction ? deriveNationalSimulation({ ...input, production: nextProduction }) : null, [input, nextProduction]);
  const nextConsumer = preview?.goods.find((good) => good.id === 'consumer');
  const nextLine = nextProduction?.find((item) => item.id === line?.id);
  const postwarCurrent = useMemo(() => postwarInput ? forecastPostwarIndustry(postwarInput) : null, [postwarInput]);
  const postwarNext = useMemo(() => postwarInput && nextProduction ? forecastPostwarIndustry({ ...postwarInput, production: nextProduction }) : null, [postwarInput, nextProduction]);
  const routedLine = input.phase === 'nation' && routedEquipmentKey !== undefined && stockpileKeyByLineId[line?.id ?? ''] === routedEquipmentKey;
  const output = (item: typeof line) => item ? Math.round(item.output * item.assigned / 5 * item.efficiency / 100) : 0;
  const supplyLabel = (value: number | undefined | null) => typeof value !== 'number' || !Number.isFinite(value) ? '자료 없음' : value < 52 ? '공급 부족' : value < 68 ? '공급 주의' : '공급 원활';
  const metric = (value: number | undefined | null, digits = 1) => typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(digits)).toString() : '자료 없음';
  const currentPresentation = useMemo(() => deriveLivingWorldPresentation(input, snapshot, staffIssues), [input, snapshot, staffIssues]);
  const projectedPresentation = useMemo(() => preview && nextProduction ? deriveLivingWorldPresentation({ ...input, production: nextProduction }, preview, staffIssues) : null, [input, preview, nextProduction, staffIssues]);
  const projectionVisible = showProjection && industryMandate.mode === 'direct' && projectedPresentation !== null;
  return (
    <section className="living-world" aria-labelledby="living-world-title">
      <header className="living-world-header">
        <div><span>WORLD IN MOTION · 제{input.game.week + 1}주</span><h2 id="living-world-title">{nationName}, 지금 현장에서는</h2></div>
        <p><Eye size={14} aria-hidden="true" /> 장소를 눌러 살피고, 권한 안에서 지시하세요.</p>
        <button type="button" aria-expanded={!collapsed} aria-controls="living-world-body" onClick={() => setCollapsed((current) => !current)}>{collapsed ? '현장 펼치기' : '현장 접기'}</button>
      </header>
      <div id="living-world-body" hidden={collapsed}>
      <div className="living-world-layout">
        <div className="living-world-stage">
          <div className="living-world-view-mode" role="group" aria-label="현장 상태 비교">
            <button type="button" aria-pressed={!projectionVisible} onClick={() => setShowProjection(false)}>현재 상태</button>
            {industryMandate.mode === 'direct' && <button type="button" aria-pressed={projectionVisible} disabled={!projectedPresentation} onClick={() => setShowProjection(true)}>전환안 미리보기</button>}
          </div>
          <p className={`living-world-view-notice ${projectionVisible ? 'projected' : ''}`} role="status">{projectionVisible ? '예상 장면 · 아직 결재하지 않았습니다. 공장 배치와 공급 전망만 바뀌며, 물가·신뢰·병상은 실제 현재 상태입니다.' : `현재 확정 상태 · 제${input.game.week + 1}주. 장소를 누르면 설명과 가능한 행동이 열립니다.`}</p>
          <LivingWorldDiorama presentation={projectionVisible ? projectedPresentation : currentPresentation} selected={selected} onSelect={setSelected} artSrc={livingTerrainArt} />
          <div className="living-world-flow" aria-label="공급이 사회에 미치는 경로"><span>공장 배치</span><ArrowRight size={13} /><span>생활재 공급</span><ArrowRight size={13} /><span>물가·신뢰·불안</span></div>
          <p className="living-world-disclaimer">국가 집계 기반 모식도 · 실제 도시 위치나 개별 건물 수를 나타내지 않습니다.</p>
        </div>
        <section className="living-world-detail" id="living-world-detail" aria-label={`${siteTitles[selected]} 상세`}>
          {projectionVisible && selected !== 'industry' && <p className="living-world-current-detail">현재 확정 지표 · 왼쪽 전환안의 예상 공급과 구분해 보세요. 아직 정책 효과가 적용된 것은 아닙니다.</p>}
          {selected === 'industry' && <>
            <span className="living-world-kicker">이번 주에 바꿀 수 있는 것</span><h3>군수와 민생, 어디에 힘을 줄까?</h3>
            <p>군수 생산에 배치하지 않은 공장 역량은 민수 공급 여력으로 계산합니다. 전환하면 장비 생산 잠재력과 생활재 공급이 함께 바뀝니다.</p>
            {industryMandate.mode === 'direct' ? <>
              <label>조정할 생산 라인<select value={line?.id ?? ''} onChange={(event) => { setLineId(event.target.value); setShowProjection(false); }}>{input.production.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.assigned}개 배치</option>)}</select></label>
              <div className="living-world-direction" role="group" aria-label="공장 전환 방향">
                <button type="button" aria-pressed={direction === -1} onClick={() => setDirection(-1)}>민수로 1개</button>
                <button type="button" aria-pressed={direction === 1} onClick={() => setDirection(1)}>군수로 1개</button>
              </div>
              <div className="living-world-preview" aria-live="polite">
                {preview && nextLine ? <><strong>결재 전 예상 · 아직 적용 안 됨</strong><span>소비재 공급 {consumer?.availability ?? '—'} → {nextConsumer?.availability ?? '—'} / 100</span>{input.phase === 'war' ? <span>{line?.name} 기본 생산력 {output(line)} → {output(nextLine)} / 주</span> : <span>{postwarNext && postwarCurrent ? `${line?.name} ${routedLine ? '다음 주 집하창고 생산 완료' : '다음 주 입고'} ${postwarCurrent.perLine.find((item) => item.lineId === line?.id)?.delivered ?? 0} → ${postwarNext.perLine.find((item) => item.lineId === line?.id)?.delivered ?? 0}` : `군수 배치 ${line?.assigned} → ${nextLine.assigned} · 납품 전망 확인 필요`}</span>}{input.phase === 'nation' ? <span>{routedLine ? '집하창고 생산 완료 → 수송 후 가용' : '새 납품은 국가 직접 입고'}</span> : null}<small>{input.phase === 'war' ? '생산력은 배치·효율 기준이며 국가 정책·조달 보정 전 값입니다.' : `국정 납품은 승인된 방침·예산·연료·강철을 반영합니다. ${routedLine ? '표시 수치는 생산 완료 전망입니다. 창고·수송 중 물량은 국가 가용 비축이 아니며 실제 도착 후 편입합니다.' : '산업 전환에서 부족 원인과 원료 조달을 확인하세요.'}`}{direction === -1 ? ' 회수 시 해당 라인 효율 4 감소(최저 15).' : ''}</small></> : <span>{direction === -1 ? '선택한 라인에서 회수할 공장이 없습니다.' : '군수에 추가 배치할 민수 여력이 없습니다.'}</span>}
              </div>
              <button type="button" className="living-world-primary" disabled={!nextProduction} onClick={() => {
                if (!line || !nextProduction) return;
                setShowProjection(false);
                onReallocate(line.id, direction);
              }}><Check size={16} /> 공장 전환 결재</button>
            </> : <div className="living-world-authority"><strong>{industryMandate.label} · 직접 결재 불가</strong><p>{industryMandate.reason}</p><button type="button" onClick={() => onNavigate('industry')}>{industryMandate.mode === 'request' ? '생산 조정 상신하기' : '권한과 보고 확인'} <ArrowRight size={14} /></button></div>}
            {lastOrder && <p className="living-world-receipt" role="status">최근 승인 기록: {lastOrder.title}. {lastSettlement && lastSettlement.week > lastOrder.week ? '이후 주간 결산이 있습니다. 브리핑에서 공급 경로 기여분과 전체 변화를 확인하세요.' : `배치는 적용됐고, 제${lastOrder.week + 2}주 결산에서 사회 반응을 검증합니다.`}</p>}
            {input.phase === 'nation' && <button type="button" onClick={() => onNavigate('industry')}>국정 군수 납품 지휘실 <ArrowRight size={14} /></button>}
          </>}
          {selected === 'market' && <><span className="living-world-kicker">배치의 결과가 생활로 · 현재 지표</span><h3>{supplyLabel(currentPresentation.goods.consumer)} · 가계의 체감</h3><dl><div><dt>현재 소비재 공급</dt><dd>{metric(currentPresentation.goods.consumer)} / 100</dd></div><div><dt>현재 식량 공급</dt><dd>{metric(currentPresentation.goods.food)} / 100</dd></div><div><dt>현재 물가 상승률</dt><dd>{metric(input.economy.inflation, 2)}%</dd></div><div><dt>경제 신뢰</dt><dd>{metric(input.economy.publicConfidence)} / 100</dd></div></dl><p>{consumer?.driver} 공급 부족은 다음 주 물가·신뢰·안정·고용에 제한된 추가 압력으로 반영됩니다. 공급을 회복해도 즉시 모든 불만이 사라지지는 않습니다.</p><button type="button" onClick={() => onNavigate('economy')}>재정·생활 정책 확인 <ArrowRight size={14} /></button></>}
          {selected === 'health' && <><span className="living-world-kicker">치료와 생활의 접점 · 현재 지표</span><h3>보건 거점의 현재 부담</h3><dl><div><dt>의약품 공급</dt><dd>{metric(currentPresentation.goods.medicine)} / 100</dd></div><div><dt>방역 준비도</dt><dd>{metric(input.publicHealth.preparedness, 0)} / 100</dd></div></dl><p>{input.publicHealth.activeOutbreak ? `${input.publicHealth.activeOutbreak.codeName}: 현재 병상 부담 ${metric(currentPresentation.hospital.load)}%. 실제 보건 엔진의 기록입니다.` : '현재 진행 중인 유행은 없습니다. 준비도와 의료 비축을 점검할 수 있습니다.'}</p><button type="button" onClick={() => onNavigate('health')}>보건 담당 보고·정책 열기 <ArrowRight size={14} /></button></>}
          {selected === 'council' && <><span className="living-world-kicker">사건을 겪은 사람들</span><h3>참모에게 후속 판단을 묻다</h3><div className="living-world-council"><Users size={32} /><strong>{staffIssues}건</strong><span>현재 참모 서사 현안</span></div><p>조직 운영에서 발생 근거를 확인하고 대화·중재를 선택합니다. 실제 전투·임명 기록으로 생긴 현안과 조직 내부 점검은 구분됩니다.</p><button type="button" onClick={() => onNavigate('organization')}>참모 회의실로 이동 <ArrowRight size={14} /></button></>}
          {(selected === 'industry' || selected === 'health') && <details className="living-world-art-reference"><summary>현장 미술 참고</summary><WorldSiteArt site={selected} /></details>}
        </section>
      </div>
      <footer className="living-world-settlement"><div><small>{lastSettlement ? `제${lastSettlement.week + 1}주 확정 기록` : '첫 검증은 다음 주'}</small><p>{lastSettlement?.detail ?? '장소의 수치는 현재 상태입니다. 명령의 사회적 효과는 주간 진행 뒤 결산에 기록됩니다.'}</p></div><button type="button" onClick={onOpenBriefing}>주간 브리핑 <ArrowRight size={14} /></button></footer>
      </div>
    </section>
  );
}
