import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { careerRoles } from './campaign';
import { KoreaCampaignBrief } from './KoreaCampaignBrief';
import { getKoreaRoleGuide } from './koreaExperience';

describe('Korean campaign briefing illustration', () => {
  it.each(['military', 'politics', 'intelligence'] as const)('renders one period-gated illustration without changing the %s role', (branch) => {
    const role = structuredClone(careerRoles.find((candidate) => candidate.nationId === 'korea' && candidate.branch === branch)!);
    const before = structuredClone(role);
    const guide = getKoreaRoleGuide(branch);

    // Render the real catalog and figure: omitting the briefing's year={1942}
    // would make the period-gated independence illustration disappear.
    const html = renderToStaticMarkup(<KoreaCampaignBrief role={role} />);
    expect(html).toContain('1942 · CHONGQING TO KOREA');
    expect(html.match(/data-game-illustration=/g) ?? []).toHaveLength(1);
    const figures = html.match(/<figure\b[^>]*data-game-illustration="independence-network"[\s\S]*?<\/figure>/g) ?? [];
    expect(figures).toHaveLength(1);
    const figure = figures[0]!;
    expect(figure).toContain('game-illustration--compact');
    expect(figure).toContain('<figcaption>');
    expect(figure).toContain('상징 삽화 · 실제 기록 아님');
    const images = figure.match(/<img\b[^>]*>/g) ?? [];
    expect(images).toHaveLength(1);
    expect(images[0]!).toContain('independence-network.webp');
    expect(images[0]!).toContain('alt=""');
    expect(images[0]!).toContain('loading="lazy"');
    expect(images[0]!).toContain('decoding="async"');
    // The only controls inspect and close the read-only artwork; no game action
    // or navigation is introduced into the briefing illustration.
    const buttons = figure.match(/<button\b[^>]*>/g) ?? [];
    expect(buttons).toHaveLength(2);
    expect(buttons[0]!).toContain('type="button"');
    expect(buttons[0]!).toContain('aria-haspopup="dialog"');
    expect(buttons[0]!).toContain(' · 삽화 확대"');
    expect(buttons[1]!).toContain('type="button"');
    expect(buttons[1]!).toContain('aria-label="삽화 확대 닫기"');
    expect(figure).toMatch(/<dialog\b/);
    expect(figure).not.toMatch(/<dialog[^>]+\sopen(?:\s|=|>)/);
    expect(figure).not.toMatch(/<a\s|<input\b/);

    expect(html).toContain(guide.mission);
    expect(html).toContain(guide.firstAction);
    expect(html).toContain(guide.authorityBoundary);
    expect(html).toContain(role.expectation);
    expect(role).toEqual(before);
  });
});
