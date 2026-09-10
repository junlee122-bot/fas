import type { Faction, Territory } from './types';
import type { StrategicFrontDefinition } from './strategicMapData';

export interface MapConnection {
  from: Territory;
  to: Territory;
  isFront: boolean;
}

export interface FramedMapPoint {
  x: number;
  y: number;
  frame?: string;
}

export interface FrontLabelAnchor {
  front: FrontSummary;
  x: number;
  y: number;
  frame: string;
}

export type TerrainGlyphKind = 'mountain' | 'forest' | 'urban' | 'naval' | 'desert' | 'river' | 'plains';
export type MapLabelMode = 'essential' | 'operational' | 'all';

export interface MapMarkerPresentationInput {
  mode: MapLabelMode;
  selected: boolean;
  hasUnits: boolean;
  planningOrigin: boolean;
  validTarget: boolean;
  siteType: Territory['siteType'];
  labelTier: number;
  value: number;
  frontId?: string;
  zoom: number;
}

export interface MapMarkerPresentation {
  showLabel: boolean;
  secondary: boolean;
  showDetailGlyph: boolean;
}

export interface MapLabelCandidate {
  id: string;
  x: number;
  y: number;
  text: string;
  priority: number;
  force?: boolean;
  width?: number;
  height?: number;
}

export interface MapCamera {
  centerX: number;
  centerY: number;
  zoom: number;
}

export interface FrontSummary extends StrategicFrontDefinition {
  territoryIds: string[];
  activeContacts: number;
  controlled: number;
  hostile: number;
  neutral: number;
  controlPercent: number;
  averageSupply: number;
  intensity: number;
  status: '우세' | '경합' | '위기' | '후방';
}

export const DEFAULT_MAP_CAMERA: MapCamera = { centerX: 600, centerY: 380, zoom: 1 };
// Local game builds retain the archival scans at source resolution. Six-times
// zoom exposes printed railways, routes and place names that the old
// deployment-oriented 240% ceiling hid from the player.
export const MAX_MAP_ZOOM = 6;

export function deriveMapMarkerPresentation({
  mode,
  selected,
  hasUnits,
  planningOrigin,
  validTarget,
  siteType,
  labelTier,
  value,
  frontId,
  zoom,
}: MapMarkerPresentationInput): MapMarkerPresentation {
  const essentialLabel = selected
    || hasUnits
    || planningOrigin
    || validTarget
    || (siteType === 'capital' && labelTier === 1);
  const operationalLabel = essentialLabel
    || (labelTier === 1 && value >= 8)
    || (frontId !== undefined && value >= 9);
  const fullLabel = essentialLabel
    || (labelTier === 1 && zoom >= 1.55)
    || (labelTier === 2 && zoom >= 2.3)
    || zoom >= 2.4;
  const showLabel = mode === 'essential' ? essentialLabel : mode === 'operational' ? operationalLabel : fullLabel;
  const secondary = mode === 'essential'
    ? !essentialLabel && value < 9
    : mode === 'operational' && !operationalLabel && labelTier > 1;
  return {
    showLabel,
    secondary,
    showDetailGlyph: showLabel && (selected || mode !== 'essential' || siteType === 'capital'),
  };
}

function estimateMapLabelWidth(text: string): number {
  const glyphWidth = [...text].reduce((width, character) => (
    width + (/[^\u0000-\u00ff]/.test(character) ? 10 : 6.4)
  ), 0);
  return Math.max(48, Math.min(190, glyphWidth + 18));
}

