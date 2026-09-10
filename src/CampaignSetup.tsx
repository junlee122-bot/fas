import {
  Atom,
  ArrowLeft,
  ArrowRight,
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
  Stethoscope,
  UserRound,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { useCallback, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { CAREER_TIER_COUNT, careerRoles, getCareerStarCount, getNation, nations } from './campaign';
import {
  CIVILIAN_POSSIBILITY_BASE,
  civilianOrigins,
  civilianProfessions,
  getCivilianOrigin,
  getCivilianProfession,
} from './civilianCareer';
import { getHistoricalFlag } from './historicalFlags';
import { withJosa } from './koreanGrammar';
import { KoreaCampaignBrief } from './KoreaCampaignBrief';
import { NationFlag } from './NationFlag';
import europeMap from './assets/european-theater-war-department-1944.jpg';
import asiaMap from './assets/far-east-milrose-1943.jpg';
import './CampaignSetup.css';
import type {
  CampaignStartMode,
  CareerBranch,
  CivilianOriginId,
  CivilianProfessionId,
  NationId,
  NationStatus,
} from './types';

type Doctrine = 'coalition' | 'methodical' | 'maneuver';

export interface CampaignSetupProps {
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

export type CampaignSetupStep = 1 | 2 | 3;

export interface CampaignSetupViewProps extends CampaignSetupProps {
  step: CampaignSetupStep;
  branch: CareerBranch;
  onStepChange: (step: CampaignSetupStep) => void;
  onBranchChange: (branch: CareerBranch) => void;
  stepHeadingRef?: Ref<HTMLHeadingElement>;
}

const stepLabels = ['국가 선택', '삶과 보직', '최종 취임'] as const;
const stepDescriptions = [
  '같은 1942년, 서로 다른 출발점입니다. 국가와 시작 전구를 먼저 확인하십시오.',
  '한 사람의 권한과 책임을 정합니다. 다른 분야의 보직은 탭에서 살펴볼 수 있습니다.',
  '선택을 검토하고 첫 방향을 정하십시오. 시작 버튼을 누르기 전까지 캠페인은 변경되지 않습니다.',
] as const;

function doctrineTitle(id: Doctrine, civilian: boolean) {
  return civilian ? id === 'coalition' ? '연대와 설득' : id === 'methodical' ? '전문성과 준비' : '행동과 돌파'
    : doctrineChoices.find((choice) => choice.id === id)?.title ?? '선택 필요';
}

function navigateTabs<T extends string>(event: KeyboardEvent<HTMLButtonElement>, choices: readonly T[], active: T, select: (choice: T) => void) {
  let index = choices.indexOf(active);
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') index = (index + 1) % choices.length;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') index = (index - 1 + choices.length) % choices.length;
  else if (event.key === 'Home') index = 0;
  else if (event.key === 'End') index = choices.length - 1;
  else return;
  event.preventDefault();
  select(choices[index]);
  event.currentTarget.closest('[role="tablist"]')?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus();
}

function trapDialogFocus(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab') return;
  const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), select:not(:disabled), summary, a[href]');
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (!first || !last) return;
  const active = event.currentTarget.ownerDocument.activeElement;
  if (event.shiftKey && (active === first || !Array.from(controls).some((item) => item === active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/** The only internal state is navigation. Draft changes remain explicit parent callbacks. */
export function CampaignSetup(props: CampaignSetupProps) {
  const [step, setStep] = useState<CampaignSetupStep>(1);
  const [branchChoice, setBranchChoice] = useState<CareerBranch | null>(null);
  const focusHeading = useCallback((node: HTMLHeadingElement | null) => { node?.focus(); }, []);
  const selectedBranch = careerRoles.find((role) => role.id === props.roleId && role.nationId === props.nationId)?.branch ?? 'politics';
  const changeStep = (next: CampaignSetupStep) => {
    setStep(next);
  };
  return <CampaignSetupView {...props} step={step} branch={branchChoice ?? selectedBranch}
    onStepChange={changeStep} stepHeadingRef={focusHeading}
    onBranchChange={setBranchChoice}
    onNationChange={(id) => { setBranchChoice(null); props.onNationChange(id); }} />;
}

/** Controlled presentation also allows every stage to be verified without creating a campaign. */
export function CampaignSetupView(props: CampaignSetupViewProps) {
  const { nationId, roleId, startMode, civilianProfessionId, civilianOriginId, doctrine, hasSave, hasManualSaves,
    onNationChange, onRoleChange, onStartModeChange, onCivilianProfessionChange, onCivilianOriginChange,
    onDoctrineChange, onStart, onContinue, onManageSaves, step, branch, onStepChange, onBranchChange, stepHeadingRef } = props;
  const nation = getNation(nationId);
  const historicalFlag = getHistoricalFlag(nationId);
  const roles = careerRoles.filter((role) => role.nationId === nationId);
  const selectedRole = roles.find((role) => role.id === roleId);
  const visibleRoles = roles.filter((role) => role.branch === branch);
  const profession = getCivilianProfession(civilianProfessionId);
  const origin = getCivilianOrigin(civilianOriginId);
  const isCivilian = startMode === 'civilian';
  const validNation = nations.some((item) => item.id === nationId);
  const validLife = isCivilian
    ? civilianProfessions.some((item) => item.id === civilianProfessionId) && civilianOrigins.some((item) => item.id === civilianOriginId)
    : Boolean(selectedRole);
  const validChoice = validNation && validLife && doctrineChoices.some((choice) => choice.id === doctrine);
  const canProceed = validNation && (step === 1 || (validChoice && (isCivilian || selectedRole?.branch === branch)));
  const lifeLabel = isCivilian ? profession.name : selectedRole?.title ?? '보직을 선택하십시오';
  const selectedBranchRole = selectedRole?.branch === branch ? selectedRole : undefined;
  const roleDescription = selectedBranchRole ?? (step === 3 ? selectedRole : undefined);
  const record = roleDescription ? <div className="campaign-onboarding__dossier">
    <span className="campaign-onboarding__eyebrow">1942 · 실제 재직 기록</span>
    <h3>{roleDescription.historicalHolderName}</h3>
    <p className="campaign-onboarding__label">{roleDescription.historicalOffice}</p>
    <p>{roleDescription.historicalBasis}</p>
    <p>{roleDescription.replacementEffect}</p>
    <dl className="campaign-onboarding__facts">
      <div><dt>담당 범위</dt><dd>{roleDescription.scope}</dd></div>
      <div><dt>초기 권한</dt><dd>{roleDescription.authority}</dd></div>
      <div><dt>활동 위장</dt><dd>{roleDescription.coverIdentity}</dd></div>
    </dl>
    <div className="campaign-onboarding__responsibility"><span className="campaign-onboarding__label">이 자리에서 기대하는 일</span><p>{roleDescription.expectation}</p></div>
    {nationId === 'korea' ? <KoreaCampaignBrief role={roleDescription} /> : null}
  </div> : null;

  return <div className="campaign-onboarding">
    <div className="campaign-onboarding__window" role="dialog" aria-modal="true" aria-labelledby="campaign-onboarding-title"
      aria-describedby="campaign-onboarding-description" onKeyDown={trapDialogFocus} data-step={step}>
      <header className="campaign-onboarding__header">
        <div className="campaign-onboarding__brand"><Globe2 size={23} aria-hidden="true" /><span>IRON DOMINION<small>1942 / 새 캠페인</small></span></div>
        <div className="campaign-onboarding__resume" aria-label="저장 캠페인">
          {hasManualSaves ? <button type="button" onClick={onManageSaves}><Save size={16} aria-hidden="true" />체크포인트 관리</button> : null}
          {hasSave ? <button type="button" className="campaign-onboarding__continue" onClick={onContinue}><Play size={16} aria-hidden="true" />저장 캠페인 계속</button> : null}
        </div>
      </header>
      <nav className="campaign-onboarding__steps" aria-label="캠페인 생성 단계">
        <ol>{stepLabels.map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} data-complete={step > index + 1}>
          <span aria-hidden="true">{step > index + 1 ? <CheckCircle2 size={18} /> : '0' + (index + 1)}</span><strong>{label}</strong>
        </li>)}</ol>
      </nav>
      <main className="campaign-onboarding__body" key={step}>
        <div className="campaign-onboarding__intro"><span className="campaign-onboarding__eyebrow">CAMPAIGN SETUP / 0{step}</span>
          <h1 id="campaign-onboarding-title" ref={stepHeadingRef} tabIndex={-1}>{stepLabels[step - 1]}</h1>
          <p id="campaign-onboarding-description">{stepDescriptions[step - 1]}</p>
        </div>

        {step === 1 ? <div className="campaign-onboarding__nation-layout">
          <section className="campaign-onboarding__nation-rail" aria-label="플레이 진영 선택">
            <div className="campaign-onboarding__section-heading"><h2>플레이 진영</h2><span>{nations.length}개 출발점</span></div>
            <div className="campaign-onboarding__nation-list">{nations.map((item) => <button type="button" key={item.id}
              aria-pressed={nationId === item.id} onClick={() => onNationChange(item.id)} aria-label={item.shortName + ', ' + nationStatusLabels[item.status]}>
              <NationFlag nationId={item.id} size="compact" decorative />
              <span><strong>{item.shortName}</strong><small>{nationStatusLabels[item.status]}</small></span>
              {nationId === item.id ? <CheckCircle2 size={18} aria-hidden="true" /> : <span className="campaign-onboarding__nation-code">{item.code}</span>}
            </button>)}</div>
          </section>
          <article className="campaign-onboarding__nation-detail" aria-label="선택한 진영 기록">
            <figure className="campaign-onboarding__map">
              <img src={nation.defaultTheater === 'asia' ? asiaMap : europeMap} alt="" />
              <figcaption><MapPinned size={15} aria-hidden="true" />{nation.defaultTheater === 'asia' ? '아시아·태평양' : '유럽'} · 기록 지도 / 실제 작전 상황 아님</figcaption>
            </figure>
            <div className="campaign-onboarding__nation-copy">
              <div className="campaign-onboarding__nation-title"><NationFlag nationId={nation.id} size="large" /><div>
                <span className="campaign-onboarding__eyebrow">{nationStatusLabels[nation.status]}</span><h2>{nation.name}</h2></div></div>
              <p className="campaign-onboarding__lead">{nation.summary}</p>
              <div className="campaign-onboarding__challenge"><span className="campaign-onboarding__label">시작 시 마주할 과제</span><p>{nation.challenge}</p></div>
              <dl className="campaign-onboarding__facts"><div><dt>시작 전구</dt><dd>{nation.defaultTheater === 'asia' ? '아시아·태평양' : '유럽'}</dd></div>
                <div><dt>플레이 범위</dt><dd>양대 전구 동시 진행</dd></div></dl>
              <details className="campaign-onboarding__archive"><summary>국기와 역사적 출발점 확인</summary><div>
                <strong>{historicalFlag.name}</strong><small>{historicalFlag.period} · {historicalFlag.kindLabel}</small>
                <p>{historicalFlag.historicalNote}</p><p>사료 기준 · {nation.historicalBasis}</p>
              </div></details>
            </div>
          </article>
        </div> : null}

        {step === 2 ? <>
          <div className="campaign-onboarding__mode-tabs" role="tablist" aria-label="캠페인 시작 방식">
            {(['office', 'civilian'] as const).map((mode) => <button type="button" key={mode} role="tab" id={'campaign-mode-' + mode}
              aria-controls="campaign-mode-panel" aria-selected={startMode === mode} tabIndex={startMode === mode ? 0 : -1}
              onClick={() => onStartModeChange(mode)} onKeyDown={(event) => navigateTabs(event, ['office', 'civilian'], mode, onStartModeChange)}>
              {mode === 'office' ? <BriefcaseBusiness size={22} aria-hidden="true" /> : <UserRound size={22} aria-hidden="true" />}
              <span><strong>{mode === 'office' ? '보직을 맡아 시작' : '일반인으로 시작'}</strong><small>{mode === 'office' ? '실존 재직자의 자리와 책임을 대체' : '공식 권한 0 · 직업과 관계망부터 구축'}</small></span>
            </button>)}
          </div>
          <section id="campaign-mode-panel" role="tabpanel" aria-labelledby={'campaign-mode-' + startMode}>
            {!isCivilian ? <>
              <div className="campaign-onboarding__branch-tabs" role="tablist" aria-label="보직 분야">{branchOrder.map((item) => <button type="button" key={item}
                role="tab" id={'campaign-branch-' + item} aria-controls="campaign-branch-panel" aria-selected={branch === item} tabIndex={branch === item ? 0 : -1}
                onClick={() => onBranchChange(item)} onKeyDown={(event) => navigateTabs(event, branchOrder, item, onBranchChange)}>
                {branchIcons[item]}{branchLabels[item]}<small>{roles.filter((role) => role.branch === item).length}</small>
              </button>)}</div>
              <div className="campaign-onboarding__career-layout" id="campaign-branch-panel" role="tabpanel" aria-labelledby={'campaign-branch-' + branch}>
                <div><div className="campaign-onboarding__section-heading"><h2>{branchLabels[branch]}</h2><span>1급 최고위 ↔ 5급 현장</span></div>
                  <div className="campaign-onboarding__role-list">{visibleRoles.map((role) => {
                    const stars = getCareerStarCount(role.tier);
                    return <button type="button" key={role.id} aria-pressed={role.id === roleId}
                      aria-label={role.title + ', ' + stars + '성 보직, ' + role.historicalHolderName + ' 대체'} onClick={() => onRoleChange(role.id)}>
                      <span className="campaign-onboarding__rank" aria-hidden="true">{role.tier}<small>급</small></span>
                      <span className="campaign-onboarding__role-copy"><strong>{role.title}</strong><small>{role.scope}</small><span>대체 인물 · {role.historicalHolderName}</span></span>
                      <span className="campaign-onboarding__stars" aria-hidden="true">{'★'.repeat(stars)}{'☆'.repeat(CAREER_TIER_COUNT - stars)}</span>
                    </button>;
                  })}</div>
                  <p className="campaign-onboarding__note">같은 분야에서 네 번의 승진 기회가 열립니다. 최고위층의 인사권에는 신임과 해임 위험이 따릅니다.</p>
                </div>
                {record ?? <div className="campaign-onboarding__dossier campaign-onboarding__empty"><BriefcaseBusiness size={30} aria-hidden="true" /><h3>이 분야의 자리를 선택하십시오</h3><p>역사적 재직자, 담당 범위, 첫 책임이 이곳에 표시됩니다.</p></div>}
              </div>
            </> : <div className="campaign-onboarding__career-layout">
              <section><div className="campaign-onboarding__section-heading"><h2>민간 직업</h2><span>{civilianProfessions.length}개 직업</span></div>
                <div className="campaign-onboarding__profession-list">{civilianProfessions.map((item) => <button type="button" key={item.id}
                  aria-pressed={civilianProfessionId === item.id} onClick={() => onCivilianProfessionChange(item.id)}>
                  {civilianProfessionIcons[item.id]}<span><small>{item.category}</small><strong>{item.name}</strong></span>
                </button>)}</div>
              </section>
              <div className="campaign-onboarding__dossier"><span className="campaign-onboarding__eyebrow">공식 보직 없이 시작</span><h3>{profession.name}</h3>
                <p>{profession.summary}</p><dl className="campaign-onboarding__facts"><div><dt>일상 활동</dt><dd>{profession.vocation}</dd></div>
                  <div><dt>강점</dt><dd>{profession.strengths.join(' · ')}</dd></div><div><dt>감수할 위험</dt><dd>{profession.risk}</dd></div></dl>
                <label className="campaign-onboarding__origin-label" htmlFor="campaign-origin">출신 배경</label>
                <select id="campaign-origin" value={civilianOriginId} onChange={(event) => onCivilianOriginChange(event.target.value as CivilianOriginId)}>
                  {civilianOrigins.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                </select><p>{origin.summary}</p><p className="campaign-onboarding__note">{origin.advantage}</p>
                <details className="campaign-onboarding__archive"><summary>직업의 역사적 근거와 가능성</summary><div><p>{profession.historicalBasis}</p><p>기본 조합 {CIVILIAN_POSSIBILITY_BASE.toLocaleString('ko-KR')}개. 행동의 순서와 제도권 진입 시점에 따라 경로가 달라집니다.</p></div></details>
              </div>
            </div>}
          </section>
        </> : null}

        {step === 3 ? <div className="campaign-onboarding__review-layout">
          <section className="campaign-onboarding__review"><div className="campaign-onboarding__section-heading"><h2>{isCivilian ? '시작할 삶' : '취임 기록'}</h2><span>1942</span></div>
            <div className="campaign-onboarding__review-identity"><NationFlag nationId={nationId} size="large" /><div><span className="campaign-onboarding__label">{nation.name}</span><h3>{lifeLabel}</h3></div></div>
            <dl className="campaign-onboarding__facts"><div><dt>시작 방식</dt><dd>{isCivilian ? '일반인 · 공식 권한 0' : '실존 재직자 대체'}</dd></div>
              <div><dt>{isCivilian ? '출신 배경' : '대체할 인물'}</dt><dd>{isCivilian ? origin.name : selectedRole?.historicalHolderName ?? '선택 필요'}</dd></div>
              <div><dt>{isCivilian ? '첫 활동' : '담당 범위'}</dt><dd>{isCivilian ? profession.vocation : selectedRole?.scope ?? '선택 필요'}</dd></div></dl>
            <button type="button" className="campaign-onboarding__text-button" onClick={() => onStepChange(2)}><ArrowLeft size={16} aria-hidden="true" />삶과 보직 다시 선택</button>
            {!isCivilian ? record : <div className="campaign-onboarding__responsibility"><span className="campaign-onboarding__label">유지하거나 넓힐 영향력</span><p>언론·학계·기업·저항운동·정부에 진입하거나, 끝까지 독립적인 활동을 이어갈 수 있습니다.</p><p>{profession.risk}</p></div>}
          </section>
          <section className="campaign-onboarding__principles"><div className="campaign-onboarding__section-heading"><h2>{isCivilian ? '삶의 원칙' : '지휘 철학'}</h2></div>
            <p>{isCivilian ? '민간 활동의 첫 방향을 선택하십시오.' : '취임과 함께 적용할 초기 보너스를 선택하십시오.'}</p>
            <div className="campaign-onboarding__doctrines">{doctrineChoices.map((choice) => <button type="button" key={choice.id}
              aria-pressed={doctrine === choice.id} onClick={() => onDoctrineChange(choice.id)}>{choice.icon}<span><strong>{doctrineTitle(choice.id, isCivilian)}</strong>
                <small>{isCivilian ? choice.id === 'coalition' ? '인맥·공공 신뢰 중심' : choice.id === 'methodical' ? '전문성·생계 기반 중심' : '평판·변화 속도 중심' : choice.detail}</small></span>
              {doctrine === choice.id ? <CheckCircle2 size={18} aria-hidden="true" /> : null}
            </button>)}</div>
            <div className="campaign-onboarding__commit-note"><CheckCircle2 size={20} aria-hidden="true" /><p>확인한 선택으로 새 캠페인을 시작합니다. 이후의 정책·관계·작전과 주간 행동이 실제 세계에 누적됩니다.</p></div>
            {!validChoice ? <p className="campaign-onboarding__validation" role="alert">현재 국가에 맞는 유효한 보직 또는 민간 경로를 다시 선택하십시오.</p> : null}
          </section>
        </div> : null}
      </main>
      <footer className="campaign-onboarding__footer">
        <div className="campaign-onboarding__selection" aria-label="현재 선택 요약"><NationFlag nationId={nationId} size="compact" decorative />
          <div><small>현재 선택 · 아직 시작 전</small><strong>{nation.shortName} <span>/</span> {lifeLabel}</strong><span>{step === 3 ? doctrineTitle(doctrine, isCivilian) : isCivilian ? origin.name : selectedRole ? branchLabels[selectedRole.branch] : '2단계에서 보직을 선택합니다'}</span></div>
        </div>
        <div className="campaign-onboarding__actions"><button type="button" data-action="back" disabled={step === 1} onClick={() => { if (step > 1) onStepChange((step - 1) as CampaignSetupStep); }}><ArrowLeft size={16} aria-hidden="true" />이전</button>
          {step < 3 ? <button type="button" className="campaign-onboarding__primary" data-action="next" disabled={!canProceed}
            onClick={() => { if (canProceed) onStepChange((step + 1) as CampaignSetupStep); }}>{step === 1 ? '삶과 보직 선택' : '최종 선택 확인'}<ArrowRight size={17} aria-hidden="true" /></button>
            : <button type="button" className="campaign-onboarding__primary" data-action="start" disabled={!validChoice}
              onClick={() => { if (validChoice) onStart(); }}><Play size={17} fill="currentColor" aria-hidden="true" />{nation.shortName} · {isCivilian ? withJosa(profession.name, '으로/로') + ' 시작' : '취임'}</button>}
        </div>
      </footer>
    </div>
  </div>;
}
