import { AlertTriangle, ArrowUpRight, CheckCircle2, ClipboardList, Gavel, LockKeyhole, Send, ShieldCheck, Users } from 'lucide-react';
import type { GameTab } from './types';
import type { RoleTabMandate } from './roleMandate';
import type { RoleAuthorityRequest, RoleCommandChainProfile, RolePersuasionStrategy } from './roleCommand';

interface RoleMandateDeskProps {
  roleTitle: string;
  tabLabel: string;
  mandate: RoleTabMandate;
  year: number;
  week: number;
  reports: { label: string; value: string; detail: string }[];
  directDestinations: { id: GameTab; label: string }[];
  request: RoleAuthorityRequest | null;
  commandChain: RoleCommandChainProfile;
  officialFavor: number;
  defiance: number;
  onSubmitRequest: () => void;
  onPersuade: (strategy: RolePersuasionStrategy) => void;
  onDefy: () => void;
  onAcknowledgeReport: () => void;
  onNavigate: (tab: GameTab) => void;
}

export function RoleMandateDesk({
  roleTitle,
  tabLabel,
  mandate,
  year,
  week,
  reports,
  directDestinations,
  request,
  commandChain,
  officialFavor,
  defiance,
  onSubmitRequest,
  onPersuade,
  onDefy,
  onAcknowledgeReport,
  onNavigate,
}: RoleMandateDeskProps) {
  const canRequest = mandate.mode === 'request' || mandate.mode === 'report';
  const pendingRequest = request && ['submitted', 'reviewing', 'rejected'].includes(request.status) ? request : null;
  const statusLabel = request?.status === 'submitted' ? '접수'
    : request?.status === 'reviewing' ? '심사 중'
      : request?.status === 'approved' ? '승인'
        : request?.status === 'rejected' ? '기각·재상신 가능'
          : request?.status === 'expired' ? '위임 종료' : '초안 없음';
  return (
    <section className={`role-mandate-desk mode-${mandate.mode}`} aria-labelledby="role-mandate-title">
      <header>
        <span className="role-mandate-seal" aria-hidden="true">{mandate.mode === 'locked' ? <LockKeyhole size={26} /> : canRequest ? <Send size={26} /> : <ClipboardList size={26} />}</span>
        <span>
          <small>{year} · 제 {week + 1}주 · ROLE MANDATE</small>
          <h2 id="role-mandate-title">{tabLabel}: {mandate.label}</h2>
          <p><b>{roleTitle}</b> — {mandate.reason}</p>
        </span>
        <em>{mandate.label}</em>
      </header>

      <div className="role-mandate-layout">
        <section className="role-report-sheet">
          <div className="role-report-heading"><ClipboardList size={16} /><span><strong>담당 부서 보고</strong><small>직접 조작 대신 현재 결과와 위험만 요약합니다.</small></span></div>
          <div className="role-report-grid">
            {reports.map((report) => (
              <article key={report.label}><small>{report.label}</small><strong>{report.value}</strong><p>{report.detail}</p></article>
            ))}
          </div>
          <p className="role-authority-route"><ShieldCheck size={15} /><span><b>권한 경로</b>{mandate.authorityRoute}</span></p>
          {canRequest ? (
            <div className="role-request-workflow">
              <div className={`role-request-status status-${request?.status ?? 'none'}`}>
                <span><Gavel size={15} /><b>{statusLabel}</b></span>
                <strong>{request ? `승인 지지 ${Math.round(request.support)}%` : mandate.mode === 'request' ? '정식 권한 상신 가능' : '부처 간 협의 요청 가능'}</strong>
                <small>{request ? `제${request.decisionWeek + 1}주 결정 예정 · 설득 ${request.persuasionCount}회` : '제출 뒤 최소 2주 동안 상급기관이 책임·예산·정치 위험을 심사합니다.'}</small>
              </div>
              {!pendingRequest ? (
                <button type="button" className="role-request-button" onClick={onSubmitRequest}><Send size={16} /> {mandate.mode === 'request' ? '담당자 의견을 붙여 권한 상신' : '담당 부서와 공동결재 협의 요청'}</button>
              ) : (
                <div className="role-persuasion-actions" aria-label="상급기관 설득 방식">
                  <button type="button" onClick={() => onPersuade('evidence')}><ClipboardList size={14} /><span>근거 보강<small>정치력 2 · 지지 +10</small></span></button>
                  <button type="button" onClick={() => onPersuade('sponsor')}><Users size={14} /><span>후원자 설득<small>정치력 4 · 지지 +16</small></span></button>
                  <button type="button" onClick={() => onPersuade('pressure')}><AlertTriangle size={14} /><span>공개 압박<small>신뢰 -4 · 지지 +13</small></span></button>
                </div>
              )}
              <button type="button" className="role-defy-button" onClick={onDefy}><AlertTriangle size={15} /> 비상권한 인수 <small>2주 직접 집행 · 신뢰 -8</small></button>
              {mandate.mode === 'report' ? <button type="button" className="role-report-button" onClick={onAcknowledgeReport}><CheckCircle2 size={16} /> 담당 부서 보고만 확인</button> : null}
              <small className="role-request-note">승인되면 제한된 기간에만 이 화면의 실제 결재 기능이 열립니다. 월권은 즉시 열리지만 실패 책임과 해임 위험이 남습니다.</small>
            </div>
          ) : <button type="button" className="role-report-button" onClick={onAcknowledgeReport}><CheckCircle2 size={16} /> 접근 경로 확인</button>}
        </section>

        <aside className="role-direct-routes">
          <div className="role-chain-mini">
            <small>나를 감독하는 기관</small><strong>{commandChain.superior}</strong>
            <i />
            <small>현재 책임</small><strong>{commandChain.current}</strong>
            <i />
            <small>내가 지휘하는 조직</small><strong>{commandChain.subordinates}</strong>
          </div>
          <div className="role-chain-risk"><span>상급자 호의 <b>{Math.round(officialFavor)}</b></span><span>불복 기록 <b>{Math.round(defiance)}</b></span></div>
          <small>내가 직접 책임지는 업무</small>
          <h3>현재 보직의 지휘실</h3>
          <p>아래 화면에서는 결재·배치·명령을 직접 실행할 수 있습니다.</p>
          {directDestinations.slice(0, 5).map((destination) => (
            <button type="button" key={destination.id} onClick={() => onNavigate(destination.id)}>
              <span><CheckCircle2 size={14} />{destination.label}</span><ArrowUpRight size={14} />
            </button>
          ))}
          <p className="role-refusal-risk"><AlertTriangle size={14} /> 명령 충돌 시: {commandChain.refusalConsequence}</p>
        </aside>
      </div>
    </section>
  );
}
