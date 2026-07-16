import { useEffect, useRef, useState } from 'react';
import { Check, Clock3, Download, FileUp, RotateCcw, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import type { ManualSaveSlot } from './save';

interface SaveCenterProps {
  saves: ManualSaveSlot[];
  autoSavedAt: number | null;
  nationName: string;
  roleTitle: string;
  week: number;
  theaterName: string;
  victoryScore: number;
  onSave: (slot: number) => void;
  onLoad: (slot: number) => void;
  onDelete: (slot: number) => void;
  onExport: (slot: number | null) => void;
  onImport: (file: File) => void;
  onNewCampaign: () => void;
  onClose: () => void;
}

type PendingAction = { type: 'overwrite' | 'delete'; slot: number } | null;

function formatSavedAt(value: string | number) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function SaveCenter({
  saves,
  autoSavedAt,
  nationName,
  roleTitle,
  week,
  theaterName,
  victoryScore,
  onSave,
  onLoad,
  onDelete,
  onExport,
  onImport,
  onNewCampaign,
  onClose,
}: SaveCenterProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="ux-backdrop save-center-backdrop" onClick={onClose}>
      <section className="save-center" role="dialog" aria-modal="true" aria-labelledby="save-center-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <div className="save-center-mark"><Save size={22} /></div>
          <div><span>CAMPAIGN ARCHIVE</span><h2 id="save-center-title">저장 및 캠페인 관리</h2><small>자동 저장과 별도로 세 개의 안전한 체크포인트를 보관할 수 있습니다.</small></div>
          <div className="autosave-status"><ShieldCheck size={15} /><span>자동 저장<strong>{autoSavedAt ? formatSavedAt(autoSavedAt) : '대기 중'}</strong></span></div>
          <button ref={closeButtonRef} onClick={onClose} aria-label="저장 센터 닫기"><X size={18} /></button>
        </header>

        <div className="save-current-summary">
          <div><span>현재 캠페인</span><strong>{nationName} · {roleTitle}</strong><small>제 {week + 1}주 · {theaterName}</small></div>
          <div><span>전황 점수</span><strong>{victoryScore}</strong></div>
          <button onClick={() => onExport(null)}><Download size={14} /> 현재 저장 내보내기</button>
        </div>

        <div className="save-slot-grid">
          {[1, 2, 3].map((slotNumber) => {
            const saveSlot = saves.find((slot) => slot.slot === slotNumber);
            const isPending = pendingAction?.slot === slotNumber;
            return (
              <article key={slotNumber} className={saveSlot ? 'occupied' : 'empty'}>
                <header><span>SLOT {String(slotNumber).padStart(2, '0')}</span>{saveSlot ? <em><Clock3 size={12} /> {formatSavedAt(saveSlot.savedAt)}</em> : <em>비어 있음</em>}</header>
                {saveSlot ? (
                  <>
                    <div className="save-slot-copy"><strong>{saveSlot.nationName}</strong><span>{saveSlot.roleTitle}</span><small>제 {saveSlot.week + 1}주 · {saveSlot.theaterName}</small></div>
                    <dl><div><dt>전황</dt><dd>{saveSlot.victoryScore}</dd></div><div><dt>저장 버전</dt><dd>v{saveSlot.payload.version}</dd></div></dl>
                    {isPending ? (
                      <div className={'save-slot-confirm ' + pendingAction.type}>
                        <strong>{pendingAction.type === 'delete' ? '이 체크포인트를 삭제합니까?' : '현재 상태로 덮어씁니까?'}</strong>
                        <span>{pendingAction.type === 'delete' ? '삭제 후에는 복구할 수 없습니다.' : '기존 체크포인트가 현재 캠페인으로 교체됩니다.'}</span>
                        <div><button onClick={() => setPendingAction(null)}>취소</button><button onClick={() => { pendingAction.type === 'delete' ? onDelete(slotNumber) : onSave(slotNumber); setPendingAction(null); }}>{pendingAction.type === 'delete' ? '삭제 확인' : '덮어쓰기 확인'}</button></div>
                      </div>
                    ) : (
                      <div className="save-slot-actions">
                        <button className="primary" onClick={() => onLoad(slotNumber)}><Check size={13} /> 불러오기</button>
                        <button onClick={() => setPendingAction({ type: 'overwrite', slot: slotNumber })}><Save size={13} /> 덮어쓰기</button>
                        <button aria-label={`슬롯 ${slotNumber} 내보내기`} title="체크포인트 내보내기" onClick={() => onExport(slotNumber)}><Download size={13} /></button>
                        <button aria-label={`슬롯 ${slotNumber} 삭제`} title="체크포인트 삭제" onClick={() => setPendingAction({ type: 'delete', slot: slotNumber })}><Trash2 size={13} /></button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-save-slot"><Save size={27} /><strong>비어 있는 체크포인트</strong><span>현재 캠페인의 모든 상태를 이 슬롯에 보관합니다.</span><button onClick={() => onSave(slotNumber)}>현재 상태 저장</button></div>
                )}
              </article>
            );
          })}
        </div>

        <footer>
          <div>
            <input ref={importInputRef} type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ''; }} />
            <button onClick={() => importInputRef.current?.click()}><FileUp size={14} /> 저장 파일 불러오기</button>
            <span>빈 슬롯에 안전하게 가져옵니다.</span>
          </div>
          <button className="new-campaign" onClick={onNewCampaign}><RotateCcw size={14} /> 새 캠페인 시작</button>
        </footer>
      </section>
    </div>
  );
}
