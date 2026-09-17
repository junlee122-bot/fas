import type { SyntheticEvent } from 'react';
import { nations } from './campaign';
import { getCampaignDateForWeek } from './campaignCalendar';
import type { MapPoliticalLedger, PoliticalChange, PoliticalSnapshot } from './mapPoliticalLedger';
import type { PoliticalSettlementState } from './politicalSettlement';
import type { TreatyState } from './territorialTreaties';
import { getTreatyTerms } from './territorialTreaties';
import type { Faction, NationId, Territory } from './types';
import './TerritoryPoliticalCard.css';

export interface TerritoryPoliticalCardProps {
  territory: Territory;
  ledger: MapPoliticalLedger;
  week: number;
  settlement?: PoliticalSettlementState;
  treaties?: TreatyState;
  onOpenTreaties?: () => void;
  onOpenDiplomacy?: () => void;
}

const nationNames = new Map(nations.map((nation) => [nation.id, nation.shortName]));
const factionNames: Record<Faction, string> = { allies: '연합 진영', axis: '추축 진영', neutral: '중립' };
const sourceNames: Record<PoliticalChange['source']['kind'], string> = {
  'land-combat': '육상 전투', 'sea-transport': '해상 수송·상륙',
  'enemy-land': '적 육상 작전', 'enemy-sea': '적 해상 작전', 'nation-transition': '국가 체제 전환', 'treaty-transfer': '조약에 따른 현지 인도',
};
const isWeek = (value: number) => Number.isSafeInteger(value) && value >= 0;
const weekLabel = (value: number) => isWeek(value) ? `${(value + 1).toLocaleString('ko-KR')}주차` : '주차 미확인';
const factionLabel = (value: Faction) => factionNames[value] ?? '진영 미확인';
const nationLabel = (value: NationId | undefined, fallback: string) => value ? nationNames.get(value) ?? fallback : fallback;
const isolateMapInput = (event: SyntheticEvent) => event.stopPropagation();

function PoliticalChangeItem({ change }: { change: PoliticalChange }) {
  const { before, after } = change;
  const rows = [
    { label: '통제 진영', before: factionLabel(before.controller), after: factionLabel(after.controller), changed: before.controller !== after.controller },
    { label: '통제 국가', before: nationLabel(before.verifiedControllerNationId, '국가 미확인'), after: nationLabel(after.verifiedControllerNationId, '국가 미확인'), changed: before.verifiedControllerNationId !== after.verifiedControllerNationId },
    { label: '게임상 귀속', before: nationLabel(before.gameOwnerId, '미기록'), after: nationLabel(after.gameOwnerId, '미기록'), changed: before.gameOwnerId !== after.gameOwnerId },
  ].filter((row) => row.changed);
  return <li className="territory-political-change">
    <div className="territory-political-change-meta"><strong>{weekLabel(change.week)}</strong><span>{sourceNames[change.source.kind] ?? '출처 미확인'}</span></div>
    <time className="territory-political-history-note" dateTime={getCampaignDateForWeek(change.week).toISOString().slice(0, 10)}>{getCampaignDateForWeek(change.week).toLocaleDateString('ko-KR', { timeZone: 'UTC' })}</time>
    <p className="territory-political-change-source">{change.source.label || '출처 이름 미기록'}</p>
    {rows.length > 0 ? <dl>{rows.map((row) => <div key={row.label}>
      <dt>{row.label}</dt><dd><span>{row.before}</span><span className="territory-political-change-arrow" aria-label="에서"> → </span><strong>{row.after}</strong></dd>
    </div>)}</dl> : <p className="territory-political-history-note">이 기록에는 표시할 통제·귀속 차이가 없습니다.</p>}
  </li>;
}

