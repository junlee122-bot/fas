import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { LivingWorldPresentation, LivingWorldSite } from './livingWorldPresentation';
import './LivingWorldDiorama.css';

export interface LivingWorldDioramaProps {
  presentation: LivingWorldPresentation;
  selected: LivingWorldSite;
  onSelect: (site: LivingWorldSite) => void;
  artSrc?: string;
  detailId?: string;
}

const districts: { id: LivingWorldSite; title: string; number: string }[] = [
  { id: 'industry', title: '생산 지구', number: '01' },
  { id: 'council', title: '참모 회의실', number: '02' },
  { id: 'market', title: '생활 시장', number: '03' },
  { id: 'health', title: '보건 거점', number: '04' },
];
const stateNames = { stable: '안정', watch: '살펴볼 곳', critical: '주의 필요', unknown: '자료 확인 필요' };
const slots = [0, 1, 2, 3, 4, 5];
const shownTokens = (model: LivingWorldPresentation, site: LivingWorldSite) => model.sites[site].severity === 'unknown' ? 0 : model.sites[site].tokenCount;
const activeSite = (model: LivingWorldPresentation, site: LivingWorldSite) => model.sites[site].severity !== 'unknown' && model.sites[site].activityLevel > 0;

/** Isometric coordinates are presentation only: no building represents a literal factory. */
function Block({ x, y, width, depth, height, tone = 'stone', className = '' }: {
  x: number; y: number; width: number; depth: number; height: number; tone?: string; className?: string;
}) {
  const frontX = x + width - depth;
  const frontY = y + (width + depth) / 2;
  return <g className={`lwd-block lwd-${tone} ${className}`}>
    <polygon className="lwd-face-left" points={`${x - depth},${y + depth / 2 - height} ${frontX},${frontY - height} ${frontX},${frontY} ${x - depth},${y + depth / 2}`} />
    <polygon className="lwd-face-right" points={`${x + width},${y + width / 2 - height} ${frontX},${frontY - height} ${frontX},${frontY} ${x + width},${y + width / 2}`} />
    <polygon className="lwd-roof" points={`${x},${y - height} ${x + width},${y + width / 2 - height} ${frontX},${frontY - height} ${x - depth},${y + depth / 2 - height}`} />
  </g>;
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} className="lwd-tree">
    <ellipse cx="2" cy="6" rx="13" ry="6" fill="#101d1770" />
    <path d="M0 4V-23" stroke="#7a7653" strokeWidth="3" />
    <path d="M0-45 14-16 5-17 18-6 0 0-18-6-5-17-14-16Z" fill="#435d46" />
    <path d="M0-45V0L18-6 5-17 14-16Z" fill="#2c4435" />
  </g>;
}

function Industry({ model }: { model: LivingWorldPresentation }) {
  const known = model.sites.industry.severity !== 'unknown';
  const militaryShare = known ? model.factories.militaryShare ?? 0 : 0;
  const civilianShare = known ? model.factories.civilianShare ?? 0 : 0;
  const military = Math.round(militaryShare * 6);
  const civilian = Math.round(civilianShare * 6);
  const allocationWidth = 210;
  return <g data-district="industry" data-state={model.sites.industry.severity}>
    <Block x={285} y={167} width={92} depth={69} height={48} tone="factory" />
    <Block x={292} y={140} width={13} depth={13} height={80} tone="chimney" />
    <Block x={319} y={155} width={13} depth={13} height={68} tone="chimney" />
    <path d="m235 160 31 16 15-15 31 15 15-14 32 16v12l-62 34-62-32Z" fill="#87917b" stroke="#afb396" strokeWidth="1.5" />
    <path d="m244 179 12 6v16l-12-6Zm22 11 12 6v16l-12-6Zm22 11 12 6v16l-12-6Z" fill="#192d27" />
    <Block x={383} y={213} width={55} depth={56} height={32} tone="civilian" />
    <path d="m341 235 25 13v17l-25-13Z" fill="#1c3026" />
    <g data-allocation="military" data-active-slots={military}>
      {slots.map((index) => <polygon key={index} points={`${239 + index * 11},222 ${247 + index * 11},226 ${247 + index * 11},232 ${239 + index * 11},228`} className={index < military ? 'lwd-military-lit' : 'lwd-window-off'} />)}
    </g>
    <g data-allocation="civilian" data-active-slots={civilian}>
      {slots.map((index) => <polygon key={index} points={`${377 + index * 8},244 ${383 + index * 8},241 ${383 + index * 8},247 ${377 + index * 8},250`} className={index < civilian ? 'lwd-civilian-lit' : 'lwd-window-off'} />)}
    </g>
    <path d="m208 255 63 31 22-11-62-31Z" fill="#6e785d" stroke="#a1a68a" />
    <path d="m207 262 64 32 23-12" stroke="#344335" fill="none" strokeWidth="4" />
    <text x="282" y="274" className="lwd-map-note">군수</text><text x="419" y="279" className="lwd-map-note">민수 여력</text>
    <g className="lwd-allocation-strip" data-military-share={known ? militaryShare : 'unknown'} data-civilian-share={known ? civilianShare : 'unknown'}>
      <title>공장 역량의 배치 비중 · 건물 수가 아닙니다</title>
      <rect className="lwd-allocation-track" x="224" y="289" width={allocationWidth} height="11" rx="1" />
      <rect className="lwd-allocation-military" x="224" y="289" width={militaryShare * allocationWidth} height="11" data-continuous-width={militaryShare * allocationWidth} />
      <rect className="lwd-allocation-civilian" x={224 + militaryShare * allocationWidth} y="289" width={civilianShare * allocationWidth} height="11" data-continuous-width={civilianShare * allocationWidth} />
      <rect className="lwd-allocation-edge" x="224" y="289" width={allocationWidth} height="11" rx="1" />
    </g>
    {model.factories.overAllocated ? <path data-overallocated="true" d="m318 253 12 21h-24Z" fill="#dd9a70" stroke="#ffe1b8" /> : null}
  </g>;
}

