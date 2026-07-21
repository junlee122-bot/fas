import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, X } from 'lucide-react';
import type { CareerRole, GameTab, NationId } from './types';

interface TutorialOverlayProps {
  nationId: NationId;
  role: Pick<CareerRole, 'branch' | 'tier' | 'scope' | 'title'>;
  onNavigate: (tab: GameTab) => void;
  onComplete: (openWorldWeekly: boolean) => void;
}

interface TutorialStep {
  title: string;
  detail: string;
  action: string;
  tab: GameTab;
  target: string;
}

const branchLabels: Record<CareerRole['branch'], string> = {
  military: '군사 지휘',
  politics: '정치 운영',
  intelligence: '정보 공작',
};

function getRoleSteps(role: TutorialOverlayProps['role']): TutorialStep[] {
  const junior = role.tier >= 4;
  if (role.branch === 'military') return [
    { title: '지휘 가능한 부대를 먼저 고릅니다', detail: '전력·조직력·보급과 현재 명령을 한 화면에서 비교하십시오. 붉은 준비도만 보고 공세를 서두르면 회복 주기가 길어집니다.', action: '부대 지휘 보기', tab: 'army', target: '[data-tour="army-tab"]' },
    { title: junior ? '작전안을 상신합니다' : '첫 작전 명령을 승인합니다', detail: junior ? '현재 직급에서는 모든 사단을 직접 움직이지 않습니다. 통솔 범위의 부대를 준비하고 목표·위험·지원 요구를 상급 지휘부에 제출하십시오.' : '전선과 인접한 준비 완료 부대에 공세·훈련 의도를 부여하고 예상 손실을 확인하십시오.', action: junior ? '상신 절차 확인' : '명령 절차 확인', tab: 'army', target: '[data-tour="army-tab"]' },
  ];
  if (role.branch === 'politics') return [
    { title: '내각과 이해집단을 읽습니다', detail: '정책을 집행할 부서, 반대 파벌, 정치력과 현재 권한을 먼저 확인하십시오.', action: '내각·권한 보기', tab: 'organization', target: '[data-tour="organization-tab"]' },
    { title: junior ? '정책 건의안을 상신합니다' : '첫 국가 원칙을 결재합니다', detail: junior ? '정책의 비용·수혜자·반대 세력을 정리해 상급 의사결정자에게 채택을 요청하십시오.' : '경제·사회·외교·교리 중 한 영역의 운영 원칙을 채택하고 다음 주 파급효과를 확인하십시오.', action: '정책 운영 보기', tab: 'economy', target: '[data-tour="economy-tab"]' },
  ];
  return [
    { title: '정보망과 노출 위험을 확인합니다', detail: '정보 신뢰도, 작전망, 적 방첩 압력을 비교한 뒤 첫 표적을 정하십시오.', action: '정보망 보기', tab: 'intelligence', target: '[data-tour="intelligence-tab"]' },
    { title: junior ? '수집·공작안을 상신합니다' : '첫 조사·접촉을 승인합니다', detail: junior ? '접촉선과 근거를 확보해 실행 가능한 공작안을 상급 기관에 제출하십시오.' : '후보 한 명의 조사나 접촉을 시작하고 충성도·이중공작 위험을 함께 검토하십시오.', action: '후보 시장 보기', tab: 'organization', target: '[data-tour="organization-tab"]' },
  ];
}

