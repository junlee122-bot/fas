import { useId, useState } from 'react';
import {
  Atom,
  Banknote,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  Factory,
  GraduationCap,
  HeartPulse,
  House,
  Leaf,
  Link2,
  Luggage,
  Palette,
  RadioTower,
  Route,
  Scale,
  ShieldPlus,
  Sprout,
  UsersRound,
  Zap,
} from 'lucide-react';
import {
  civilizationDomainDefinitions,
  getCivilizationEffectLabels,
  getCivilizationEra,
  getCivilizationPaths,
  getCivilizationPrograms,
  getCompletedCivilizationApproach,
  nationCivilizationProfiles,
  type CivilizationDomainId,
  type CivilizationPath,
  type CivilizationProgram,
} from './civilizationSystems';
import type { NationalSimulationSnapshot, SimulationStatus } from './nationalSimulation';
import type { CareerRole, GameState, NationId } from './types';

interface CivilizationPortfolioProps {
  year: number;
  nationId: NationId;
  role: CareerRole;
  game: GameState;
  snapshot: NationalSimulationSnapshot;
  completedDecisions: string[];
  onEnact: (program: CivilizationProgram, path: CivilizationPath) => void;
}

const domainIcons: Record<CivilizationDomainId, typeof Sprout> = {
  food: Sprout,
  energy: Zap,
  housing: House,
  transport: Route,
  health: HeartPulse,
  education: GraduationCap,
  labor: UsersRound,
  information: RadioTower,
  environment: Leaf,
  science: Atom,
  finance: Banknote,
  justice: Scale,
  migration: Luggage,
  culture: Palette,
  resilience: ShieldPlus,
};

const domainClusters: Array<{ id: string; label: string; description: string; domains: CivilizationDomainId[] }> = [
  { id: 'survival', label: '생존 기반', description: '먹고 살며 이동하고 충격을 견디는 능력', domains: ['food', 'energy', 'housing', 'transport', 'resilience'] },
  { id: 'society', label: '사회계약', description: '사람의 건강·역량·소속과 공동체', domains: ['health', 'education', 'labor', 'migration', 'culture'] },
  { id: 'sovereignty', label: '주권과 미래', description: '정보·돈·법·환경·기술의 통제권', domains: ['information', 'finance', 'justice', 'environment', 'science'] },
];

const statusLabels: Record<SimulationStatus, string> = {
  stable: '안정',
  watch: '관찰',
  strained: '압박',
  critical: '위기',
};

const statusForScore = (score: number): SimulationStatus => (
  score < 35 ? 'critical' : score < 52 ? 'strained' : score < 68 ? 'watch' : 'stable'
);

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / Math.max(1, values.length);
}

function findGood(snapshot: NationalSimulationSnapshot, id: string) {
  return snapshot.goods.find((good) => good.id === id)?.availability ?? snapshot.marketAccess;
}

function findInstitution(snapshot: NationalSimulationSnapshot, id: string) {
  return snapshot.institutions.find((institution) => institution.id === id)?.coverage ?? snapshot.administrativeCapacity;
}

