import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { historicalMapSources } from './historicalMaps';
import type { TheaterId } from './types';
import './HistoricalMapArchive.css';

/** Reference only: no territory hit targets, command callbacks, or game overlay. */
export function HistoricalMapArchive({ theater, campaignYear, onClose }: {
  theater: TheaterId; campaignYear: number; onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(1);
  const source = historicalMapSources[theater];
  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      // The parent removes inert in the same commit; restore focus afterwards.
      requestAnimationFrame(() => {
        const target = previous && previous !== document.body && previous.isConnected && !previous.closest('[inert]')
          ? previous : document.querySelector<HTMLElement>('[aria-label="역사 지도 사료 열람"]');
        if (target && !target.closest('[inert]')) target.focus();
      });
    };
  }, []);

  return <dialog ref={dialogRef} className="historical-map-archive" aria-modal="true" aria-labelledby="archive-map-title" aria-describedby="archive-map-disclosure"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onKeyDown={(event) => event.stopPropagation()}>
    <header><div><span>역사 사료 열람 · 읽기 전용</span><h2 id="archive-map-title">{source.title}</h2></div><button type="button" onClick={onClose} aria-label="사료 닫고 작전 지도로 돌아가기" autoFocus><X size={20} />작전 지도로</button></header>
    <p id="archive-map-disclosure"><strong>사료 제작 {source.dateLabel} / 캠페인 {campaignYear}년</strong> — 이 원본의 국경·지명·전황은 현재 게임 상태가 아닙니다. 명령은 실제 지리 작전 지도에서 내리세요.</p>
    <nav aria-label="사료 확대 도구"><button type="button" aria-label="사료 축소" onClick={() => setZoom((value) => Math.max(1, value - .5))} disabled={zoom === 1}><ZoomOut size={17} /></button><output>{Math.round(zoom * 100)}%</output><button type="button" aria-label="사료 확대" onClick={() => setZoom((value) => Math.min(4, value + .5))} disabled={zoom === 4}><ZoomIn size={17} /></button><button type="button" onClick={() => setZoom(1)}><Maximize2 size={16} />전체 보기</button><a href={source.sourceUrl} target="_blank" rel="noreferrer">소장처 원문<ExternalLink size={15} /></a></nav>
    <div className="historical-map-archive-scroll" tabIndex={0} aria-label="사료 이미지 · 확대한 뒤 스크롤로 이동"><img src={source.image} alt={`${source.title} — ${source.creator}, ${source.dateLabel}`} style={{ width: `${zoom * 100}%`, maxHeight: zoom === 1 ? '100%' : undefined }} /></div>
    <footer><span>{source.archive} · {source.catalogId}</span><span>{source.pixelDimensions} · {source.rightsLabel} · 원본 화질 보존</span></footer>
  </dialog>;
}