function Council({ model }: { model: LivingWorldPresentation }) {
  const count = shownTokens(model, 'council');
  return <g data-district="council" data-state={model.sites.council.severity}>
    <Block x={679} y={145} width={83} depth={76} height={39} tone="council" />
    <path d="m590 145 77-51 111 48-78 47Z" fill="#77836e" stroke="#b3b396" strokeWidth="2" />
    <path d="m590 145 77-51 33 95Z" fill="#929b7e" />
    <path d="m609 170 73 37v41l-73-36Z" fill="#435444" />
    {[0, 1, 2, 3, 4].map((index) => <path key={index} d={`m${617 + index * 14} ${178 + index * 7} 6 3v30l-6-3Z`} fill="#cbc5a1" />)}
    <path d="m603 216 85 43 16-8-85-43Z" fill="#b2b199" />
    <path d="m597 222 92 46 23-11-92-46Z" fill="#83937b" />
    <path d="M702 100V58" stroke="#a4a98b" strokeWidth="2" /><path d="m704 59 28 5-8 10-20-4Z" fill="#b3a06a" />
    <g data-dossiers={count}>
      {slots.slice(0, count).map((index) => <g key={index} transform={`translate(${642 + index * 15} ${279 + index % 2 * 6})`}>
        <path d="m0 0 12-6 10 5-12 6Z" fill="#c6b77b" stroke="#f0deb0" />
        <path d="m0 0 10 5v5L0 5Z" fill="#8c8158" /><path d="m10 5 12-6v5l-12 6Z" fill="#a49b74" />
      </g>)}
    </g>
  </g>;
}

function Market({ model }: { model: LivingWorldPresentation }) {
  const count = shownTokens(model, 'market');
  return <g data-district="market" data-state={model.sites.market.severity}>
    <Block x={307} y={341} width={60} depth={46} height={31} tone="market" />
    <path d="m252 333 52-27 69 35-50 27Z" fill="#b4a66e" stroke="#d4c69c" strokeWidth="1.4" />
    <path d="m267 325 67 35m-44-47 66 35" stroke="#5f7761" strokeWidth="12" />
    <path d="m254 334 68 34v11l-68-34Zm68 34 51-27v11l-51 27Z" fill="#8c7f58" />
    <path d="M255 343v35m69-4v41m49-65v33" stroke="#b3a985" strokeWidth="3" />
    <Block x={416} y={377} width={55} depth={40} height={28} tone="market" />
    <path d="m368 368 46-24 65 33-46 24Z" fill="#617d67" stroke="#a8b29a" strokeWidth="1.4" />
    <path d="m382 361 64 33m-40-46 62 33" stroke="#b7a878" strokeWidth="10" />
    <path d="M370 374v30m64-4v37m44-58v32" stroke="#b3a985" strokeWidth="3" />
    <g data-market-crates={count}>
      {slots.slice(0, count).map((index) => <g key={index}>
        <Block x={316 + index % 3 * 27} y={423 + Math.floor(index / 3) * 23 + index % 3 * 3} width={17} depth={16} height={15} tone={index % 2 ? 'food' : 'crate'} />
        <path d={`m${304 + index % 3 * 27} ${422 + Math.floor(index / 3) * 23 + index % 3 * 3} 12 6m-7-14v14`} stroke="#dac395" strokeWidth="1" />
      </g>)}
    </g>
    {count === 0 ? <path data-empty-market="true" d="m298 430 87 9-32 20-75-16Z" fill="none" stroke="#b7b093" strokeDasharray="5 5" /> : null}
  </g>;
}

