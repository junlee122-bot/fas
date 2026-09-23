import { useId, type ReactNode } from 'react';

export type HeadquartersRoomArtKind = 'command' | 'research' | 'warehouse' | 'workshop' | 'infirmary' | 'personnel' | 'diplomacy' | 'treasury';

interface RoomArtProps {
  kind: HeadquartersRoomArtKind;
  /** Cosmetic furnishings only; this does not unlock equipment or technology. */
  modern?: boolean;
}

function Chair({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <rect x="-8" y="-6" width="16" height="14" rx="3" fill="#323e38" stroke="#1c2723" />
    <rect x="-9" y="-9" width="18" height="5" rx="2" fill="#7b8166" stroke="#343d32" />
    <path d="M-5 8v3M5 8v3" stroke="#b5ae89" strokeWidth="2" />
    <path d="M-5-3H5" stroke="#a6aa86" opacity=".5" />
  </g>;
}

function Cabinet({ x, y, width = 28, height = 45, wood }: { x: number; y: number; width?: number; height?: number; wood: string }) {
  return <g transform={`translate(${x} ${y})`}>
    <rect width={width} height={height} rx="2" fill={wood} stroke="#302e25" strokeWidth="2" />
    <rect x="3" y="3" width={width - 6} height={height - 6} rx="1" fill="none" stroke="#c1af79" opacity=".38" />
    <path d={`M2 ${height / 3}H${width - 2}M2 ${height * 2 / 3}H${width - 2}`} stroke="#403a2b" />
    {[height / 6, height / 2, height * 5 / 6].map(yPos => <path key={yPos} d={`M${width / 2 - 3} ${yPos}h6`} stroke="#d1c799" strokeWidth="2" />)}
  </g>;
}

function Papers({ x, y, angle = 0 }: { x: number; y: number; angle?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect x="2" y="2" width="18" height="23" fill="#645d43" opacity=".45" />
    <rect width="18" height="23" rx="1" fill="#e0d6af" stroke="#b7ab82" strokeWidth=".6" />
    <path d="M4 5h10M4 9h8M4 13h10M4 17h7" stroke="#776f55" strokeWidth=".8" opacity=".65" />
  </g>;
}

function Terminal({ x, y, modern }: { x: number; y: number; modern: boolean }) {
  return <g transform={`translate(${x} ${y})`} data-apparatus={modern ? 'terminal' : 'radio'}>
    <rect width="30" height="20" rx="2" fill="#303c39" stroke="#b5b6a0" strokeWidth="1.2" />
    {modern ? <>
      <rect x="4" y="3" width="22" height="12" rx="1" fill="#17332f" stroke="#798d78" />
      <path d="M7 6h9M7 9h16M7 12h6" stroke="#a3c6a1" strokeWidth="1" />
      <rect x="2" y="23" width="26" height="8" rx="1" fill="#8e998a" stroke="#344740" />
      <path d="M5 26h20M7 29h16" stroke="#435a4c" strokeDasharray="2 1" />
    </> : <>
      <rect x="4" y="4" width="13" height="7" rx="1" fill="#b9ac76" stroke="#343e32" />
      <path d="M6 7h9M8 5v4M13 5v4" stroke="#625f41" strokeWidth=".7" />
      <circle cx="23" cy="7" r="3" fill="#c1bea4" stroke="#1c2821" />
      <circle cx="23" cy="15" r="2" fill="#a2a98e" />
      <path d="M5 15h11M5 17h11M30 11h5v16h-6" stroke="#a3ad92" />
    </>}
  </g>;
}

function Lamp({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cx="0" cy="0" rx="5" ry="4" fill="#a6955e" stroke="#4a492f" />
    <path d="M0 0V-8h8" stroke="#c6b27a" strokeWidth="2" />
    <rect x="3" y="-13" width="14" height="7" rx="3" fill="#53694f" stroke="#b2ad7d" />
  </g>;
}

/** Furnishing layer only. Room selection and real staff tokens belong to the host. */
export function HeadquartersRoomArt({ kind, modern = false }: RoomArtProps) {
  const id = useId().replace(/:/g, '');
  const wood = `url(#${id}-wood)`;
  const metal = `url(#${id}-metal)`;
  let furnishing: ReactNode;

  switch (kind) {
    case 'command':
      furnishing = <>
        <Cabinet x={17} y={15} width={33} height={43} wood={wood} />
        <rect x="69" y="11" width="141" height="25" rx="2" fill={wood} stroke="#38382b" strokeWidth="2" />
        <Terminal x={78} y={12} modern={modern} />
        <Papers x={147} y={12} angle={4} />
        <Lamp x={187} y={28} />
        <Chair x={134} y={48} />
        <Chair x={134} y={119} rotate={180} />
        <Chair x={92} y={84} rotate={-90} />
        <Chair x={187} y={84} rotate={90} />
        <rect x="105" y="60" width="69" height="46" rx="3" fill={wood} stroke="#302d23" strokeWidth="2" />
        <rect x="111" y="65" width="57" height="35" fill="#a7ad85" stroke="#d4cdac" />
        <path d="M115 69l12 6 9-3 13 9 15-7M119 96l8-15 11 7 9-2 12 10" stroke="#697a5b" strokeWidth="3" opacity=".7" />
        <path d="M118 68v30M130 67v32M142 67v32M154 67v32M112 77h55M112 88h55" stroke="#e2dfbb" strokeWidth=".6" opacity=".65" />
        <path d="M121 82l12-4 12 13 13-4" stroke="#8e5141" strokeWidth="1.7" strokeDasharray="3 2" />
        <circle cx="121" cy="82" r="2.7" fill="#b1624c" stroke="#e8c9a6" />
        <circle cx="145" cy="91" r="2.7" fill="#456d77" stroke="#c7d5c0" />
      </>;
      break;
    case 'research':
      furnishing = <>
        <Cabinet x={16} y={13} width={31} height={48} wood={metal} />
        <rect x="63" y="13" width="149" height="30" rx="2" fill={metal} stroke="#35453f" strokeWidth="2" />
        <Terminal x={70} y={16} modern={modern} />
        <path d="M119 20v8l-6 9h18l-6-9v-8" fill="#90aa98" stroke="#d2d9b9" />
        <path d="M116 33h12" stroke="#48765f" strokeWidth="3" />
        <path d="M141 20v10l-4 6h14l-4-6V20" fill="#c4b377" stroke="#e0d2a9" />
        <Papers x={176} y={17} angle={-3} />
        <Chair x={127} y={110} rotate={180} />
        <rect x="94" y="65" width="102" height="30" rx="2" fill={metal} stroke="#344039" strokeWidth="2" />
        <rect x="104" y="73" width="24" height="14" rx="2" fill="#454b3c" stroke="#c7c4a4" />
        <circle cx="113" cy="79" r="4" fill="#bfc5a9" stroke="#717861" />
        <path d="M118 78l8-9-5-5M123 67l8 5" stroke="#d0c9aa" strokeWidth="3" />
        <circle cx="165" cy="79" r="9" fill="#dad3b0" stroke="#77806a" />
        <circle cx="165" cy="79" r="5" fill="#91aa88" stroke="#4d725b" />
        <path d="M183 72v15M188 72v15" stroke="#c1cab6" strokeWidth="3" />
        <path d="M183 80v7M188 82v5" stroke="#879866" strokeWidth="3" />
      </>;
      break;
    case 'warehouse':
      furnishing = <>
        {[18, 88, 158].map(x => <g key={x} transform={`translate(${x} 13)`}>
          <rect width="56" height="43" rx="2" fill="#484e3e" stroke="#a3a280" strokeWidth="2" />
          {[4, 28].map(boxX => <g key={boxX}>
            <rect x={boxX} y="5" width="21" height="31" fill={wood} stroke="#343b2b" />
            <path d={`M${boxX + 2} 7l17 27m0-27-17 27`} stroke="#b8a270" opacity=".65" />
            <rect x={boxX + 7} y="15" width="9" height="7" fill="#d5c293" />
          </g>)}
          <path d="M0 39h56" stroke="#c3b995" strokeWidth="2" />
        </g>)}
        <g transform="translate(104 82)">
          <rect x="-4" y="-4" width="54" height="39" fill="#4c4b36" stroke="#857b50" />
          <rect width="22" height="27" fill={wood} stroke="#b4a16e" />
          <rect x="24" width="22" height="27" fill={wood} stroke="#b4a16e" />
          <path d="M1 2l20 23M25 2l20 23" stroke="#a99562" />
          <path d="M8 1v26M32 1v26" stroke="#343c2e" strokeWidth="3" />
        </g>
        <g transform="translate(188 91)">
          <rect x="-12" y="-10" width="25" height="30" rx="5" fill={metal} stroke="#333e36" strokeWidth="2" />
          <ellipse cy="-5" rx="10" ry="4" fill="#98a18a" stroke="#4c6150" />
          <path d="M-11 8h22" stroke="#a1ad91" strokeWidth="2" />
          <circle cx="4" cy="-5" r="2" fill="#334338" />
        </g>
      </>;
      break;
    case 'workshop':
      furnishing = <>
        <rect x="17" y="12" width="196" height="25" rx="2" fill={wood} stroke="#3b3a2a" strokeWidth="2" />
        <path d="M29 19h39M29 24h32M29 29h35" stroke="#a4ae98" strokeWidth="2" />
        <path d="M99 17v14M105 17v14M120 17l9 12" stroke="#9fae9b" strokeWidth="3" />
        <circle cx="139" cy="25" r="7" fill="#394a3e" stroke="#a6af95" strokeWidth="3" />
        <Terminal x={173} y={13} modern={modern} />
        <rect x="100" y="59" width="99" height="47" rx="4" fill={metal} stroke="#2d4237" strokeWidth="2" />
        <rect x="110" y="65" width="76" height="22" rx="3" fill="#324d40" stroke="#b1b797" />
        <rect x="133" y="61" width="13" height="39" rx="2" fill="#aeb9a1" stroke="#354b3b" />
        <circle cx="167" cy="95" r="6" fill="#3a4a3d" stroke="#aaba9c" strokeWidth="2" />
        <path d="M167 91v8M163 95h8" stroke="#bac4a5" />
        <path d="M116 78h62" stroke="#d0c7a2" strokeWidth="4" />
        <path d="M208 65v39M207 65h7M207 103h7" stroke="#aca983" strokeWidth="2" />
        <rect x="165" y="116" width="45" height="8" fill="#8d885e" stroke="#4b5036" />
        <path d="M169 117l5 6m4-6 5 6m4-6 5 6m4-6 5 6" stroke="#333f2c" strokeWidth="3" />
      </>;
      break;
    case 'infirmary':
      furnishing = <>
        <Cabinet x={17} y={13} width={32} height={46} wood={metal} />
        <rect x="25" y="21" width="16" height="18" rx="2" fill="#d9d9b9" />
        <path d="M33 24v12M28 30h10" stroke="#668c76" strokeWidth="3" />
        {[94, 167].map(x => <g key={x} transform={`translate(${x} 32)`}>
          <rect x="-3" y="-4" width="42" height="70" rx="3" fill={metal} stroke="#45594c" strokeWidth="2" />
          <rect width="36" height="63" rx="3" fill="#d8d8bb" stroke="#a8b19c" />
          <rect x="4" y="3" width="28" height="14" rx="4" fill="#ece6c9" stroke="#b9c1a8" />
          <rect y="23" width="36" height="34" rx="2" fill="#809687" />
          <path d="M4 28h28M4 50h28" stroke="#abb7a0" opacity=".7" />
          <path d="M-6-3v13M42-3v13M-6 53v13M42 53v13" stroke="#c2c7ab" strokeWidth="2" />
        </g>)}
        <rect x="143" y="42" width="14" height="26" rx="2" fill="#b9c4ad" stroke="#526958" />
        <circle cx="150" cy="49" r="3" fill="#dfdfc4" />
        <path d="M148 58h5" stroke="#547563" strokeWidth="2" />
        <path d="M76 33v43m-5 0h10M70 33h12" stroke="#bbc6b0" strokeWidth="2" />
        <rect x="72" y="35" width="8" height="14" rx="2" fill="#d1d6b9" stroke="#a6b89e" />
      </>;
      break;
    case 'personnel':
      furnishing = <>
        <Cabinet x={18} y={13} width={31} height={47} wood={wood} />
        <Cabinet x={55} y={13} width={31} height={47} wood={wood} />
        <rect x="100" y="12" width="111" height="21" rx="2" fill={wood} stroke="#343b2c" strokeWidth="2" />
        <Terminal x={108} y={13} modern={modern} />
        <rect x="168" y="16" width="32" height="13" fill="#687858" stroke="#b9b78d" />
        <path d="M173 16v13M179 16v13M185 16v13M191 16v13" stroke="#d2c496" strokeWidth="2" />
        <Chair x={139} y={52} />
        <Chair x={125} y={121} rotate={180} />
        <Chair x={167} y={121} rotate={180} />
        <rect x="105" y="65" width="88" height="40" rx="3" fill={wood} stroke="#3b3729" strokeWidth="2" />
        <Papers x={120} y={72} angle={-5} />
        <rect x="151" y="74" width="24" height="21" rx="1" fill="#69846b" stroke="#c3bb92" />
        <path d="M154 78h17M154 82h10" stroke="#cdd2ad" />
        <Lamp x={181} y={85} />
      </>;
      break;
    case 'diplomacy':
      furnishing = <>
        <Cabinet x={17} y={13} width={40} height={34} wood={wood} />
        <circle cx="80" cy="28" r="14" fill="#48604d" stroke="#b8ad7c" strokeWidth="2" />
        <path d="M66 28h28M80 14c-10 8-10 20 0 28M80 14c10 8 10 20 0 28M69 21h22M69 35h22" stroke="#aaa880" strokeWidth="1" />
        <rect x="149" y="15" width="63" height="19" rx="2" fill={wood} stroke="#393b2a" />
        <path d="M157 19v12M163 19v12M171 19v12M178 19v12M186 19v12M193 19v12M201 19v12" stroke="#b2a272" strokeWidth="3" />
        <Chair x={125} y={55} />
        <Chair x={163} y={55} />
        <Chair x={125} y={122} rotate={180} />
        <Chair x={163} y={122} rotate={180} />
        <Chair x={92} y={88} rotate={-90} />
        <Chair x={196} y={88} rotate={90} />
        <rect x="105" y="69" width="78" height="39" rx="17" fill={wood} stroke="#3a3426" strokeWidth="2" />
        <rect x="111" y="74" width="66" height="29" rx="12" fill="#4b6350" stroke="#a19669" />
        <Papers x={137} y={78} angle={3} />
        <circle cx="122" cy="85" r="3" fill="#dedcc2" stroke="#b4b58e" />
        <circle cx="165" cy="94" r="3" fill="#dedcc2" stroke="#b4b58e" />
      </>;
      break;
    case 'treasury':
      furnishing = <>
        <rect x="16" y="13" width="48" height="46" rx="3" fill={metal} stroke="#354237" strokeWidth="3" />
        <rect x="23" y="19" width="34" height="33" rx="2" fill="#4c6154" stroke="#bbc4a6" />
        <circle cx="39" cy="35" r="9" fill="#819580" stroke="#273d30" strokeWidth="2" />
        <path d="M39 29v12M33 35h12M30 22h3M30 49h3" stroke="#d3d6b9" strokeWidth="2" />
        <Cabinet x={77} y={14} width={35} height={42} wood={wood} />
        <rect x="130" y="13" width="81" height="24" rx="2" fill={wood} stroke="#393b2a" strokeWidth="2" />
        <Terminal x={173} y={15} modern={modern} />
        <rect x="138" y="18" width="21" height="12" fill="#637b5c" stroke="#b6b78c" />
        <path d="M143 18v12M153 18v12" stroke="#d3c993" strokeWidth="3" />
        <Chair x={143} y={120} rotate={180} />
        <rect x="105" y="70" width="90" height="34" rx="3" fill={wood} stroke="#38382a" strokeWidth="2" />
        <path d="M116 77h19v21h-19zM137 77h19v21h-19z" fill="#d4c89d" stroke="#b7a474" />
        <path d="M120 82h12M120 87h12M120 92h12M141 82h12M141 87h12M141 92h12" stroke="#8a825d" strokeWidth=".9" />
        <path d="M136 77v21" stroke="#504f32" strokeWidth="2" />
        <Lamp x={180} y={87} />
      </>;
      break;
  }

  return <svg
    className="headquarters-room-art"
    viewBox="0 0 240 135"
    aria-hidden="true"
    focusable="false"
    data-room-art={kind}
    data-era-furnishing={modern ? 'modern' : 'period'}
    style={{ pointerEvents: 'none', display: 'block', width: '100%', height: '100%' }}
  >
    <defs>
      <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8b7c55" /><stop offset="1" stopColor="#66583c" />
      </linearGradient>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#879580" /><stop offset="1" stopColor="#5e7361" />
      </linearGradient>
      <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%" colorInterpolationFilters="sRGB">
        <feDropShadow dx="1" dy="3" stdDeviation="1.5" floodColor="#172119" floodOpacity=".5" />
      </filter>
    </defs>
    <g strokeLinejoin="round" strokeLinecap="round" filter={`url(#${id}-shadow)`}>{furnishing}</g>
  </svg>;
}
