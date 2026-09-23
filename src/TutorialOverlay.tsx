import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, X } from 'lucide-react';
import { getCivilianOrigin, getCivilianProfession } from './civilianCareer';
import { getRoleTabMandates, type RoleTabMandate } from './roleMandate';
import { getPlayGuide } from './playGuide';
import type { CareerRole, CivilianCareerState, GameTab, NationId } from './types';

type TutorialRole = Pick<CareerRole, 'branch' | 'tier' | 'scope' | 'title'> & Partial<Pick<CareerRole, 'archetype'>>;

interface TutorialOverlayProps {
  nationId: NationId;
  role: TutorialRole;
  mandates?: Record<GameTab, RoleTabMandate>;
  civilian?: CivilianCareerState;
  onNavigate: (tab: GameTab) => void;
  onComplete: (openWorldWeekly: boolean) => void;
}

export interface TutorialStep {
  title: string;
  detail: string;
  action: string;
  tab: GameTab;
  target: string;
}

const branchLabels: Record<CareerRole['branch'], string> = {
  military: '군사 지휘', politics: '정치 운영', intelligence: '정보 공작',
};

/** A read-only tour: actual choices remain in their existing reviewed workflows. */
export function buildTutorialSteps(
  nationId: NationId,
  role: TutorialRole,
  civilian?: CivilianCareerState,
  currentMandates?: Record<GameTab, RoleTabMandate>,
): TutorialStep[] {
  const mandates = currentMandates ?? getRoleTabMandates(role, civilian ? 'civilian' : 'office');
  const guide = getPlayGuide({ role, mandates, civilian });
  if (civilian) {
    const profession = getCivilianProfession(civilian.professionId);
    const origin = getCivilianOrigin(civilian.originId);
    return [
      { title: `${profession.name}의 삶에서 시작합니다`, detail: `${origin.name} 배경입니다. 공식 국가 권한 없이 개인의 생계·전문성·인맥·평판·감시 위험을 관리합니다.`, action: '상황실 → 나의 사회적 기반', tab: 'command', target: '.civilian-career-hero' },
      { title: '세계가 내 삶에 주는 기회를 읽습니다', detail: '세계 주보에서 지역·전쟁·정치 변화를 확인하십시오. 주보를 읽거나 안내를 넘기는 것만으로 행동·시간·비용이 발생하지 않습니다.', action: '상황실 → 세계 주보', tab: 'command', target: '.civilian-hero-actions' },
      { title: guide.firstAction.title, detail: `${guide.firstAction.detail} ${guide.firstAction.result} 보직 진입은 필수가 아니며 독립적인 민간 활동도 이어갈 수 있습니다.`, action: guide.firstAction.actionLabel, tab: 'command', target: '.civilian-actions-board' },
      { title: '준비되면 한 주를 진행합니다', detail: '다음 주에 생계·감시·세계 사건이 계산됩니다. 결과를 읽고 활동을 이어가십시오. 이 안내를 완료해도 주간 진행은 자동 실행되지 않습니다.', action: '상황실 → 다음 주 진행 → 변화 확인', tab: 'command', target: '.civilian-week-loop' },
    ];
  }
  const supportTab: GameTab = role.branch === 'politics' ? 'economy' : 'organization';
  const support = mandates[supportTab];
  const supportTitle = role.branch === 'politics'
    ? support.mode === 'direct' ? '정책의 비용과 다음 주 효과를 비교합니다'
      : support.mode === 'request' ? '재정은 보고받고 필요한 권한을 상신합니다' : '재정 보고와 담당 부서를 확인합니다'
    : role.branch === 'intelligence' ? '후보와 요원을 비교합니다' : '지휘 범위와 지원 부서를 확인합니다';
  return [
    { title: nationId === 'korea' ? '충칭의 본부와 조선 본토를 구분합니다' : '내 보직에서 할 수 있는 일부터 봅니다', detail: `${nationId === 'korea' ? '1942년의 대한민국 임시정부 본부는 충칭이며 조선 본토는 일제 점령지입니다. ' : ''}${guide.roleSummary} 직접 지휘·상신 필요·보고 열람 표시는 서로 다른 권한입니다.`, action: '지휘 데스크 → 내 역할과 가능한 일', tab: 'command', target: '.command-desk' },
    { title: '현재 세계와 이번 주 우선순위를 읽습니다', detail: '지휘 데스크의 주간 브리핑에서 상황과 지난 결과를 확인합니다. 모든 메뉴를 읽을 필요 없이 지금 검토할 업무 하나를 고르십시오.', action: '지휘 데스크 → 주간 브리핑', tab: 'command', target: '.command-desk-briefing' },
    { title: guide.firstAction.title, detail: `${guide.firstAction.detail} ${guide.firstAction.result} 이 안내는 업무 화면을 보여 줄 뿐 명령·정책·계약을 실행하지 않습니다.`, action: guide.firstAction.actionLabel, tab: guide.firstAction.tab, target: `[data-tour="${guide.firstAction.tab}-tab"]` },
    { title: supportTitle, detail: `${support.label}. ${support.authorityRoute} ${role.branch === 'military' ? '하급 보직도 실제 예하 부대는 직접 지휘할 수 있습니다. 연구 슬롯을 채우는 것이 모든 지휘관의 의무는 아닙니다.' : role.branch === 'intelligence' ? '조직 운영의 후보 시장에서 조사 정보·노출 위험·관리 범위를 비교한 뒤 기존 검토 절차로 진행합니다.' : '비용·예상 효과·확인 시점을 비교하고 권한 밖의 결정을 직접 집행하지 마십시오.'}`, action: role.branch === 'politics' ? '재정 화면 → 권한과 예상 결과' : '조직 운영 → 담당 범위 확인', tab: supportTab, target: `[data-tour="${supportTab}-tab"]` },
    { title: '한 번 결정하고 다음 주 결과로 이어갑니다', detail: '결정은 의무가 아닙니다. 준비되면 다음 주를 진행하고 주간 브리핑에서 무엇이 왜 바뀌었는지 확인하십시오. 안내 완료는 시간을 진행하거나 성과를 확정하지 않습니다.', action: '다음 주 진행 → 주간 브리핑', tab: 'command', target: '[data-tour="next-week"]' },
  ];
}

