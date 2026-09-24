import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getRole } from './campaign';
import { createEconomyState } from './economy';
import { createElectoralPoliticsState, type ElectionResult } from './electoralPolitics';
import { ElectionSituationRoom } from './ElectionSituationRoom';
import { createNationManagementState } from './nationManagement';
import type { GameState } from './types';

type Props = ComponentProps<typeof ElectionSituationRoom>;

function fixture(): Props {
  const game: GameState = { week: 48, manpower: 1200, politicalPower: 82, fuel: 70, steel: 108, factories: 34, stability: 72, warSupport: 78, commandPoints: 48, treasury: 860, victoryScore: 66, airPower: 61, navalPower: 56, intelNetwork: 64, enemyPressure: 42 };
  const economy = createEconomyState('china');
  return {
    state: createElectoralPoliticsState('china', game.week),
    nation: createNationManagementState('china', game, economy, 3, 'victory'),
    game, economy, role: getRole('china-tier1', 'china'),
    formatMoney: (value) => `금액 ${value.toFixed(1)}`,
    onCampaignAction: vi.fn(), onLaunchReferendum: vi.fn(),
  };
}

function render(props = fixture()) {
  const snapshot = () => JSON.stringify({ state: props.state, nation: props.nation, game: props.game, economy: props.economy, role: props.role });
  const before = snapshot();
  const html = renderToStaticMarkup(<ElectionSituationRoom {...props} />);
  expect(snapshot()).toBe(before);
  expect(props.onCampaignAction).not.toHaveBeenCalled();
  expect(props.onLaunchReferendum).not.toHaveBeenCalled();
  return html;
}

function candidateCards(html: string) {
  const grid = html.split('<div class="candidate-poll-grid">')[1]?.split('<div class="election-action-layout">')[0] ?? '';
  return grid.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
}

function candidateCard(html: string, name: string) {
  return candidateCards(html).find((card) => card.includes(`<strong>${name}</strong>`)) ?? '';
}

function pastResult(): ElectionResult {
  return {
    id: 'past-local-result', type: 'local', week: 24, round: 1,
    title: '이전 지방선거 확정 기록', winnerCandidateId: 'historical-churchill', winnerName: '윈스턴 처칠', winnerParty: '당시 정당', playerWon: false,
    turnout: 70, integrity: 80,
    candidateResults: [
      { candidateId: 'historical-churchill', name: '윈스턴 처칠', party: '당시 정당', votes: 6000, voteShare: 60, seats: 6, electors: 6 },
      { candidateId: 'mao', name: '마오쩌둥', party: '당시 상대 정당', votes: 4000, voteShare: 40, seats: 4, electors: 4 },
    ],
    regionalResults: [],
    mayorResults: [{ city: '과거 지역', winnerName: '윈스턴 처칠', party: '당시 정당', voteShare: 60, turnout: 70, alignment: 'opposition' }],
    referendum: null, summary: '저장된 과거 개표 기록', consequence: '이미 확정된 지역 위임',
  };
}

