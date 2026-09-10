import { getCampaignYearForWeek } from './campaignCalendar';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  Globe2,
  Landmark,
  Network,
  Newspaper,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import {
  civilianActions,
  getCivilianActionAvailability,
  getCivilianInstitutionReadiness,
  getCivilianOrigin,
  getCivilianProfession,
  getCivilianStageLabel,
} from './civilianCareer';
import type { CareerRole, CivilianCareerState, NationProfile } from './types';

interface CivilianCareerPanelProps {
  state: CivilianCareerState;
  nation: NationProfile;
  week: number;
  entryRoles: CareerRole[];
  worldlineTitle: string;
  worldlineCode: string;
  weeklyUnread: boolean;
  onAction: (actionId: string) => void;
  onEnterRole: (roleId: string) => void;
  onOpenWorldWeekly: () => void;
  onOpenWorldHistory: () => void;
  onNextWeek: () => void;
}

const branchLabels: Record<CareerRole['branch'], string> = {
  politics: '정치·행정',
  military: '군사·기술',
  intelligence: '정보·저항',
};

function CivilianMetric({ label, value, detail, tone = 'neutral' }: { label: string; value: number; detail: string; tone?: 'neutral' | 'good' | 'risk' }) {
  return (
    <div className={`civilian-metric ${tone}`}>
      <span><small>{label}</small><strong>{value}</strong></span>
      <i aria-hidden="true"><b style={{ width: `${value}%` }} /></i>
      <p>{detail}</p>
    </div>
  );
}