function buildTutorialSteps(nationId: NationId, role: TutorialOverlayProps['role']): TutorialStep[] {
  const opening: TutorialStep[] = nationId === 'korea' ? [
    { title: '충칭의 독립운동 지휘부에서 시작합니다', detail: '현재 행정·외교 본부는 충칭의 대한민국 임시정부입니다. 조선 본토는 일제 점령지이므로 본부와 영토를 구분해 읽으십시오.', action: '충칭 지휘부 확인', tab: 'command', target: '[data-tour="command-hero"]' },
    { title: '해방 준비는 네 축으로 나뉩니다', detail: '연합국 승인, 국내 공작망, 한국광복군, 귀환·건국 준비 가운데 가장 약한 축을 먼저 보완하십시오.', action: '해방 준비도 확인', tab: 'command', target: '[data-tour="korea-command-center"]' },
  ] : [
    { title: '지휘 본부에서 시작합니다', detail: '긴급 결재와 준비도 경고, 이번 주 목표를 먼저 확인하십시오. 지도는 작전 판단이 필요할 때 엽니다.', action: '지휘 본부 확인', tab: 'command', target: '[data-tour="command-dashboard"]' },
  ];
  return [
    ...opening,
    { title: '취임 첫 세계를 읽습니다', detail: '세계 주보 창간호는 선택한 국가·보직·세계선의 전선, 외교, 경제, 사회, 과학과 정보를 정리합니다.', action: '창간호 확인', tab: 'command', target: '[data-tour="world-weekly"]' },
    { title: `TIER ${role.tier} 권한을 확인합니다`, detail: `${role.scope}. 잠긴 결정은 직접 집행하지 않고 상신·설득·위임 요청으로 처리합니다.`, action: '권한 범위 보기', tab: 'organization', target: '[data-tour="organization-tab"]' },
    ...getRoleSteps(role),
    { title: nationId === 'korea' ? '한반도와 충칭을 구분해 봅니다' : '전황 지도는 판단이 필요할 때 엽니다', detail: nationId === 'korea' ? '한반도 점령 상태, 만주 연락선, 중국 내 거점과 국내정진 경로는 서로 다른 좌표와 지휘선을 가집니다.' : '위험 전선과 인접 관계를 확인하고 지휘 목표를 정할 때 지역 지도를 사용하십시오.', action: '전황 지도 이해', tab: 'map', target: '[data-tour="map-tab"]' },
    { title: '결정이 역사를 갈라놓습니다', detail: '미래를 프롬프트로 작성하지 않습니다. 군사·정치·정보·경제 결정이 누적되어 세계선과 인물의 선택을 바꿉니다.', action: '역사 흐름 확인', tab: 'command', target: '[data-tour="history-flow"]' },
    { title: '결정을 마치고 한 주를 진행합니다', detail: '결산에서 무엇이 왜 바뀌었는지 확인하면 첫 지휘 주기가 완성됩니다.', action: '튜토리얼 완료', tab: 'command', target: '[data-tour="next-week"]' },
  ];
}

export function TutorialOverlay({ nationId, role, onNavigate, onComplete }: TutorialOverlayProps) {
  const [index, setIndex] = useState(0);
  const steps = useMemo(() => buildTutorialSteps(nationId, role), [nationId, role.branch, role.scope, role.tier]);
  const step = steps[index] ?? steps[0];
  const progress = `${index + 1}/${steps.length}`;

  useEffect(() => {
    onNavigate(step.tab);
    const timer = window.setTimeout(() => {
      const target = document.querySelector(step.target);
      target?.classList.add('tutorial-target');
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 120);
    return () => {
      window.clearTimeout(timer);
      document.querySelector(step.target)?.classList.remove('tutorial-target');
    };
  }, [onNavigate, step]);

  const next = () => {
    if (index === steps.length - 1) onComplete(true);
    else setIndex((current) => current + 1);
  };

  return (
    <aside className="tutorial-overlay" role="dialog" aria-modal="false" aria-labelledby="tutorial-title">
      <header><span><CircleHelp size={16} /> FIRST COMMAND · {branchLabels[role.branch]} TIER {role.tier}</span><button onClick={() => onComplete(false)} aria-label="튜토리얼 건너뛰기"><X size={16} /></button></header>
      <div className="tutorial-progress"><i style={{ width: `${(index + 1) / steps.length * 100}%` }} /><span>{progress}</span></div>
      <main><em>STEP {index + 1} · {role.title}</em><h2 id="tutorial-title">{step.title}</h2><p>{step.detail}</p></main>
      <footer><button disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}><ArrowLeft size={14} /> 이전</button><button className="tutorial-next" onClick={next}>{index === steps.length - 1 ? <CheckCircle2 size={14} /> : null}{step.action}{index < steps.length - 1 ? <ArrowRight size={14} /> : null}</button></footer>
      <small>언제든 설정 또는 <kbd>?</kbd> 야전 교범에서 다시 시작할 수 있습니다.</small>
    </aside>
  );
}
