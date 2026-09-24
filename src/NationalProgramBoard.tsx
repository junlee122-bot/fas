import { CheckCircle2, ChevronRight, ClipboardCheck, Clock3, Globe2, Landmark, Shield } from 'lucide-react';
import {
  getNationalProgramProgress,
  nationalProgramToneMeta,
} from './nationalPrograms';
import type { NationProfile } from './types';

interface NationalProgramBoardProps {
  nation: NationProfile;
  activeProgramId: string | null;
  completedDecisions: string[];
  currentWeek: number;
  politicalPower: number;
  onSelect: (programId: string) => void;
}

const toneIcons = {
  reform: <Landmark size={18} />,
  hardline: <Shield size={18} />,
  international: <Globe2 size={18} />,
};

export function NationalProgramBoard({
  nation,
  activeProgramId,
  completedDecisions,
  currentWeek,
  politicalPower,
  onSelect,
}: NationalProgramBoardProps) {
  const active = getNationalProgramProgress(nation, activeProgramId, completedDecisions, currentWeek);
  const selectionCost = active ? 14 : 8;
  return (
    <section className={`national-program-board ${active ? `tone-${active.program.tone}` : ''}`} aria-labelledby="national-program-title">
      <header>
        <div>
          <span className="eyebrow">NATIONAL PROGRAM · 26-WEEK JOURNAL</span>
          <h3 id="national-program-title">{active ? active.program.title : `${nation.shortName}의 장기 전략을 선택하십시오`}</h3>
          <p>{active
            ? `${active.program.summary} 선택은 매주 누적되고 6·13·26주 검증 뒤 13주마다 성과감사를 받습니다.`
            : '세 노선은 즉시 보너스가 아니라 서로 다른 비용·기관·후속 사건을 만드는 중기 국가 의제입니다.'}</p>
        </div>
        {active ? (
          <span className="national-program-clock">
            <Clock3 size={17} />
            <small>{active.nextMilestone ? '다음 이정표' : '다음 정기감사'}</small>
            <strong>{active.nextMilestone
              ? `${Math.max(0, active.nextMilestone.week - active.elapsedWeeks)}주 후`
              : `${active.weeksUntilReview}주 후`}</strong>
          </span>
        ) : <span className="national-program-unset">미결정</span>}
      </header>

      {active && (
        <div className="national-program-progress">
          <span><small>{nationalProgramToneMeta[active.program.tone].label} · {nationalProgramToneMeta[active.program.tone].domain}</small><strong>{active.progress}%</strong></span>
          <i><b style={{ width: `${active.progress}%` }} /></i>
          <em>{nationalProgramToneMeta[active.program.tone].cadence} · {nationalProgramToneMeta[active.program.tone].tradeoff}</em>
        </div>
      )}

      <div className="national-program-options">
        {nation.paths.map((program) => {
          const selected = program.id === activeProgramId;
          const meta = nationalProgramToneMeta[program.tone];
          return (
            <button
              type="button"
              key={program.id}
              className={`${selected ? 'selected' : ''} tone-${program.tone}`}
              aria-pressed={selected}
              onClick={() => onSelect(program.id)}
            >
              <i>{selected ? <CheckCircle2 size={18} /> : toneIcons[program.tone]}</i>
              <span>
                <small>{meta.label} · {meta.domain}</small>
                <strong>{program.title}</strong>
                <em>{program.summary}</em>
                <b>{program.effect}</b>
              </span>
              <ChevronRight size={15} />
            </button>
          );
        })}
      </div>

      {active && (
        <div className="national-program-milestones">
          {active.milestones.map((milestone) => {
            const complete = active.elapsedWeeks >= milestone.week;
            return (
              <article className={complete ? 'complete' : ''} key={milestone.week}>
                <span>{complete ? <CheckCircle2 size={14} /> : milestone.week}</span>
                <div><small>{milestone.week}주 이정표</small><strong>{milestone.title}</strong><em>{milestone.reward}</em></div>
              </article>
            );
          })}
        </div>
      )}

      {active?.phase === 'institutional' && (
        <aside className="national-program-institutional" aria-label="상설 국가 프로그램 감사 일정">
          <ClipboardCheck size={18} />
          <span>
            <small>INSTITUTIONAL REVIEW · 상설 운영 {active.reviewCount + 1}기</small>
            <strong>13주 성과감사와 노선별 부작용 검증</strong>
            <em>{active.weeksUntilReview}주 뒤 제{active.reviewCount + 1}차 감사 · {nationalProgramToneMeta[active.program.tone].tradeoff}</em>
          </span>
          <b>W{active.nextReviewWeek}</b>
        </aside>
      )}

      <footer>
        <span>{active ? `노선 전환에는 정치력 14가 들고 기존 이정표·감사 결과는 역사 기록에 남습니다.` : `최초 채택 비용 정치력 8 · 현재 ${politicalPower}`}</span>
        {!active && <b>FM식 장기 계획 · 문명식 이정표 · 저널식 후속 사건</b>}
        {active && politicalPower < selectionCost && <b className="warning">전환 정치력 부족</b>}
      </footer>
    </section>
  );
}
