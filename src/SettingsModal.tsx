import { useEffect, useRef } from 'react';
import { Check, CircleHelp, Contrast, MapPinned, RotateCcw, ScanText, Settings, Volume2, Waves, X } from 'lucide-react';
import type { UXPreferences } from './ux';

interface SettingsModalProps {
  preferences: UXPreferences;
  onToggle: (key: keyof UXPreferences) => void;
  onReset: () => void;
  onRestartTutorial: () => void;
  onClose: () => void;
}

const preferenceOptions: Array<{
  key: keyof UXPreferences;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  { key: 'soundOn', title: '게임 음향', description: '효과음과 전쟁 전문 알림음을 사용합니다.', icon: <Volume2 size={18} /> },
  { key: 'readableUI', title: '가독성 우선 UI', description: '작은 정보 글자와 조작 영역을 확대해 장시간 플레이 피로를 줄입니다.', icon: <ScanText size={18} /> },
  { key: 'highContrast', title: '고대비 정보 표시', description: '희미한 본문·경계선·상태 색상의 명암을 높입니다.', icon: <Contrast size={18} /> },
  { key: 'largeMapLabels', title: '큰 지도 라벨', description: '지역명과 소유국 표기를 더 크고 선명하게 표시합니다.', icon: <MapPinned size={18} /> },
  { key: 'reducedMotion', title: '화면 효과 감소', description: '모달·토스트·버튼의 이동 애니메이션을 최소화합니다.', icon: <Waves size={18} /> },
];

export function SettingsModal({ preferences, onToggle, onReset, onRestartTutorial, onClose }: SettingsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="ux-backdrop settings-backdrop" onClick={onClose}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <div className="settings-mark"><Settings size={21} /></div>
          <div><span>INTERFACE & ACCESSIBILITY</span><h2 id="settings-title">사용자 환경 설정</h2><small>캠페인과 별도로 이 브라우저에 자동 저장됩니다.</small></div>
          <button ref={closeButtonRef} onClick={onClose} aria-label="설정 닫기"><X size={17} /></button>
        </header>

        <div className="settings-content">
          <div className="settings-options">
            <h3>표시와 피드백</h3>
            {preferenceOptions.map((option) => {
              const selected = preferences[option.key];
              return (
                <button key={option.key} aria-pressed={selected} className={selected ? 'selected' : ''} onClick={() => onToggle(option.key)}>
                  <i>{option.icon}</i>
                  <span><strong>{option.title}</strong><small>{option.description}</small></span>
                  <em>{selected ? <Check size={14} /> : null}<b>{selected ? '사용' : '사용 안 함'}</b></em>
                </button>
              );
            })}
          </div>

          <aside className="shortcut-guide">
            <h3>키보드 단축키</h3>
            <div><kbd>H</kbd><span><strong>지휘 현황판</strong><small>핵심 자원·위험·최우선 행동 요약</small></span></div>
            <div><kbd>G</kbd><span><strong>행동 센터</strong><small>놓친 결정과 다음 행동 확인</small></span></div>
            <div><kbd>Ctrl K</kbd><span><strong>빠른 이동</strong><small>화면·전구·기능을 검색해 즉시 이동</small></span></div>
            <div><kbd>Ctrl S</kbd><span><strong>저장 센터</strong><small>체크포인트·내보내기·불러오기 관리</small></span></div>
            <div><kbd>?</kbd><span><strong>야전 교범</strong><small>첫 주 체크리스트와 시스템 설명 검색</small></span></div>
            <div><kbd>1–4</kbd><span><strong>지도 레이어</strong><small>전황 지도에서 정치·보급·기상·정보 전환</small></span></div>
            <div><kbd>+ − 0</kbd><span><strong>지도 카메라</strong><small>확대·축소·전체 전구 위치로 초기화</small></span></div>
            <div><kbd>F I L</kbd><span><strong>지도 집중 도구</strong><small>집중 모드·전구 정보·표식 밀도 전환</small></span></div>
            <div><kbd>N</kbd><span><strong>다음 주</strong><small>현재 명령을 해결하고 한 주 진행</small></span></div>
            <div><kbd>Space</kbd><span><strong>시간 제어</strong><small>일시 정지와 1배속 전환</small></span></div>
            <div><kbd>Esc</kbd><span><strong>닫기·취소</strong><small>열린 안내와 공세 목표 지정 취소</small></span></div>
            <p>입력창·선택 메뉴·버튼에 초점이 있을 때는 단축키가 실행되지 않습니다.</p>
          </aside>
        </div>

        <footer>
          <button onClick={onRestartTutorial}><CircleHelp size={14} /> 첫 지휘 튜토리얼 다시 보기</button>
          <button onClick={onReset}><RotateCcw size={14} /> 기본 설정 복원</button>
          <button onClick={onClose}>설정 완료</button>
        </footer>
      </section>
    </div>
  );
}