describe('election candidate portrait identity boundaries', () => {
  it('keeps the real China fixture player Chiang generic while showing opposition Mao as an illustrated person', () => {
    const props = fixture();
    expect(props.state.activeCampaign?.playerCandidateId).toBe('chiang');
    const html = render(props);
    const player = candidateCard(html, '장제스');
    const opposition = candidateCard(html, '마오쩌둥');
    expect(candidateCards(html)).toHaveLength(3);
    expect(player).toContain('플레이 진영');
    expect(player).toContain('data-person-portrait="fallback"');
    expect(player).toContain('data-portrait-kind="player"');
    expect(player).not.toContain('<img');
    expect(html).not.toContain('data-person-portrait="chiang"');
    expect(opposition).toContain('data-person-portrait="mao"');
    expect(opposition).toContain('data-portrait-kind="illustrated"');
    expect(opposition).toContain('alt="마오쩌둥 · AI 재구성 초상 · 실제 사진 아님"');
    expect(opposition).not.toContain('플레이 진영');
    expect(candidateCard(html, '장란')).toContain('data-portrait-kind="monogram"');
  });

  it.each(['chiang', 'mao', 'zhang-lan'])('uses only current playerCandidateId=%s, independent of candidate order or the governing identity', (playerCandidateId) => {
    const props = fixture();
    const campaign = props.state.activeCampaign!;
    props.state.activeCampaign = { ...campaign, playerCandidateId, candidateIds: [...campaign.candidateIds].reverse() };
    props.state.candidates = [...props.state.candidates].reverse();
    props.state.governingCandidateId = 'chiang';
    const html = render(props);
    expect(html.match(/data-portrait-kind="player"/g)).toHaveLength(1);
    for (const candidate of props.state.candidates) {
      const card = candidateCard(html, candidate.name);
      expect(card).not.toBe('');
      if (candidate.id === playerCandidateId) {
        expect(card).toContain('data-portrait-kind="player"');
        expect(card).toContain('플레이 진영');
        expect(card).not.toContain('<img');
      } else {
        expect(card).not.toContain('data-portrait-kind="player"');
        expect(card).not.toContain('플레이 진영');
        expect(card).toContain(`data-portrait-kind="${candidate.id === 'zhang-lan' ? 'monogram' : 'illustrated'}"`);
      }
    }
  });

  it('does not attach a named portrait to an unregistered candidate or partial name match', () => {
    const props = fixture();
    props.state.candidates = props.state.candidates.map((candidate) => candidate.id === 'mao'
      ? { ...candidate, id: 'unregistered-candidate', name: '마오쩌둥 연구회 후보' } : candidate);
    props.state.activeCampaign!.candidateIds = ['chiang', 'unregistered-candidate', 'zhang-lan'];
    const html = render(props);
    const unknown = candidateCard(html, '마오쩌둥 연구회 후보');
    expect(unknown).toContain('data-person-portrait="fallback"');
    expect(unknown).toContain('data-portrait-kind="monogram"');
    expect(unknown).not.toContain('<img');
    expect(html).not.toContain('data-person-portrait="mao"');
  });

  it('renders portraits only for resolved active candidate IDs, never missing entries or inactive known people', () => {
    const props = fixture();
    props.state.activeCampaign!.candidateIds = ['missing-candidate', ...props.state.activeCampaign!.candidateIds];
    props.state.candidates.push({ ...props.state.candidates[1], id: 'inactive-churchill', name: '윈스턴 처칠' });
    const html = render(props);
    expect(candidateCards(html)).toHaveLength(3);
    expect(html.match(/data-person-portrait=/g)).toHaveLength(3);
    expect(html).not.toContain('data-person-portrait="churchill"');
    expect(html).not.toContain('윈스턴 처칠');
  });

  it.each([true, false])('keeps historical national and mayor records portrait-free when an active campaign exists=%s', (active) => {
    const props = fixture();
    props.state.campaignHistory = [pastResult()];
    if (!active) props.state.activeCampaign = null;
    const html = render(props);
    const historicalRecords = html.split('<div class="election-results-ledger">')[1] ?? '';
    expect(historicalRecords).toContain('이전 지방선거 확정 기록');
    expect(historicalRecords).toContain('윈스턴 처칠');
    expect(historicalRecords).toContain('마오쩌둥');
    expect(historicalRecords).toContain('주요 도시 시장 선거 결과');
    expect(historicalRecords).not.toContain('data-person-portrait=');
    expect(historicalRecords).not.toContain('<img');
    expect(html.match(/data-person-portrait=/g) ?? []).toHaveLength(active ? 3 : 0);
    if (!active) expect(html).toContain('현재 진행 중인 전국 투표가 없습니다');
  });

  it('does not reuse candidate portraits for referendum camps', () => {
    const props = fixture();
    props.state.activeCampaign = { ...props.state.activeCampaign!, type: 'referendum', referendumTopicId: 'universal-suffrage', momentum: { yes: 55, no: 45 } };
    const html = render(props);
    expect(html).toContain('국민투표 문안');
    expect(html).toContain('찬성 진영 기세 55.0');
    expect(html).not.toContain('candidate-poll-grid');
    expect(html).not.toContain('data-person-portrait=');
  });
});
