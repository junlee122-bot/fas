import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, X } from 'lucide-react';
import type { GameTab } from './types';

interface TutorialOverlayProps {
  onNavigate: (tab: GameTab) => void;
  onComplete: (openWorldWeekly: boolean) => void;
}

const tutorialSteps: Array<{ title: string; detail: string; action: string; tab: GameTab; target: string }> = [
  { title: '지휘 본부에서 시작합니다', detail: '매주 가장 먼저 업무함의 긴급 결재와 준비도 경고를 확인하십시오. 지도는 필요할 때만 엽니다.', action: '지휘 본부 확인', tab: 'command', target: '[data-tour="command-dashboard"]' },
  { title: '취임 전 일주일을 먼저 읽습니다', detail: '세계 주보 창간호는 선택한 국가·보직·세계선에 맞춰 1942년 10월 18일부터 25일까지의 전선·외교·경제·사회·과학·정보를 정리합니다.', action: '창간호 위치 확인', tab: 'command', target: '[data-tour="world-weekly"]' },
  { title: '다음 행동은 숫자로 표시됩니다', detail: '왼쪽 메뉴의 배지는 미처리 업무 수입니다. 붉은 배지가 있는 부서부터 열면 길을 잃지 않습니다.', action: '조직 운영 보기', tab: 'organization', target: '[data-tour="organization-tab"]' },
  { title: '참모와 인재가 전력을 만듭니다', detail: '실존 인물을 조사·접촉·포섭하고, 참모에게 업무를 위임하십시오. 능력뿐 아니라 충성도와 경쟁 제안도 중요합니다.', action: '정보 부서 보기', tab: 'intelligence', target: '[data-tour="intelligence-tab"]' },
  { title: '전황 지도는 핵심부터 읽습니다', detail: '기본 핵심 표식으로 위험 전선을 찾고, 지역·표식에서 필요한 정보만 펼치십시오. 집중 모드는 메뉴를 숨기고 지도 전체를 사용합니다.', action: '전황 지도 이해', tab: 'map', target: '[data-tour="map-tab"]' },
  { title: '역사는 행동에서 갈라집니다', detail: '별도의 미래를 작성하지 않습니다. 국가 원칙, 작전, 외교, 연구와 위기 대응이 여섯 역사 압력으로 쌓이는 모습을 확인하십시오.', action: '역사 흐름 확인', tab: 'command', target: '[data-tour="history-flow"]' },
  { title: '결정이 끝나면 한 주를 진행합니다', detail: '생산·연구·보급·작전과 국가 결정이 함께 계산되고, 그 결과와 장기 역사 변화가 업무함에 돌아옵니다.', action: '튜토리얼 완료', tab: 'command', target: '[data-tour="next-week"]' },
];

export function TutorialOverlay({ onNavigate, onComplete }: TutorialOverlayProps) {
  const [index, setIndex] = useState(0);
  const step = tutorialSteps[index];
  const progress = useMemo(() => `${index + 1}/${tutorialSteps.length}`, [index]);

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
    if (index === tutorialSteps.length - 1) onComplete(true);
    else setIndex((current) => current + 1);
  };

  return (
    <aside className="tutorial-overlay" role="dialog" aria-modal="false" aria-labelledby="tutorial-title">
      <header><span><CircleHelp size={16} /> FIRST COMMAND</span><button onClick={() => onComplete(false)} aria-label="튜토리얼 건너뛰기"><X size={16} /></button></header>
      <div className="tutorial-progress"><i style={{ width: `${(index + 1) / tutorialSteps.length * 100}%` }} /><span>{progress}</span></div>
      <main><em>STEP {index + 1}</em><h2 id="tutorial-title">{step.title}</h2><p>{step.detail}</p></main>
      <footer><button disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}><ArrowLeft size={14} /> 이전</button><button className="tutorial-next" onClick={next}>{index === tutorialSteps.length - 1 ? <CheckCircle2 size={14} /> : null}{step.action}{index < tutorialSteps.length - 1 ? <ArrowRight size={14} /> : null}</button></footer>
      <small>언제든 설정 또는 <kbd>?</kbd> 야전 교범에서 다시 시작할 수 있습니다.</small>
    </aside>
  );
}
