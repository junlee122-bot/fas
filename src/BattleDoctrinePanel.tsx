import { AlertTriangle, CheckCircle2, ChevronRight, Shield, Swords, Target } from 'lucide-react';
import type { BattleReport, BattleStance } from './types';

interface BattleDoctrinePanelProps {
  stance: BattleStance;
  reports: BattleReport[];
  onStanceChange: (stance: BattleStance) => void;
  onOpenReport: (reportId: string) => void;
}

const stances: Array<{ id: BattleStance; title: string; summary: string; effect: string; icon: React.ReactNode }> = [
  { id: 'cautious', title: '신중한 공세', summary: '정찰과 전개를 우선하고 불리하면 빠르게 이탈', effect: '손실 -28% · 화력 감소 · 보급 8', icon: <Shield size={15} /> },
  { id: 'balanced', title: '균형 공세', summary: '화력·보급·예비대를 표준 작전 계획대로 운용', effect: '표준 손실 · 보급 11', icon: <Target size={15} /> },
  { id: 'aggressive', title: '총력 공세', summary: '주력과 기동 예비대를 조기에 투입해 돌파를 강제', effect: '교전/추격 강화 · 손실 +28% · 보급 16', icon: <Swords size={15} /> },
];

export function BattleDoctrinePanel({ stance, reports, onStanceChange, onOpenReport }: BattleDoctrinePanelProps) {
  return (
    <section className="battle-doctrine-panel">
      <div className="battle-stance-block">
        <header><span>OPERATIONAL POSTURE</span><h3>다음 공세 태세</h3><em>전투 단계별 계산에 적용</em></header>
        <div className="battle-stance-options">
          {stances.map((item) => (
            <button key={item.id} aria-pressed={stance === item.id} className={stance === item.id ? 'selected' : ''} onClick={() => onStanceChange(item.id)}>
              <i>{item.icon}</i>
              <span><strong>{item.title}</strong><small>{item.summary}</small><em>{item.effect}</em></span>
            </button>
          ))}
        </div>
      </div>
      <div className="battle-history-block">
        <header><span>AFTER ACTION ARCHIVE</span><h3>최근 전투 보고서</h3><em>{reports.length}건 기록</em></header>
        <div>
          {reports.length === 0 ? (
            <p><AlertTriangle size={16} /> 아직 완료된 전투가 없습니다. 공세 후 정찰부터 추격까지 단계별 보고서가 생성됩니다.</p>
          ) : reports.slice(0, 3).map((report) => (
            <button key={report.id} onClick={() => onOpenReport(report.id)}>
              <i className={report.victory ? 'victory' : 'defeat'}>{report.victory ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}</i>
              <span><strong>{report.targetName} · {report.victory ? '승리' : '공세 중단'}</strong><small>제 {report.week}주 · {report.divisionName} · 우세 {report.margin >= 0 ? '+' : ''}{report.margin}</small></span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
