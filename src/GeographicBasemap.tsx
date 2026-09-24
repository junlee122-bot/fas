import { memo } from 'react';
import { geographicBounds, getGeographicPlotBounds, projectGeographicPoint } from './geographicProjection';
import type { TheaterId } from './types';
import './geographicBasemap.css';

const waterLabels = {
  europe: [
    { text: '북대서양', latitude: 48, longitude: -21 },
    { text: '북해', latitude: 57, longitude: 3 },
    { text: '지중해', latitude: 35, longitude: 18 },
    { text: '흑해', latitude: 43, longitude: 34 },
    { text: '노르웨이해', latitude: 69, longitude: 4 },
  ],
  asia: [
    { text: '인도양', latitude: -14, longitude: 80 },
    { text: '벵골만', latitude: 12, longitude: 87 },
    { text: '남중국해', latitude: 13, longitude: 114 },
    { text: '필리핀해', latitude: 19, longitude: 135 },
    { text: '태평양', latitude: 31, longitude: 174 },
    { text: '산호해', latitude: -18, longitude: 157 },
    { text: '오호츠크해', latitude: 53, longitude: 150 },
  ],
} as const;

/** SVG group embedded beneath every gameplay marker/route using this projection. */
export const GeographicBasemap = memo(function GeographicBasemap({ theater }: { theater: TheaterId }) {
  const bounds = geographicBounds[theater];
  const plot = getGeographicPlotBounds(theater);
  const longitudeStep = theater === 'asia' ? 20 : 10;
  const latitudes = Array.from({ length: 19 }, (_, index) => index * 10 - 90)
    .filter((latitude) => latitude > bounds.south && latitude < bounds.north);
  const longitudes = Array.from({ length: 37 }, (_, index) => index * longitudeStep - 180)
    .filter((longitude) => longitude > bounds.west && longitude < bounds.east);
  return (
    <g className={`geographic-basemap geographic-basemap--${theater}`} pointerEvents="none" aria-label="실제 위경도 기반 지형도">
      <defs>
        <linearGradient id={`geographic-water-${theater}`} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#14272b" />
          <stop offset="100%" stopColor="#223b3d" />
        </linearGradient>
      </defs>
      <rect width="1200" height="760" fill={`url(#geographic-water-${theater})`} />
      <image className="geographic-physical-vectors" href={`${import.meta.env.BASE_URL}assets/geography/${theater}-natural-earth-10m.svg`} x="0" y="0" width="1200" height="760" />
      <g className="geographic-graticule" aria-hidden="true">
        {latitudes.map((latitude) => {
          const point = projectGeographicPoint(theater, { latitude, longitude: bounds.west });
          return <line key={`lat-${latitude}`} x1={plot.x} x2={plot.x + plot.width} y1={point.y} y2={point.y} className={latitude === 0 ? 'geographic-equator' : undefined} />;
        })}
        {longitudes.map((longitude) => {
          const point = projectGeographicPoint(theater, { latitude: bounds.north, longitude });
          return <line key={`lon-${longitude}`} x1={point.x} x2={point.x} y1={plot.y} y2={plot.y + plot.height} />;
        })}
      </g>
      <g className="geographic-water-labels" aria-hidden="true">
        {waterLabels[theater].map(({ text, latitude, longitude }) => {
          const point = projectGeographicPoint(theater, { latitude, longitude });
          return <text key={text} x={point.x} y={point.y}>{text}</text>;
        })}
      </g>
      <rect className="geographic-extent" {...plot} />
    </g>
  );
});
