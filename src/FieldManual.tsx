import { useEffect, useMemo, useRef, useState } from 'react';
import { BookMarked, Check, ChevronRight, CircleHelp, Search, X } from 'lucide-react';
import type { GameTab } from './types';
import type { OnboardingStep } from './ux';

type ManualCategory = 'all' | 'start' | 'management' | 'combat' | 'politics';

interface ManualArticle {
  id: string;
  category: Exclude<ManualCategory, 'all'>;
  title: string;
  summary: string;
  body: string;
  tip: string;
  keywords: string[];
}

interface FieldManualProps {
  steps: OnboardingStep[];
  onNavigate: (tab: GameTab) => void;
  onClose: () => void;
}

const categoryOptions: Array<{ id: ManualCategory; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'start', label: '시작' },
  { id: 'management', label: '운영' },
  { id: 'combat', label: '전투' },
  { id: 'politics', label: '정치·외교' },
];

const manualArticles: ManualArticle[] = [
  { id: 'weekly-loop', category: 'start', title: '한 주는 어떻게 진행됩니까?', summary: '결정하고, 명령하고, 다음 주에 결과를 확인하는 기본 순환입니다.', body: '먼저 행동 센터와 지휘 보좌관에서 빈 슬롯과 대기 결정을 확인합니다. 생산·연구·보급·작전 명령을 조정한 뒤 다음 주를 진행하면 모든 시스템이 함께 계산됩니다.', tip: '다음 주를 누르기 전에 미배정 공장과 연구 슬롯부터 확인하십시오.', keywords: ['턴', '다음 주', '시간', '행동 센터'] },
  { id: 'map-layers', category: 'start', title: '전략 지도와 전구', summary: '유럽·지중해와 아시아·태평양은 하나의 전쟁으로 연결됩니다.', body: '지도 상단에서 전구를 전환하고 정치·보급·기상·정보 레이어를 바꿀 수 있습니다. 지역을 선택하면 보급과 전략 가치, 주둔 부대를 확인합니다.', tip: '공세 전에는 보급 레이어로 목표 지역과 출발 지역을 함께 확인하십시오.', keywords: ['지도', '전구', '아시아', '유럽', '레이어'] },
  { id: 'staff-room', category: 'management', title: '참모진과 인재 영입', summary: 'FM처럼 능력·잠재력·충성도·업무량을 보고 조직을 구성합니다.', body: '후보를 정밀 조사하면 불완전한 능력치 평가가 좁혀집니다. 관심 명단에 올리고 충분한 정보와 예산을 확보한 뒤 협상을 시작하십시오. 기존 참모는 집중 육성과 승급으로 성장합니다.', tip: '낮은 충성도와 높은 업무량은 숫자가 좋아도 장기 운영 위험을 만듭니다.', keywords: ['참모', '스카우트', '영입', '관심 명단', '승급'] },
  { id: 'industry-research', category: 'management', title: '생산과 연구의 기회비용', summary: '사용하지 않은 공장과 연구 슬롯은 다음 주로 이월되지 않습니다.', body: '공장 배정은 즉시 주간 생산량과 생산 효율 성장에 영향을 줍니다. 연구는 동시에 두 과제만 진행되므로 당장 필요한 전선 보너스와 장기 기술을 조합하십시오.', tip: '조달 포커스와 실제 생산 라인을 같은 장비에 맞추면 성장 속도가 빨라집니다.', keywords: ['공장', '생산', '연구', '장비', '조달'] },
  { id: 'supply', category: 'management', title: '보급과 회복', summary: '전투력보다 보급이 먼저 무너지면 강한 사단도 공세를 유지하지 못합니다.', body: '전선 우선·균형·예비대 보급 정책은 회복과 비축 속도를 바꿉니다. 핵심 편제와 조달 포커스를 지정해 중요한 사단에 장비가 먼저 도착하도록 만드십시오.', tip: '재편 중인 사단이 많다면 공격보다 보급 정책과 핵심 편제를 먼저 조정하십시오.', keywords: ['보급', '회복', '재편', '핵심 편제'] },
  { id: 'battle-flow', category: 'combat', title: '작전 계획실과 4단계 전투', summary: '승인 전에 태세별 승산과 손실을 비교하고, 정찰부터 돌파까지 결과를 이어갑니다.', body: '지도에서 공세 목표를 고르면 작전 계획실이 81개 전장 변수 조합으로 목표 확보 확률, 정보 신뢰 범위, 전력·조직력·보급 손실을 예측합니다. 선택한 신중·균형·총력 태세는 해당 명령에 고정되며, 실제 전투에서는 정찰 우세가 접근과 주력 교전의 모멘텀으로 이어집니다.', tip: '확률 하나만 보지 말고 정보 신뢰 범위와 공세 뒤 남을 조직력·보급을 함께 비교하십시오.', keywords: ['전투', '정찰', '공세', '태세', '돌파', '확률', '예측', '계획실'] },
  { id: 'commanders', category: 'combat', title: '지휘관 성장과 피로', summary: '전투 경험은 자동 능력치가 아니라 선택 가능한 지휘 특기로 전환됩니다.', body: '지휘관은 전투 경험으로 복무 레벨과 특기 점수를 얻습니다. 특기는 운용 방향을 영구적으로 정하며, 피로가 높으면 실제 전투 효율이 떨어집니다.', tip: '중요 공세 전에 지휘관 피로와 미사용 특기 점수를 함께 확인하십시오.', keywords: ['지휘관', '장군', '특기', '피로', '휴양'] },
  { id: 'alternate-history', category: 'politics', title: '대체역사는 어떻게 만들어집니까?', summary: '역사 이벤트를 재연하지 않고 조직과 정책의 조합이 결과를 만듭니다.', body: '국가 진로, 네 영역의 국가 원칙, 내각 위기 대응, 외교 관계와 전투 결과가 매주 누적됩니다. 같은 선택도 전선과 조직 상태에 따라 다른 후속 결과를 만들 수 있습니다.', tip: '즉시 수치보다 반복 적용 효과와 지도부 신임의 장기 변화를 확인하십시오.', keywords: ['대체역사', '국가 진로', '원칙', '내각', '외교'] },
];

