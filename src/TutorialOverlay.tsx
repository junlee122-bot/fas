import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, X } from 'lucide-react';
import type { GameTab, NationId } from './types';

interface TutorialOverlayProps {
  nationId: NationId;
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

const tutorialSteps: TutorialStep[] = [
  { title: '지휘 본부에서 시작합니다', detail: '매주 가장 먼저 임무실의 긴급 결재와 준비도 경고를 확인하십시오. 지도는 필요할 때만 엽니다.', action: '지휘 본부 확인', tab: 'command', target: '[data-tour="command-dashboard"]' },
  { title: '취임 첫 세계를 읽습니다', detail: '세계 주보 창간호는 선택한 국가·보직·세계선에 맞춰 전선, 외교, 경제, 사회, 과학과 정보를 정리합니다.', action: '창간호 위치 확인', tab: 'command', target: '[data-tour="world-weekly"]' },
  { title: '다음 행동은 숫자로 표시됩니다', detail: '왼쪽 메뉴의 배지는 미처리 임무 수입니다. 붉은 배지가 있는 부서부터 열면 길을 잃지 않습니다.', action: '조직 운영 보기', tab: 'organization', target: '[data-tour="organization-tab"]' },
  { title: '참모와 인재가 전력을 만듭니다', detail: '소속 인물을 조사·접촉·포섭하고, 참모에게 임무를 위임하십시오. 능력뿐 아니라 충성심과 경쟁 구도도 중요합니다.', action: '정보 부서 보기', tab: 'intelligence', target: '[data-tour="intelligence-tab"]' },
  { title: '전황 지도는 통솔부 도구입니다', detail: '위험 전선을 찾고 지휘 목표를 정할 때 지도를 여십시오. 집중 모드와 지역 지도를 함께 사용할 수 있습니다.', action: '전황 지도 이해', tab: 'map', target: '[data-tour="map-tab"]' },
  { title: '역사는 행동에서 갈라집니다', detail: '별도의 미래를 작성하지 않습니다. 군사, 정치, 외교, 연구와 인사 결정이 누적되어 세계선이 자연스럽게 달라집니다.', action: '역사 흐름 확인', tab: 'command', target: '[data-tour="history-flow"]' },
  { title: '결정이 끝나면 한 주를 진행합니다', detail: '생산·연구·보급·작전과 국가 결정이 함께 계산되고, 그 결과와 장기 역사 변화가 임무실에 돌아옵니다.', action: '튜토리얼 완료', tab: 'command', target: '[data-tour="next-week"]' },
];

const koreaTutorialSteps: TutorialStep[] = [
  { title: '충칭의 독립운동 지휘부에서 시작합니다', detail: '현재 행정·외교 본부는 충칭의 대한민국 임시정부입니다. 조선 본토는 아직 일제 점령지이므로, 본부와 영토를 같은 것으로 보지 않습니다.', action: '충칭 지휘부 확인', tab: 'command', target: '[data-tour="command-hero"]' },
  { title: '해방 준비는 네 축으로 나뉩니다', detail: '연합국 승인, 국내 공작망, 한국광복군, 귀환·건국 준비가 서로 다른 속도로 전진합니다. 약한 축을 먼저 보완하십시오.', action: '해방 준비도 확인', tab: 'command', target: '[data-tour="korea-command-center"]' },
  { title: '한반도는 본국이자 점령 작전구입니다', detail: '지도에서 조선 본토의 점령 상태, 만주 연락선, 중국 내 거점과 국내정진 경로를 구분해 읽으십시오.', action: '한반도 작전도 보기', tab: 'map', target: '[data-tour="map-tab"]' },
  { title: '임정·광복군·공작망을 나눠 배치합니다', detail: '같은 독립운동 진영이라도 정치, 군사, 정보 조직의 지휘선은 다릅니다. 현재 보직의 권한 범위 안에서 인재를 배치하십시오.', action: '독립운동 조직 보기', tab: 'organization', target: '[data-tour="organization-tab"]' },
  { title: '승인 외교가 또 하나의 전선입니다', detail: '중국과 연합국의 지원·승인·전후 발언권은 자동으로 주어지지 않습니다. 정치력과 외교 인맥을 투자해 주권의 근거를 만드십시오.', action: '독립 승인 외교 보기', tab: 'diplomacy', target: '[data-tour="diplomacy-tab"]' },
  { title: '국내 연락망이 작전의 출발점입니다', detail: '조선·만주의 연락선, 침투 거점과 방첩 상태를 먼저 확인하십시오. 정보망이 약하면 봉기와 국내정진 작전의 위험이 급증합니다.', action: '국내 공작망 보기', tab: 'intelligence', target: '[data-tour="intelligence-tab"]' },
  { title: '해방 이후까지 지금 결정합니다', detail: '독립운동의 결속, 광복군의 통합 방식, 헌정 구상과 행정 인력 준비가 해방 뒤의 정부 형태와 분단 위험을 바꿉니다.', action: '해방·건국 설계 보기', tab: 'governance', target: '[data-tour="governance-tab"]' },
];

export function TutorialOverlay({ nationId, onNavigate, onComplete }: TutorialOverlayProps) {
  const [index, setIndex] = useState(0);
  const steps = nationId === 'korea' ? koreaTutorialSteps : tutorialSteps;
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
      <header><span><CircleHelp size={16} /> FIRST COMMAND</span><button onClick={() => onComplete(false)} aria-label="튜토리얼 건너뛰기"><X size={16} /></button></header>
      <div className="tutorial-progress"><i style={{ width: `${(index + 1) / steps.length * 100}%` }} /><span>{progress}</span></div>
      <main><em>STEP {index + 1}</em><h2 id="tutorial-title">{step.title}</h2><p>{step.detail}</p></main>
      <footer><button disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}><ArrowLeft size={14} /> 이전</button><button className="tutorial-next" onClick={next}>{index === steps.length - 1 ? <CheckCircle2 size={14} /> : null}{step.action}{index < steps.length - 1 ? <ArrowRight size={14} /> : null}</button></footer>
      <small>언제든 설정 또는 <kbd>?</kbd> 야전 교범에서 다시 시작할 수 있습니다.</small>
    </aside>
  );
}