export function deriveVisibleMapLabelIds(
  candidates: MapLabelCandidate[],
  zoom: number,
  padding = 7,
): Set<string> {
  const safeZoom = Math.max(1, zoom);
  const accepted: Array<{ left: number; right: number; top: number; bottom: number }> = [];
  const visible = new Set<string>();

  [...candidates]
    .sort((a, b) => Number(Boolean(b.force)) - Number(Boolean(a.force)) || b.priority - a.priority || a.id.localeCompare(b.id))
    .forEach((candidate) => {
      const width = (candidate.width ?? estimateMapLabelWidth(candidate.text)) / safeZoom;
      const height = (candidate.height ?? 18) / safeZoom;
      const horizontalPadding = padding / safeZoom;
      const verticalPadding = Math.max(3, padding * 0.65) / safeZoom;
      const bounds = {
        left: candidate.x - width / 2 - horizontalPadding,
        right: candidate.x + width / 2 + horizontalPadding,
        top: candidate.y - height / 2 - verticalPadding,
        bottom: candidate.y + height / 2 + verticalPadding,
      };
      const collides = accepted.some((item) => !(
        bounds.right < item.left
        || bounds.left > item.right
        || bounds.bottom < item.top
        || bounds.top > item.bottom
      ));
      if (collides && !candidate.force) return;
      accepted.push(bounds);
      visible.add(candidate.id);
    });

  return visible;
}

export function clampMapCamera(camera: MapCamera): MapCamera {
  const zoom = Math.max(1, Math.min(MAX_MAP_ZOOM, camera.zoom));
  const halfWidth = 600 / zoom;
  const halfHeight = 380 / zoom;
  return {
    zoom,
    centerX: Math.max(halfWidth, Math.min(1200 - halfWidth, camera.centerX)),
    centerY: Math.max(halfHeight, Math.min(760 - halfHeight, camera.centerY)),
  };
}

export function deriveMapConnections(territories: Territory[]): MapConnection[] {
  const territoryById = new Map(territories.map((territory) => [territory.id, territory]));
  return territories.flatMap((territory) => territory.neighbors.flatMap((neighborId) => {
    const neighbor = territoryById.get(neighborId);
    if (!neighbor || territory.id.localeCompare(neighbor.id) >= 0) return [];
    return [{
      from: territory,
      to: neighbor,
      isFront: territory.controller !== neighbor.controller
        && territory.controller !== 'neutral'
        && neighbor.controller !== 'neutral',
    }];
  }));
}

function getMapFrame(point: FramedMapPoint | undefined): string {
  return point?.frame ?? 'main';
}

