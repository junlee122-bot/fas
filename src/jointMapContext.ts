import type { Territory, TheaterId } from './types';
import {
  getAvailableJointOperationTemplates, getJointOperationObjectives,
  type JointCampaignObjective, type JointForcesState,
} from './jointOperations';

/** Navigation intent only: it never allocates forces, spends resources or launches a mission. */
export interface JointMapContext {
  territoryId: string;
  territoryName: string;
  theater: TheaterId;
  objectiveId?: string;
  templateId?: string;
  explanation: string;
}

// Explicit links to the geographic scope already documented in jointOperations.objectiveSeeds.
// Do not infer a target from proximity, front membership, display names or map inset coordinates.
const objectiveByTerritory: Readonly<Record<string, string>> = {
  atlantic: 'north-atlantic-route', liverpool: 'north-atlantic-route',
  malta: 'mediterranean-route', alexandria: 'mediterranean-route',
  channel: 'channel-air-zone', dover: 'channel-air-zone', calais: 'channel-air-zone',
  ruhr: 'ruhr-industrial-area', narvik: 'norway-naval-bases',
  normandy: 'normandy-landing-sector', cherbourg: 'normandy-landing-sector',
  hawaii: 'south-pacific-route', brisbane: 'south-pacific-route',
  bombay: 'indian-ocean-route', ceylon: 'indian-ocean-route', calcutta: 'indian-ocean-route',
  solomons: 'solomons-air-zone', port_moresby: 'solomons-air-zone',
  japan_home: 'home-islands-industry', nagoya: 'home-islands-industry', osaka_kure: 'home-islands-industry',
  truk: 'truk-rabaul-bases', rabaul: 'truk-rabaul-bases',
  philippines: 'philippines-landing-sector', leyte: 'philippines-landing-sector',
};

function preferredTemplates(objective: JointCampaignObjective): string[] {
  switch (objective.kind) {
    case 'convoy-route': return objective.control >= 38
      ? ['atlantic-lifeline', 'armed-reconnaissance']
      : ['wolfpack-interdiction', 'armed-reconnaissance'];
    case 'air-zone': return ['fighter-sweep', 'armed-reconnaissance'];
    case 'industrial-area': return ['strategic-air-campaign', 'fighter-sweep', 'armed-reconnaissance'];
    case 'naval-base': return ['carrier-strike', 'armed-reconnaissance'];
    case 'landing-sector': return ['amphibious-cover', 'close-air-support', 'armed-reconnaissance'];
  }
}

export function getJointMapContext(territory: Territory, state: JointForcesState): JointMapContext {
  const theater = territory.theater ?? 'europe';
  const context: JointMapContext = {
    territoryId: territory.id, territoryName: territory.name, theater,
    explanation: '이 거점에 직접 연결된 합동작전 목표가 아직 없습니다. 이 전구 전체의 현황을 엽니다. 다른 지역의 목표를 대신 지정하지 않습니다.',
  };
  const objective = state.objectives[theater].find((item) => item.id === objectiveByTerritory[territory.id] && item.theater === theater);
  if (!objective) return context;
  const templates = getAvailableJointOperationTemplates(theater);
  const template = preferredTemplates(objective).map((id) => templates.find((item) => item.id === id)).find((item) =>
    item && getJointOperationObjectives(state, theater, item.kind).some((candidate) => candidate.id === objective.id));
  return {
    ...context, objectiveId: objective.id, templateId: template?.id,
    explanation: `지도에서 선택한 거점이 포함된 실제 작전 구역 ‘${objective.name}’(${objective.region})을 연결했습니다. ${template ? `‘${template.name}’ 계획만 사전 선택합니다.` : '현재 가능한 작전 유형이 없어 구역 현황만 표시합니다.'} 비용·배속은 승인 전까지 변경되지 않습니다.`,
  };
}