export function FieldManual({ steps, onNavigate, onClose }: FieldManualProps) {
  const [category, setCategory] = useState<ManualCategory>('all');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const completedCount = steps.filter((step) => step.complete).length;
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    return manualArticles.filter((article) => {
      const categoryMatches = category === 'all' || article.category === category;
      const queryMatches = !normalizedQuery || [article.title, article.summary, article.body, ...article.keywords].join(' ').toLocaleLowerCase('ko-KR').includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
  }, [category, query]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  return (
    <div className="ux-backdrop field-manual-backdrop" onClick={onClose}>
      <section className="field-manual" role="dialog" aria-modal="true" aria-labelledby="field-manual-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <div className="field-manual-mark"><CircleHelp size={22} /></div>
          <div><span>FIELD MANUAL · LIVE CAMPAIGN GUIDE</span><h2 id="field-manual-title">야전 교범</h2><small>현재 캠페인 진행 상황과 게임 시스템 설명을 한곳에서 확인합니다.</small></div>
          <button onClick={onClose} aria-label="야전 교범 닫기"><X size={18} /></button>
        </header>

        <div className="field-manual-body">
          <aside className="first-week-guide">
            <div className="manual-section-heading"><span>FIRST WEEK</span><strong>첫 주 지휘 체크리스트</strong><small>{completedCount}/{steps.length} 완료</small></div>
            <div className="first-week-progress" aria-label={`첫 주 체크리스트 ${completedCount}/${steps.length} 완료`}><i style={{ width: `${completedCount / Math.max(1, steps.length) * 100}%` }} /></div>
            <p>아래 다섯 항목을 마치면 생산·연구·정책·전투의 기본 순환이 완성됩니다.</p>
            <div className="first-week-steps">
              {steps.map((step, index) => (
                <button key={step.id} className={step.complete ? 'complete' : ''} aria-label={`${step.title} · ${step.complete ? '완료' : '미완료'} · ${step.detail}`} onClick={() => onNavigate(step.tab)}>
                  <i>{step.complete ? <Check size={14} /> : index + 1}</i>
                  <span><strong>{step.title}</strong><small>{step.detail}</small></span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </aside>

          <main className="manual-library">
            <label className="manual-search"><Search size={16} /><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="전투, 보급, 영입, 대체역사 검색" aria-label="야전 교범 검색" />{query && <button type="button" onClick={() => setQuery('')} aria-label="검색어 지우기"><X size={14} /></button>}</label>
            <div className="manual-categories" role="group" aria-label="교범 분류">
              {categoryOptions.map((option) => <button key={option.id} className={category === option.id ? 'active' : ''} aria-pressed={category === option.id} onClick={() => setCategory(option.id)}>{option.label}</button>)}
            </div>
            <div className="manual-results" aria-live="polite">
              {results.length > 0 ? results.map((article) => (
                <details key={article.id}>
                  <summary><BookMarked size={16} /><span><strong>{article.title}</strong><small>{article.summary}</small></span><ChevronRight size={15} /></summary>
                  <div><p>{article.body}</p><em>현장 조언 · {article.tip}</em></div>
                </details>
              )) : <div className="manual-empty"><Search size={27} /><strong>일치하는 교범 항목이 없습니다.</strong><span>검색어를 줄이거나 다른 분류를 선택하십시오.</span></div>}
            </div>
          </main>
        </div>

        <footer><span><kbd>?</kbd> 교범 열기</span><span><kbd>Ctrl K</kbd> 빠른 이동</span><span><kbd>Esc</kbd> 닫기</span></footer>
      </section>
    </div>
  );
}
