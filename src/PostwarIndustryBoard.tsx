import { useId, useMemo, useState } from 'react';
import { Check, Factory, Fuel, PackageCheck, ShieldCheck } from 'lucide-react';
import { forecastPostwarIndustry, postwarIndustryPolicyDefinitions, postwarStockpileKeys } from './postwarIndustry';
import type { PostwarIndustryInput, PostwarIndustryPolicyId, PostwarIndustryReport } from './postwarIndustry';
import { postwarIndustryAllowances, postwarMaterialQuotes } from './postwarIndustrySettlement';
import type { PostwarIndustrySettings } from './postwarIndustrySettlement';
import type { Stockpile } from './types';
import './PostwarIndustryBoard.css';

const labels = { infantryEquipment: '보병 장비', tanks: '전차', aircraft: '항공기', convoys: '함선·수송선', artillery: '야포', trucks: '차량' };
const constraints = { inactive: '가동 라인 없음', factories: '공장 초과 배치', fuel: '연료 부족', steel: '강철 부족', budget: '집행 예산 부족' };
export interface PostwarIndustryBoardProps {
  input: PostwarIndustryInput;
  routedEquipmentKey?: keyof Stockpile;
  lastReport: PostwarIndustryReport | null;
  canManage: boolean;
  canAuthorizeCash: boolean;
  cashAvailable: number;
  formatMoney: (amount: number) => string;
  onApprove: (settings: PostwarIndustrySettings) => boolean;
  onPurchase: (material: 'fuel' | 'steel') => void;
  onOpenBudget: () => void;
  onOpenBriefing: () => void;
}

export interface PostwarIndustryDraft { basis: string; settings: PostwarIndustrySettings }
export function getPostwarIndustryDraftBasis(input: PostwarIndustryInput, canManage: boolean, canAuthorizeCash: boolean, cashAvailable: number) {
  return JSON.stringify([input, canManage, canAuthorizeCash, cashAvailable]);
}
export function resolvePostwarIndustryDraft(draft: PostwarIndustryDraft | null, basis: string, approved: PostwarIndustrySettings) {
  return { settings: draft?.basis === basis ? draft.settings : approved, stale: draft !== null && draft.basis !== basis };
}

