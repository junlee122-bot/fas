import { useMemo, useState } from 'react';
import { ArrowRight, Factory, HeartPulse, Landmark, Store, Users, Check, Eye } from 'lucide-react';
import { deriveNationalSimulation } from './nationalSimulation';
import type { NationalSimulationInput, NationalSimulationSnapshot } from './nationalSimulation';
import type { RoleTabMandate } from './roleMandate';
import type { GameTab, Stockpile, WarEvent } from './types';
import { reallocateFactory } from './livingWorld';
import { forecastPostwarIndustry } from './postwarIndustry';
import type { PostwarIndustryInput } from './postwarIndustry';
import './LivingWorldScene.css';

type Site = 'industry' | 'market' | 'health' | 'council';
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
  const [selected, setSelected] = useState<Site>('industry');
  const [collapsed, setCollapsed] = useState(false);
  const [lineId, setLineId] = useState(input.production[0]?.id ?? '');
  const [direction, setDirection] = useState<-1 | 1>(-1);
  const line = input.production.find((item) => item.id === lineId) ?? input.production[0];
  const used = input.production.reduce((sum, item) => sum + item.assigned, 0);
  const civilian = Math.max(0, input.game.factories - used);
  const consumer = snapshot.goods.find((good) => good.id === 'consumer');
  const food = snapshot.goods.find((good) => good.id === 'food');
  const medicine = snapshot.goods.find((good) => good.id === 'medicine');
  const nextProduction = useMemo(() => reallocateFactory(input.production, input.game.factories, line?.id ?? '', direction, industryMandate.mode === 'direct'), [input.production, input.game.factories, line?.id, direction, industryMandate.mode]);
  const preview = useMemo(() => nextProduction ? deriveNationalSimulation({ ...input, production: nextProduction }) : null, [input, nextProduction]);
  const nextConsumer = preview?.goods.find((good) => good.id === 'consumer');
  const nextLine = nextProduction?.find((item) => item.id === line?.id);
  const postwarCurrent = useMemo(() => postwarInput ? forecastPostwarIndustry(postwarInput) : null, [postwarInput]);
  const postwarNext = useMemo(() => postwarInput && nextProduction ? forecastPostwarIndustry({ ...postwarInput, production: nextProduction }) : null, [postwarInput, nextProduction]);
  const routedLine = input.phase === 'nation' && routedEquipmentKey !== undefined && stockpileKeyByLineId[line?.id ?? ''] === routedEquipmentKey;
  const output = (item: typeof line) => item ? Math.round(item.output * item.assigned / 5 * item.efficiency / 100) : 0;
  const supplyLabel = (value: number | undefined) => value === undefined ? '자료 없음' : value < 52 ? '공급 부족' : value < 68 ? '공급 주의' : '공급 원활';
  const sites = [
    { id: 'industry' as const, title: '생산 지구', icon: Factory, value: `군수 ${used} · 민수 여력 ${civilian}`, state: civilian === 0 ? 'watch' : 'stable', detail: '공장 배치' },
    { id: 'market' as const, title: '생활 시장', icon: Store, value: supplyLabel(consumer?.availability), state: consumer?.status ?? 'stable', detail: '가계와 물가' },
    { id: 'health' as const, title: '보건 거점', icon: HeartPulse, value: input.publicHealth.activeOutbreak ? `병상 부담 ${Math.round(input.publicHealth.activeOutbreak.hospitalLoad)}%` : '유행 없음', state: medicine?.status ?? 'stable', detail: '의약품과 병상' },
    { id: 'council' as const, title: '참모 회의실', icon: Landmark, value: staffIssues > 0 ? `대화할 현안 ${staffIssues}건` : '대기 현안 없음', state: staffIssues > 0 ? 'watch' : 'stable', detail: '사람과 책임' },
  ];
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
          <div className="living-world-sites" aria-label="국가 현황의 네 장소">
            {sites.map(({ id, title, icon: Icon, value, state, detail }) => (
              <button key={id} type="button" className={`living-world-site ${state} ${selected === id ? 'selected' : ''}`} aria-pressed={selected === id} aria-controls="living-world-detail" onClick={() => setSelected(id)}>
                <span className={`living-world-building ${id}`} aria-hidden="true"><i /><i /><i /><Icon size={34} strokeWidth={1.4} /></span>
                <span className="living-world-site-copy"><small>{detail}</small><strong>{title}</strong><em>{value}</em></span>
              </button>
            ))}
          </div>
          <div className="living-world-flow" aria-label="공급이 사회에 미치는 경로"><span>공장 배치</span><ArrowRight size={13} /><span>생활재 공급</span><ArrowRight size={13} /><span>물가·신뢰·불안</span></div>
          <p className="living-world-disclaimer">국가 집계 기반 모식도 · 실제 도시 위치나 개별 건물 수를 나타내지 않습니다.</p>
        </div>
        <section className="living-world-detail" id="living-world-detail" aria-label={`${sites.find((site) => site.id === selected)?.title} 상세`}>
          {selected === 'industry' && <>
            <span className="living-world-kicker">이번 주에 바꿀 수 있는 것</span><h3>군수와 민생, 어디에 힘을 줄까?</h3>
            <p>군수 생산에 배치하지 않은 공장 역량은 민수 공급 여력으로 계산합니다. 전환하면 장비 생산 잠재력과 생활재 공급이 함께 바뀝니다.</p>
            {industryMandate.mode === 'direct' ? <>
              <label>조정할 생산 라인<select value={line?.id ?? ''} onChange={(event) => setLineId(event.target.value)}>{input.production.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.assigned}개 배치</option>)}</select></label>
              <div className="living-world-direction" role="group" aria-label="공장 전환 방향">
                <button type="button" aria-pressed={direction === -1} onClick={() => setDirection(-1)}>민수로 1개</button>
                <button type="button" aria-pressed={direction === 1} onClick={() => setDirection(1)}>군수로 1개</button>
              </div>
              <div className="living-world-preview" aria-live="polite">
                {preview && nextLine ? <><strong>결재 전 예상 · 아직 적용 안 됨</strong><span>소비재 공급 {consumer?.availability ?? '—'} → {nextConsumer?.availability ?? '—'} / 100</span>{input.phase === 'war' ? <span>{line?.name} 기본 생산력 {output(line)} → {output(nextLine)} / 주</span> : <span>{postwarNext && postwarCurrent ? `${line?.name} ${routedLine ? '다음 주 집하창고 생산 완료' : '다음 주 입고'} ${postwarCurrent.perLine.find((item) => item.lineId === line?.id)?.delivered ?? 0} → ${postwarNext.perLine.find((item) => item.lineId === line?.id)?.delivered ?? 0}` : `군수 배치 ${line?.assigned} → ${nextLine.assigned} · 납품 전망 확인 필요`}</span>}{input.phase === 'nation' ? <span>{routedLine ? '집하창고 생산 완료 → 수송 후 가용' : '새 납품은 국가 직접 입고'}</span> : null}<small>{input.phase === 'war' ? '생산력은 배치·효율 기준이며 국가 정책·조달 보정 전 값입니다.' : `국정 납품은 승인된 방침·예산·연료·강철을 반영합니다. ${routedLine ? '표시 수치는 생산 완료 전망입니다. 창고·수송 중 물량은 국가 가용 비축이 아니며 실제 도착 후 편입합니다.' : '산업 전환에서 부족 원인과 원료 조달을 확인하세요.'}`}{direction === -1 ? ' 회수 시 해당 라인 효율 4 감소(최저 15).' : ''}</small></> : <span>{direction === -1 ? '선택한 라인에서 회수할 공장이 없습니다.' : '군수에 추가 배치할 민수 여력이 없습니다.'}</span>}
              </div>
              <button type="button" className="living-world-primary" disabled={!nextProduction} onClick={() => {
                if (!line || !nextProduction) return;
                onReallocate(line.id, direction);
              }}><Check size={16} /> 공장 전환 결재</button>
            </> : <div className="living-world-authority"><strong>{industryMandate.label} · 직접 결재 불가</strong><p>{industryMandate.reason}</p><button type="button" onClick={() => onNavigate('industry')}>{industryMandate.mode === 'request' ? '생산 조정 상신하기' : '권한과 보고 확인'} <ArrowRight size={14} /></button></div>}
            {lastOrder && <p className="living-world-receipt" role="status">최근 승인 기록: {lastOrder.title}. {lastSettlement && lastSettlement.week > lastOrder.week ? '이후 주간 결산이 있습니다. 브리핑에서 공급 경로 기여분과 전체 변화를 확인하세요.' : `배치는 적용됐고, 제${lastOrder.week + 2}주 결산에서 사회 반응을 검증합니다.`}</p>}
            {input.phase === 'nation' && <button type="button" onClick={() => onNavigate('industry')}>국정 군수 납품 지휘실 <ArrowRight size={14} /></button>}
          </>}
          {selected === 'market' && <><span className="living-world-kicker">배치의 결과가 생활로</span><h3>{supplyLabel(consumer?.availability)} · 가계의 체감</h3><dl><div><dt>소비재 공급</dt><dd>{consumer?.availability ?? '—'} / 100</dd></div><div><dt>식량 공급</dt><dd>{food?.availability ?? '—'} / 100</dd></div><div><dt>현재 물가 상승률</dt><dd>{input.economy.inflation.toFixed(2)}%</dd></div><div><dt>경제 신뢰</dt><dd>{input.economy.publicConfidence.toFixed(1)} / 100</dd></div></dl><p>{consumer?.driver} 공급 부족은 다음 주 물가·신뢰·안정·고용에 제한된 추가 압력으로 반영됩니다. 공급을 회복해도 즉시 모든 불만이 사라지지는 않습니다.</p><button type="button" onClick={() => onNavigate('economy')}>재정·생활 정책 확인 <ArrowRight size={14} /></button></>}
          {selected === 'health' && <><span className="living-world-kicker">치료와 생활의 접점</span><h3>보건 거점의 현재 부담</h3><dl><div><dt>의약품 공급</dt><dd>{medicine?.availability ?? '—'} / 100</dd></div><div><dt>방역 준비도</dt><dd>{Math.round(input.publicHealth.preparedness)} / 100</dd></div></dl><p>{input.publicHealth.activeOutbreak ? `${input.publicHealth.activeOutbreak.codeName}: 현재 병상 부담 ${Math.round(input.publicHealth.activeOutbreak.hospitalLoad)}%. 실제 보건 엔진의 기록입니다.` : '현재 진행 중인 유행은 없습니다. 준비도와 의료 비축을 점검할 수 있습니다.'}</p><button type="button" onClick={() => onNavigate('health')}>보건 담당 보고·정책 열기 <ArrowRight size={14} /></button></>}
          {selected === 'council' && <><span className="living-world-kicker">사건을 겪은 사람들</span><h3>참모에게 후속 판단을 묻다</h3><div className="living-world-council"><Users size={32} /><strong>{staffIssues}건</strong><span>현재 참모 서사 현안</span></div><p>조직 운영에서 발생 근거를 확인하고 대화·중재를 선택합니다. 실제 전투·임명 기록으로 생긴 현안과 조직 내부 점검은 구분됩니다.</p><button type="button" onClick={() => onNavigate('organization')}>참모 회의실로 이동 <ArrowRight size={14} /></button></>}
        </section>
      </div>
      <footer className="living-world-settlement"><div><small>{lastSettlement ? `제${lastSettlement.week + 1}주 확정 기록` : '첫 검증은 다음 주'}</small><p>{lastSettlement?.detail ?? '장소의 수치는 현재 상태입니다. 명령의 사회적 효과는 주간 진행 뒤 결산에 기록됩니다.'}</p></div><button type="button" onClick={onOpenBriefing}>주간 브리핑 <ArrowRight size={14} /></button></footer>
      </div>
    </section>
  );
}