export function deriveSameFrameMapConnections(
  connections: MapConnection[],
  positions: Record<string, FramedMapPoint>,
): MapConnection[] {
  return connections.filter(({ from, to }) => {
    const fromPoint = positions[from.id];
    const toPoint = positions[to.id];
    return fromPoint !== undefined
      && toPoint !== undefined
      && getMapFrame(fromPoint) === getMapFrame(toPoint);
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function selectLargestFrameGroup<T extends { frame: string }>(groups: Map<string, T[]>): T[] {
  return [...groups.values()].sort((a, b) => b.length - a.length || a[0].frame.localeCompare(b[0].frame))[0] ?? [];
}

/**
 * Locate a front over its real hostile contact segments. A centroid of every
 * territory can land between unrelated map insets or far behind the fighting;
 * medians keep a single distant island from pulling the label off its front.
 */
export function deriveFrontLabelAnchors(
  fronts: FrontSummary[],
  connections: MapConnection[],
  positions: Record<string, FramedMapPoint>,
): FrontLabelAnchor[] {
  return fronts.flatMap((front) => {
    const memberIds = new Set(front.territoryIds);
    const contactGroups = new Map<string, Array<FramedMapPoint & { frame: string }>>();

    connections.forEach(({ from, to, isFront }) => {
      if (!isFront || (!memberIds.has(from.id) && !memberIds.has(to.id))) return;
      const fromPoint = positions[from.id];
      const toPoint = positions[to.id];
      if (!fromPoint || !toPoint) return;
      const frame = getMapFrame(fromPoint);
      if (frame !== getMapFrame(toPoint)) return;
      const group = contactGroups.get(frame) ?? [];
      group.push({
        x: (fromPoint.x + toPoint.x) / 2,
        y: (fromPoint.y + toPoint.y) / 2,
        frame,
      });
      contactGroups.set(frame, group);
    });

    let anchorPoints = selectLargestFrameGroup(contactGroups);
    if (!anchorPoints.length) {
      const memberGroups = new Map<string, Array<FramedMapPoint & { frame: string }>>();
      front.territoryIds.forEach((territoryId) => {
        const point = positions[territoryId];
        if (!point) return;
        const frame = getMapFrame(point);
        memberGroups.set(frame, [...(memberGroups.get(frame) ?? []), { ...point, frame }]);
      });
      anchorPoints = selectLargestFrameGroup(memberGroups);
    }
    if (!anchorPoints.length) return [];

    return [{
      front,
      x: median(anchorPoints.map((point) => point.x)),
      y: median(anchorPoints.map((point) => point.y)),
      frame: anchorPoints[0].frame,
    }];
  });
}

export function deriveValidTargetIds(
  territories: Territory[],
  originId: string | undefined,
  playerFaction: Exclude<Faction, 'neutral'>,
): Set<string> {
  if (!originId) return new Set();
  const territoryById = new Map(territories.map((territory) => [territory.id, territory]));
  const origin = territoryById.get(originId);
  return new Set(origin?.neighbors.filter((neighborId) => {
    const controller = territoryById.get(neighborId)?.controller;
    return controller !== undefined && controller !== playerFaction && controller !== 'neutral';
  }) ?? []);
}

export function deriveFrontSummaries(
  territories: Territory[],
  fronts: StrategicFrontDefinition[],
  playerFaction: Exclude<Faction, 'neutral'>,
): FrontSummary[] {
  const connections = deriveMapConnections(territories);
  return fronts.map((front) => {
    const members = territories.filter((territory) => territory.frontId === front.id);
    const memberIds = new Set(members.map((territory) => territory.id));
    const activeContacts = connections.filter(({ from, to, isFront }) => isFront && (memberIds.has(from.id) || memberIds.has(to.id))).length;
    const controlled = members.filter((territory) => territory.controller === playerFaction).length;
    const hostile = members.filter((territory) => territory.controller !== playerFaction && territory.controller !== 'neutral').length;
    const neutral = members.length - controlled - hostile;
    const contestedTotal = Math.max(1, controlled + hostile);
    const controlPercent = Math.round(controlled / contestedTotal * 100);
    const averageSupply = members.length ? Math.round(members.reduce((sum, territory) => sum + territory.supply, 0) / members.length) : 0;
    const intensity = Math.min(100, Math.round(activeContacts * 17 + Math.min(25, hostile * 3) + Math.max(0, 65 - averageSupply) * 0.45));
    const status: FrontSummary['status'] = activeContacts === 0
      ? '후방'
      : controlPercent >= 62
        ? '우세'
        : controlPercent >= 35
          ? '경합'
          : '위기';
    return {
      ...front,
      territoryIds: members.map((territory) => territory.id),
      activeContacts,
      controlled,
      hostile,
      neutral,
      controlPercent,
      averageSupply,
      intensity,
      status,
    };
  }).sort((a, b) => b.activeContacts - a.activeContacts || b.intensity - a.intensity || a.name.localeCompare(b.name, 'ko'));
}

export function getTerrainGlyphKind(terrain: string): TerrainGlyphKind {
  if (terrain.includes('산악') || terrain.includes('고원') || terrain.includes('구릉')) return 'mountain';
  if (terrain.includes('삼림') || terrain.includes('정글')) return 'forest';
  if (terrain.includes('도시') || terrain.includes('요새')) return 'urban';
  if (terrain.includes('해양') || terrain.includes('해안') || terrain.includes('도서') || terrain.includes('해군')) return 'naval';
  if (terrain.includes('사막')) return 'desert';
  if (terrain.includes('강')) return 'river';
  return 'plains';
}
