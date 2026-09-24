import { useEffect, useRef } from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface ConfirmResetModalProps {
  nationName: string;
  week: number;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmResetModal({ nationName, week, onConfirm, onClose }: ConfirmResetModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  return (
    <div className="ux-backdrop reset-confirm-backdrop" onClick={onClose}>
      <section className="reset-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="reset-confirm-title" aria-describedby="reset-confirm-description" onClick={(event) => event.stopPropagation()}>
        <header>
          <div><AlertTriangle size={24} /></div>
          <span>DANGEROUS ACTION</span>
          <h2 id="reset-confirm-title">현재 캠페인을 끝내시겠습니까?</h2>
          <button onClick={onClose} aria-label="새 캠페인 확인 닫기"><X size={17} /></button>
        </header>
        <p id="reset-confirm-description"><strong>{nationName} · 제 {week + 1}주</strong>의 자동 저장, 전투 보고서, 지휘관 성장과 모든 대체역사 진행 상황이 이 브라우저에서 삭제됩니다.</p>
        <footer>
          <button ref={cancelButtonRef} onClick={onClose}>현재 캠페인 계속</button>
          <button className="danger" onClick={onConfirm}><RotateCcw size={14} /> 저장 삭제 후 새 캠페인</button>
        </footer>
      </section>
    </div>
  );
}
