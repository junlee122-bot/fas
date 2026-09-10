import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TimeCommandCenter } from './TimeCommandCenter';
import { assessStrategicCadence, buildStrategicAdvanceReport, createStrategicAdvanceSession, getStrategicTimeAdvanceOptions } from './timeCadence';

const context = {
  year: 1988,
  unrest: 22,
  activeElection: false,
  publicHealthPressure: 8,
  activeStrategicOperation: false,
  activeNationalPlan: true,
};
const assessment = assessStrategicCadence(context);
const snapshot = { week: 2392, treasury: 820, stability: 72, mandate: 64, unrest: 22, nationalScore: 71, publicConfidence: 68, inflation: 4.2 };

describe('TimeCommandCenter', () => {
  it('shows cadence choices, safety stops, and the recommended period', () => {
    const html = renderToStaticMarkup(<TimeCommandCenter
      assessment={assessment}
      options={getStrategicTimeAdvanceOptions(context)}
      currentWeek={snapshot.week}
      currentDate="1988년 10월 23일"
      targetDate={null}
      remainingWeeks={0}
      session={null}
      report={null}
      onAdvanceWeek={vi.fn()}
      onStart={vi.fn()}
      onCancel={vi.fn()}
      onClose={vi.fn()}
    />);

    expect(html).toContain('지휘 주기 설정');
    expect(html).toContain('현재 추천');
    expect(html).toContain('자동 정지 조건');
    expect(html).toContain('1년');
  });

  it('shows live progress and an auditable before-and-after report', () => {
    const session = createStrategicAdvanceSession(52, snapshot, assessment);
    const report = buildStrategicAdvanceReport(session, { ...snapshot, week: 2405, treasury: 854, unrest: 19 }, '분기 국가계획 중간평가');
    const html = renderToStaticMarkup(<TimeCommandCenter
      assessment={assessment}
      options={getStrategicTimeAdvanceOptions(context)}
      currentWeek={2405}
      currentDate="1989년 1월 22일"
      targetDate="1989년 10월 22일"
      remainingWeeks={39}
      session={session}
      report={report}
      onAdvanceWeek={vi.fn()}
      onStart={vi.fn()}
      onCancel={vi.fn()}
      onClose={vi.fn()}
    />);

    expect(html).toContain('39주 남음');
    expect(html).toContain('지금 멈추고 중간결산');
    expect(html).toContain('820.0M → 854.0M');
    expect(html).toContain('분기 국가계획 중간평가');
  });
});
