import type { CSSProperties } from 'react';
import './GameIcon.css';

/** Hand-drawn 28-unit operational symbols; no generated bitmap dependencies. */
export const GAME_ICON_NAMES = [
  'command', 'map', 'organization', 'army', 'industry', 'research', 'diplomacy',
  'intelligence', 'health', 'manpower', 'politics', 'fuel', 'steel', 'treasury',
  'supply', 'alert', 'objective', 'report', 'search', 'save', 'help', 'settings',
  'sound', 'weather', 'time', 'advance', 'air', 'naval', 'newspaper', 'recruitment',
  'constitution', 'justice', 'election', 'crown', 'trade', 'treaty', 'education',
  'resistance', 'reconstruction', 'medal',
] as const;

export type GameIconName = typeof GAME_ICON_NAMES[number];
export type GameIconTone = 'gold' | 'blue' | 'green' | 'red' | 'steel' | 'muted';

interface GameIconProps {
  name: GameIconName;
  size?: number;
  tone?: GameIconTone;
  framed?: boolean;
  active?: boolean;
  label?: string;
  className?: string;
}

function IconGlyph({ name }: { name: GameIconName }) {
  switch (name) {
    case 'command':
      return <><path className="game-icon-solid" d="m14 3 3 6.1 6.7 1-4.9 4.7 1.2 6.7-6-3.2-6 3.2 1.2-6.7-4.9-4.7 6.7-1L14 3Z" /><path d="m4 22 4 3m16-3-4 3" /></>;
    case 'map':
      return <><path d="m3 6 7-3 8 3 7-3v19l-7 3-8-3-7 3V6Zm7-3v19m8-16v19" /><path d="m5.5 16 2-2m5-3 3 3m5-4 2-2" /></>;
    case 'organization':
      return <><rect x="10" y="3" width="8" height="6" rx="1" /><path d="M14 9v6M6 19v-4h16v4" /><rect x="2.5" y="19" width="7" height="6" rx="1" /><rect x="18.5" y="19" width="7" height="6" rx="1" /></>;
    case 'army':
      return <><path d="m14 3 10 4v7c0 5-4 9-10 12C8 23 4 19 4 14V7l10-4Z" /><path d="m9 11 10 9M19 11 9 20m0-9v4m10-4v4" /></>;
    case 'industry':
      return <><path d="M3 25V11h4V4h5v13l6-4v4l7-4v12H3Z" /><path d="M7 8h5m-6 13h1m5 0h1m5 0h1M8 2h3" /></>;
    case 'research':
      return <><path d="M10 3h8m-6 0v8L5 22a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3l-7-11V3M8.5 17h11" /><circle className="game-icon-solid" cx="12" cy="21" r="1.25" /><circle className="game-icon-solid" cx="17" cy="20" r="1.25" /></>;
    case 'diplomacy':
      return <><path d="m3 10 4-5 5 3m13 2-4-5-6 3-5 5 3 3 4-3 5 5M3 10l4 8 6 6 3-3m9-11-3 8-6 6-3-3m-6-3 3-3" /></>;
    case 'intelligence':
      return <><path d="M2 14S6 6 14 6s12 8 12 8-4 8-12 8S2 14 2 14Z" /><circle cx="14" cy="14" r="4" /><circle className="game-icon-solid" cx="14" cy="14" r="1.25" /><path d="M14 2v1m0 22v1" /></>;
    case 'health':
      return <><path d="M14 25C8 22 3 17 3 11a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 6-5 11-11 14Z" /><path d="M14 11v8m-4-4h8" /></>;
    case 'manpower':
      return <><circle cx="11" cy="8" r="4" /><path d="M3 25v-3a8 8 0 0 1 16 0v3H3Zm17-20a4 4 0 0 1 0 8m2 4a7 7 0 0 1 3 6v2" /></>;
    case 'politics':
      return <><path d="m3 9 11-6 11 6H3Zm2 16h18M7 13v8m7-8v8m7-8v8M3 25h22" /><circle className="game-icon-solid" cx="14" cy="7" r="1" /></>;
    case 'fuel':
      return <><path d="M14 2S6 11 6 17a8 8 0 0 0 16 0c0-6-8-15-8-15Z" /><path d="M10 17a4 4 0 0 0 4 4" /></>;
    case 'steel':
      return <><path d="m3 17 6-5h14l2 8-6 5H5l-2-8Zm0 0h14l6-5m-6 5 2 8M5 8l5-5h13v5H5Zm5-5v5" /></>;
    case 'treasury':
      return <><ellipse cx="14" cy="6" rx="10" ry="3" /><path d="M4 6v6c0 4 20 4 20 0V6M4 17v5c0 4 20 4 20 0v-5M4 16c4 4 16 4 20 0" /></>;
    case 'supply':
      return <><path d="m3 8 11-5 11 5v13l-11 5-11-5V8Zm0 0 11 5 11-5M14 13v13M8.5 5.5l11 5V16" /></>;
    case 'alert':
      return <><path d="m14 3 12 22H2L14 3Z" /><path d="M14 10v7" /><circle className="game-icon-solid" cx="14" cy="21" r="1.2" /></>;
    case 'objective':
      return <><circle cx="13" cy="15" r="10" /><circle cx="13" cy="15" r="5" /><path d="m13 15 12-12m-5 0h5v5" /></>;
    case 'report':
      return <><path d="M6 3h11l5 5v17H6V3Zm11 0v5h5M10 13h8m-8 4h8m-8 4h5" /><path d="M3 7v18" /></>;
    case 'search':
      return <><circle cx="11.5" cy="11.5" r="8.5" /><path d="m18 18 7 7" /></>;
    case 'save':
      return <><path d="M4 3h17l4 4v18H4V3Zm4 0v8h11V3M8 25v-9h13v9m-5-19v2" /></>;
    case 'help':
      return <><path d="M14 6C10 3 6 3 3 4v20c4-1 8 0 11 2 3-2 7-3 11-2V4c-3-1-7-1-11 2Zm0 0v20M7 10h3m-3 5h3m8-5h3m-3 5h3" /></>;
    case 'settings':
      return <><path d="m11 3-1 4-4-1-3 5 3 3-3 3 3 5 4-1 1 4h6l1-4 4 1 3-5-3-3 3-3-3-5-4 1-1-4h-6Z" /><circle cx="14" cy="14" r="4" /></>;
    case 'sound':
      return <><path d="M3 10h5l7-6v20l-7-6H3v-8Zm16-1a8 8 0 0 1 0 10m4-14a14 14 0 0 1 0 18" /></>;
    case 'weather':
      return <><path d="M7 18a5 5 0 0 1-1-10 7 7 0 0 1 13-2 6 6 0 1 1 3 12H7Z" /><path d="m8 22-1 3m7-3-1 3m7-3-1 3" /></>;
    case 'time':
      return <><circle cx="14" cy="14" r="11" /><path d="M14 7v7l5 3M14 3v1m11 10h-1M14 25v-1M3 14h1" /></>;
    case 'advance':
      return <><path className="game-icon-solid" d="m3 5 9 9-9 9V5Zm11 0 9 9-9 9V5Z" /><path d="M25 5v18" /></>;
    case 'air':
      return <><path d="M14 2c-1 0-2 3-2 5v4L3 16v3l9-3v5l-3 3v2l5-2 5 2v-2l-3-3v-5l9 3v-3l-9-5V7c0-2-1-5-2-5Z" /></>;
    case 'naval':
      return <><circle cx="14" cy="5" r="3" /><path d="M14 8v17M8 12h12M3 16c1 5 5 8 11 10 6-2 10-5 11-10M3 16v5m0-5h5m17 0v5m0-5h-5" /></>;
    case 'newspaper':
      return <><path d="M7 4h18v19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9h4v14M11 8h10m-10 4h4v5h-4v-5m8 0h2m-2 5h2m-10 4h10" /></>;
    case 'recruitment':
      return <><rect x="3" y="3" width="18" height="22" rx="1" /><circle cx="12" cy="10" r="3" /><path d="M7 20a5 5 0 0 1 10 0M22 13v8m-4-4h8" /></>;
    case 'constitution':
      return <><path d="M6 3h16v15m-16 0V3H4a2 2 0 0 0-2 2v2h4m0 15v3h14a2 2 0 0 0 2-2v-2H6a2 2 0 0 1 0-4h12M10 7h8m-8 4h8" /><circle cx="22" cy="16" r="3" /></>;
    case 'justice':
      return <><path d="m7 4 4-2 8 10-4 3L7 4Zm-2 3 4-3 9 11-4 3L5 7Zm7 9-7 8M17 24h9m-8 0v-4h7v4" /></>;
    case 'election':
      return <><path d="m3 15 4-5h3m9 0h2l4 5v10H3V15Zm0 0h22M10 19h8" /><path d="m10 3 10 3-3 10-10-3 3-10Zm2 5 1 2 3-2" /></>;
    case 'crown':
      return <><path d="m3 7 6 5 5-9 5 9 6-5-3 14H6L3 7Zm3 18h16" /><circle className="game-icon-solid" cx="14" cy="16" r="1.5" /></>;
    case 'trade':
      return <><path d="M3 8h21m-4-4 4 4-4 4M25 20H4m4-4-4 4 4 4" /><path d="M6 3v1m16 20v1" /></>;
    case 'treaty':
      return <><path d="M4 3h16v10M4 3v22h10M8 7h8m-8 4h5m-5 4h4" /><circle cx="21" cy="18" r="4" /><path d="m18 22-1 4 4-2 4 2-1-4" /></>;
    case 'education':
      return <><path d="m2 9 12-6 12 6-12 6-12-6Zm5 3v8c4 4 10 4 14 0v-8m5-3v11" /></>;
    case 'resistance':
      return <><path d="M10 25h8M14 25V14m-4 4h8M13 2c1 5-4 5-4 9a5 5 0 0 0 10 0c0-4-3-4-3-7l-3 4V2Z" /></>;
    case 'reconstruction':
      return <><path d="M3 25V13l7-5 7 5v12H3Zm5 0v-7h4v7m10 0V3M18 3h8m-9 5h9M22 3l-5 5m9 0v7" /></>;
    case 'medal':
      return <><path d="M7 3h5l2 9-5 1L7 3Zm9 0h5l-2 10-5-1 2-9Z" /><circle cx="14" cy="19" r="7" /><path className="game-icon-solid" d="m14 14 1.3 2.9 3.2.4-2.3 2.2.6 3.2-2.8-1.5-2.8 1.5.6-3.2-2.3-2.2 3.2-.4L14 14Z" /></>;
  }
}

export function GameIcon({ name, size = 22, tone = 'steel', framed = false, active = false, label, className = '' }: GameIconProps) {
  const resolvedSize = Number.isFinite(size) && size > 0 ? size : 22;
  const style = { '--game-icon-size': `${resolvedSize}px` } as CSSProperties;
  return (
    <span
      className={`game-icon game-icon-v2 ${framed ? 'framed' : ''} tone-${tone} ${active ? 'active' : ''} ${className}`.trim()}
      style={style}
      data-game-icon={name}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 28 28" focusable="false" aria-hidden="true">
        <g className="game-icon-line"><IconGlyph name={name} /></g>
      </svg>
    </span>
  );
}
