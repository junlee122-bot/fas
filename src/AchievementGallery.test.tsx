import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AchievementGallery } from './AchievementGallery';
import { achievementDefinitions } from './achievements';
import type { AchievementProgress, AchievementUnlock } from './achievements';
import { symbolicAchievementArtCaption, symbolicAchievementGoalCaption, worldSceneArt } from './worldSceneArt';

const symbolicIds = ['epidemic-contained', 'prepared-state', 'peace-dividend'];
const unlockFor = (id: string): AchievementUnlock => ({ id, unlockedWeek: 7, unlockedAt: '2026-09-18T00:00:00.000Z' });

function render(unlocks: AchievementUnlock[] = [], featuredId?: string, progress: Record<string, AchievementProgress> = {}) {
  const callbacks = { onClose: vi.fn(), onAcknowledge: vi.fn(), onOpenGallery: vi.fn(), onTrack: vi.fn() };
  const before = structuredClone({ unlocks, progress });
  const html = renderToStaticMarkup(<AchievementGallery unlocks={unlocks} progress={progress} featuredId={featuredId} {...callbacks} />);
  expect({ unlocks, progress }).toEqual(before);
  for (const callback of Object.values(callbacks)) expect(callback).not.toHaveBeenCalled();
  return html;
}

describe('achievement still-life honesty', () => {
  it('uses the medal emblem on the gallery without unlocking an achievement', () => {
    const html = render();
    expect(html).toMatch(/achievement-gallery-seal[\s\S]*?data-game-icon="medal"/);
    expect(html).not.toContain('CHALLENGE COMPLETE');
  });
  it('lazy-loads every gallery image with async decoding, including earned and legacy art', () => {
    const html = render([unlockFor('peace-dividend'), unlockFor('first-victory')]);
    const images = html.match(/<img\b[^>]*>/g) ?? [];
    expect(images).toHaveLength(achievementDefinitions.length);
    for (const image of images) {
      expect(image).toContain('loading="lazy"');
      expect(image).toContain('decoding="async"');
    }
  });

  it.each(['peace-dividend', 'first-victory'])('keeps the featured %s image immediate with async decoding', (id) => {
    const html = render([unlockFor(id)], id);
    const images = html.match(/<img\b[^>]*>/g) ?? [];
    expect(images).toHaveLength(1);
    expect(images[0]).toContain('decoding="async"');
    expect(images[0]).not.toContain('loading=');
  });

  it('limits the new artwork and captions to the three intended achievements', () => {
    expect(achievementDefinitions.filter((item) => item.artCaption).map((item) => item.id)).toEqual(symbolicIds);
    expect(achievementDefinitions.find((item) => item.id === 'peace-dividend')?.art).toBe(worldSceneArt.industry.src);
    for (const id of symbolicIds.slice(0, 2)) expect(achievementDefinitions.find((item) => item.id === id)?.art).toBe(worldSceneArt.health.src);
  });

  it('labels locked art as a goal, preserves all locks and does not treat a featured request as an unlock', () => {
    const html = render([], 'peace-dividend');
    expect(html.split(symbolicAchievementGoalCaption)).toHaveLength(4);
    expect(html).not.toContain(symbolicAchievementArtCaption);
    expect(html).not.toContain('CHALLENGE COMPLETE');
    expect(html).not.toContain('achievement-unlocked-title');
    expect(html.match(/class="achievement-lock"/g)).toHaveLength(achievementDefinitions.length);
    for (const source of [worldSceneArt.industry.src, worldSceneArt.health.src]) {
      expect(html).toContain(`src="${source}" alt="" aria-hidden="true"`);
    }
  });

  it.each(symbolicIds)('shows %s as symbolic earned art only with its persisted unlock', (id) => {
    const html = render([unlockFor(id)], id);
    expect(html).toContain('CHALLENGE COMPLETE');
    expect(html).toContain(symbolicAchievementArtCaption);
    expect(html).not.toContain(symbolicAchievementGoalCaption);
    expect(html).toContain('WEEK 8');
  });

  it('distinguishes earned and locked symbolism in the same gallery', () => {
    const html = render([unlockFor('peace-dividend')]);
    expect(html.split(symbolicAchievementArtCaption)).toHaveLength(2);
    expect(html.split(symbolicAchievementGoalCaption)).toHaveLength(3);
    expect(html.match(/class="achievement-lock"/g)).toHaveLength(achievementDefinitions.length - 1);
    expect(html).not.toContain('CHALLENGE COMPLETE');
  });

  it('does not mint an unlock or a completed banner from progress alone', () => {
    const progress = { 'peace-dividend': { current: 4, target: 4, percent: 100, complete: true, detail: '조건 충족' } };
    const html = render([], 'peace-dividend', progress);
    expect(html).not.toContain('CHALLENGE COMPLETE');
    expect(html).not.toContain(symbolicAchievementArtCaption);
    expect(html).toContain(symbolicAchievementGoalCaption);
    expect(html.match(/class="achievement-lock"/g)).toHaveLength(achievementDefinitions.length);
  });

  it('does not add a new caption to legacy achievement art', () => {
    const html = render([unlockFor('first-victory')], 'first-victory');
    expect(html).not.toContain('achievement-symbolic-caption');
  });
});