export function PostwarIndustryBoard({ input, routedEquipmentKey, lastReport, canManage, canAuthorizeCash, cashAvailable, formatMoney, onApprove, onPurchase, onOpenBudget, onOpenBriefing }: PostwarIndustryBoardProps) {
  const [draft, setDraft] = useState<PostwarIndustryDraft | null>(null);
  const [view, setView] = useState<'overview' | 'plan' | 'settlement'>('overview');
  const [rejection, setRejection] = useState<string | null>(null);
  const panelId = useId();
  const approved = { policy: input.policy ?? 'balanced', extraTreasuryAllowance: input.extraTreasuryAllowance ?? 0 };
  const basis = getPostwarIndustryDraftBasis(input, canManage, canAuthorizeCash, cashAvailable);
  const { settings, stale } = resolvePostwarIndustryDraft(draft, basis, approved);
  const pending = settings.policy !== approved.policy || settings.extraTreasuryAllowance !== approved.extraTreasuryAllowance;
  const preview = useMemo(() => forecastPostwarIndustry({ ...input, ...settings }), [input, settings.policy, settings.extraTreasuryAllowance]);
  const approvedPreview = useMemo(() => forecastPostwarIndustry(input), [input]);
  const update = (change: Partial<PostwarIndustrySettings>) => { setDraft({ basis, settings: { ...settings, ...change } }); setRejection(null); };
  const report = lastReport?.nationId === input.nationId && lastReport.week < input.week ? lastReport : null;
  return <section className="postwar-industry" aria-label="국정 군수 납품 지휘실">
    <header><div><span>INDUSTRIAL DELIVERY · 제{input.week + 1}주 예정</span><h3><Factory size={21} /> 국정 산업 가동</h3></div><strong className="postwar-industry-access">{canManage ? '산업 직접 결재' : '열람 전용'}</strong></header>
    <nav className="postwar-industry-tabs" aria-label="국정 산업 보기">{([['overview', '현재 개요'], ['plan', '가동 방침·예측'], ['settlement', '지난 실제 결산']] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} aria-controls={`${panelId}-${id}`} onClick={() => setView(id)}>{label}{id === 'plan' && pending ? ' · 변경안' : ''}</button>)}</nav>
    {stale && <p className="postwar-industry-warning" role="status">주차·국가·배치·예산 또는 권한이 바뀌어 이전 변경안을 적용하지 않습니다. 현재 승인값을 기준으로 다시 검토하십시오.</p>}
    {!canManage && <p className="postwar-industry-warning">산업 직접권한이 없어 가동 방침 결재와 원료 조달을 실행할 수 없습니다.</p>}
    <div id={`${panelId}-overview`} className="postwar-industry-overview" hidden={view !== 'overview'}>
      <dl className="postwar-industry-kpis"><div><dt>현재 승인 방침</dt><dd>{postwarIndustryPolicyDefinitions[approved.policy].label}</dd></div><div><dt>다음 주 생산 완료율 예상</dt><dd>{Math.round(approvedPreview.deliveryRatio * 100)}%</dd></div><div><dt>추가 국고 차감 예상</dt><dd>{formatMoney(approvedPreview.additionalTreasuryCost)}</dd></div></dl>
      <div className="postwar-industry-next"><strong>{approvedPreview.bottlenecks.length ? '현재 병목' : '승인된 생산 계획'}</strong><p>{approvedPreview.bottlenecks.length ? approvedPreview.bottlenecks.map((reason) => constraints[reason]).join(' · ') : '현재 배치의 생산 계획을 충족합니다. 아직 실제 생산·입고된 수량은 아닙니다.'}</p><button type="button" onClick={() => setView('plan')}>가동 방침·예산 검토</button></div>
      <p>{routedEquipmentKey ? '생산 완료 → 품목별 직접 입고 또는 집하·수송' : '배치 → 예산·원료 확인 → 주간 납품 → 비축 입고'}</p>
      {pending && <p className="postwar-industry-warning">검토 중인 미결재 변경안이 있습니다. 이 개요는 현재 승인된 방침으로 계산합니다.</p>}
      <div className="postwar-industry-last-summary"><PackageCheck size={20} /><span>{report ? `최근 실제 기록: 제${report.week + 1}주 생산 완료 결산` : '아직 국정 군수 납품 기록이 없습니다'}</span><button type="button" onClick={() => setView('settlement')}>실제 기록 열기</button></div>
    </div>
    <div id={`${panelId}-plan`} className="postwar-industry-plan" hidden={view !== 'plan'}>
    <div className="postwar-industry-policies" role="group" aria-label="국정 공장 가동 방침">
      {(Object.entries(postwarIndustryPolicyDefinitions) as Array<[PostwarIndustryPolicyId, typeof postwarIndustryPolicyDefinitions.balanced]>).map(([id, policy]) => <button key={id} type="button" disabled={!canManage} aria-pressed={settings.policy === id} onClick={() => update({ policy: id })}><strong>{policy.label}</strong><span>{policy.description}</span></button>)}
    </div>
    <div className="postwar-industry-budget">
      <div><small>이미 공공지출에 포함</small><strong>{formatMoney(preview.includedIndustryBudget)}</strong><p>안보예산 {formatMoney(preview.securityBaseBudget)}의 {preview.industryBudgetShare * 100}% 군수몫. 재차 국고에서 빼지 않습니다.</p></div>
      <label><span>추가 국고 집행 한도 / 주</span><select value={settings.extraTreasuryAllowance} disabled={!canManage || !canAuthorizeCash} onChange={(event) => update({ extraTreasuryAllowance: Number(event.target.value) })}>{postwarIndustryAllowances.map((amount) => <option key={amount} value={amount}>{amount === 0 ? '추가 집행 없음' : formatMoney(amount)}</option>)}</select><small>{canAuthorizeCash ? '자동 차입 없음 · 실제 필요한 금액만 현금 범위에서 집행' : '변경에는 재정 또는 국정 직접권한이 필요합니다.'}</small></label>
    </div>
    <div className="postwar-industry-forecast" aria-live="polite">
      <strong>{pending ? '미결재 변경안' : '승인된 방침'} · 다음 주 예상 {routedEquipmentKey ? '생산 완료율' : '납품률'} {Math.round(preview.deliveryRatio * 100)}%</strong>
      <p>{preview.bottlenecks.length ? preview.bottlenecks.map((reason) => constraints[reason]).join(' · ') : '현재 배치의 생산 계획을 충족합니다.'}</p>
      <dl><div><dt>예상 운영비 + 제조비</dt><dd>{formatMoney(preview.operatingCost)} + {formatMoney(preview.manufacturingCost)}</dd></div><div><dt>추가 국고 차감 예상</dt><dd>{formatMoney(preview.additionalTreasuryCost)}</dd></div><div><dt>연료 사용 / 필요 예상</dt><dd>{preview.fuelUsed.toFixed(2)} / {preview.fuelRequired.toFixed(2)}K</dd></div><div><dt>강철 사용 / 필요 예상</dt><dd>{preview.steelUsed.toFixed(2)} / {preview.steelRequired.toFixed(2)}K</dd></div></dl>
      <div className="postwar-industry-deliveries">{postwarStockpileKeys.map((key) => <div key={key}><span>{labels[key]}</span><strong>{preview.delivered[key].toLocaleString()}<small> / {preview.potentialDelivery[key].toLocaleString()}</small></strong><em>{key === routedEquipmentKey ? '집하창고 생산 완료 → 수송 후 가용' : '국가 직접 입고 전망 / 생산 계획'}</em></div>)}</div>
      <small>비용·물량은 게임 내 추상 계산입니다. 부족하면 비례 감산합니다. {routedEquipmentKey ? '표시 수치는 생산 완료 전망입니다. 집하창고·예약·수송 중 장비는 국가 가용 비축이 아니며 실제 도착 후 편입합니다.' : '인도되지 않은 장비는 비축에 추가하지 않습니다.'} 열람·예상 계산만으로 비용이 들지 않습니다.</small>
    </div>
    {canManage && <div className="postwar-industry-approval"><button type="button" disabled={!pending || stale || (!canAuthorizeCash && settings.extraTreasuryAllowance !== approved.extraTreasuryAllowance)} onClick={() => { if (!pending || stale || !canManage || (!canAuthorizeCash && settings.extraTreasuryAllowance !== approved.extraTreasuryAllowance)) return; if (onApprove(settings)) { setDraft(null); setRejection(null); } else setRejection(basis); }}><Check size={15} /> 가동 방침 결재</button>{pending && <button type="button" onClick={() => { setDraft(null); setRejection(null); }}>변경안 취소</button>}<span>{pending ? '현재 세계는 기존 승인안으로 진행합니다.' : '다음 주 진행 때 실제 납품합니다.'}</span></div>}
    {rejection === basis && <p className="postwar-industry-warning" role="status">결재가 승인되지 않았습니다. 기존 방침은 유지되며 현재 권한·예산을 다시 확인하십시오.</p>}
    <details className="postwar-industry-procurement"><summary><Fuel size={15} /> 원료 확보와 추가 재정 권한</summary><p>보유 원료는 생산에 소모됩니다. 아래는 게임 내 즉시 조달 견적이며 실제 역사적 시장가격·운송망을 뜻하지 않습니다. 구매는 1회성이고 납품비와 별도입니다.</p><div>{(['fuel', 'steel'] as const).map((material) => <button type="button" key={material} disabled={!canManage || !canAuthorizeCash || cashAvailable < postwarMaterialQuotes[material].cost} onClick={() => onPurchase(material)}>{postwarMaterialQuotes[material].label} 조달 · {formatMoney(postwarMaterialQuotes[material].cost)}</button>)}<button type="button" onClick={onOpenBudget}>재정 보고·권한 협의</button></div>{!canAuthorizeCash && <small>현재 보직은 원료 조달의 추가 국고 집행을 직접 승인할 수 없습니다.</small>}</details>
    </div>
    <div id={`${panelId}-settlement`} className="postwar-industry-settlement" hidden={view !== 'settlement'}>
      <footer><PackageCheck size={23} /><div><strong>{report ? `제${report.week + 1}주 생산 완료 결산 · ${postwarIndustryPolicyDefinitions[report.policy].label}` : '아직 국정 군수 납품 기록이 없습니다'}</strong><p>{report ? `전차 ${report.delivered.tanks} · 항공기 ${report.delivered.aircraft} · 보병 장비 ${report.delivered.infantryEquipment} · 추가 국고 ${formatMoney(report.additionalTreasuryCost)}. 실제 국가 가용 입고는 당시 귀속·도착 영수증에서 확인합니다.` : '공장 배치는 유지됩니다. 첫 주간 결산부터 납품과 비용이 함께 기록됩니다.'}</p></div><button type="button" onClick={onOpenBriefing}><ShieldCheck size={15} /> 납품 결산 확인</button></footer>
      {report && <><dl className="postwar-industry-kpis"><div><dt>기존 예산 사용 · 재차 차감 없음</dt><dd>{formatMoney(report.includedBudgetUsed)}</dd></div><div><dt>실제 추가 국고 집행</dt><dd>{formatMoney(report.additionalTreasuryCost)}</dd></div><div><dt>실제 연료 / 강철 사용</dt><dd>{report.fuelUsed.toFixed(2)} / {report.steelUsed.toFixed(2)}K</dd></div></dl><div className="postwar-industry-actual-lines" aria-label="지난 생산선별 실제 완료 기록">{report.perLine.map((line) => <article key={line.lineId}><strong>{line.name}</strong><span>생산 완료 {line.delivered.toLocaleString()} / 당시 계획 {line.planned.toLocaleString()}</span><small>생산선 ID: {line.lineId} · 당시 배정 {line.assignedFactories}개 공장</small></article>)}</div><p className="postwar-industry-note">현재 방침·배치를 과거 기록에 다시 적용하지 않습니다. 생산 완료는 창고 출발이나 국가 가용 도착을 뜻하지 않습니다.</p></>}
    </div>
  </section>;
}
