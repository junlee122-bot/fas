import { ArrowRight, BookOpen, ClipboardCheck, LockKeyhole, Newspaper } from 'lucide-react';
import type { PlayGuide, PlayGuideGroup } from './playGuide';
import type { GameTab } from './types';
import './PlayGuidePanel.css';

interface Props {
  guide: PlayGuide;
  onNavigate: (tab: GameTab) => void;
  onOpenWorldWeekly: () => void;
  onOpenBriefing: () => void;
}

const groups: ReadonlyArray<{ id: PlayGuideGroup; title: string }> = [
  { id: 'people', title: '사람과 조직' },
  { id: 'operations', title: '현장과 작전' },
  { id: 'state', title: '국가와 사회' },
  { id: 'development', title: '생산과 기술' },
];

/** Discovery only: there are deliberately no simulation/approval callbacks. */
export function PlayGuidePanel({ guide, onNavigate, onOpenWorldWeekly, onOpenBriefing }: Props) {
  const firstLocked = guide.firstAction.tab !== 'command'
    && !guide.capabilities.some((item) => item.id === guide.firstAction.tab && item.mode !== 'locked');
  return <section className="play-guide" aria-label="내가 할 수 있는 일">
    <header><span>처음에는 한 가지 업무만 골라도 됩니다</span><h3>내 역할에서 시작하는 한 주</h3><p>{guide.roleSummary}</p></header>
    <ol className="play-guide-loop" aria-label="첫 주 플레이 순서">
      <li><span className="play-guide-step">01 · 이해</span><h4>지금 세계는 어떤 상황인가요?</h4><p>세계 주보에서 내 국가·지역에 생긴 일과 현재의 위험을 읽습니다.</p><button type="button" onClick={onOpenWorldWeekly}><Newspaper size={17} aria-hidden="true" />세계 주보 읽기</button></li>
      <li><span className="play-guide-step">02 · 선택</span><h4>{guide.firstAction.title}</h4><p>{guide.firstAction.detail}</p><button type="button" disabled={firstLocked} onClick={() => { if (!firstLocked) onNavigate(guide.firstAction.tab); }}>{guide.firstAction.actionLabel}<ArrowRight size={17} aria-hidden="true" /></button></li>
      <li><span className="play-guide-step">03 · 확인</span><h4>선택 뒤 무엇이 달라졌나요?</h4><p>{guide.firstAction.result}</p><button type="button" onClick={onOpenBriefing}><ClipboardCheck size={17} aria-hidden="true" />주간 브리핑 열기</button></li>
    </ol>
    <p className="play-guide-safety">이 안내의 버튼은 화면을 열기만 합니다. 실제 명령·계약·지출은 이동한 화면에서 조건을 확인한 뒤 결정합니다. 주간 브리핑을 여는 것만으로 시간이 흐르지는 않습니다.</p>
    <section className="play-guide-directory" aria-labelledby="play-guide-directory-title"><h3 id="play-guide-directory-title">무엇을 해볼 수 있나요?</h3><p>분야를 펼치면 하는 일, 내 권한, 결과 확인 방법을 볼 수 있습니다. 모든 분야를 한꺼번에 관리할 필요는 없습니다.</p>
      <div className="play-guide-access-key"><span><b>직접 담당</b> 범위 안에서 검토·결정</span><span><b>상신</b> 상급자의 승인 요청</span><span><b>보고</b> 현황 열람</span><span><b>잠김</b> 권한 획득 필요</span></div>
      {groups.map((group) => <details className="play-guide-group" key={group.id}><summary><BookOpen size={18} aria-hidden="true" /><strong>{group.title}</strong><span>{guide.capabilities.filter((item) => item.group === group.id).map((item) => item.title.replace(/하기$|살펴보기$|검토하기$/, '')).join(' · ')}</span></summary>
        <div className="play-guide-capabilities">{guide.capabilities.filter((item) => item.group === group.id).map((item) => <article key={item.id} className={`play-guide-capability ${item.mode}`}><header><h4>{item.title}</h4><span>{item.accessLabel}</span></header><p>{item.description}</p><dl><div><dt>내 권한</dt><dd>{item.reason}</dd></div><div><dt>결과 확인</dt><dd>{item.result}</dd></div></dl><button type="button" disabled={item.mode === 'locked'} onClick={() => { if (item.mode !== 'locked') onNavigate(item.id); }}>{item.mode === 'locked' ? <LockKeyhole size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}{item.actionLabel}</button></article>)}</div>
      </details>)}
    </section>
  </section>;
}

export function FirstWeekOrientation({ onOpenGuide, civilian = false }: { onOpenGuide: () => void; civilian?: boolean }) {
  return <section className="first-week-orientation" aria-label="처음 시작하는 플레이 안내"><BookOpen size={22} aria-hidden="true" /><div><strong>{civilian ? '국가가 아닌, 한 사람의 삶부터 시작합니다.' : '처음이라면, 담당 업무 하나부터 시작하세요.'}</strong><p>세계 읽기 → {civilian ? '이번 주 개인 활동 고르기' : '내 권한 안에서 한 가지 검토하기'} → 주간 결과 확인</p></div><button type="button" onClick={onOpenGuide}>내가 할 수 있는 일<ArrowRight size={16} aria-hidden="true" /></button></section>;
}