function domainScore(snapshot: NationalSimulationSnapshot, domainId: CivilizationDomainId) {
  const laborApproval = average(snapshot.populationGroups.map((group) => Math.max(0, Math.min(100, group.approval + 50))));
  const institutionAverage = average(snapshot.institutions.map((institution) => institution.coverage));
  const scores: Record<CivilizationDomainId, number> = {
    food: findGood(snapshot, 'food'),
    energy: findGood(snapshot, 'fuel'),
    housing: average([snapshot.standardOfLiving * 5, snapshot.socialCohesion, findGood(snapshot, 'consumer')]),
    transport: findGood(snapshot, 'transport'),
    health: average([findGood(snapshot, 'medicine'), findInstitution(snapshot, 'public-health')]),
    education: findInstitution(snapshot, 'education-science'),
    labor: average([laborApproval, snapshot.socialCohesion, findGood(snapshot, 'consumer')]),
    information: average([findInstitution(snapshot, 'home-affairs'), snapshot.socialCohesion, snapshot.administrativeCapacity]),
    environment: average([snapshot.socialCohesion, institutionAverage, findGood(snapshot, 'food')]),
    science: average([findInstitution(snapshot, 'education-science'), snapshot.administrativeCapacity, snapshot.marketAccess]),
    finance: average([snapshot.marketAccess, snapshot.administrativeCapacity, findInstitution(snapshot, 'economic-planning')]),
    justice: average([snapshot.administrativeCapacity, snapshot.socialCohesion, findInstitution(snapshot, 'home-affairs')]),
    migration: average([snapshot.socialCohesion, snapshot.standardOfLiving * 5, findGood(snapshot, 'transport')]),
    culture: average([snapshot.socialCohesion, findInstitution(snapshot, 'education-science'), findInstitution(snapshot, 'home-affairs')]),
    resilience: average([snapshot.administrativeCapacity, findGood(snapshot, 'transport'), findInstitution(snapshot, 'public-health')]),
  };
  return Math.round(Math.max(0, Math.min(100, scores[domainId])));
}