/** Read-only ledger presentation; ownership never supplies an unverified controller or sovereignty. */
export function TerritoryPoliticalCard({ territory, ledger, week, settlement, treaties, onOpenTreaties, onOpenDiplomacy }: TerritoryPoliticalCardProps) {
  const recorded = ledger.current[territory.id];
  const snapshot: PoliticalSnapshot = recorded ?? { controller: territory.controller, gameOwnerId: territory.ownerId };
  // Preserve oldest-to-newest input and the ledger itself. Unknown/future weeks
  // must not look like confirmed events at the current map date.
  const retainedChanges = ledger.changes.filter((change) => change.territoryId === territory.id
    && isWeek(change.week) && isWeek(week) && change.week <= week);
  const lastEvidence = ledger.latestByTerritory?.[territory.id];
  const showLastEvidence = retainedChanges.length === 0 && lastEvidence?.territoryId === territory.id
    && isWeek(lastEvidence.week) && isWeek(week) && lastEvidence.week <= week;
  const changes = showLastEvidence ? [lastEvidence] : retainedChanges;
  const recent = changes.slice(-5).reverse();
  const omittedCount = Number.isSafeInteger(ledger.omittedCount) && ledger.omittedCount > 0 ? ledger.omittedCount : 0;
  const administrations = settlement?.administrations.filter((entry) => entry.territoryId === territory.id && entry.startedWeek <= week) ?? [];
  const polities = settlement?.polities.filter((polity) => polity.declaredWeek <= week
    && (polity.seatTerritoryId === territory.id || administrations.some((entry) => entry.polityId === polity.id))) ?? [];
  const siteTreaties = treaties?.treaties.filter((treaty) => treaty.territoryId === territory.id && isWeek(week)
    && [treaty.proposedWeek, treaty.respondedWeek, treaty.ratifiedWeek, treaty.completedWeek,
      treaty.consent?.startedWeek, treaty.consent?.lastProcessedWeek, treaty.consent?.resolvedWeek]
      .every((date) => date === undefined || isWeek(date) && date <= week)) ?? [];
  const bindingTreaty = siteTreaties.filter((treaty) => treaty.ratifiedWeek !== undefined && treaty.ratifiedWeek <= week
    && ['ratified', 'suspended', 'completed'].includes(treaty.status)).sort((a, b) => b.ratifiedWeek! - a.ratifiedWeek!).at(0);

  return <section id="territory-political-card" tabIndex={-1} className="territory-political-card" aria-label={`${territory.name} 통제·귀속 기록`}
    onPointerDown={isolateMapInput} onMouseDown={isolateMapInput} onClick={isolateMapInput}
    onDoubleClick={isolateMapInput} onWheel={isolateMapInput} onKeyDown={isolateMapInput} onKeyUp={isolateMapInput}>
    <header className="territory-political-heading">
      <div><span className="territory-political-eyebrow">{territory.name} · 정치 기록</span><h3>통제와 귀속</h3></div>
      <span className="territory-political-readonly">조회 전용</span>
    </header>
    <dl className="territory-political-facts">
      <div><dt>통제 진영</dt><dd><span className="territory-political-faction" data-faction={snapshot.controller}>{factionLabel(snapshot.controller)}</span></dd></div>
      <div><dt>통제 국가</dt><dd>{nationLabel(snapshot.verifiedControllerNationId, '국가 미확인')}</dd></div>
      <div><dt>게임상 귀속</dt><dd>{nationLabel(snapshot.gameOwnerId, '미기록')}</dd></div>
      <div><dt>영토 주권·국경</dt><dd className="territory-political-unverified">확정 기록 없음</dd></div>
      {bindingTreaty ? <div><dt>당사국 간 합의 귀속</dt><dd>{nationLabel(bindingTreaty.toNationId, '미확인')} · {weekLabel(bindingTreaty.ratifiedWeek!)} 비준</dd></div> : null}
    </dl>
    <p className="territory-political-caution">{territory.siteType === 'sea' ? '해역 우세는 영토 주권과 다릅니다. 해역의 게임상 귀속도 영해나 국제 승인을 확정하지 않습니다.' : '군사 통제·점령은 법적 주권이나 국제 승인을 뜻하지 않습니다. 게임상 귀속도 별도 기록입니다.'}</p>
    {!recorded ? <p className="territory-political-history-note">이 거점의 정치 기록이 없어 현재 지도 값만 표시합니다. 통제 국가는 귀속 값에서 추정하지 않습니다.</p> : null}
    {treaties ? <details className="territory-political-history">
      <summary>조약·인도 기록 <span>{siteTreaties.length}건</span></summary>
      <div className="territory-political-history-body">
        <p className="territory-political-history-note">거점 단위 당사국 합의입니다. 전국의 국경선·제3국 승인·부대·장비·공장을 자동으로 바꾸지 않습니다. 영역 미확인.</p>
        {siteTreaties.length ? [...siteTreaties].reverse().map((treaty) => {
          const terms = getTreatyTerms(treaty);
          const consent = treaty.consent;
          const consentLabel = terms.consentMethod === 'none' ? '별도 지역 동의 조항 없음' : terms.consentMethod === 'referendum' ? '주민투표' : '지역대표 심의';
          return <article className="territory-political-government" key={treaty.id}>
          <h4>{treaty.name}</h4><p>{nationLabel(treaty.fromNationId, '미확인')} → {nationLabel(treaty.toNationId, '미확인')}</p>
          <p>{treaty.status === 'completed' && treaty.completedWeek !== undefined && treaty.completedWeek <= week ? `현지 인도 완료 · ${weekLabel(treaty.completedWeek)}`
            : treaty.status === 'suspended' ? '비준 유지 · 현지 인도 중단'
              : treaty.status === 'ratified' ? '비준 완료 · 현지 인도 대기'
                : treaty.status === 'accepted' ? '상대국 동의 · 국내 비준 대기' : treaty.status === 'rejected' ? '상대국 거절' : treaty.status === 'withdrawn' ? '비준 전 철회' : '상대국 답변 대기'}</p>
          <p className="territory-political-history-note">{treaty.reason}</p>
          <dl>
            <div><dt>지역 동의 조건</dt><dd>{consentLabel}</dd></div>
            <div><dt>인도 준비 기간</dt><dd>비준 후 {terms.handoverDelayWeeks}주{treaty.handoverDueWeek !== undefined ? ` · 최초 확인 ${weekLabel(treaty.handoverDueWeek)}` : ''}</dd></div>
            {terms.civilGuarantees ? <div><dt>주민 보호</dt><dd>조약상 주민보호 약속</dd></div> : null}
            {terms.withdrawBeforeHandover ? <div><dt>육군 철수</dt><dd>인도 시 제공국의 육군 주둔부대 철수 확인 필요</dd></div> : null}
          </dl>
          {consent ? <>
            <p>{consent.status === 'approved' ? '지역 동의 승인' : consent.status === 'rejected' ? '지역 동의 부결' : consent.status === 'suspended' ? '지역 동의 절차 중단' : `지역 동의 준비 ${consent.progressWeeks}/3주`}{consent.resolvedWeek !== undefined ? ` · ${weekLabel(consent.resolvedWeek)}` : ''}</p>
            {Number.isFinite(consent.supportPercent) && Number.isFinite(consent.participationPercent) ? <p>게임 내 찬성 지표 {consent.supportPercent}/100 · 참여 지표 {consent.participationPercent}/100</p> : null}
            <p className="territory-political-history-note">{consent.reason}</p>
            <p className="territory-political-history-note">게임의 합성 지역 모형입니다. 실제 역사 여론·득표수나 절차의 공정성을 증명하지 않습니다. 다른 거점이나 새로운 조약의 동의로 사용할 수 없습니다.</p>
          </> : terms.consentMethod !== 'none' ? <p className="territory-political-history-note">지역 동의 착수 전 · 조약 화면에서 절차를 시작하십시오.</p> : null}
        </article>;
        }) : <p className="territory-political-empty">이 거점에 연결된 조약이 없습니다.</p>}
        {onOpenTreaties ? <button type="button" className="territory-political-open-process" onClick={onOpenTreaties}>조약·영토 이양 열기</button> : null}
      </div>
    </details> : null}
    {settlement ? <details className="territory-political-history territory-political-settlements">
      <summary>정부·행정 기록 <span>{polities.length}개 정부</span></summary>
      <div className="territory-political-history-body">
        <p className="territory-political-history-note">선언·외국의 정부 대표권 승인·현지 행정은 서로 다른 사실입니다. 아래 기록은 영토 주권이나 국경을 확정하지 않습니다.</p>
        {polities.length === 0 ? <p className="territory-political-empty">이 거점에 연결된 정부 선언이나 행정 기록이 없습니다.</p> : polities.map((polity) => {
          const recognition = settlement.recognitions.filter((entry) => entry.polityId === polity.id && entry.requestedWeek <= week);
          const recognized = recognition.filter((entry) => entry.status === 'recognized' && entry.resolvedWeek !== undefined && entry.resolvedWeek <= week);
          const pending = recognition.filter((entry) => entry.status === 'pending' || (entry.resolvedWeek !== undefined && entry.resolvedWeek > week));
          const administration = administrations.find((entry) => entry.polityId === polity.id);
          return <article className="territory-political-government" key={polity.id}>
            <h4>{polity.name}</h4>
            <p>{nationLabel(polity.nationId, '소속 미확인')} · {polity.declaration === 'independence' ? '독립 선언' : '정부 대표 선언'} · {weekLabel(polity.declaredWeek)}</p>
            {polity.seatTerritoryId === territory.id ? <p className="territory-political-history-note">연락·활동 거점입니다. 이곳의 소유권이나 수도 지위를 뜻하지 않습니다.</p> : null}
            <dl>
              <div><dt>대표권 승인국</dt><dd>{recognized.length > 0 ? recognized.map((entry) => nationLabel(entry.partnerNationId, '국가 미확인')).join(' · ') : '아직 없음'}{pending.length > 0 ? ` · 심사 중 ${pending.length}개국` : ''}</dd></div>
              <div><dt>현지 행정</dt><dd>{administration ? administration.status === 'operating' ? '행정 운영 중' : administration.status === 'suspended' ? '행정 중단 · 재개 검토 필요' : `준비 ${administration.progressWeeks}/3주` : '착수 기록 없음'}</dd></div>
            </dl>
            {administration ? <p className="territory-political-history-note">{administration.reason}</p> : null}
          </article>;
        })}
        {onOpenDiplomacy ? <button type="button" className="territory-political-open-process" onClick={onOpenDiplomacy}>정부·행정 절차 열기</button> : null}
      </div>
    </details> : null}
    <details className="territory-political-history">
      <summary>통제·귀속 변동 <span>{showLastEvidence ? '마지막 근거 1건' : changes.length > 5 ? `최근 5건 / ${changes.length.toLocaleString('ko-KR')}건` : `${changes.length}건`}</span></summary>
      <div className="territory-political-history-body">
        <p className="territory-political-history-baseline">기록 기준 {weekLabel(ledger.startedWeek)} · 현재 {weekLabel(week)}</p>
        {showLastEvidence ? <p className="territory-political-history-note">상세 이력이 보관 한도를 넘어 현재 통제·귀속을 확인한 마지막 근거를 표시합니다.</p> : null}
        {ledger.baselineKind === 'legacy-load' ? <p className="territory-political-history-note">기존 저장을 불러온 시점부터 기록합니다. 그 이전의 점령·귀속 이력은 추정해 만들지 않습니다.</p> : <p className="territory-political-history-note">캠페인 시작 상태를 기준으로 이후 확인된 변동만 기록합니다.</p>}
        {recent.length > 0 ? <ol className="territory-political-change-list" aria-label="최근 통제·귀속 변동, 최신순">{recent.map((change) => <PoliticalChangeItem key={change.id} change={change} />)}</ol>
          : <p className="territory-political-empty">기록 기준 이후 확인된 변동이 없습니다.</p>}
        {omittedCount > 0 ? <p className="territory-political-history-note">보관 한도를 넘긴 이전 세계 기록 {omittedCount.toLocaleString('ko-KR')}건은 원장에 남아 있지 않습니다.</p> : null}
      </div>
    </details>
  </section>;
}
