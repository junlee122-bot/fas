import {
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  Factory,
  Globe2,
  Handshake,
  Landmark,
  MapPinned,
  Play,
  Save,
  Shield,
  Star,
  Zap,
} from 'lucide-react';
import { CAREER_TIER_COUNT, careerRoles, getCareerStarCount, getNation, nations } from './campaign';
import { getHistoricalFlag } from './historicalFlags';
import { NationFlag } from './NationFlag';
import type { CareerBranch, NationId, NationStatus } from './types';

type Doctrine = 'coalition' | 'methodical' | 'maneuver';

interface CampaignSetupProps {
  nationId: NationId;
  roleId: string;
  doctrine: Doctrine;
  hasSave: boolean;
  hasManualSaves: boolean;
  onNationChange: (nationId: NationId) => void;
  onRoleChange: (roleId: string) => void;
  onDoctrineChange: (doctrine: Doctrine) => void;
  onStart: () => void;
  onContinue: () => void;
  onManageSaves: () => void;
}

const branchLabels: Record<CareerBranch, string> = {
  military: '군사 지휘',
  politics: '정치 지도',
  intelligence: '정보 공작',
};

const branchIcons = {
  military: <Shield size={16} />,
  politics: <Landmark size={16} />,
  intelligence: <Eye size={16} />,
};

const branchOrder: CareerBranch[] = ['politics', 'military', 'intelligence'];

const nationStatusLabels: Record<NationStatus, string> = {
  sovereign: '주권국',
  'government-in-exile': '망명정부',
  colonized: '식민지 독립운동',
  'occupied-commonwealth': '점령지 자치정부',
  'resistance-coalition': '저항연합',
};

const doctrineChoices = [
  { id: 'coalition' as const, icon: <Handshake size={17} />, title: '연합과 협상', detail: '정치력 +16 · 안정도 +4' },
  { id: 'methodical' as const, icon: <Factory size={17} />, title: '산업과 준비', detail: '군수 공장 +3 · 강철 +13K' },
  { id: 'maneuver' as const, icon: <Zap size={17} />, title: '속도와 충격', detail: '연료 +22K · 지휘 점수 +8' },
];