export function CivilizationPortfolio({
  year,
  nationId,
  role,
  game,
  snapshot,
  completedDecisions,
  onEnact,
}: CivilizationPortfolioProps) {
  const [selectedDomainId, setSelectedDomainId] = useState<CivilizationDomainId>('food');
  const tabBaseId = useId();
  const era = getCivilizationEra(year);
  const programs = getCivilizationPrograms(year);
  const profile = nationCivilizationProfiles[nationId];
  const selectedProgram = programs.find((program) => program.domainId === selectedDomainId) ?? programs[0];
  const selectedDomain = civilizationDomainDefinitions[selectedProgram.domainId];
  const paths = getCivilizationPaths(selectedProgram, nationId, role);
  const completedApproach = getCompletedCivilizationApproach(selectedProgram.id, completedDecisions);
  const completedCount = programs.filter((program) => getCompletedCivilizationApproach(program.id, completedDecisions)).length;

  return (
    <section className="civilization-portfolio" aria-labelledby="civilization-portfolio-title">
      <header className="civilization-portfolio-header">
        <div>
          <span className="eyebrow">CIVILIZATION SYSTEMS · {era.shortLabel}</span>
          <h3 id="civilization-portfolio-title">{era.label} 국가 포트폴리오</h3>
          <p>{era.order}</p>
        </div>
        <div className="civilization-era-progress">
          <span><strong>{completedCount}</strong><small>/ {programs.length} 분야 결정</small></span>
          <i><b style={{ width: `${(completedCount / Math.max(1, programs.length)) * 100}%` }} /></i>
          <em>{era.question}</em>
        </div>
      </header>

      <div className="civilization-profile-strip">
        <span><Factory /><small>국가 집행력</small><strong>{profile.stateCapacity}</strong></span>
        <span><UsersRound /><small>시민 연합력</small><strong>{profile.civicCapacity}</strong></span>
        <span><Bot /><small>시장·혁신 깊이</small><strong>{profile.marketDepth}</strong></span>
        <p>{profile.historicalAnchor}</p>
      </div>

      <div className="civilization-domain-rail" role="tablist" aria-label="국가 문명체계 분야">
        {domainClusters.map((cluster) => {
          const clusterPrograms = programs.filter((program) => cluster.domains.includes(program.domainId));
          const completedInCluster = clusterPrograms.filter((program) => getCompletedCivilizationApproach(program.id, completedDecisions)).length;
          return (
            <section className="civilization-domain-cluster" role="presentation" key={cluster.id}>
              <header><span><strong>{cluster.label}</strong><small>{cluster.description}</small></span><em>{completedInCluster}/{clusterPrograms.length}</em></header>
              <div className="civilization-domain-cluster-grid" role="presentation">
                {clusterPrograms.map((program) => {
                  const definition = civilizationDomainDefinitions[program.domainId];
                  const Icon = domainIcons[program.domainId];
                  const score = domainScore(snapshot, program.domainId);
                  const status = statusForScore(score);
                  const completed = getCompletedCivilizationApproach(program.id, completedDecisions);
                  return (
                    <button
                      type="button"
                      role="tab"
                      id={`${tabBaseId}-${program.domainId}-tab`}
                      aria-controls={`${tabBaseId}-${program.domainId}-panel`}
                      aria-selected={program.id === selectedProgram.id}
                      className={`${program.id === selectedProgram.id ? 'active' : ''} ${status}`}
                      onClick={() => setSelectedDomainId(program.domainId)}
                      key={program.id}
                    >
                      <Icon />
                      <span><strong>{definition.shortLabel}</strong><small>{statusLabels[status]}</small></span>
                      <b>{score}</b>
                      {completed ? <CheckCircle2 aria-label="이 시대 결정 완료" /> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div
        className="civilization-program-brief"
        id={`${tabBaseId}-${selectedProgram.domainId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabBaseId}-${selectedProgram.domainId}-tab`}
      >
        <div>
          <span>{selectedDomain.label} · {selectedProgram.reviewWeeks}주 검증</span>
          <h4>{selectedProgram.title}</h4>
          <p>{selectedProgram.summary}</p>
        </div>
        <aside>
          <strong>역사적 기준점</strong>
          <p>{selectedProgram.historicalBasis}</p>
          <a href={selectedProgram.sourceUrl} target="_blank" rel="noreferrer"><BookOpen /> {selectedProgram.sourceLabel}<Link2 /></a>
        </aside>
      </div>

      <div className="civilization-path-grid">
        {paths.map((path) => {
          const completed = completedApproach === path.approachId;
          const anotherCompleted = Boolean(completedApproach && !completed);
          const lacksTreasury = game.treasury < path.treasuryCost;
          const lacksPoliticalPower = game.politicalPower < path.politicalCost;
          const effectChips = getCivilizationEffectLabels(path);
          return (
            <article className={`${path.approachId} ${completed ? 'completed' : ''} ${anotherCompleted ? 'closed' : ''}`} key={path.id}>
              <header>
                <span>{path.authorityLabel}</span>
                <em>예상 실효 {path.effectiveness}%</em>
                {completed && <CheckCircle2 />}
              </header>
              <h4>{path.label}</h4>
              <p>{path.summary}</p>
              <div className="civilization-effect-chips">
                {effectChips.map((effectChip) => <span className={effectChip.favorable ? '' : 'cost'} key={effectChip.label}>{effectChip.text}</span>)}
              </div>
              <dl>
                <div><dt>주요 수혜</dt><dd>{path.beneficiary}</dd></div>
                <div><dt>구조적 위험</dt><dd>{path.risk}</dd></div>
                <div><dt>권한 경로</dt><dd>{path.authorityNote}</dd></div>
              </dl>
              <footer>
                <span><small>비용</small><strong>정치력 {path.politicalCost} · 국고 {path.treasuryCost}</strong><em>{path.reviewWeeks}주 뒤 1차 검증</em></span>
                <button
                  type="button"
                  disabled={completed || anotherCompleted || lacksTreasury || lacksPoliticalPower}
                  onClick={() => onEnact(selectedProgram, path)}
                >
                  {completed ? '시행 중' : anotherCompleted ? '다른 경로 채택됨' : lacksTreasury ? '국고 부족' : lacksPoliticalPower ? '정치력 부족' : path.authorityMode === 'proposal' ? '정책 상신' : '정책 채택'}
                  {!completed && !anotherCompleted && <ChevronRight />}
                </button>
              </footer>
            </article>
          );
        })}
      </div>

      <div className="civilization-causal-footer">
        <span>이번 결정</span><ChevronRight /><strong>즉시 자원·신뢰 변화</strong><ChevronRight /><strong>{selectedProgram.reviewWeeks}주 제도 검증</strong><ChevronRight /><strong>시장·권력집단·세계 주보에 누적</strong>
      </div>
    </section>
  );
}
