import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LivingWorldDiorama, LivingWorldDioramaView } from './LivingWorldDiorama';
import type { LivingWorldPresentation, LivingWorldSite } from './livingWorldPresentation';

const siteIds: LivingWorldSite[] = ['industry', 'council', 'market', 'health'];
function fixture(): LivingWorldPresentation {
  return {
    week: 3,
    factories: { total: 12, military: 8, civilian: 4, militaryShare: 2 / 3, civilianShare: 1 / 3, overAllocated: false },
    goods: { consumer: 80, food: 90, medicine: 95 },
    hospital: { active: false, load: null },
    staffIssues: 2,
    sites: {
      industry: { id: 'industry', severity: 'stable', label: '군수·민수 역량 분담', evidence: '총 역량 12 · 군수 배치 8 · 민수 여력 4', visibleMeaning: '실제 공장 수가 아닌 배치 비중', activityLevel: 3, tokenCount: 4 },
      market: { id: 'market', severity: 'stable', label: '생활재 공급 원활', evidence: '소비재 80 / 100 · 식량 90 / 100', visibleMeaning: '물품 표식은 공급 지수', activityLevel: 3, tokenCount: 5 },
      health: { id: 'health', severity: 'stable', label: '진행 중 유행 없음', evidence: '의약품 95 / 100 · 진행 중 유행 없음', visibleMeaning: '환자 수가 아닌 병상 부담', activityLevel: 0, tokenCount: 0 },
      council: { id: 'council', severity: 'watch', label: '참모 후속 대화 대기', evidence: '현재 권한 범위의 참모 서사 현안 2건', visibleMeaning: '참석자 수가 아닌 현안 표식', activityLevel: 2, tokenCount: 2 },
    },
  };
}
function descendants(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  const result: ReactElement<Record<string, unknown>>[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return;
    result.push(child, ...descendants(child.props.children as ReactNode));
  });
  return result;
}
const callbacks = () => ({ onSelect: vi.fn(), onToggleMotion: vi.fn() });