export function CivilianCareerPanel({
  state,
  nation,
  week,
  entryRoles,
  worldlineTitle,
  worldlineCode,
  weeklyUnread,
  onAction,
  onEnterRole,
  onOpenWorldWeekly,
  onOpenWorldHistory,
  onNextWeek,
}: CivilianCareerPanelProps) {
  const profession = getCivilianProfession(state.professionId);
  const origin = getCivilianOrigin(state.originId);
  const readiness = getCivilianInstitutionReadiness(state);
  const currentYear = getCampaignYearForWeek(week);

  return (
    <div className="civilian-career-home">
      <section className="civilian-career-hero">
        <div className="civilian-identity">
          <span className="civilian-avatar" aria-hidden="true"><UserRound size={27} /></span>
          <span>
            <small>CIVILIAN CAREER · {nation.shortName} · {currentYear}</small>
            <h2>{profession.name}</h2>
            <p>{origin.name} · {getCivilianStageLabel(state.stage)} · 공식 지휘권 없이 활동 중</p>
          </span>
        </div>
        <div className="civilian-worldline">
          <span><Globe2 size={15} /><small>현재 가능세계</small></span>
          <strong>{worldlineTitle}</strong>
          <em>{worldlineCode}</em>
          <button type="button" onClick={onOpenWorldHistory}>원인과 분기 보기 <ChevronRight size={14} /></button>
        </div>
        <div className="civilian-hero-actions">
          <button type="button" className={weeklyUnread ? 'unread' : ''} onClick={onOpenWorldWeekly}>
            <Newspaper size={16} /><span><strong>세계 주보</strong><small>{weeklyUnread ? '새 호 도착' : '이번 주 세계 확인'}</small></span>
          </button>
          <button type="button" className="primary" onClick={onNextWeek}>
            <Clock3 size={16} /><span><strong>다음 주 진행</strong><small>생계·감시·세계 사건 계산</small></span><ArrowRight size={14} />
          </button>
        </div>
      </section>

      <section className="civilian-week-loop" aria-label="민간 커리어 주간 흐름">
        <header><Sparkles size={15} /><span><small>이번 주 행동 흐름</small><strong>생활을 유지하면서 영향력을 한 단계씩 넓히십시오</strong></span></header>
        <ol>
          <li className="active"><b>1</b><span><strong>세계 읽기</strong><small>주보와 지역 상황 파악</small></span></li>
          <li><b>2</b><span><strong>민간 행동</strong><small>6개 활동 중 하나 선택</small></span></li>
          <li><b>3</b><span><strong>관계 축적</strong><small>평판·전문성·인맥 변화</small></span></li>
          <li><b>4</b><span><strong>세계선 반영</strong><small>다음 주 사건 조건 변경</small></span></li>
        </ol>
      </section>

      <div className="civilian-career-grid">
        <section className="civilian-dashboard-card civilian-standing">
          <header><span><TrendingUp size={15} /><strong>나의 사회적 기반</strong></span><em>{getCivilianStageLabel(state.stage)}</em></header>
          <p>국가 자원과 별도로 관리되는 개인 커리어 지표입니다. 공개 행동은 평판과 인맥을 높이지만 생계를 소모하고 감시를 부릅니다.</p>
          <div className="civilian-metric-grid">
            <CivilianMetric label="공적 평판" value={state.publicReputation} detail="대중·언론이 당신을 신뢰하는 정도" tone="good" />
            <CivilianMetric label="전문성" value={state.expertise} detail="직업적 판단과 성과의 신뢰도" tone="good" />
            <CivilianMetric label="인맥" value={state.network} detail="동료·후원자·조직과의 연결" tone="good" />
            <CivilianMetric label="생계" value={state.livelihood} detail="활동을 지속할 개인 재정과 생활 안정" />
            <CivilianMetric label="독립성" value={state.independence} detail="후원자와 권력으로부터의 자율성" />
            <CivilianMetric label="감시 위험" value={state.scrutiny} detail="검열·경찰·정보기관의 주목" tone={state.scrutiny >= 65 ? 'risk' : 'neutral'} />
          </div>
          <div className="civilian-vocation-note">
            <BookOpen size={15} /><span><strong>{profession.vocation}</strong><small>역사 기반 · {profession.historicalBasis}</small></span>
          </div>
        </section>

        <section className="civilian-dashboard-card civilian-actions-board">
          <header><span><Network size={15} /><strong>이번 주 민간 행동</strong></span><em>{civilianActions.filter((action) => getCivilianActionAvailability(state, action, week).available).length}/{civilianActions.length} 실행 가능</em></header>
          <p>행동의 종류와 순서가 세계선의 시민·산업·독립·정보 압력을 직접 바꿉니다. 같은 행동은 준비 기간이 지나면 다시 실행할 수 있습니다.</p>
          <div className="civilian-action-grid">
            {civilianActions.map((action) => {
              const availability = getCivilianActionAvailability(state, action, week);
              return (
                <article key={action.id} className={availability.available ? '' : 'locked'}>
                  <span className="civilian-action-icon" aria-hidden="true">
                    {action.force === 'industry' ? <CircleDollarSign size={17} /> : action.force === 'intelligence' ? <Eye size={17} /> : action.force === 'liberation' ? <Landmark size={17} /> : <ShieldCheck size={17} />}
                  </span>
                  <span><small>{action.force.toUpperCase()}</small><strong>{action.title}</strong><p>{action.summary}</p><em>{action.commitment}</em></span>
                  <button type="button" disabled={!availability.available} onClick={() => onAction(action.id)}>
                    {availability.available ? '실행' : availability.reason}<ChevronRight size={13} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="civilian-dashboard-card civilian-entry-board">
          <header><span><BriefcaseBusiness size={15} /><strong>제도권·조직 진입 제안</strong></span><em>준비도 {readiness.score}</em></header>
          <p>공식 보직은 시작 조건이 아니라 플레이 중 얻는 선택지입니다. 들어가면 기존 보직 커리어와 참모·이적시장 흐름이 열리며, 민간에서 만든 인맥과 세계선은 그대로 남습니다.</p>
          <div className="civilian-readiness">
            {readiness.requirements.map((requirement) => (
              <span key={requirement.label} className={requirement.met ? 'met' : ''}>{requirement.met ? <Check size={12} /> : <Clock3 size={12} />}{requirement.label}</span>
            ))}
          </div>
          <div className="civilian-entry-routes">
            {entryRoles.map((role) => (
              <article key={role.id}>
                <span><small>{branchLabels[role.branch]} · TIER {role.tier}</small><strong>{role.title}</strong><p>{role.expectation}</p></span>
                <button type="button" disabled={!readiness.ready} onClick={() => onEnterRole(role.id)}>
                  {readiness.ready ? '제안 수락' : '조건 미달'}<ChevronRight size={13} />
                </button>
              </article>
            ))}
          </div>
          {!readiness.ready && <div className="civilian-entry-hint">모든 조건을 충족하면 국가별 최하위 보직·저항조직·정보망의 제안이 열립니다. 제도권에 들어가지 않고 전국적 민간 인물로 성장하는 길도 유지됩니다.</div>}
        </section>

        <section className="civilian-dashboard-card civilian-record">
          <header><span><Newspaper size={15} /><strong>내 선택의 기록</strong></span><em>{state.actionHistory.length}개 행동 · {state.weeksActive}주 활동</em></header>
          {state.actionHistory.length > 0 ? (
            <div>
              {[...state.actionHistory].reverse().slice(0, 5).map((record) => (
                <article key={`${record.id}-${record.week}`}>
                  <time>제 {record.week + 1}주</time><span><strong>{record.title}</strong><p>{record.outcome}</p></span>
                </article>
              ))}
            </div>
          ) : (
            <div className="civilian-empty-record"><UserRound size={23} /><strong>아직 공적 기록이 없습니다.</strong><p>첫 민간 행동을 선택하면 그 결과가 세계 주보와 가능세계 원인 기록에 남습니다.</p></div>
          )}
        </section>
      </div>
    </div>
  );
}