function Health({ model }: { model: LivingWorldPresentation }) {
  const burden = shownTokens(model, 'health');
  const medicines = model.goods.medicine === null ? 0 : Math.round(model.goods.medicine * 6 / 100);
  return <g data-district="health" data-state={model.sites.health.severity}>
    <Block x={719} y={337} width={63} depth={74} height={42} tone="hospital" />
    <Block x={656} y={362} width={64} depth={42} height={30} tone="hospital" />
    <path d="m636 310 74-39 83 41-73 40Z" fill="#adb2a0" stroke="#d1d3b9" strokeWidth="1.5" />
    <path d="m703 292 15 8 16-8 12 6-16 8 15 8-12 6-15-8-16 8-12-6 16-8-15-8Z" fill="#537966" />
    {[0, 1, 2, 3].map((index) => <path key={index} d={`m${650 + index * 17} ${357 + index * 8.5} 9 4.5v13l-9-4.5Z`} fill="#4c675d" />)}
    <path d="m722 374 16-8v24l-16 8Z" fill="#253d34" />
    <g data-hospital-burden={burden}>
      {slots.slice(0, burden).map((index) => <g key={index}>
        <path d={`M${735 + index * 14} ${429 - index * 7}v-26`} stroke="#cfbd8b" strokeWidth="2" />
        <path d={`m${736 + index * 14} ${403 - index * 7} 11 3-4 8-7-2Z`} fill={model.sites.health.severity === 'critical' ? '#d89978' : '#c7b778'} />
      </g>)}
    </g>
    <g data-medicine-slots={medicines}>
      {slots.map((index) => <polygon key={index} points={`${621 + index * 12},428 ${630 + index * 12},432 ${630 + index * 12},439 ${621 + index * 12},435`} fill={index < medicines ? '#b1c8a6' : '#3d5045'} />)}
    </g>
    <text x="649" y="454" className="lwd-map-note">의약품</text>
  </g>;
}

function Terrain({ selected, illustrated = false }: { selected: LivingWorldSite; illustrated?: boolean }) {
  if (illustrated) return <g className="lwd-plots lwd-illustrated-plots">
    <path className={selected === 'industry' ? 'is-selected' : ''} d="m139 106 136-54 181 57 31 50-40 74-161 23-144-67Z" />
    <path className={selected === 'council' ? 'is-selected' : ''} d="m551 113 149-64 163 63 33 51-106 82-195-9-70-51Z" />
    <path className={selected === 'market' ? 'is-selected' : ''} d="m118 303 170-45 163 40 38 76-96 83-164 32-151-86Z" />
    <path className={selected === 'health' ? 'is-selected' : ''} d="m561 283 179-6 139 60 51 77-150 74-149-32-91-99Z" />
  </g>;
  return <>
    <path d="m83 287 421-206 421 206v18L504 527 83 305Z" fill="#344536" stroke="#708065" strokeWidth="2" />
    <path d="m83 287 421-206 421 206-421 222Z" fill="#607451" />
    <path d="m108 287 395-193 396 193-396 204Z" fill="#73805b" opacity=".38" />
    <path d="m201 286 307-151 322 158-326 163Z" fill="none" stroke="#a8a082" strokeWidth="39" />
    <path d="m204 286 304-149 319 156-323 161Z" fill="none" stroke="#d0c3a0" strokeWidth="25" opacity=".53" />
    <path d="m351 205 312 153m-312 16 309-150" stroke="#b3a783" strokeWidth="20" />
    <path d="m351 205 312 153m-312 16 309-150" stroke="#d4c5a0" strokeWidth="2" strokeDasharray="3 7" opacity=".55" />
    <g className="lwd-plots">
      <path className={selected === 'industry' ? 'is-selected' : ''} d="m182 224 122-60 140 72-116 61Z" />
      <path className={selected === 'council' ? 'is-selected' : ''} d="m574 207 113-62 139 68-128 68Z" />
      <path className={selected === 'market' ? 'is-selected' : ''} d="m226 365 126-63 151 77-126 72Z" />
      <path className={selected === 'health' ? 'is-selected' : ''} d="m588 371 125-61 129 65-133 76Z" />
    </g>
    <path d="m480 276 28-14 29 14v23l-29 15-28-15Z" fill="#9caa88" stroke="#c4c6a5" />
    <path d="m480 276 28 14 29-14-29-14Z" fill="#bac2a1" />
    <path d="M508 274v-31" stroke="#6c7c64" strokeWidth="5" />
    <circle cx="508" cy="240" r="7" fill="#c1c9a6" />
    <Tree x={183} y={300} /><Tree x={145} y={279} scale={.8} /><Tree x={536} y={139} /><Tree x={823} y={314} /><Tree x={860} y={292} scale={.8} /><Tree x={526} y={458} scale={.75} /><Tree x={548} y={470} />
    <path d="m442 472 19-10 27 13-19 10Z" fill="#6f8c70" stroke="#95aa84" /><path d="m459 482 20-10 28 13-20 10Z" fill="#5f7d66" stroke="#95aa84" />
  </>;
}

