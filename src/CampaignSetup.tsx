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
import { careerRoles, getNation, nations } from './campaign';
import type { CareerBranch, NationId } from './types';

type Doctrine = 'coalition' | 'methodical' | 'maneuver';

interface CampaignSetupProps {
  nationId: NationId;
  roleId: string;
  doctrine: Doctrine;
  hasSave: boolean;
  onNationChange: (nationId: NationId) => void;
  onRoleChange: (roleId: string) => void;
  onDoctrineChange: (doctrine: Doctrine) => void;
  onStart: () => void;
  onContinue: () => void;
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
  onNationChange,
  onRoleChange,
  onDoctrineChange,
  onStart,
  onContinue,
}: CampaignSetupProps) {
  const nation = getNation(nationId);
  const roles = careerRoles.filter((role) => role.nationId === nationId);

  return (
    <div className="modal-backdrop campaign-setup-backdrop">
      <div className="campaign-setup-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-setup-title">
        <header className="setup-header">
          <div>
            <span className="eyebrow">IRON DOMINION · ALTERNATE HISTORY CAREER</span>
            <h1 id="campaign-setup-title">1942년, 누구의 자리에 앉겠습니까?</h1>
            <p>실존 지도자의 결정을 따라가는 대신, 국가 조직의 빈자리에 당신이 취임합니다. 승진하고 파벌을 설득하며 원래 역사에 없던 세계를 만드십시오.</p>
          </div>
          <div className="setup-era"><Globe2 size={21} /><span>유럽 ↔ 아시아·태평양<strong>양대 전구 동시 진행</strong></span></div>
        </header>

        <div className="setup-body">
          <section className="setup-nations">
            <div className="setup-section-title"><span>01</span><div><strong>플레이 진영</strong><small>9개 국가·정치체</small></div></div>
            <div className="nation-choice-grid">
              {nations.map((item) => (
                <button
                  key={item.id}
                  className={nationId === item.id ? 'selected' : ''}
                  aria-pressed={nationId === item.id}
                  onClick={() => onNationChange(item.id)}
                >
                  <i style={{ background: item.color, borderColor: item.accent }}>{item.code}</i>
                  <span><strong>{item.shortName}</strong><small>{item.alignment === 'allies' ? '연합 진영' : '추축 진영'} · {item.defaultTheater === 'asia' ? '아시아' : '유럽'}</small></span>
                  {nationId === item.id && <CheckCircle2 size={15} />}
                </button>
              ))}
            </div>
            <div className="nation-brief" style={{ borderColor: nation.accent }}>
              <div><i style={{ background: nation.color }}>{nation.code}</i><span><strong>{nation.name}</strong><small>{nation.challenge}</small></span></div>
              <p>{nation.summary}</p>
            </div>
          </section>

          <section className="setup-career">
            <div className="setup-section-title"><span>02</span><div><strong>취임 보직</strong><small>상급 리그부터 현장 리그까지</small></div></div>
            <div className="role-choice-list">
              {roles.map((role) => (
                <button key={role.id} className={roleId === role.id ? 'selected' : ''} aria-pressed={roleId === role.id} onClick={() => onRoleChange(role.id)}>
                  <i>{branchIcons[role.branch]}</i>
                  <span><small>TIER {role.tier} · {branchLabels[role.branch]}</small><strong>{role.title}</strong><em>{role.scope} · 권한 {role.authority}</em></span>
                  <div className="role-tier">{'★'.repeat(4 - role.tier)}{'☆'.repeat(role.tier - 1)}</div>
                </button>
              ))}
            </div>
            <div className="career-ladder-note"><BriefcaseBusiness size={16} /><span><strong>커리어는 고정되지 않습니다.</strong>하위 보직은 성과로 승진하고, 상위 보직은 내각과 군부의 신임을 잃으면 해임될 수 있습니다.</span></div>

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
          <div className="alternate-history-promise"><MapPinned size={18} /><span><strong>역사는 출발 조건일 뿐입니다.</strong>국가 진로, 동맹, 독립, 휴전, 전후 체제는 플레이마다 달라집니다.</span></div>
          <div className="setup-actions">
            {hasSave && <button className="continue-button" onClick={onContinue}><Save size={15} /> 저장 캠페인 계속</button>}
            <button className="start-button" onClick={onStart}><Play size={15} fill="currentColor" /> {nation.shortName} · 취임</button>
          </div>
        </footer>
        <Star className="setup-watermark" size={190} />
      </div>
    </div>
  );
}