function keepTutorialFocus(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') return;
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  const first = buttons[0];
  const last = buttons.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !event.currentTarget.contains(document.activeElement))) {
    event.preventDefault(); first.focus();
  }
}

export function TutorialOverlay({ nationId, role, mandates, civilian, onNavigate, onComplete }: TutorialOverlayProps) {
  const [index, setIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const steps = useMemo(
    () => buildTutorialSteps(nationId, role, civilian, mandates),
    [civilian?.originId, civilian?.professionId, mandates, nationId, role.archetype, role.branch, role.scope, role.tier, role.title],
  );
  const currentIndex = Math.min(index, steps.length - 1);
  const step = steps[currentIndex];
  const progress = `${currentIndex + 1}/${steps.length}`;
  const navigateToStep = useEffectEvent((tab: GameTab) => onNavigate(tab));

  useEffect(() => { closeButtonRef.current?.focus(); }, []);
  useEffect(() => {
    navigateToStep(step.tab);
    const timer = window.setTimeout(() => {
      const target = document.querySelector(step.target);
      target?.classList.add('tutorial-target');
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 120);
    return () => {
      window.clearTimeout(timer);
      document.querySelector(step.target)?.classList.remove('tutorial-target');
    };
  }, [step]);

  const next = () => {
    if (currentIndex === steps.length - 1) onComplete(true);
    else setIndex(currentIndex + 1);
  };
  return (
    <aside className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" onKeyDown={keepTutorialFocus}>
      <header><span><CircleHelp size={16} /> {civilian ? 'FIRST CIVILIAN WEEK · 공식 권한 없음' : `FIRST COMMAND · ${branchLabels[role.branch]} TIER ${role.tier}`}</span><button ref={closeButtonRef} onClick={() => onComplete(false)} aria-label="튜토리얼 건너뛰기"><X size={16} /></button></header>
      <div className="tutorial-progress"><i style={{ width: `${(currentIndex + 1) / steps.length * 100}%` }} /><span>{progress}</span></div>
      <main><em>STEP {currentIndex + 1} · {civilian ? getCivilianProfession(civilian.professionId).name : role.title}</em><h2 id="tutorial-title">{step.title}</h2><p>{step.detail}</p><small>찾아갈 곳 · {step.action}</small></main>
      <footer><button disabled={currentIndex === 0} onClick={() => setIndex(Math.max(0, currentIndex - 1))}><ArrowLeft size={14} /> 이전</button><button className="tutorial-next" onClick={next} aria-label={currentIndex === steps.length - 1 ? '완료하고 창간호 읽기' : `다음 안내: ${steps[currentIndex + 1].title}`}>{currentIndex === steps.length - 1 ? <CheckCircle2 size={14} /> : null}{currentIndex === steps.length - 1 ? '완료하고 창간호 읽기' : '다음 안내'}{currentIndex < steps.length - 1 ? <ArrowRight size={14} /> : null}</button></footer>
      <small>나중에 설정 또는 <kbd>?</kbd> 플레이 안내에서 다시 볼 수 있습니다. 건너뛰어도 불이익은 없습니다.</small>
    </aside>
  );
}