export function CampaignSetup({
  nationId,
  roleId,
  doctrine,
  hasSave,
  hasManualSaves,
  onNationChange,
  onRoleChange,
  onDoctrineChange,
  onStart,
  onContinue,
  onManageSaves,
}: CampaignSetupProps) {
  const nation = getNation(nationId);
  const historicalFlag = getHistoricalFlag(nationId);
  const roles = careerRoles.filter((role) => role.nationId === nationId);
  const selectedRole = roles.find((role) => role.id === roleId) ?? roles[1];

  return (
    <div className="modal-backdrop campaign-setup-backdrop">
      <div className="campaign-setup-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-setup-title">
        <header className="setup-header">
          <div>
            <span className="eyebrow">IRON DOMINION · ALTERNATE HISTORY CAREER</span>
            <h1 id="campaign-setup-title">1942년, 누구의 자리에 앉겠습니까?</h1>
            <p>1942년 실존 재직자 한 명의 보직을 사용자가 직접 대체합니다. 밀려난 전임자와 실제 참모·지휘관을 설득하고 경쟁하며 원래 역사에 없던 세계를 만드십시오.</p>
          </div>
          <div className="setup-era"><Globe2 size={21} /><span>유럽 ↔ 아시아·태평양<strong>양대 전구 동시 진행</strong></span></div>
        </header>

        <div className="setup-body">
          <section className="setup-nations">
            <div className="setup-section-title"><span>01</span><div><strong>플레이 진영</strong><small>{nations.length}개 국가·망명정부·독립운동</small></div></div>
            <div className="nation-choice-grid">
              {nations.map((item) => (
                <button
                  key={item.id}
                  className={nationId === item.id ? 'selected' : ''}
                  aria-pressed={nationId === item.id}
                  onClick={() => onNationChange(item.id)}
                >
                  <NationFlag nationId={item.id} size="compact" decorative />
                  <span><strong>{item.shortName}</strong><small>{nationStatusLabels[item.status]} · {item.defaultTheater === 'asia' ? '아시아' : '유럽'}</small></span>
                  {nationId === item.id && <CheckCircle2 size={15} />}
                </button>
              ))}
            </div>
            <div className="nation-brief" style={{ borderColor: nation.accent }}>
              <div><NationFlag nationId={nation.id} size="standard" /><span><strong>{nation.name}</strong><small>{nation.challenge}</small></span></div>
              <p>{nation.summary}</p>
              <div className="historical-flag-record">
                <span>1942 FLAG RECORD</span>
                <strong>{historicalFlag.name}</strong>
                <small>{historicalFlag.period} · {historicalFlag.kindLabel}</small>
                <p>{historicalFlag.historicalNote}</p>
              </div>
              <small className="nation-historical-basis">사료 기준 · {nation.historicalBasis}</small>
            </div>
          </section>

          <section className="setup-career">
            <div className="setup-section-title"><span>02</span><div><strong>취임 보직</strong><small>3단계에서 5단계로 확장된 커리어 피라미드</small></div></div>
            <div className="role-tier-guide" aria-label="5단계 보직 등급 안내">
              <span><strong>★★★★★</strong> 국가 최고위</span><i>→</i><span><strong>★★★☆☆</strong> 중간관리</span><i>→</i><span><strong>★☆☆☆☆</strong> 현장 실무</span>
            </div>
            <div className="role-choice-groups">
              {branchOrder.map((branch) => (
                <section className="role-choice-group" key={branch} aria-labelledby={`role-group-${branch}`}>
                  <header id={`role-group-${branch}`}>{branchIcons[branch]}<strong>{branchLabels[branch]}</strong><small>{roles.filter((role) => role.branch === branch).length}개 보직</small></header>
                  <div className="role-choice-list">
                    {roles.filter((role) => role.branch === branch).map((role) => {
                      const stars = getCareerStarCount(role.tier);
                      return (
                        <button key={role.id} className={roleId === role.id ? 'selected' : ''} aria-pressed={roleId === role.id} aria-label={`${role.title}, ${stars}성 보직, ${role.historicalHolderName} 대체`} onClick={() => onRoleChange(role.id)}>
                          <i>{branchIcons[role.branch]}</i>
                          <span><small>TIER {role.tier}/{CAREER_TIER_COUNT} · {branchLabels[role.branch]}</small><strong>{role.title}</strong><em>{role.scope} · 권한 {role.authority}</em><b>대체할 실존 인물 · {role.historicalHolderName}</b></span>
                          <div className="role-tier" title={`${stars}성 보직`}>{'★'.repeat(stars)}{'☆'.repeat(CAREER_TIER_COUNT - stars)}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <div className="historical-seat-brief">
              <span>1942 HISTORICAL SEAT</span>
              <div><strong>{selectedRole.historicalHolderName}</strong><small>{selectedRole.historicalOffice}</small></div>
              <p>{selectedRole.historicalBasis} {selectedRole.replacementEffect}</p>
              <em>활동 위장 · {selectedRole.coverIdentity}</em>
            </div>
            <div className="career-ladder-note"><BriefcaseBusiness size={16} /><span><strong>5급에서 1급까지 네 번 승진할 수 있습니다.</strong>같은 분야의 바로 위 보직으로 이동하며, 최고위층 진입 시 국가 전체 인사권이 열립니다. 신임을 잃으면 해임·쿠데타 위험도 커집니다.</span></div>

            <div className="setup-section-title compact"><span>03</span><div><strong>지휘 철학</strong><small>취임 시 초기 보너스</small></div></div>
            <div className="setup-doctrines">
              {doctrineChoices.map((choice) => (
                <button key={choice.id} className={doctrine === choice.id ? 'selected' : ''} aria-pressed={doctrine === choice.id} onClick={() => onDoctrineChange(choice.id)}>
                  {choice.icon}<span><strong>{choice.title}</strong><small>{choice.detail}</small></span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <footer className="setup-footer">
          <div className="alternate-history-promise"><MapPinned size={18} /><span><strong>역사는 미리 작성하지 않습니다.</strong>취임 뒤의 정책·인사·작전·외교·연구 선택이 누적되어 자연스럽게 다른 세계를 만듭니다.</span></div>
          <div className="setup-actions">
            {hasManualSaves && <button className="manual-save-button" onClick={onManageSaves}><Save size={15} /> 체크포인트 관리</button>}
            {hasSave && <button className="continue-button" onClick={onContinue}><Save size={15} /> 저장 캠페인 계속</button>}
            <button className="start-button" onClick={onStart}><Play size={15} fill="currentColor" /> {nation.shortName} · 취임</button>
          </div>
        </footer>
        <Star className="setup-watermark" size={190} />
      </div>
    </div>
  );
}
