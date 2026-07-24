import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Clock3,
  Eye,
  Handshake,
  History,
  Landmark,
  LockKeyhole,
  MessageSquareReply,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRoundSearch,
  X,
} from 'lucide-react';
import { getRole, nations } from './campaign';
import {
  careerAffiliationLabels,
  careerApproachLabels,
  careerOfferKindLabels,
  careerOfferStatusLabels,
} from './careerMarket';
import type {
  CareerApproachKind,
  CareerMarketState,
  CareerOfferResponse,
  ForeignCareerOffer,
} from './careerMarket';
import { NationFlag } from './NationFlag';
import type { CareerRole, NationId } from './types';
import { ClandestineCareerCenter } from './ClandestineCareerCenter';
import type {
  ClandestineIncidentResponse,
  ClandestineMissionResponse,
  ClandestinePosture,
} from './clandestineCareer';

interface CareerMarketCenterProps {
  state: CareerMarketState;
  currentNationId: NationId;
  role: CareerRole;
  week: number;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  canTurnApproach: boolean;
  initialOfferId?: string | null;
  initialView?: CareerMarketView;
  initialMissionId?: string | null;
  onRespond: (offerId: string, response: CareerOfferResponse) => void;
  onApproach: (nationId: NationId, kind: CareerApproachKind) => void;
  onClandestineMissionResponse: (missionId: string, response: ClandestineMissionResponse) => void;
  onClandestineIncidentResponse: (response: ClandestineIncidentResponse) => void;
  onClandestinePostureChange: (posture: ClandestinePosture) => void;
  onClose: () => void;
}

export type CareerMarketView = 'inbox' | 'opportunities' | 'clandestine' | 'history';

const motiveLabels: Record<ForeignCareerOffer['motive'], string> = {
  money: '금전·생활보장',
  ideology: '이념·정치노선',
  compromise: '약점·강압',
  ego: '인정·자존심',
  security: '신변·가족 안전',
  revenge: '조직에 대한 원한',
};

const autonomyLabels = {
  limited: '제한적 재량',
  operational: '작전 재량',
  independent: '독립 지휘권',
};

const responseLabels: Record<Exclude<CareerOfferResponse, 'defer'>, { title: string; detail: string }> = {
  explore: { title: '탐색 회신', detail: '의사표명 없이 조건의 진위를 확인' },
  negotiate: { title: '조건 재협상', detail: '권한·보호·대가를 높이고 기한 연장' },
  accept: { title: '제안 수락', detail: '공식 이적 또는 비밀 협조 관계 개시' },
  reject: { title: '명시적 거절', detail: '연락선을 닫고 제안을 기록' },
  report: { title: '현 소속에 보고', detail: '방첩망에 접촉 정보와 신원을 제출' },
  turn: { title: '역포섭', detail: '통제 이중공작으로 상대 연락망 이용' },
};

