import { useEffect } from 'react';
import { CalendarClock, HeartHandshake, WalletCards, X } from 'lucide-react';
import { assessRecruitmentOffer } from './recruitment';
import type { RecruitmentOffer } from './recruitment';
import type { StaffCandidate } from './types';

interface RecruitmentNegotiationProps {
  candidate: StaffCandidate;
  offer: RecruitmentOffer;
  politicalPower: number;
  treasury: number;
  reputation: number;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onChange: (offer: RecruitmentOffer) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function RecruitmentNegotiation({
  candidate,
  offer,
  politicalPower,
  treasury,
  reputation,
  formatMoney,
  onChange,
  onClose,
  onSubmit,
}: RecruitmentNegotiationProps) {
  const assessment = assessRecruitmentOffer(candidate, reputation, offer);
  const canAfford = politicalPower >= 6 && treasury >= assessment.signingCost;
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  return (
    <div className="staff-negotiation-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="staff-negotiation-modal" role="dialog" aria-modal="true" aria-labelledby="staff-negotiation-title">
        <header>
          <span><HeartHandshake size={19} /><small>APPOINTMENT NEGOTIATION</small><strong id="staff-negotiation-title">{candidate.name} 임명 조건 협상</strong></span>
          <button type="button" onClick={onClose} aria-label="협상 창 닫기"><X size={16} /></button>
        </header>
        <div className="staff-negotiation-summary">
          <span><small>제안 보직</small><strong>{candidate.role}</strong></span>
          <span><small>후보 관심도</small><strong>{candidate.interest}</strong></span>
          <span><small>우리와의 관계</small><strong>{candidate.relationship}</strong></span>
          <span><small>경쟁 기관 압력</small><strong>{candidate.rivalInterest}</strong></span>
        </div>
        <div className="staff-offer-editor">
          <section>
            <header><strong>1. 의사결정 권한</strong><small>임명 뒤 맡길 실질 권한입니다.</small></header>
            <div className="staff-offer-options three">
              {([
                ['advisor', '자문관', '제안만 가능'],
                ['executive', '집행 책임자', '위임 범위 집행'],
                ['autonomous', '독립 책임자', '넓은 재량 보장'],
              ] as const).map(([value, label, detail]) => <button type="button" className={offer.authority === value ? 'active' : ''} key={value} onClick={() => onChange({ ...offer, authority: value })}><strong>{label}</strong><small>{detail}</small></button>)}
            </div>
          </section>
          <section>
            <header><strong>2. 임기</strong><small>장기 안정성은 합의율을 높이지만 교체 비용도 키웁니다.</small></header>
            <div className="staff-offer-options three">
              {([52, 104, 156] as const).map((weeks) => <button type="button" className={offer.termWeeks === weeks ? 'active' : ''} key={weeks} onClick={() => onChange({ ...offer, termWeeks: weeks })}><strong>{weeks / 52}년</strong><small>{weeks}주 보장</small></button>)}
            </div>
          </section>
          <section>
            <header><strong>3. 주급·계약금</strong><small>재정 부담과 설득력을 실시간으로 비교합니다.</small></header>
            <div className="staff-compensation-grid">
              <div><span>주급</span>{([0.9, 1, 1.15] as const).map((value) => <button type="button" className={offer.salaryMultiplier === value ? 'active' : ''} key={value} onClick={() => onChange({ ...offer, salaryMultiplier: value })}>{Math.round(value * 100)}%</button>)}</div>
              <div><span>계약금</span>{([0.9, 1, 1.15] as const).map((value) => <button type="button" className={offer.signingMultiplier === value ? 'active' : ''} key={value} onClick={() => onChange({ ...offer, signingMultiplier: value })}>{Math.round(value * 100)}%</button>)}</div>
            </div>
          </section>
          <section>
            <header><strong>4. 보직 약속</strong><small>약속을 지키지 않으면 역할 만족도와 충성도가 하락합니다.</small></header>
            <select value={offer.promise} onChange={(event) => onChange({ ...offer, promise: event.target.value as RecruitmentOffer['promise'] })}>
              <option value="none">추가 약속 없음</option>
              <option value="resources">예산·인력 우선 지원</option>
              <option value="succession">차기 지도부 승계선 보장</option>
              <option value="security">신변·정치적 안전 보장</option>
            </select>
          </section>
        </div>
        <aside className="staff-offer-assessment">
          <div className="staff-offer-score"><span><small>예상 합의율</small><strong>{assessment.chance}%</strong></span><span><small>설득 점수</small><strong className={assessment.score >= assessment.threshold ? 'ready' : ''}>{assessment.score} / {assessment.threshold}</strong></span></div>
          <div className="staff-offer-factors">{assessment.factors.map((factor) => <span key={factor.label}><small>{factor.label}</small><strong className={factor.points < 0 ? 'negative' : factor.points > 0 ? 'positive' : ''}>{factor.points > 0 ? '+' : ''}{factor.points}</strong></span>)}</div>
          <div className="staff-offer-cost"><span><WalletCards size={15} /><small>즉시 계약금</small><strong>{formatMoney(assessment.signingCost)}</strong></span><span><CalendarClock size={15} /><small>주간 보수</small><strong>{formatMoney(assessment.weeklyCost)}</strong></span></div>
          <p className={canAfford ? 'ready' : 'blocked'}>{canAfford ? '정치력 6과 계약금을 확보했습니다. 제안을 전달할 수 있습니다.' : `제안 전달에는 정치력 6과 계약금 ${formatMoney(assessment.signingCost)}가 필요합니다.`}</p>
        </aside>
        <footer><button type="button" onClick={onClose}>협상 보류</button><button type="button" className="primary" disabled={!canAfford} onClick={onSubmit}><HeartHandshake size={14} /> 조건부 임명 제안 보내기</button></footer>
      </section>
    </div>
  );
}
