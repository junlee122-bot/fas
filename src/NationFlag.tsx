import { memo, type ReactNode } from 'react';
import { getHistoricalFlag } from './historicalFlags';
import type { NationId } from './types';

type NationFlagSize = 'compact' | 'standard' | 'large';

interface NationFlagProps {
  nationId: NationId;
  size?: NationFlagSize;
  className?: string;
  decorative?: boolean;
}

interface FlagArtwork {
  viewBox: string;
  artwork: ReactNode;
}

const starPoints = (cx: number, cy: number, outer: number, inner = outer * 0.382, points = 5, rotation = -90) =>
  Array.from({ length: points * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = ((rotation + index * 180 / points) * Math.PI) / 180;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(' ');

const radialPoint = (cx: number, cy: number, radius: number, angle: number) => {
  const radians = (angle * Math.PI) / 180;
  return `${cx + Math.cos(radians) * radius},${cy + Math.sin(radians) * radius}`;
};

function flagArtwork(nationId: NationId): FlagArtwork {
  switch (nationId) {
    case 'britain':
      return {
        viewBox: '0 0 120 60',
        artwork: <>
          <rect width="120" height="60" fill="#012169" />
          <path d="M0 0 120 60M120 0 0 60" stroke="#fff" strokeWidth="14" />
          <path d="M0 0 120 60M120 0 0 60" stroke="#c8102e" strokeWidth="6" />
          <path d="M60 0v60M0 30h120" stroke="#fff" strokeWidth="20" />
          <path d="M60 0v60M0 30h120" stroke="#c8102e" strokeWidth="11" />
        </>,
      };
    case 'usa':
      return {
        viewBox: '0 0 190 100',
        artwork: <>
          <rect width="190" height="100" fill="#fff" />
          {Array.from({ length: 7 }, (_, index) => <rect key={index} y={index * 200 / 13} width="190" height={100 / 13} fill="#b22234" />)}
          <rect width="76" height={700 / 13} fill="#3c3b6e" />
          {Array.from({ length: 48 }, (_, index) => {
            const column = index % 8;
            const row = Math.floor(index / 8);
            return <polygon key={index} points={starPoints(5.4 + column * 9.35, 4.5 + row * 9, 2.5)} fill="#fff" />;
          })}
        </>,
      };
    case 'ussr':
      return {
        viewBox: '0 0 120 60',
        artwork: <>
          <rect width="120" height="60" fill="#cd0000" />
          <polygon points={starPoints(14, 8.5, 4.5)} fill="#ffd700" />
          <path d="M9.5 22.5a10 10 0 0 0 14.5 1.8" fill="none" stroke="#ffd700" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M12.2 15.4a7.2 7.2 0 0 0 10.1 9.1" fill="none" stroke="#cd0000" strokeWidth="3.2" strokeLinecap="round" />
          <path d="m12.4 26 11-11.4M18.9 13.2l5.8 5.5M22.7 11.4l4 3.8" fill="none" stroke="#ffd700" strokeWidth="2.8" strokeLinecap="square" />
        </>,
      };
    case 'germany':
      return {
        viewBox: '0 0 50 30',
        artwork: <>
          <rect width="50" height="30" fill="#dd0000" />
          <circle cx="25" cy="15" r="10" fill="#fff" />
          <path d="M22 7h5v6h6V9h4v8H27v6h4v-4h6v8H23V17h-6v4h4v6h-8V13h10V7h-4v4h-6V3h14v10" fill="#111" transform="rotate(45 25 15) scale(.72) translate(9.7 5.8)" />
        </>,
      };
    case 'japan':
      return {
        viewBox: '0 0 70 49',
        artwork: <>
          <rect width="70" height="49" fill="#fff" />
          <circle cx="34.3" cy="24.5" r="14.7" fill="#bc002d" />
        </>,
      };
    case 'china': {
      const rays = Array.from({ length: 12 }, (_, index) => {
        const centerAngle = -90 + index * 30;
        return `${radialPoint(18, 12, 4.6, centerAngle - 7)} ${radialPoint(18, 12, 10, centerAngle)} ${radialPoint(18, 12, 4.6, centerAngle + 7)}`;
      });
      return {
        viewBox: '0 0 72 48',
        artwork: <>
          <rect width="72" height="48" fill="#fe0000" />
          <rect width="36" height="24" fill="#000095" />
          {rays.map((points, index) => <polygon key={index} points={points} fill="#fff" />)}
          <circle cx="18" cy="12" r="3.6" fill="#fff" />
        </>,
      };
    }
    case 'india':
      return {
        viewBox: '0 0 60 40',
        artwork: <>
          <rect width="60" height={40 / 3} fill="#ff9933" />
          <rect y={40 / 3} width="60" height={40 / 3} fill="#fff" />
          <rect y={80 / 3} width="60" height={40 / 3} fill="#138808" />
          <circle cx="30" cy="20" r="6" fill="none" stroke="#142c66" strokeWidth="1.1" />
          {Array.from({ length: 12 }, (_, index) => <line key={index} x1="30" y1="20" x2={30 + Math.cos(index * Math.PI / 6) * 5.7} y2={20 + Math.sin(index * Math.PI / 6) * 5.7} stroke="#142c66" strokeWidth=".55" />)}
          <path d="M23 27h14M25 27l-3 5m13-5 3 5M30 14l8-4" fill="none" stroke="#142c66" strokeWidth="1" strokeLinecap="round" />
        </>,
      };
    case 'freefrance':
      return {
        viewBox: '0 0 60 40',
        artwork: <>
          <rect width="20" height="40" fill="#002395" />
          <rect x="20" width="20" height="40" fill="#fff" />
          <rect x="40" width="20" height="40" fill="#ed2939" />
          <path d="M28.4 9h3.2v7h4.8v3.2h-4.8v4.4h6.2v3.2h-6.2V32h-3.2v-5.2h-6.2v-3.2h6.2v-4.4h-4.8V16h4.8z" fill="#d22630" />
        </>,
      };
    case 'italy':
      return {
        viewBox: '0 0 60 40',
        artwork: <>
          <rect width="20" height="40" fill="#009246" />
          <rect x="20" width="20" height="40" fill="#fff" />
          <rect x="40" width="20" height="40" fill="#ce2b37" />
          <path d="M25 13h10v10.5c0 4-2.2 6.3-5 7.5-2.8-1.2-5-3.5-5-7.5z" fill="#0072bc" />
          <path d="M26 14h8v9.2c0 3.1-1.6 5.1-4 6.3-2.4-1.2-4-3.2-4-6.3z" fill="#e52536" stroke="#fff" strokeWidth=".7" />
          <path d="M30 14v15.3M26 20.2h8" stroke="#fff" strokeWidth="2.2" />
        </>,
      };
    case 'korea':
      return {
        viewBox: '0 0 60 40',
        artwork: <>
          <rect width="60" height="40" fill="#fff" />
          <g transform="rotate(-18 30 20)">
            <path d="M30 13a7 7 0 0 1 0 14 3.5 3.5 0 0 0 0-7 3.5 3.5 0 0 1 0-7z" fill="#c60c30" />
            <path d="M30 27a7 7 0 0 1 0-14 3.5 3.5 0 0 0 0 7 3.5 3.5 0 0 1 0 7z" fill="#003478" />
          </g>
          <g stroke="#111" strokeWidth="1.8">
            <path d="M12 9h8m-8 3h8m-8 3h8M40 25h3m2 0h3m-8 3h3m2 0h3m-8 3h3m2 0h3" />
            <path d="M40 9h8m-8 3h3m2 0h3m-8 3h8M12 25h3m2 0h3m-8 3h8m-8 3h3m2 0h3" />
          </g>
        </>,
      };
    case 'vietnam':
      return {
        viewBox: '0 0 60 40',
        artwork: <>
          <rect width="60" height="40" fill="#da251d" />
          <polygon points={starPoints(30, 20, 10.5, 4.2)} fill="#ffcd00" />
        </>,
      };
    case 'indonesia':
      return {
        viewBox: '0 0 60 40',
        artwork: <>
          <rect width="60" height="20" fill="#ce1126" />
          <rect y="20" width="60" height="20" fill="#fff" />
        </>,
      };
    case 'philippines': {
      const sunRays = Array.from({ length: 8 }, (_, index) => {
        const angle = -90 + index * 45;
        return `${radialPoint(14, 20, 3.3, angle - 9)} ${radialPoint(14, 20, 7.1, angle)} ${radialPoint(14, 20, 3.3, angle + 9)}`;
      });
      return {
        viewBox: '0 0 80 40',
        artwork: <>
          <rect width="80" height="20" fill="#ce1126" />
          <rect y="20" width="80" height="20" fill="#0038a8" />
          <path d="M0 0 34.6 20 0 40z" fill="#fff" />
          {sunRays.map((points, index) => <polygon key={index} points={points} fill="#fcd116" />)}
          <circle cx="14" cy="20" r="2.6" fill="#fcd116" />
          <polygon points={starPoints(5.3, 5.5, 2.4)} fill="#fcd116" />
          <polygon points={starPoints(5.3, 34.5, 2.4)} fill="#fcd116" />
          <polygon points={starPoints(29.2, 20, 2.4)} fill="#fcd116" />
        </>,
      };
    }
  }
}

export const NationFlag = memo(function NationFlag({ nationId, size = 'standard', className = '', decorative = false }: NationFlagProps) {
  const flag = getHistoricalFlag(nationId);
  const { viewBox, artwork } = flagArtwork(nationId);
  const classes = ['historical-flag', flag.ratio, size, flag.containsSensitiveSymbol ? 'sensitive-symbol' : '', className].filter(Boolean).join(' ');
  const accessibleLabel = `${flag.name}, ${flag.period}, ${flag.kindLabel}`;

  return (
    <span className={classes} title={accessibleLabel} data-flag-kind={flag.kind}>
      <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : accessibleLabel} focusable="false">
        {artwork}
      </svg>
    </span>
  );
});
