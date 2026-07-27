import {
  Atom,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Church,
  Eye,
  Factory,
  Globe2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Landmark,
  MapPinned,
  Newspaper,
  Palette,
  Play,
  Save,
  Scale,
  Shield,
  Star,
  Stethoscope,
  UserRound,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { CAREER_TIER_COUNT, careerRoles, getCareerStarCount, getNation, nations } from './campaign';
import {
  CIVILIAN_POSSIBILITY_BASE,
  civilianOrigins,
  civilianProfessions,
  getCivilianOrigin,
  getCivilianProfession,
} from './civilianCareer';
import { getHistoricalFlag } from './historicalFlags';
import { KoreaCampaignBrief } from './KoreaCampaignBrief';
import { NationFlag } from './NationFlag';
import type {
  CampaignStartMode,
  CareerBranch,
  CivilianOriginId,
  CivilianProfessionId,
  NationId,
  NationStatus,
} from './types';

type Doctrine = 'coalition' | 'methodical' | 'maneuver';

interface CampaignSetupProps {
  nationId: NationId;
  roleId: string;
  startMode: CampaignStartMode;
  civilianProfessionId: CivilianProfessionId;
  civilianOriginId: CivilianOriginId;
  doctrine: Doctrine;
  hasSave: boolean;
  hasManualSaves: boolean;
  onNationChange: (nationId: NationId) => void;
  onRoleChange: (roleId: string) => void;
  onStartModeChange: (mode: CampaignStartMode) => void;
  onCivilianProfessionChange: (professionId: CivilianProfessionId) => void;
  onCivilianOriginChange: (originId: CivilianOriginId) => void;
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

function withInstrumentalParticle(label: string) {
  const code = label.charCodeAt(label.length - 1) - 0xac00;
  const finalConsonant = code >= 0 && code <= 11171 ? code % 28 : 0;
  return `${label}${finalConsonant !== 0 && finalConsonant !== 8 ? '으로' : '로'}`;
}

const civilianProfessionIcons: Record<CivilianProfessionId, ReactNode> = {
  intellectual: <BookOpen size={17} />,
  scientist: <Atom size={17} />,
  engineer: <Wrench size={17} />,
  physician: <Stethoscope size={17} />,
  journalist: <Newspaper size={17} />,
  jurist: <Scale size={17} />,
  educator: <GraduationCap size={17} />,
  entrepreneur: <Building2 size={17} />,
  'labor-organizer': <Users size={17} />,
  artist: <Palette size={17} />,
  humanitarian: <HeartHandshake size={17} />,
  clergy: <Church size={17} />,
};

export function CampaignSetup({
  nationId,
  roleId,
  startMode,
  civilianProfessionId,
  civilianOriginId,
  doctrine,
  hasSave,
  hasManualSaves,
  onNationChange,
  onRoleChange,
  onStartModeChange,
  onCivilianProfessionChange,
  onCivilianOriginChange,
  onDoctrineChange,
  onStart,
  onContinue,
  onManageSaves,
}: CampaignSetupProps) {
  const nation = getNation(nationId);
  const historicalFlag = getHistoricalFlag(nationId);
  const roles = careerRoles.filter((role) => role.nationId === nationId);
  const selectedRole = roles.find((role) => role.id === roleId) ?? roles[1];
  const selectedProfession = getCivilianProfession(civilianProfessionId);
  const selectedOrigin = getCivilianOrigin(civilianOriginId);
  const isCivilian = startMode === 'civilian';

  return (
    <div className="modal-backdrop campaign-setup-backdrop">
      <div className="campaign-setup-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-setup-title">
        <header className="setup-header">
          <div>
            <span className="eyebrow">IRON DOMINION · ALTERNATE HISTORY CAREER</span>
            <h1 id="campaign-setup-title">{isCivilian ? '1942년, 어떤 삶에서 역사를 시작하겠습니까?' : '1942년, 누구의 자리에 앉겠습니까?'}</h1>
            <p>{isCivilian
              ? '공식 보직 없이 한 사람의 시민으로 시작합니다. 생계와 검열을 견디며 지식·직업·공동체를 쌓고, 언론·학계·기업·저항운동·정부로 진입하거나 끝까지 독립적인 영향력을 유지하십시오.'
              : '1942년 실존 재직자 한 명의 보직을 사용자가 직접 대체합니다. 밀려난 전임자와 실제 참모·지휘관을 설득하고 경쟁하며 원래 역사에 없던 세계를 만드십시오.'}</p>
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
              {nation.id === 'korea' && !isCivilian && <KoreaCampaignBrief role={selectedRole} />}
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
            <div className="campaign-start-tabs" role="tablist" aria-label="캠페인 시작 방식">
              <button type="button" role="tab" aria-selected={!isCivilian} className={!isCivilian ? 'selected' : ''} onClick={() => onStartModeChange('office')}>
                <BriefcaseBusiness size={17} /><span><strong>보직을 맡아 시작</strong><small>실존 재직자의 자리를 대체</small></span>
              </button>
              <button type="button" role="tab" aria-selected={isCivilian} className={isCivilian ? 'selected' : ''} onClick={() => onStartModeChange('civilian')}>
                <UserRound size={17} /><span><strong>일반인으로 시작</strong><small>직업과 관계망을 처음부터 구축</small></span>
              </button>
            </div>

            {!isCivilian ? (
              <>
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
              </>
            ) : (
              <div className="civilian-setup-flow">
                <div className="setup-section-title"><span>02</span><div><strong>민간 직업</strong><small>{civilianProfessions.length}개 직업 · 공식 권한 0에서 시작</small></div></div>
                <div className="civilian-profession-grid">
                  {civilianProfessions.map((profession) => (
                    <button
                      type="button"
                      key={profession.id}
                      className={profession.id === civilianProfessionId ? 'selected' : ''}
                      aria-pressed={profession.id === civilianProfessionId}
                      onClick={() => onCivilianProfessionChange(profession.id)}
                    >
                      <i>{civilianProfessionIcons[profession.id]}</i>
                      <span><small>{profession.category}</small><strong>{profession.name}</strong><em>{profession.summary}</em></span>
                      {profession.id === civilianProfessionId && <CheckCircle2 size={15} />}
                    </button>
                  ))}
                </div>

                <div className="setup-section-title compact"><span>03</span><div><strong>출신 배경</strong><small>초기 인맥·생계·독립성·감시 위험을 결정</small></div></div>
                <div className="civilian-origin-grid">
                  {civilianOrigins.map((origin) => (
                    <button type="button" key={origin.id} className={origin.id === civilianOriginId ? 'selected' : ''} aria-pressed={origin.id === civilianOriginId} onClick={() => onCivilianOriginChange(origin.id)}>
                      <strong>{origin.name}</strong><small>{origin.summary}</small><em>{origin.advantage}</em>
                    </button>
                  ))}
                </div>

                <div className="civilian-path-preview">
                  <span>YOUR CIVILIAN PATH</span>
                  <div><strong>{selectedProfession.name}</strong><small>{selectedOrigin.name}</small></div>
                  <p>{selectedProfession.historicalBasis}</p>
                  <ul>
                    <li><b>일상</b>{selectedProfession.vocation}</li>
                    <li><b>강점</b>{selectedProfession.strengths.join(' · ')}</li>
                    <li><b>위험</b>{selectedProfession.risk}</li>
                  </ul>
                  <em>기본 조합 {CIVILIAN_POSSIBILITY_BASE.toLocaleString('ko-KR')}개에서 시작하며, 주간 행동의 순서·성공·제도권 진입 시점에 따라 세계선이 다시 갈라집니다.</em>
                </div>
              </div>
            )}

            <div className="setup-section-title compact"><span>{isCivilian ? '04' : '03'}</span><div><strong>{isCivilian ? '삶의 원칙' : '지휘 철학'}</strong><small>{isCivilian ? '민간 활동의 첫 방향' : '취임 시 초기 보너스'}</small></div></div>
            <div className="setup-doctrines">
              {doctrineChoices.map((choice) => (
                <button key={choice.id} className={doctrine === choice.id ? 'selected' : ''} aria-pressed={doctrine === choice.id} onClick={() => onDoctrineChange(choice.id)}>
                  {choice.icon}<span><strong>{isCivilian
                    ? choice.id === 'coalition' ? '연대와 설득' : choice.id === 'methodical' ? '전문성과 준비' : '행동과 돌파'
                    : choice.title}</strong><small>{isCivilian
                      ? choice.id === 'coalition' ? '인맥·공공 신뢰 중심' : choice.id === 'methodical' ? '전문성·생계 기반 중심' : '평판·변화 속도 중심'
                      : choice.detail}</small></span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <footer className="setup-footer">
          <div className="alternate-history-promise"><MapPinned size={18} /><span><strong>역사는 미리 작성하지 않습니다.</strong>{isCivilian ? '직업 활동·인맥·공개 발언·지하조직 참여·제도권 진입이 누적되어 자연스럽게 다른 세계를 만듭니다.' : '취임 뒤의 정책·인사·작전·외교·연구 선택이 누적되어 자연스럽게 다른 세계를 만듭니다.'}</span></div>
          <div className="setup-actions">
            {hasManualSaves && <button className="manual-save-button" onClick={onManageSaves}><Save size={15} /> 체크포인트 관리</button>}
            {hasSave && <button className="continue-button" onClick={onContinue}><Save size={15} /> 저장 캠페인 계속</button>}
            <button className="start-button" onClick={onStart}><Play size={15} fill="currentColor" /> {nation.shortName} · {isCivilian ? `${withInstrumentalParticle(selectedProfession.name)} 시작` : '취임'}</button>
          </div>
        </footer>
        <Star className="setup-watermark" size={190} />
      </div>
    </div>
  );
}
