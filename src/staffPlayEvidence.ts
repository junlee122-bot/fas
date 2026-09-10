import type { BattleReport, StaffMember } from './types';
import type { StaffNarrativeContext } from './staffNarrative';

/** Only link uniquely identified people; a department does not prove participation. */
export function deriveStaffPlayEvidence(staff: StaffMember[], reports: BattleReport[], week: number): StaffNarrativeContext {
  const evidence: StaffNarrativeContext['evidence'][number][] = [];
  for (const report of reports) {
    if (report.week > week || report.week < week - 7 || report.operationOutcome === 'ongoing') continue;
    const matches = staff.filter((member) => member.name === report.commanderName);
    if (matches.length !== 1) continue;
    const victory = report.operationOutcome ? report.operationOutcome === 'victory' : report.victory;
    evidence.push({
      id: `battle:${report.id}`, week: report.week, kind: victory ? 'battle-victory' : 'battle-defeat',
      description: `${report.targetName} · ${report.divisionName}의 ${victory ? '승리' : '패배'}. 전투 보고서에 지휘관 ${report.commanderName} 기록.`,
      staffIds: [matches[0].id],
    });
  }
  for (const member of staff) {
    if (member.joinedWeek === undefined || member.joinedWeek <= 0 || member.joinedWeek > week || member.joinedWeek < week - 7) continue;
    evidence.push({ id: `appointment:${member.id}:${member.joinedWeek}`, week: member.joinedWeek, kind: 'personnel-change', description: `${member.name}의 제${member.joinedWeek + 1}주 조직 합류 기록.`, staffIds: [member.id] });
  }
  return { evidence };
}
