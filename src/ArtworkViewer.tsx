import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ArtworkViewer.css';

interface ArtworkViewerProps {
  src: string;
  label: string;
  width: number;
  height: number;
  disclosure: string;
  note?: string;
}

/** Read-only image inspection. Native modal behavior keeps the game behind it inert. */
export function ArtworkViewer({ src, label, width, height, disclosure, note }: ArtworkViewerProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [imageMounted, setImageMounted] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  function openViewer() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setImageFailed(false);
    setImageMounted(true);
    dialog.showModal();
  }

  function restoreTrigger() {
    setImageMounted(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  const dialog = <dialog ref={dialogRef} id={id} className="artwork-viewer" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onClose={restoreTrigger} onKeyDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
    <header className="artwork-viewer__header">
      <div><span>삽화 확대 · 읽기 전용</span><h2 id={`${id}-title`}>{label}</h2></div>
      <button type="button" className="artwork-viewer__close" autoFocus onClick={() => dialogRef.current?.close()} aria-label="삽화 확대 닫기">닫기 <span aria-hidden="true">×</span></button>
    </header>
    <div className="artwork-viewer__canvas">
      {imageMounted && !imageFailed ? <img src={src} alt={label} width={width} height={height} decoding="async" onError={() => setImageFailed(true)} /> : null}
      {imageFailed ? <p role="status">그림을 불러오지 못했습니다. 닫은 뒤 다시 열어 주세요.</p> : null}
    </div>
    <footer className="artwork-viewer__footer" id={`${id}-description`}>
      <strong>{disclosure}</strong>
      {note ? <span>{note}</span> : null}
      <span>그림 열람은 게임 시간·명령·성과·저장 기록을 변경하지 않습니다. Esc 키로 닫을 수 있습니다.</span>
    </footer>
  </dialog>;

  return <>
    <button ref={triggerRef} type="button" className="artwork-viewer-trigger" aria-label={`${label} · 삽화 확대`} aria-haspopup="dialog" aria-controls={id} onClick={(event) => { event.stopPropagation(); openViewer(); }}>
      <img src={src} alt="" width={width} height={height} loading="lazy" decoding="async" />
      <span className="artwork-viewer-trigger__label" aria-hidden="true">확대 보기 <span>↗</span></span>
    </button>
    {typeof document === 'undefined' ? dialog : createPortal(dialog, document.body)}
  </>;
}
