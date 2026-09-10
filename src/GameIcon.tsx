import type { CSSProperties } from 'react';

export type GameIconName =
  | 'command'
  | 'map'
  | 'organization'
  | 'army'
  | 'industry'
  | 'research'
  | 'diplomacy'
  | 'intelligence'
  | 'health'
  | 'manpower'
  | 'politics'
  | 'fuel'
  | 'steel'
  | 'treasury'
  | 'supply'
  | 'alert'
  | 'objective'
  | 'report'
  | 'search'
  | 'save'
  | 'help'
  | 'settings'
  | 'sound'
  | 'weather'
  | 'time'
  | 'advance'
  | 'air'
  | 'naval';

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
      return <><path d="M14 2.1 17 8l6.5.9-4.7 4.5 1.1 6.4-5.9-3.1-5.9 3.1 1.1-6.4-4.7-4.5L11 8 14 2.1Z" /><path className="game-icon-cut" d="M13 9.2h2v7.4h-2zM9.3 12h9.4v2H9.3z" /></>;
    case 'map':
      return <><path d="m3 5.2 7-3 8 3 7-3v20.6l-7 3-8-3-7 3V5.2Zm8.5-.2v15.2l5 1.8V6.8l-5-1.8Z" /><circle className="game-icon-cut" cx="20.5" cy="10" r="2" /><path className="game-icon-cut" d="m18 18 2.5-5 2.5 5-2.5-1.3L18 18Z" /></>;
    case 'organization':
      return <><path d="M14 2 3 7v3h22V7L14 2Zm-8 10h4v9H6v-9Zm6 0h4v9h-4v-9Zm6 0h4v9h-4v-9ZM3 23h22v3H3v-3Z" /><path className="game-icon-cut" d="m14 5 2.2 2h-4.4L14 5Z" /></>;
    case 'army':
      return <><path d="M14 2 4 6v7c0 6.3 4.1 10.6 10 13 5.9-2.4 10-6.7 10-13V6L14 2Z" /><path className="game-icon-cut" d="m9 9 8.8 8.8-1.8 1.8-8.8-8.8L9 9Zm10 0-8.8 8.8 1.8 1.8 8.8-8.8L19 9Z" /><circle className="game-icon-cut" cx="14" cy="14" r="2.1" /></>;
    case 'industry':
      return <><path d="M3 25V11h5v4l7-4v4l7-4v14H3Zm3-3h3v-3H6v3Zm6 0h3v-3h-3v3Zm6 0h3v-3h-3v3ZM4 9l1-7h5l1 7H4Z" /></>;
    case 'research':
      return <><path d="M10 2h8v3h-1v5.1l6.2 10.6A3.5 3.5 0 0 1 20.2 26H7.8a3.5 3.5 0 0 1-3-5.3L11 10.1V5h-1V2Zm1.3 14-3.8 6.5h13L16.7 16h-5.4Z" /><circle className="game-icon-cut" cx="13" cy="20" r="1.2" /><circle className="game-icon-cut" cx="17" cy="22" r=".8" /></>;
    case 'diplomacy':
      return <><path d="M2.5 10.5 8 5l5 3-3.2 3.2 2 2 4.7-4.7L20 6l5.5 5.5-5.2 5.2-7.1 7.1a3 3 0 0 1-4.2 0l-6.5-6.5 3.2-3.2-3.2-3.6Zm7.2 5.3 5 5 1.6-1.6-5-5-1.6 1.6Zm-3 3 3.6 3.6 1.6-1.6-3.6-3.6-1.6 1.6Z" /></>;
    case 'intelligence':
      return <><path d="M2 14s4.4-8 12-8 12 8 12 8-4.4 8-12 8S2 14 2 14Zm12-5.2a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4Z" /><circle cx="14" cy="14" r="2.8" /><path d="M23 3h3v7h-3zM21 5h7v3h-7z" /></>;
    case 'health':
      return <><path d="M14 26C7.4 22.4 3 18.1 3 11.8 3 7.6 6 4.5 9.9 4.5c1.8 0 3.1.7 4.1 2 1-1.3 2.3-2 4.1-2C22 4.5 25 7.6 25 11.8 25 18.1 20.6 22.4 14 26Z" /><path className="game-icon-cut" d="M12.2 8h3.6v4.2H20v3.6h-4.2V20h-3.6v-4.2H8v-3.6h4.2V8Z" /></>;
    case 'manpower':
      return <><path d="M14 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10ZM4 25c.5-6.1 3.9-9.5 10-9.5s9.5 3.4 10 9.5H4Z" /><path className="game-icon-cut" d="M9 7h10l-2-3h-6L9 7Zm3 9 2 2 2-2 1.2 9h-6.4l1.2-9Z" /></>;
    case 'politics':
      return <><path d="M14 2 3 7v3h22V7L14 2ZM6 12h16v3H6v-3Zm2 5h12v7h3v2H5v-2h3v-7Z" /><path className="game-icon-cut" d="M12.5 18h3v6h-3z" /></>;
    case 'fuel':
      return <path d="M14 2s8 9.2 8 15a8 8 0 1 1-16 0c0-5.8 8-15 8-15Zm-4 15.2c0 2.5 1.5 4.3 4.2 4.8-1.4-2.2-.8-4.6 1.7-7.3-3.7.5-5.9 1.3-5.9 2.5Z" />;
    case 'steel':
      return <><path d="m4 7 7-4h11l2 5-6 17H7L4 7Zm5.2 4h9.6l1.1-3H8.1l1.1 3Zm1.3 10h5l2.2-6h-9l1.8 6Z" /><path className="game-icon-cut" d="M12 15h3l-1 3h-3l1-3Z" /></>;
    case 'treasury':
      return <><ellipse cx="14" cy="7" rx="9" ry="4" /><path d="M5 7v5c0 2.2 4 4 9 4s9-1.8 9-4V7c-1.7 2-5.2 3-9 3S6.7 9 5 7Zm0 7v5c0 2.2 4 4 9 4s9-1.8 9-4v-5c-1.7 2-5.2 3-9 3s-7.3-1-9-3Z" /><path className="game-icon-cut" d="M13 4h2v6h-2z" /></>;
    case 'supply':
      return <><path d="M3 8 14 2l11 6v13l-11 6L3 21V8Zm3 3v8l6 3.3v-8L6 11Zm10 3.3v8l6-3.3v-8l-6 3.3Z" /><path className="game-icon-cut" d="m7.5 8.5 6.5 3.6 6.5-3.6L14 5 7.5 8.5Z" /></>;
    case 'alert':
      return <><path d="M14 2 27 25H1L14 2Z" /><path className="game-icon-cut" d="M12.5 9h3l-.5 9h-2L12.5 9Zm0 11h3v3h-3v-3Z" /></>;
    case 'objective':
      return <><circle cx="14" cy="14" r="11" /><circle className="game-icon-cut" cx="14" cy="14" r="7" /><circle cx="14" cy="14" r="3" /><path d="M13 0h2v7h-2zM13 21h2v7h-2zM0 13h7v2H0zM21 13h7v2h-7z" /></>;
    case 'report':
      return <><path d="M5 2h13l5 5v19H5V2Zm13 2.5V8h3.5L18 4.5ZM9 12h10v2H9v-2Zm0 5h10v2H9v-2Zm0 5h7v2H9v-2Z" /><path d="M2 6h2v18H2z" /></>;
    case 'search':
      return <><circle cx="12" cy="12" r="8" /><circle className="game-icon-cut" cx="12" cy="12" r="4.5" /><path d="m17.5 17.5 8 8-2.5 2.5-8-8 2.5-2.5Z" /></>;
    case 'save':
      return <><path d="M3 3h18l4 4v18H3V3Zm4 2v7h13V5H7Zm1 11v7h12v-7H8Z" /><path className="game-icon-cut" d="M10 18h8v3h-8zM16 6h3v5h-3z" /></>;
    case 'help':
      return <><path d="M14 2a12 12 0 1 1 0 24 12 12 0 0 1 0-24Zm-1.5 17v3h3v-3h-3Zm-3-9h3c0-1.4.7-2.2 2-2.2 1.2 0 2 .7 2 1.8 0 1-.5 1.5-1.9 2.4-1.7 1.1-2.2 2.1-2.1 4.2h3c0-1.2.3-1.7 1.7-2.6 2.1-1.3 3.2-2.5 3.2-4.5 0-2.6-2-4.3-5.1-4.3-3.4 0-5.6 1.9-5.8 5.2Z" /></>;
    case 'settings':
      return <><path d="m14 2 2.2 3.2 3.9-.5.7 3.9 3.5 1.7-1.8 3.5 2.4 3-3 2.5.9 3.8-3.8 1.1-1.1 3.8H10l-1.1-3.8-3.8-1.1.9-3.8-3-2.5 2.4-3-1.8-3.5 3.5-1.7.7-3.9 3.9.5L14 2Z" /><circle className="game-icon-cut" cx="14" cy="14" r="5" /><circle cx="14" cy="14" r="2" /></>;
    case 'sound':
      return <><path d="M3 10h5l7-6v20l-7-6H3v-8Z" /><path d="M18 9c2.7 2.7 2.7 7.3 0 10l2 2c3.9-3.9 3.9-10.3 0-14l-2 2Zm4-4c5 5 5 13 0 18l2 2c6.1-6.1 6.1-15.9 0-22l-2 2Z" /></>;
    case 'weather':
      return <><path d="M7 20a5 5 0 0 1-.6-10A8 8 0 0 1 22 9.2 5.5 5.5 0 1 1 .5 10.8H7Z" /><path d="m7 22-2 5h3l2-5H7Zm7 0-2 5h3l2-5h-3Zm7 0-2 5h3l2-5h-3Z" /></>;
    case 'time':
      return <><circle cx="14" cy="14" r="12" /><circle className="game-icon-cut" cx="14" cy="14" r="8.5" /><path d="M13 6h2v8.4l5.5 3.2-1.5 2.5-6-3.7V6Z" /></>;
    case 'advance':
      return <><path d="m3 4 10 10L3 24V4Zm11 0 10 10-10 10V4Z" /><path d="M24 4h3v20h-3z" /></>;
    case 'air':
      return <path d="m2 16 10-4 3-9h3l-1 9 8 3v3l-8 1-3 7h-2v-7l-10-1v-2Z" />;
    case 'naval':
      return <><path d="M12 2h4v6h5v3h-5v7.5c3.2-.5 5.7-2 7.8-4.5l2.2 1.5C23.7 22.2 19.7 26 14 27 8.3 26 4.3 22.2 2 15.5L4.2 14c2.1 2.5 4.6 4 7.8 4.5V11H7V8h5V2Z" /><circle className="game-icon-cut" cx="14" cy="6" r="1.2" /></>;
  }
}

export function GameIcon({ name, size = 22, tone = 'steel', framed = false, active = false, label, className = '' }: GameIconProps) {
  const style = { '--game-icon-size': `${size}px` } as CSSProperties;
  return (
    <span
      className={`game-icon ${framed ? 'framed' : ''} tone-${tone} ${active ? 'active' : ''} ${className}`.trim()}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 28 28" focusable="false"><IconGlyph name={name} /></svg>
    </span>
  );
}
