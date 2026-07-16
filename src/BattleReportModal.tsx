import { Award, CheckCircle2, Eye, Package, ShieldAlert, Star, Swords, Target, TrendingUp, X } from 'lucide-react';
import type { BattlePhase, BattleReport } from './types';

interface BattleReportModalProps {
  report: BattleReport;
  onClose: () => void;
}

const stanceLabels = {
  cautious: '신중한 공세',
  balanced: '균형 공세',
  aggressive: '총력 공세',
};

const phaseIcons: Record<BattlePhase['id'], React.ReactNode> = {
  reconnaissance: <Eye size={17} />,
  approach: <Target size={17} />,
  engagement: <Swords size={17} />,
  exploitation: <Star size={17} />,
};

export function BattleReportModal({ report, onClose }: BattleReportModalProps) {
  return (
    <div className="modal-backdrop battle-report-backdrop" role="dialog" aria-modal="true" aria-labelledby="battle-report-title">
      <section className={'battle-report-modal ' + (report.victory ? 'victory' : 'defeat')}>
        <header>
          <div className="battle-result-mark">{report.victory ? <CheckCircle2 size={28} /> : <ShieldAlert size={28} />}</div>
          <div>
            <span>AFTER ACTION REPORT · 제 {report.week}주</span>
            <h2 id="battle-report-title">{report.targetName} {report.victory ? '전투 승리' : '공세 중단'}</h2>
            <small>{report.divisionName} · {report.commanderName} · {stanceLabels[report.stance]}</small>
          </div>
          <button onClick={onClose} aria-label="전투 보고서 닫기"><X size={17} /></button>
        </header>

        <div className="battle-report-summary">
          <div><span>작전 결과</span><strong>{report.victory ? '목표 지역 확보' : '출발선 재편'}</strong></div>
          <div><span>종합 우세</span><strong className={report.margin >= 0 ? 'positive' : 'negative'}>{report.margin >= 0 ? '+' : ''}{report.margin}</strong></div>
          <div><span>지형</span><strong>{report.terrain}</strong></div>
          <p>{report.summary}</p>
        </div>

        <div className="battle-phase-flow">
          {report.phases.map((phase, index) => (
            <article className={'battle-phase ' + phase.tone} key={phase.id}>
              <header><i>{phaseIcons[phase.id]}</i><span><small>PHASE {index + 1}</small><strong>{phase.title}</strong></span><em>{phase.delta >= 0 ? '+' : ''}{phase.delta}</em></header>
              <div className="phase-score"><span style={{ width: Math.max(8, Math.min(92, phase.attackerScore / (phase.attackerScore + phase.defenderScore) * 100)) + '%' }} /></div>
              <div className="phase-score-labels"><span>아군 {phase.attackerScore}</span><span>적군 {phase.defenderScore}</span></div>
              <p>{phase.narrative}</p>
            </article>
          ))}
        </div>

        {(report.commanderXpGained || report.battleHonor) && (
          <div className="battle-development-awards">
            {report.commanderXpGained && <div><TrendingUp size={17} /><span>지휘관 실전 경험<strong>+{report.commanderXpGained} XP</strong></span></div>}
            {report.battleHonor && <div><Award size={17} /><span>부대 전투명예<strong>{report.battleHonor}</strong></span></div>}
            <p>전투 경험은 지휘관 복무 레벨과 선택형 특기로, 전투명예는 부대의 영구 작전 기록으로 이어집니다.</p>
          </div>
        )}

        <footer>
          <div><ShieldAlert size={16} /><span>아군 전력 손실<strong>-{report.attackerStrengthLoss}</strong></span></div>
          <div><Swords size={16} /><span>적 추정 손실<strong>-{report.defenderStrengthLoss}</strong></span></div>
          <div><Target size={16} /><span>조직력 소모<strong>-{report.organizationLoss}</strong></span></div>
          <div><Package size={16} /><span>보급 소모<strong>-{report.supplySpent}</strong></span></div>
          <button onClick={onClose}>지휘소로 복귀</button>
        </footer>
      </section>
    </div>
  );
}
