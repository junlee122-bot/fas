import { memo, useMemo } from 'react';
import { Anchor, ArrowRight, Crosshair, Eye, Radio, Shield, Waves } from 'lucide-react';
import { enemyMaritimeKindLabels, enemyMaritimeStageLabels, getEnemyMaritimeCounterPressure, type EnemyMaritimeContext, type EnemyMaritimeOperation, type EnemyMaritimeState } from './enemyMaritime';
import './EnemyMaritimeBoard.css';

export interface EnemyMaritimeBoardProps {
  state: EnemyMaritimeState;
  context: EnemyMaritimeContext;
  onOpenLocation?: (territoryId: string) => void;
  onOpenJointOperations?: () => void;
}

export function getEnemyMaritimeIntel(state: EnemyMaritimeState, context: EnemyMaritimeContext) {
  const sites = new Map(context.territories.map((site) => [site.id, site]));
  return state.operations.filter((op) => op.detected).map((op) => {
    const age = Math.max(0, context.week - (op.lastObservedWeek ?? op.detectedWeek ?? context.week));
    const point = op.lastKnownNodeId ? sites.get(op.lastKnownNodeId) : undefined;
    const recent = age <= 1;
    return { id: op.id, kind: op.kind, theater: op.theater, confidence: Math.round(op.confidence), age,
      stage: op.lastKnownStage ? enemyMaritimeStageLabels[op.lastKnownStage] : '행동 분석 중',
      locationId: point?.id, locationName: point?.name ?? '위치 식별 중',
      targetName: recent && op.confidence >= 75 ? sites.get(op.targetId)?.name : undefined,
      warning: !recent ? '마지막 관측 이후 이동했을 수 있습니다. 현재 위치나 진행 단계가 아닙니다.' : op.confidence >= 75 ? '최근 관측 · 예상 목적지는 변경될 수 있습니다.' : '부분 관측 · 목적지는 아직 확인되지 않았습니다.',
      current: recent,
    };
  });
}

const recommendedResponse: Record<EnemyMaritimeOperation['kind'], { title: string; detail: string }> = {
  transport: { title: '보급 하역 전에 차단', detail: '잠수함 차단·항모 타격으로 적 수송선을 줄이면 실제 도착 보급량이 줄어듭니다.' },
  landing: { title: '해안을 지키고 접근로를 압박', detail: '주둔 사단·항구 보급·해공군 엄호가 교두보 전투에 반영됩니다. 상륙은 도착 즉시 점령되지 않습니다.' },
  interdiction: { title: '호송과 대잠 순찰 연계', detail: '실제 같은 전구에 배속한 호송·정찰·타격 전력이 차단 강도를 낮추고 철수를 유도합니다.' },
};

/** The board consumes an intelligence projection, never an omniscient enemy fleet table. */
export const EnemyMaritimeBoard = memo(function EnemyMaritimeBoard({ state, context, onOpenLocation, onOpenJointOperations }: EnemyMaritimeBoardProps) {
  const intel = useMemo(() => getEnemyMaritimeIntel(state, context), [state, context]);
  const knownRecords = useMemo(() => state.records.filter((record) => record.detected).slice(-4).reverse(), [state.records]);
  const activePatrol = Math.max(getEnemyMaritimeCounterPressure(context, 'europe'), getEnemyMaritimeCounterPressure(context, 'asia'));
  return <section className="enemy-maritime-board" aria-labelledby="enemy-maritime-title">
    <header className="em-header">
      <div className="em-heading"><Radio size={21} aria-hidden="true" /><div><span>MARITIME INTELLIGENCE</span><h3 id="enemy-maritime-title">적 해상 활동 정보</h3></div></div>
      <div className="em-observed-count"><Eye size={16} aria-hidden="true" /><strong>{intel.length}</strong><span>관측된 움직임</span></div>
    </header>
    <p className="em-intro">적도 함대와 수송선을 배속하고 보급·상륙·항로 차단을 수행합니다. 이 화면은 <strong>우리 측이 관측한 정보</strong>만 보여줍니다.</p>
    {context.phase !== 'war' ? <div className="em-peace"><Shield size={18} aria-hidden="true" /><p>평시 전환: 새 적 전투 작전은 중지됩니다. 출항한 함대는 귀항·급유를 마친 뒤 배속에서 해제됩니다.</p></div> : null}
    {intel.length ? <div className="em-contact-grid">{intel.map((contact) => <article key={contact.id} className={`em-contact ${contact.current ? 'is-current' : 'is-stale'}`}>
      <div className="em-contact-top"><span className={`em-kind em-kind-${contact.kind}`}>{enemyMaritimeKindLabels[contact.kind]}</span><span className="em-confidence">정보 신뢰 {contact.confidence}%</span></div>
      <h4>{contact.locationName}</h4>
      <div className="em-contact-meta"><span>{contact.theater === 'asia' ? '아시아·태평양' : '유럽·대서양'}</span><span>{contact.stage}</span><span>{contact.age === 0 ? '이번 주 관측' : `${contact.age}주 전 관측`}</span></div>
      <p className="em-observation-note">{contact.warning}</p>
      {contact.targetName ? <p className="em-target"><Crosshair size={15} aria-hidden="true" /><span>예상 목적지 <strong>{contact.targetName}</strong></span></p> : <p className="em-target is-unconfirmed"><Crosshair size={15} aria-hidden="true" /><span>목적지 미확인</span></p>}
      <div className="em-response"><strong>{recommendedResponse[contact.kind].title}</strong><p>{recommendedResponse[contact.kind].detail}</p></div>
      {contact.locationId && onOpenLocation ? <button type="button" className="em-map-link" onClick={() => onOpenLocation(contact.locationId!)}>마지막 관측 지점 보기<ArrowRight size={16} aria-hidden="true" /></button> : null}
    </article>)}</div> : <div className="em-empty"><Waves size={28} aria-hidden="true" /><div><strong>확인된 적 해상 움직임이 없습니다</strong><p>적이 없다는 뜻은 아닙니다. 정찰과 해상 순찰을 배속하면 정보 획득과 대응 가능성이 높아집니다.</p></div></div>}
    <footer className="em-action-bar"><div><Shield size={19} aria-hidden="true" /><span><strong>{activePatrol > 0 ? '배속된 대응 전력 활동 중' : '독립 대응 작전 미배속'}</strong><small>전구가 일치하고 실제 배속된 생존 함정·항공기만 대응 효과를 냅니다.</small></span></div>{onOpenJointOperations ? <button type="button" onClick={onOpenJointOperations}>해공군 대응 계획<ArrowRight size={16} aria-hidden="true" /></button> : null}</footer>
    {knownRecords.length ? <details className="em-history"><summary><Anchor size={16} aria-hidden="true" />최근 확인된 작전 결과 <span>{knownRecords.length}건</span></summary><ol>{knownRecords.map((record) => <li key={record.id}><div><strong>{enemyMaritimeKindLabels[record.kind]}</strong><span>제{record.endedWeek}주</span></div><p>{record.result}</p></li>)}</ol></details> : null}
  </section>;
});