function OfferRisk({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const tone = inverse ? value >= 65 ? 'good' : value < 38 ? 'bad' : 'neutral' : value >= 65 ? 'bad' : value < 38 ? 'good' : 'neutral';
  return (
    <div className={`career-offer-risk ${tone}`}>
      <span>{label}</span>
      <i><b style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i>
      <strong>{Math.round(value)}</strong>
    </div>
  );
}

export function CareerMarketCenter({
  state,
  currentNationId,
  role,
  week,
  formatMoney,
  canTurnApproach,
  initialOfferId,
  initialView,
  initialMissionId,
  onRespond,
  onApproach,
  onClandestineMissionResponse,
  onClandestineIncidentResponse,
  onClandestinePostureChange,
  onClose,
}: CareerMarketCenterProps) {
  const actionableOffers = useMemo(
    () => state.offers.filter((offer) => ['pending', 'exploring', 'negotiating'].includes(offer.status)),
    [state.offers],
  );
  const [view, setView] = useState<CareerMarketView>(
    initialView
      ?? (state.clandestine?.incident ? 'clandestine' : actionableOffers.length > 0 ? 'inbox' : state.clandestine ? 'clandestine' : 'opportunities'),
  );
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(initialOfferId ?? actionableOffers[0]?.id ?? null);
  const [selectedApproachNationId, setSelectedApproachNationId] = useState<NationId>(
    nations.find((nation) => nation.id !== currentNationId)?.id ?? 'britain',
  );

  useEffect(() => {
    if (!initialOfferId) return;
    setSelectedOfferId(initialOfferId);
    if (!initialView) setView('inbox');
  }, [initialOfferId, initialView]);

  useEffect(() => {
    if (initialView) setView(initialView);
  }, [initialView]);

  const selectedOffer = state.offers.find((offer) => offer.id === selectedOfferId) ?? actionableOffers[0] ?? null;
  const selectedNation = nations.find((nation) => nation.id === selectedApproachNationId) ?? nations[0];
  const pendingCount = actionableOffers.length;
  const dismissed = state.affiliationStatus === 'dismissed' || state.affiliationStatus === 'unattached';
  const approachCooldown = Math.max(0, 2 - (week - state.lastApproachWeek));

  return (
    <div className="career-market-backdrop">
      <section className="career-market-modal" role="dialog" aria-modal="true" aria-labelledby="career-market-title">
        <header className="career-market-header">
          <div className="career-market-seal"><BriefcaseBusiness size={25} /></div>
          <div>
            <span className="eyebrow">INTERNATIONAL CAREER & LIAISON DESK</span>
            <h1 id="career-market-title">국제 경력·비밀 접촉실</h1>
            <p>보직 지원, 외국의 직접 제안, 망명, 전향, 기밀 거래와 이중공작을 한 세계선 안에서 관리합니다.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="국제 경력 시장 닫기"><X size={19} /></button>
        </header>

        <div className="career-market-status">
          <div><span>현재 신분</span><strong>{careerAffiliationLabels[state.affiliationStatus]}</strong><small>{role.title}</small></div>
          <div><span>미응답 제안</span><strong>{pendingCount}</strong><small>{pendingCount > 0 ? '답변 기한 확인 필요' : '새 제안 없음'}</small></div>
          <div><span>노출 위험</span><strong>{Math.round(state.exposure)}</strong><small>{state.handlerNationId ? `${nations.find((nation) => nation.id === state.handlerNationId)?.shortName} 연락선 활성` : '외국 핸들러 없음'}</small></div>
          <div><span>협상 지렛대</span><strong>{Math.round(state.leverage)}</strong><small>평판·비밀·경력의 교섭가치</small></div>
        </div>

        <nav className="career-market-tabs" aria-label="국제 경력 화면">
          <button className={view === 'inbox' ? 'active' : ''} onClick={() => setView('inbox')}><Radio size={15} /> 받은 제안 <em>{pendingCount}</em></button>
          <button className={view === 'opportunities' ? 'active' : ''} onClick={() => setView('opportunities')}><UserRoundSearch size={15} /> 직접 접근</button>
          <button className={view === 'clandestine' ? 'active' : ''} onClick={() => setView('clandestine')}>
            <LockKeyhole size={15} /> 비밀 소속
            {state.clandestine && <em>{state.clandestine.incident ? '!' : state.clandestine.missions.filter((mission) => mission.status === 'offered').length}</em>}
          </button>
          <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}><History size={15} /> 경력 기록 <em>{state.history.length}</em></button>
        </nav>

        {view === 'inbox' && (
          <div className="career-market-workspace">
            <aside className="career-offer-list" aria-label="외국 제안 목록">
              {state.offers.length === 0 ? (
                <div className="career-market-empty"><Radio size={26} /><strong>도착한 제안이 없습니다</strong><p>평판·직급·성과·현 소속 신임에 따라 외국 기관이 먼저 접근합니다.</p></div>
              ) : state.offers.map((offer) => {
                const nation = nations.find((entry) => entry.id === offer.sourceNationId) ?? nations[0];
                const actionable = ['pending', 'exploring', 'negotiating'].includes(offer.status);
                return (
                  <button
                    key={offer.id}
                    className={`${selectedOffer?.id === offer.id ? 'active' : ''} ${actionable ? 'actionable' : 'resolved'}`}
                    onClick={() => setSelectedOfferId(offer.id)}
                  >
                    <NationFlag nationId={nation.id} decorative />
                    <span><strong>{offer.title}</strong><small>{careerOfferStatusLabels[offer.status]} · {offer.deadlineWeek + 1}주차 마감</small></span>
                    {actionable ? <Clock3 size={14} /> : <Check size={14} />}
                  </button>
                );
              })}
            </aside>

            <section className="career-offer-detail">
              {selectedOffer ? (
                <>
                  <div className="career-offer-heading">
                    <NationFlag nationId={selectedOffer.sourceNationId} size="large" decorative />
                    <div>
                      <span>{careerOfferKindLabels[selectedOffer.kind]} · {selectedOffer.origin === 'foreign-initiated' ? '상대가 먼저 접근' : '사용자 접근에 대한 회신'}</span>
                      <h2>{selectedOffer.title}</h2>
                      <p>{selectedOffer.sender} · {selectedOffer.coverChannel}</p>
                    </div>
                    <em>{careerOfferStatusLabels[selectedOffer.status]}</em>
                  </div>

                  <article className="career-offer-letter">
                    <MessageSquareReply size={18} />
                    <div><span>접촉 전문</span><p>{selectedOffer.pitch}</p></div>
                  </article>

                  <div className="career-offer-contract">
                    <div><span>제안 보직</span><strong>{getRole(selectedOffer.targetRoleId, selectedOffer.sourceNationId).title}</strong><small>{autonomyLabels[selectedOffer.terms.autonomy]} · 권한 {selectedOffer.terms.authority}</small></div>
                    <div><span>계약금</span><strong>{formatMoney(selectedOffer.terms.signingBonus)}</strong><small>주간 비밀수당 {formatMoney(selectedOffer.terms.weeklyRetainer)}</small></div>
                    <div><span>신변보호</span><strong>{Math.round(selectedOffer.terms.protection)}%</strong><small>탈출 성공 추정 {Math.round(selectedOffer.terms.extraction)}%</small></div>
                    <div><span>마감</span><strong>{Math.max(0, selectedOffer.deadlineWeek - week)}주</strong><small>제 {selectedOffer.deadlineWeek + 1}주차 철회</small></div>
                  </div>

                  <div className="career-offer-demand">
                    <span><LockKeyhole size={14} /> 상대의 실제 요구</span>
                    <strong>{selectedOffer.demand}</strong>
                    <p>접근 동기 추정: <b>{motiveLabels[selectedOffer.motive]}</b>. 동기는 제안의 진정성과 장기 안정성을 보장하지 않습니다.</p>
                  </div>

                  <div className="career-offer-risks">
                    <OfferRisk label="발각 위험" value={selectedOffer.exposureRisk} />
                    <OfferRisk label="제안 신뢰도" value={selectedOffer.credibility} inverse />
                    <OfferRisk label="상대 수용도" value={selectedOffer.acceptanceChance} inverse />
                    <OfferRisk label="통신 보안" value={selectedOffer.secrecy} inverse />
                  </div>

                  <ul className="career-offer-consequences">
                    {selectedOffer.consequencePreview.map((item) => <li key={item}><ArrowRight size={13} /> {item}</li>)}
                  </ul>

                  {['pending', 'exploring', 'negotiating'].includes(selectedOffer.status) ? (
                    <div className="career-offer-actions">
                      <button onClick={() => onRespond(selectedOffer.id, 'explore')}><Eye size={15} /><span><strong>{responseLabels.explore.title}</strong><small>{responseLabels.explore.detail}</small></span></button>
                      <button onClick={() => onRespond(selectedOffer.id, 'negotiate')}><Handshake size={15} /><span><strong>{responseLabels.negotiate.title}</strong><small>{responseLabels.negotiate.detail}</small></span></button>
                      <button className="accept" onClick={() => onRespond(selectedOffer.id, 'accept')}><BadgeCheck size={15} /><span><strong>{responseLabels.accept.title}</strong><small>{responseLabels.accept.detail}</small></span></button>
                      <button onClick={() => onRespond(selectedOffer.id, 'report')} disabled={dismissed}><ShieldCheck size={15} /><span><strong>{responseLabels.report.title}</strong><small>{dismissed ? '현재 보고할 소속기관이 없습니다' : responseLabels.report.detail}</small></span></button>
                      <button onClick={() => onRespond(selectedOffer.id, 'turn')} disabled={!canTurnApproach}><Search size={15} /><span><strong>{responseLabels.turn.title}</strong><small>{!canTurnApproach ? '정보 보직 또는 정보망 68 이상 필요' : responseLabels.turn.detail}</small></span></button>
                      <button className="reject" onClick={() => onRespond(selectedOffer.id, 'reject')}><X size={15} /><span><strong>{responseLabels.reject.title}</strong><small>{responseLabels.reject.detail}</small></span></button>
                    </div>
                  ) : (
                    <div className="career-offer-resolved"><Check size={17} /> 이 제안은 {careerOfferStatusLabels[selectedOffer.status]} 상태로 기록됐습니다.</div>
                  )}
                </>
              ) : (
                <div className="career-market-empty"><BriefcaseBusiness size={30} /><strong>제안을 선택하십시오</strong></div>
              )}
            </section>
          </div>
        )}

        {view === 'opportunities' && (
          <div className="career-opportunity-workspace">
            <aside className="career-nation-list">
              {nations.filter((nation) => nation.id !== currentNationId).map((nation) => (
                <button key={nation.id} className={selectedNation.id === nation.id ? 'active' : ''} onClick={() => setSelectedApproachNationId(nation.id)}>
                  <NationFlag nationId={nation.id} decorative />
                  <span><strong>{nation.shortName}</strong><small>{nation.status === 'sovereign' ? '주권국' : nation.status === 'government-in-exile' ? '망명정부' : '독립·저항 조직'} · {nation.alignment === 'allies' ? '연합권' : '추축권'}</small></span>
                </button>
              ))}
            </aside>
            <section className="career-approach-detail">
              <header>
                <NationFlag nationId={selectedNation.id} size="large" decorative />
                <div><span>선택한 접근 대상</span><h2>{selectedNation.name}</h2><p>{selectedNation.summary}</p></div>
              </header>
              {!dismissed && (
                <div className="career-market-warning"><ShieldAlert size={17} /><span><strong>현직 중 외부 접촉</strong><small>공식 지원도 현 소속 지도부 신임을 낮춥니다. 기밀·이중공작 제안은 발각 시 해임·체포·정치위기를 일으킬 수 있습니다.</small></span></div>
              )}
              {approachCooldown > 0 && <div className="career-market-cooldown"><Clock3 size={15} /> 연락망 재정비까지 {approachCooldown}주</div>}
              <div className="career-approach-grid">
                {(Object.keys(careerApproachLabels) as CareerApproachKind[]).map((kind) => {
                  const covert = kind === 'offer-secrets' || kind === 'offer-double-agent';
                  const disabled = approachCooldown > 0 || (covert && role.tier === 5 && role.branch !== 'intelligence');
                  return (
                    <button key={kind} disabled={disabled} onClick={() => onApproach(selectedNation.id, kind)}>
                      {kind === 'apply' ? <BriefcaseBusiness size={17} /> : kind === 'request-asylum' ? <Landmark size={17} /> : covert ? <LockKeyhole size={17} /> : <Handshake size={17} />}
                      <span><strong>{careerApproachLabels[kind].title}</strong><small>{careerApproachLabels[kind].detail}</small></span>
                      <ArrowRight size={15} />
                    </button>
                  );
                })}
              </div>
              <footer>
                <p><b>FM식 경력 규칙:</b> 평판과 최근 성과가 면담 가능성을 높이고, 재직 중 공개 지원은 현재 조직과 마찰을 만듭니다.</p>
                <p><b>정보전 규칙:</b> 돈·이념·약점·자존심·안전·원한 동기와 접근권, 방첩 수준, 노출 기록이 제안 조건을 바꿉니다.</p>
              </footer>
            </section>
          </div>
        )}

        {view === 'history' && (
          <div className="career-market-history">
            {state.history.length === 0 ? (
              <div className="career-market-empty"><History size={28} /><strong>아직 국제 경력 기록이 없습니다</strong><p>받은 제안과 사용자가 보낸 접근은 결과와 함께 여기에 남습니다.</p></div>
            ) : state.history.map((record) => {
              const nation = nations.find((entry) => entry.id === record.nationId) ?? nations[0];
              return (
                <article key={record.id}>
                  <NationFlag nationId={nation.id} decorative />
                  <time>제 {record.week + 1}주</time>
                  <div><strong>{record.title}</strong><p>{record.detail}</p></div>
                  <em>{record.outcome === 'approach-failed' ? '접촉 실패' : careerOfferStatusLabels[record.outcome]}</em>
                </article>
              );
            })}
          </div>
        )}

        {view === 'clandestine' && (
          <ClandestineCareerCenter
            state={state.clandestine}
            role={role}
            week={week}
            exposure={state.exposure}
            formatMoney={formatMoney}
            initialMissionId={initialMissionId}
            onMissionResponse={onClandestineMissionResponse}
            onIncidentResponse={onClandestineIncidentResponse}
            onPostureChange={onClandestinePostureChange}
          />
        )}

        <footer className="career-market-footer">
          <span><ShieldCheck size={14} /> 최고 국가보위(TIER 1) 재직자는 일상적인 외국 보직 제안 대상에서 제외됩니다.</span>
          <button onClick={onClose}>{dismissed && pendingCount > 0 ? '제안함을 닫고 비교 계속' : '경력실 닫기'}</button>
        </footer>
      </section>
    </div>
  );
}
