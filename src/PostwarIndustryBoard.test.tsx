import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getPostwarIndustryDraftBasis, PostwarIndustryBoard, resolvePostwarIndustryDraft } from './PostwarIndustryBoard';
import { forecastPostwarIndustry } from './postwarIndustry';
import type { PostwarIndustryInput } from './postwarIndustry';
import type { Stockpile } from './types';

function input(): PostwarIndustryInput {
  return { week: 5, nationId: 'britain', game: { factories: 10, fuel: 20, steel: 20, treasury: 20 }, production: [{ id: 'rifle', name: '시험 소총', assigned: 5, efficiency: 80, output: 200, category: '보병 장비', icon: 'R' }], stockpile: { infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 }, spendingLevel: 50, securityBudgetPercent: 20, policy: 'balanced', extraTreasuryAllowance: 0 };
}
function render(context = input(), canManage = true, canAuthorizeCash = true, routedEquipmentKey?: keyof Stockpile) {
  const onApprove = vi.fn();
  const html = renderToStaticMarkup(<PostwarIndustryBoard input={context} routedEquipmentKey={routedEquipmentKey} lastReport={null} canManage={canManage} canAuthorizeCash={canAuthorizeCash} cashAvailable={context.game.treasury} formatMoney={(amount) => `${amount.toFixed(2)}M`} onApprove={onApprove} onPurchase={vi.fn()} onOpenBudget={vi.fn()} onOpenBriefing={vi.fn()} />);
  return { html, onApprove };
}
describe('postwar delivery desk', () => {
  it('shows one approved forecast, not an immediately completed shipment', () => {
    const context = input();
    const original = structuredClone(context);
    const { html, onApprove } = render(context);
    expect(html).toContain('제6주 예정');
    expect(html).toContain('승인된 방침');
    expect(html).toContain('이미 공공지출에 포함');
    expect(html).toContain('추가 국고 차감 예상');
    expect(html).toContain('아직 국정 군수 납품 기록이 없습니다');
    expect(onApprove).not.toHaveBeenCalled();
    expect(context).toEqual(original);
  });
  it('does not authorize supplemental cash from industrial authority alone', () => {
    const { html } = render(input(), true, false);
    expect(html).toContain('<select disabled=""');
    expect(html).toContain('변경에는 재정 또는 국정 직접권한');
    expect(html).toMatch(/disabled=""[^>]*>연료 10K 조달/);
    expect(html).toMatch(/disabled=""[^>]*>강철 10K 조달/);
  });
  it('does not pretend zero materials or budget can produce equipment', () => {
    const context = input(); context.game.fuel = 0; context.securityBudgetPercent = 0;
    expect(forecastPostwarIndustry(context).delivered.infantryEquipment).toBe(0);
    const { html } = render(context);
    expect(html).toContain('다음 주 예상 납품률 0%');
    expect(html).toContain('연료 부족');
    expect(html).toContain('집행 예산 부족');
  });
  it('shows only a past, same-nation delivery receipt', () => {
    const context = input(); const lastReport = forecastPostwarIndustry({ ...context, nationId: 'germany', week: 4 });
    const html = renderToStaticMarkup(<PostwarIndustryBoard input={context} lastReport={lastReport} canManage={false} canAuthorizeCash={false} cashAvailable={0} formatMoney={String} onApprove={() => false} onPurchase={vi.fn()} onOpenBudget={vi.fn()} onOpenBriefing={vi.fn()} />);
    expect(html).toContain('아직 국정 군수 납품 기록이 없습니다');
    expect([...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].some(([markup]) => markup.includes('가동 방침 결재'))).toBe(false);
  });
  it('labels exactly the routed category as completed production, not immediately usable national stock', () => {
    const context = input(); const before = structuredClone(context);
    const { html, onApprove } = render(context, true, true, 'infantryEquipment');
    expect(html.match(/집하창고 생산 완료 → 수송 후 가용/g)).toHaveLength(1);
    expect(html.match(/국가 직접 입고 전망 \/ 생산 계획/g)).toHaveLength(5);
    expect(html).toContain('표시 수치는 생산 완료 전망입니다');
    expect(html).toContain('집하창고·예약·수송 중 장비는 국가 가용 비축이 아니며');
    expect(html).toContain('다음 주 예상 생산 완료율');
    expect(onApprove).not.toHaveBeenCalled();
    expect(context).toEqual(before);
    expect(render(context).html).not.toContain('집하창고 생산 완료 → 수송 후 가용');
  });
  it('does not reinterpret a previous production report as an actual transport arrival', () => {
    const context = input();
    const report = forecastPostwarIndustry({ ...context, week: 4 });
    const html = renderToStaticMarkup(<PostwarIndustryBoard input={context} routedEquipmentKey="infantryEquipment" lastReport={report} canManage canAuthorizeCash cashAvailable={20} formatMoney={String} onApprove={() => false} onPurchase={vi.fn()} onOpenBudget={vi.fn()} onOpenBriefing={vi.fn()} />);
    expect(html).toContain('제5주 생산 완료 결산');
    expect(html).toContain('실제 국가 가용 입고는 당시 귀속·도착 영수증에서 확인');
    expect(html).not.toContain('제5주 확정 입고');
  });
  it('opens on the approved overview and keeps the editable forecast and actual settlement in separate hidden views', () => {
    const { html } = render();
    expect(html).toContain('class="postwar-industry-overview">');
    expect(html).toContain('class="postwar-industry-plan" hidden=""');
    expect(html).toContain('class="postwar-industry-settlement" hidden=""');
    expect(html).toContain('aria-pressed="true" aria-controls="_R_0_-overview"');
    expect(html).toContain('예상 운영비 + 제조비');
    expect(html).not.toContain('실제 운영비 + 제조비');
  });
  it('invalidates an unapproved draft when the week, country, budget, production, approved plan or authority changes', () => {
    const current = input();
    const approved = { policy: 'balanced' as const, extraTreasuryAllowance: 0 };
    const basis = getPostwarIndustryDraftBasis(current, true, true, 20);
    const draft = { basis, settings: { policy: 'production' as const, extraTreasuryAllowance: 10 } };
    expect(resolvePostwarIndustryDraft(draft, basis, approved)).toEqual({ settings: draft.settings, stale: false });
    const changedInputs: PostwarIndustryInput[] = [
      { ...current, week: current.week + 1 }, { ...current, nationId: 'germany' },
      { ...current, securityBudgetPercent: 0 }, { ...current, policy: 'maintenance' },
      { ...current, production: current.production.map((line) => ({ ...line, assigned: 0 })) },
      { ...current, game: { ...current.game, fuel: 0 } },
    ];
    const changedBases = [...changedInputs.map((value) => getPostwarIndustryDraftBasis(value, true, true, 20)), getPostwarIndustryDraftBasis(current, false, true, 20), getPostwarIndustryDraftBasis(current, true, false, 20), getPostwarIndustryDraftBasis(current, true, true, 0)];
    for (const changed of changedBases) expect(resolvePostwarIndustryDraft(draft, changed, approved)).toEqual({ settings: approved, stale: true });
    expect(draft.settings.extraTreasuryAllowance).toBe(10);
    expect(resolvePostwarIndustryDraft(null, basis, approved)).toEqual({ settings: approved, stale: false });
  });
  it('preserves historical per-line totals instead of substituting the currently selected production line', () => {
    const current = input();
    const report = forecastPostwarIndustry({ ...current, week: 4 });
    report.perLine[0].name = '당시 승인된 생산선';
    report.perLine[0].delivered = 7;
    const html = renderToStaticMarkup(<PostwarIndustryBoard input={current} lastReport={report} canManage canAuthorizeCash cashAvailable={20} formatMoney={String} onApprove={() => false} onPurchase={vi.fn()} onOpenBudget={vi.fn()} onOpenBriefing={vi.fn()} />);
    expect(html).toContain('당시 승인된 생산선');
    expect(html).toContain('생산 완료 7 / 당시 계획');
    expect(html).toContain('현재 방침·배치를 과거 기록에 다시 적용하지 않습니다');
  });
});