describe('living world fieldboard', () => {
  it('renders a continuous SVG scene, four accessible places and no engine action on render', () => {
    const presentation = fixture();
    const before = JSON.stringify(presentation);
    const handlers = callbacks();
    const view = LivingWorldDioramaView({ presentation, selected: 'industry', motionEnabled: true, ...handlers });
    const html = renderToStaticMarkup(view);
    const controls = descendants(view).filter((item) => item.type === 'button');
    expect(controls).toHaveLength(5);
    expect(controls.filter((item) => item.props['aria-controls'] === 'living-world-detail')).toHaveLength(4);
    expect(html.match(/data-district=/g)).toHaveLength(4);
    expect(html).toContain('국가 집계 모식도');
    expect(html).toContain('장소 선택은 조회만 합니다.');
    expect(handlers.onSelect).not.toHaveBeenCalled();
    expect(handlers.onToggleMotion).not.toHaveBeenCalled();
    expect(JSON.stringify(presentation)).toBe(before);
  });

  it.each(siteIds)('selects %s only on the corresponding deliberate click', (selected) => {
    const presentation = fixture();
    const handlers = callbacks();
    const view = LivingWorldDioramaView({ presentation, selected, motionEnabled: false, detailId: 'custom-detail', ...handlers });
    const button = descendants(view).find((item) => item.type === 'button' && item.props['aria-controls'] === 'custom-detail' && item.props['aria-pressed'] === true)!;
    expect(button.props['aria-label']).toContain(presentation.sites[selected].evidence);
    expect(button.props.title).toContain(presentation.sites[selected].visibleMeaning);
    (button.props.onClick as () => void)();
    expect(handlers.onSelect).toHaveBeenCalledExactlyOnceWith(selected);
    expect(handlers.onToggleMotion).not.toHaveBeenCalled();
  });

  it('shows changed military and civilian allocations, not a decorative fixed factory picture', () => {
    const presentation = fixture();
    const before = renderToStaticMarkup(<LivingWorldDiorama presentation={presentation} selected="industry" onSelect={vi.fn()} />);
    presentation.factories = { total: 12, military: 12, civilian: 0, militaryShare: 1, civilianShare: 0, overAllocated: false };
    presentation.sites.industry = { ...presentation.sites.industry, label: '전 역량 군수 배치', evidence: '총 역량 12 · 군수 배치 12 · 민수 여력 0' };
    const after = renderToStaticMarkup(<LivingWorldDiorama presentation={presentation} selected="industry" onSelect={vi.fn()} />);
    expect(before).toContain('data-allocation="military" data-active-slots="4"');
    expect(before).toContain('data-allocation="civilian" data-active-slots="2"');
    expect(after).toContain('data-allocation="military" data-active-slots="6"');
    expect(after).toContain('data-allocation="civilian" data-active-slots="0"');
    expect(after).not.toEqual(before);
  });

  it('changes supply crates and pending dossiers directly with their current presentation', () => {
    const presentation = fixture();
    const rich = renderToStaticMarkup(<LivingWorldDiorama presentation={presentation} selected="market" onSelect={vi.fn()} />);
    presentation.sites.market = { ...presentation.sites.market, severity: 'critical', tokenCount: 0, label: '생활재 공급 부족' };
    presentation.sites.council = { ...presentation.sites.council, tokenCount: 6 };
    const sparse = renderToStaticMarkup(<LivingWorldDiorama presentation={presentation} selected="market" onSelect={vi.fn()} />);
    expect(rich).toContain('data-market-crates="5"');
    expect(rich).toContain('data-dossiers="2"');
    expect(sparse).toContain('data-market-crates="0"');
    expect(sparse).toContain('data-empty-market="true"');
    expect(sparse).toContain('data-dossiers="6"');
  });

  it('visibly changes exact allocation width even when a one-factory change leaves symbolic tokens unchanged', () => {
    const presentation = fixture();
    presentation.factories = { total: 30, military: 29, civilian: 1, militaryShare: 29 / 30, civilianShare: 1 / 30, overAllocated: false };
    const before = renderToStaticMarkup(<LivingWorldDiorama presentation={presentation} selected="industry" onSelect={vi.fn()} />);
    presentation.factories = { total: 30, military: 28, civilian: 2, militaryShare: 28 / 30, civilianShare: 2 / 30, overAllocated: false };
    const after = renderToStaticMarkup(<LivingWorldDiorama presentation={presentation} selected="industry" onSelect={vi.fn()} />);
    const widthOf = (html: string, kind: 'military' | 'civilian') => Number(html.match(new RegExp(`class="lwd-allocation-${kind}"[^>]*data-continuous-width="([^"]+)"`))?.[1]);
    expect(before).toContain('data-allocation="military" data-active-slots="6"');
    expect(after).toContain('data-allocation="military" data-active-slots="6"');
    expect(before).toContain('data-allocation="civilian" data-active-slots="0"');
    expect(after).toContain('data-allocation="civilian" data-active-slots="0"');
    expect(widthOf(before, 'military')).toBeCloseTo(203);
    expect(widthOf(after, 'military')).toBeCloseTo(196);
    expect(widthOf(before, 'civilian')).toBeCloseTo(7);
    expect(widthOf(after, 'civilian')).toBeCloseTo(14);
    expect(after).toContain(`data-military-share="${28 / 30}"`);
    expect(after).toContain('공장 역량의 배치 비중 · 건물 수가 아닙니다');
  });

  it('shows hospital burden independently of medicine supply, without inventing patients', () => {
    const presentation = fixture();
    presentation.hospital = { active: true, load: 95 };
    presentation.sites.health = { ...presentation.sites.health, severity: 'critical', activityLevel: 3, tokenCount: 6, label: '병상 부담 위험' };
    const html = renderToStaticMarkup(<LivingWorldDiorama presentation={presentation} selected="health" onSelect={vi.fn()} />);
    expect(html).toContain('data-hospital-burden="6"');
    expect(html).toContain('data-medicine-slots="6"');
    expect(html).toContain('data-district="health" data-state="critical"');
    expect(html).toContain('환자 수가 아닌 병상 부담');
  });

  it('does not invent activity or inventory when a district has unknown data', () => {
    const presentation = fixture();
    siteIds.forEach((id) => { presentation.sites[id] = { ...presentation.sites[id], severity: 'unknown', tokenCount: 6, activityLevel: 3, label: '자료 확인 필요' }; });
    presentation.goods.medicine = null;
    const html = renderToStaticMarkup(<LivingWorldDiorama presentation={presentation} selected="health" onSelect={vi.fn()} />);
    expect(html).not.toContain('data-symbolic-activity=');
    expect(html).toContain('data-market-crates="0"');
    expect(html).toContain('data-hospital-burden="0"');
    expect(html).toContain('data-dossiers="0"');
    expect(html).toContain('data-allocation="military" data-active-slots="0"');
    expect(html).toContain('data-allocation="civilian" data-active-slots="0"');
    expect(html).toContain('data-military-share="unknown" data-civilian-share="unknown"');
    expect(html.match(/data-continuous-width="0"/g)).toHaveLength(2);
  });

  it('keeps motion strictly local and optional', () => {
    const handlers = callbacks();
    const view = LivingWorldDioramaView({ presentation: fixture(), selected: 'industry', motionEnabled: false, ...handlers });
    const button = descendants(view).find((item) => item.type === 'button' && item.props.className === 'lwd-motion-control')!;
    expect(button.props['aria-pressed']).toBe(false);
    expect(renderToStaticMarkup(view)).not.toContain('has-motion');
    (button.props.onClick as () => void)();
    expect(handlers.onToggleMotion).toHaveBeenCalledOnce();
    expect(handlers.onSelect).not.toHaveBeenCalled();
  });

  it('supports optional illustrated terrain with a functioning no-image fallback', () => {
    const handlers = callbacks();
    const model = fixture();
    const plain = renderToStaticMarkup(<LivingWorldDiorama presentation={model} selected="industry" onSelect={handlers.onSelect} />);
    const art = renderToStaticMarkup(<LivingWorldDiorama presentation={model} selected="industry" onSelect={handlers.onSelect} artSrc="/assets/terrain.png" />);
    expect(plain).toContain('data-has-art="false"');
    expect(plain).not.toContain('<img');
    expect(art).toContain('data-has-art="true"');
    expect(art).toContain('alt="" aria-hidden="true"');
    expect(art).toContain('data-market-crates="5"');
  });
});
