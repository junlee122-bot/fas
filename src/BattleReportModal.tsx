import { Award, CheckCircle2, Eye, Package, ShieldAlert, Star, Swords, Target, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { assessBattleRecognition, getDecorationOptions } from './frontLegacy';
import { battleTypeProfiles } from './operations';
import type { BattlePhase, BattleReport, NationId } from './types';

interface BattleReportModalProps {
  report: BattleReport;
  nationId: NationId;
  onRecognize: (reportId: string, input: { battleName?: string; decorationId?: string; citation?: string }) => void;
  onClose: () => void;
}

const stanceLabels = {
  cautious: '신중한 공세',
  balanced: '균형 공세',
  aggressive: '총공세',
};

const phaseIcons: Record<BattlePhase['id'], React.ReactNode> = {
  reconnaissance: <Eye size={17} />,
  approach: <Target size={17} />,
  engagement: <Swords size={17} />,
  exploitation: <Star size={17} />,
};

export function BattleReportModal({ report, nationId, onRecognize, onClose }: BattleReportModalProps) {
  const recognition = assessBattleRecognition(report);
  const battleYear = 1942 + Math.floor(report.week / 52);
  const decorationOptions = getDecorationOptions(nationId, battleYear, recognition.maximumTier);
  const [battleName, setBattleName] = useState(report.battleName ?? recognition.suggestedBattleName);
  const [decorationId, setDecorationId] = useState(report.decoration?.id ?? '');
  const [citation, setCitation] = useState(report.decoration?.citation ?? '');
  const operationOngoing = report.operationOutcome === 'ongoing';
  const operationVictory = report.operationOutcome === 'victory' || (report.operationOutcome === undefined && report.victory);
  const operationProfile = report.battleType ? battleTypeProfiles[report.battleType] : null;
  const operationProgress = report.operationRequired ? Math.round(Math.min(100, (report.operationProgress ?? 0) / report.operationRequired * 100)) : 0;
  return (
    <div className="modal-backdrop battle-report-backdrop" role="dialog" aria-modal="true" aria-labelledby="battle-report-title">
      <section className={'battle-report-modal ' + (operationOngoing ? 'ongoing' : operationVictory ? 'victory' : 'defeat')}>
        <header>
          <div className="battle-result-mark">{operationOngoing ? <TrendingUp size={28} /> : operationVictory ? <CheckCircle2 size={28} /> : <ShieldAlert size={28} />}</div>
          <div>
            <span>AFTER ACTION REPORT · 제 {report.week}주{report.operationWeek ? ` · 작전 ${report.operationWeek}주차` : ''}</span>
            <h2 id="battle-report-title">{report.battleName ?? report.targetName} {operationOngoing ? '교전 진행 중' : operationVictory ? '작전 승리' : '공세 중단'}</h2>
            <small>{report.divisionName} · {report.commanderName} · {stanceLabels[report.stance]}</small>
          </div>
          <button onClick={onClose} aria-label="전투 보고서 닫기"><X size={17} /></button>
        </header>

        <div className="battle-report-summary">
          <div><span>작전 상태</span><strong>{operationOngoing ? '전선 유지·다음 주 계속' : operationVictory ? '목표 지역 확보' : '출발선 재편'}</strong></div>
          <div><span>종합 우세</span><strong className={report.margin >= 0 ? 'positive' : 'negative'}>{report.margin >= 0 ? '+' : ''}{report.margin}</strong></div>
          <div><span>전투 성격</span><strong>{operationProfile?.label ?? report.terrain}</strong></div>
          <p>{report.summary}</p>
          {operationOngoing && <div className="operation-report-progress"><span><strong>누적 진척 {operationProgress}%</strong><small>{report.operationProgress}/{report.operationRequired} · 목표 통제는 아직 변하지 않음</small></span><i><b style={{ width: `${operationProgress}%` }} /></i></div>}
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

        {recognition.eligible && (
          <section className={`battle-recognition ${report.battleName || report.decoration ? 'recorded' : ''}`} aria-label="전투 명명과 훈장 심사">
            <header>
              <Award size={18} />
              <div><span>BATTLE LEGACY BOARD</span><strong>{report.battleName || report.decoration ? '전선 공식 전공 기록' : '전투 명명·훈장 수여 가능'}</strong><small>심사점수 {recognition.score}/100 · {recognition.reasons.join(' · ')}</small></div>
              <em>{recognition.maximumTier === 'supreme' ? '최고 훈격' : recognition.maximumTier === 'distinguished' ? '수훈 훈격' : '표창 훈격'}</em>
            </header>
            {report.battleName || report.decoration ? (
              <div className="battle-recognition-record">
                <div><span>공식 전투명</span><strong>{report.battleName ?? recognition.suggestedBattleName}</strong></div>
                <div><span>수여 훈장</span><strong>{report.decoration?.name ?? '훈장 미수여'}</strong><small>{report.decoration?.citation ?? '전투명만 공식 기록에 등재했습니다.'}</small></div>
              </div>
            ) : (
              <div className="battle-recognition-form">
                <label className="battle-name-field"><span>공식 전투명</span><input value={battleName} maxLength={42} onChange={(event) => setBattleName(event.target.value)} aria-label="공식 전투명" /><small>전선 상황판·전투 보고서·대체역사 기록에 계속 사용됩니다.</small></label>
                <fieldset>
                  <legend>지휘관 훈장 선택 <small>선택하지 않고 전투명만 등재할 수 있습니다.</small></legend>
                  <div>
                    <button type="button" className={decorationId === '' ? 'selected' : ''} onClick={() => setDecorationId('')}><span>전투명만 기록</span><small>훈장 보류</small></button>
                    {decorationOptions.map((option) => (
                      <button type="button" key={option.id} className={decorationId === option.id ? 'selected' : ''} onClick={() => setDecorationId(option.id)}>
                        <span>{option.name}</span><small>{option.historicalBasis}</small>
                      </button>
                    ))}
                  </div>
                </fieldset>
                {decorationId && <label className="battle-citation-field"><span>공적 사유</span><textarea value={citation} maxLength={120} rows={2} onChange={(event) => setCitation(event.target.value)} placeholder={`${battleName || recognition.suggestedBattleName}에서 탁월한 지휘로 작전 목표를 달성함.`} aria-label="훈장 공적 사유" /></label>}
                <button type="button" className="recognition-confirm" onClick={() => onRecognize(report.id, { battleName, decorationId: decorationId || undefined, citation })}>전공 기록 승인</button>
              </div>
            )}
          </section>
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