/** Kept separate from local motion state so read-only interactions can be tested without a DOM. */
export function LivingWorldDioramaView({ presentation, selected, onSelect, artSrc, detailId = 'living-world-detail', motionEnabled, onToggleMotion }: LivingWorldDioramaProps & {
  motionEnabled: boolean; onToggleMotion: () => void;
}) {
  const current = presentation.sites[selected];
  return <div className={`living-world-diorama${motionEnabled ? ' has-motion' : ''}`} data-week={presentation.week ?? 'unknown'}>
    <div className="lwd-toolbar"><span>국가 집계 모식도</span><button type="button" className="lwd-motion-control" aria-pressed={motionEnabled} onClick={onToggleMotion}>장면 움직임 <strong>{motionEnabled ? '켜짐' : '꺼짐'}</strong></button></div>
    <div className="lwd-board" data-has-art={Boolean(artSrc)}>
      {artSrc ? <img className="lwd-terrain-art" src={artSrc} alt="" aria-hidden="true" decoding="async" loading="lazy" /> : null}
      <div className="lwd-atmosphere" aria-hidden="true" />
      <svg className="lwd-scene" viewBox="0 0 1000 571.4286" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <Terrain selected={selected} illustrated={Boolean(artSrc)} />
        <Industry model={presentation} />
        <Council model={presentation} />
        <Market model={presentation} />
        <Health model={presentation} />
      </svg>
      <div className="lwd-hotspots" role="group" aria-label="현장에서 살펴볼 네 장소">
        {districts.map(({ id, title, number }) => {
          const site = presentation.sites[id];
          return <button key={id} type="button" className={`lwd-hotspot lwd-hotspot-${id} is-${site.severity}${selected === id ? ' is-selected' : ''}`} aria-pressed={selected === id} aria-controls={detailId} aria-label={`${title}. ${site.label}. ${site.evidence}. 상세 살펴보기`} title={`${site.evidence}\n${site.visibleMeaning}`} onClick={() => onSelect(id)}>
            <span className="lwd-site-label"><span className="lwd-site-heading"><small>{number}</small><strong>{title}</strong><i aria-hidden="true" /></span><span className="lwd-site-status">{site.label}</span></span>
          </button>;
        })}
      </div>
      <div className="lwd-signals" aria-hidden="true" key={presentation.week ?? 'unknown'}>
        {districts.map(({ id }) => activeSite(presentation, id) ? <span key={id} data-symbolic-activity={id} className={`lwd-signal lwd-signal-${id} is-${presentation.sites[id].severity}`} style={{ '--lwd-strength': presentation.sites[id].activityLevel } as CSSProperties} /> : null)}
      </div>
      <div className="lwd-compass" aria-hidden="true"><i />FIELD<br />BOARD</div>
    </div>
    <div className={`lwd-current is-${current.severity}`} aria-live="polite" aria-atomic="true"><span className="lwd-current-label">{stateNames[current.severity]}</span><p>{current.evidence}</p></div>
    <p className="lwd-reading">{current.visibleMeaning}</p>
    <p className="lwd-note">장소 선택은 조회만 합니다. 표식은 국가 지표이며, 실제 도시·인구·운송 장면이 아닙니다.</p>
  </div>;
}

export function LivingWorldDiorama(props: LivingWorldDioramaProps) {
  const [motionEnabled, setMotionEnabled] = useState(true);
  return <LivingWorldDioramaView {...props} motionEnabled={motionEnabled} onToggleMotion={() => setMotionEnabled((enabled) => !enabled)} />;
}
