import { useRef, useState } from 'react';
import { Check, ShieldCheck, X } from 'lucide-react';
import { assessPersonnelReview, confirmPersonnelReview, createPersonnelReviewGate } from './personnelActions';
import type { PersonnelAction, PersonnelContext, PersonnelReview } from './personnelActions';
import './CandidateActionReview.css';

interface CandidateActionReviewProps {
  review: PersonnelReview;
  context: PersonnelContext;
  onConfirm: (action: PersonnelAction) => void | boolean;
  onClose: () => void;
}

const actionLabels: Partial<Record<PersonnelAction['kind'], string>> = {
  scout: '신규 조사', 'stop-scout': '조사 중단', approach: '비밀 접촉',
};

export function CandidateActionReview({ review, context, onConfirm, onClose }: CandidateActionReviewProps) {
  const gate = useRef(createPersonnelReviewGate());
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const assessment = assessPersonnelReview(review, context);
  const result = review.assessment.result;
  const after = result.updatedCandidate;
  const before = result.candidate;
  return <section className="candidate-action-review" tabIndex={-1} aria-label={`${before.name} ${actionLabels[review.action.kind] ?? '조치'} 검토`}>
    <header><span><ShieldCheck size={18} /><strong>{actionLabels[review.action.kind]} 검토 · {before.name}</strong></span><button type="button" onClick={onClose} aria-label="후보 조치 검토 닫기"><X size={16} /></button></header>
    <p>검토에는 비용이 없습니다. 아래에서 승인할 때만 현재 조건을 다시 검사해 조치합니다.</p>
    <dl>
      <div><dt>검토 당시 정치력</dt><dd>{review.basis.politicalPower} → {Math.max(0, review.basis.politicalPower + result.gameDelta.politicalPower)} <small>비용 {result.cost.politicalPower} PP · 제{review.basis.week + 1}주 기준</small></dd></div>
      <div><dt>확보 정보</dt><dd>{before.knowledge} → {after?.knowledge ?? before.knowledge}%</dd></div>
      <div><dt>우리와의 관계</dt><dd>{before.relationship} → {after?.relationship ?? before.relationship}</dd></div>
      <div><dt>영입 관심</dt><dd>{before.interest} → {after?.interest ?? before.interest}</dd></div>
    </dl>
    <ul>{result.summary.map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}</ul>
    {!assessment.allowed && !submitted && <p className="candidate-review-warning" role="status">{assessment.reason} 검토를 닫고 현재 조건에서 다시 선택하십시오.</p>}
    {message && <p role="status" ref={statusRef} tabIndex={-1}>{message}</p>}
    <footer><button type="button" onClick={onClose}>검토 닫기 · 무료</button><button type="button" disabled={submitted || !assessment.allowed} onClick={() => {
      const outcome = confirmPersonnelReview(review, context, () => onConfirm(review.action), gate.current);
      setMessage(outcome.ok ? '조치 요청을 전달했습니다. 현재 보고서에서 반영된 상태를 확인하십시오.' : outcome.reason);
      setAccepted(outcome.ok);
      // A failed or uncertain dispatch also needs a fresh review, never a blind retry.
      setSubmitted(true);
      window.setTimeout(() => statusRef.current?.focus(), 0);
    }}><Check size={16} />{submitted ? accepted ? '조치 전달 완료' : '처리 기록 확인 필요' : `${actionLabels[review.action.kind]} 승인 · ${result.cost.politicalPower} PP`}</button></footer>
  </section>;
}
