import { resolveHistoricalPortrait } from './historicalPortraits';
import './PersonPortrait.css';

export interface PersonPortraitProps {
  personId?: string;
  name: string;
  player?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PersonPortrait({ personId, name, player = false, size = 'md', className = '' }: PersonPortraitProps) {
  const isPlayer = player || personId === 'player';
  const portrait = resolveHistoricalPortrait({ personId, name, player: isPlayer });
  const kind = portrait ? 'illustrated' : isPlayer ? 'player' : 'monogram';
  const label = portrait ? `${name} · AI 재구성 초상 · 실제 사진 아님 · ${portrait.referenceEra}` : isPlayer ? `${name} · 플레이어 · 실존 인물 초상 미사용` : `${name} · 이름 표식 · 제작된 초상 없음`;
  const initials = name.trim().split(/\s+/).map((part) => Array.from(part)[0]).slice(0, 2).join('') || '—';
  return <span className={`person-portrait person-portrait--${size} ${className}`.trim()} data-person-portrait={portrait?.id ?? 'fallback'} data-portrait-kind={kind} title={label} role="img" aria-label={label}>
    {portrait ? <img src={portrait.src} alt={`${name} · AI 재구성 초상 · 실제 사진 아님`} width={2048} height={2048} loading="lazy" decoding="async" aria-hidden="true" /> : <span className="person-portrait__monogram" aria-hidden="true">{isPlayer ? '나' : initials}</span>}
  </span>;
}
