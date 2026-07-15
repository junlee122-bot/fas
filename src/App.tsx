import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CloudRain,
  Cog,
  Crosshair,
  Eye,
  Factory,
  FlaskConical,
  Fuel,
  Handshake,
  Landmark,
  LockKeyhole,
  Map,
  Menu,
  Minus,
  Pause,
  Plane,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Settings,
  Shield,
  ShieldAlert,
  SkipForward,
  Star,
  Swords,
  Target,
  TrendingUp,
  Users,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import {
  commanders,
  initialDivisions,
  initialProduction,
  initialResearch,
  territories as initialTerritories,
  worldNews,
} from './data';
import type {
  Division,
  Faction,
  GameState,
  GameTab,
  Order,
  ProductionLine,
  ResearchProject,
  Stockpile,
  Territory,
  WarEvent,
} from './types';
import type { CampaignOutcome } from './types';

const SAVE_KEY = 'iron-dominion-campaign-v1';

const initialGame: GameState = {
  week: 0,
  manpower: 1280,
  politicalPower: 86,
  fuel: 74,
  steel: 112,
  factories: 30,
  stability: 78,
  warSupport: 84,
  commandPoints: 42,
  treasury: 920,
  victoryScore: 38,
  airPower: 57,
  navalPower: 52,
  intelNetwork: 64,
  enemyPressure: 68,
};

const initialStockpile: Stockpile = {
  infantryEquipment: 48200,
  tanks: 1284,
  aircraft: 2106,
  convoys: 624,
  artillery: 3840,
  trucks: 12600,
};

const initialEvents: WarEvent[] = [
  { id: 1, week: 0, title: '전쟁 내각 소집', detail: '북아프리카와 지중해의 주도권을 되찾을 작전안을 제출하십시오.', tone: 'neutral' },
  { id: 2, week: 0, title: '울트라 전문 수신', detail: '롬멜 군단의 연료 비축량이 임계치 아래로 떨어졌습니다.', tone: 'good' },
  { id: 3, week: 0, title: '대서양 피해 보고', detail: 'HX-212 호송선단에서 상선 4척이 손실되었습니다.', tone: 'bad' },
];

const factionLabels: Record<Faction, string> = {
  allies: '연합국',
  axis: '추축국',
  neutral: '중립국',
};

const typeMeta = {
  infantry: { label: '보병', symbol: 'Ⅱ', className: 'infantry' },
  armor: { label: '기갑', symbol: '▰', className: 'armor' },
  airborne: { label: '공수', symbol: '✦', className: 'airborne' },
  marine: { label: '해병', symbol: '⚓', className: 'marine' },
};

const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.max(0, Math.round(value)));

function getCampaignDate(week: number) {
  const date = new Date(Date.UTC(1942, 9, 25 + week * 7));
  return {
    full: new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date),
    day: new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'UTC' }).format(date),
  };
}

function ProgressBar({ value, tone = 'allied', thin = false }: { value: number; tone?: 'allied' | 'axis' | 'gold' | 'green'; thin?: boolean }) {
  return (
    <div className={'progress-track ' + (thin ? 'thin' : '')}>
      <span className={'progress-fill ' + tone} style={{ width: Math.min(100, Math.max(0, value)) + '%' }} />
    </div>
  );
}

function ResourceChip({ icon, value, label, delta }: { icon: React.ReactNode; value: string; label: string; delta?: string }) {
  return (
    <div className="resource-chip" title={label}>
      <span className="resource-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      {delta && <em>{delta}</em>}
    </div>
  );
}

export function App() {
  const [game, setGame] = useState<GameState>(initialGame);
  const [territories, setTerritories] = useState<Territory[]>(initialTerritories);
  const [divisions, setDivisions] = useState<Division[]>(initialDivisions);
  const [research, setResearch] = useState<ResearchProject[]>(initialResearch);
  const [production, setProduction] = useState<ProductionLine[]>(initialProduction);
  const [events, setEvents] = useState<WarEvent[]>(initialEvents);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<GameTab>('command');
  const [selectedTerritoryId, setSelectedTerritoryId] = useState('egypt');
  const [selectedDivisionId, setSelectedDivisionId] = useState('7arm');
  const [planningMode, setPlanningMode] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [showBriefing, setShowBriefing] = useState(true);
  const [showJournal, setShowJournal] = useState(false);
  const [doctrine, setDoctrine] = useState<'coalition' | 'methodical' | 'maneuver'>('coalition');
  const [toast, setToast] = useState('');
  const [objectiveProgress, setObjectiveProgress] = useState(28);
  const [torchAuthorized, setTorchAuthorized] = useState(false);
  const [completedDecisions, setCompletedDecisions] = useState<string[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [stockpile, setStockpile] = useState<Stockpile>(initialStockpile);
  const [campaignOutcome, setCampaignOutcome] = useState<CampaignOutcome>(null);
  const toastTimerRef = useRef<number | null>(null);

  const selectedTerritory = useMemo(
    () => territories.find((territory) => territory.id === selectedTerritoryId) ?? territories[0],
    [selectedTerritoryId, territories],
  );
  const selectedDivision = useMemo(
    () => divisions.find((division) => division.id === selectedDivisionId) ?? divisions[0],
    [divisions, selectedDivisionId],
  );
  const selectedCommander = commanders.find((commander) => commander.id === selectedDivision.commanderId) ?? commanders[0];
  const campaignDate = getCampaignDate(game.week);
  const hasSave = Boolean(localStorage.getItem(SAVE_KEY));

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast('');
      toastTimerRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  const addEvent = useCallback((title: string, detail: string, tone: WarEvent['tone'], week: number) => {
    setEvents((current) => [{ id: Date.now() + Math.random(), week, title, detail, tone }, ...current].slice(0, 30));
  }, []);

  const advanceWeek = useCallback(() => {
    const nextWeek = game.week + 1;
    const currentOrder = orders[0];

    if (currentOrder) {
      const division = divisions.find((item) => item.id === currentOrder.divisionId);
      const target = territories.find((item) => item.id === currentOrder.targetId);
      const commander = commanders.find((item) => item.id === division?.commanderId);
      if (division && target && commander) {
        if (target.controller === 'allies') {
          setDivisions((current) => current.map((item) => item.id === division.id ? {
            ...item,
            territoryId: target.id,
            status: 'ready',
            organization: Math.max(45, item.organization - 3),
            supply: Math.max(35, item.supply - 2),
          } : item));
          addEvent('우군 집결 — ' + target.name, division.name + '이(가) 확보된 교두보에 합류했습니다.', 'neutral', nextWeek);
          notify(division.name + '이(가) ' + target.name + '에 합류했습니다.');
        } else {
          const doctrineBonus = doctrine === 'maneuver' && division.type === 'armor' ? 14 : doctrine === 'methodical' ? 7 : 4;
          const attackPower = division.strength * 0.52 + division.organization * 0.25 + commander.attack * 0.2 + doctrineBonus + Math.random() * 22;
          const defensePower = 57 + target.value * 2.8 + (target.terrain === '산악' || target.terrain === '요새' ? 18 : 0) + Math.random() * 24;
          const victory = attackPower >= defensePower;
          if (victory) {
          setTerritories((current) => current.map((item) => item.id === target.id ? { ...item, controller: 'allies', supply: Math.max(35, item.supply - 12) } : item));
          setDivisions((current) => current.map((item) => item.id === division.id ? {
            ...item,
            territoryId: target.id,
            status: 'recovering',
            strength: Math.max(35, item.strength - Math.round(4 + Math.random() * 8)),
            organization: Math.max(28, item.organization - Math.round(13 + Math.random() * 16)),
            experience: Math.min(100, item.experience + 4),
          } : item));
          setGame((current) => ({ ...current, victoryScore: Math.min(100, current.victoryScore + target.value), warSupport: Math.min(100, current.warSupport + 2) }));
          setObjectiveProgress((current) => Math.min(100, current + target.value * 3));
          addEvent('전선 돌파 — ' + target.name, division.name + '이(가) 적 방어선을 격파하고 지역을 확보했습니다.', 'good', nextWeek);
          notify(target.name + ' 확보! 전선이 전진했습니다.');
          } else {
            setDivisions((current) => current.map((item) => item.id === division.id ? {
              ...item,
              status: 'recovering',
              strength: Math.max(28, item.strength - Math.round(8 + Math.random() * 12)),
              organization: Math.max(20, item.organization - Math.round(18 + Math.random() * 20)),
            } : item));
            setGame((current) => ({ ...current, manpower: current.manpower - 24, warSupport: Math.max(35, current.warSupport - 2) }));
            addEvent('공세 좌절 — ' + target.name, target.terrain + ' 지형과 강한 저항으로 공세가 중단되었습니다.', 'bad', nextWeek);
            notify('공세가 좌절되었습니다. 사단을 재정비하십시오.');
          }
        }
      }
      setOrders((current) => current.slice(1));
    }

    setDivisions((current) => current.map((division) => {
      if (division.status !== 'recovering') return division;
      const recoveredOrganization = Math.min(100, division.organization + 11);
      return {
        ...division,
        organization: recoveredOrganization,
        strength: Math.min(100, division.strength + 2),
        supply: Math.min(100, division.supply + 4),
        status: recoveredOrganization >= 70 ? 'ready' : 'recovering',
      };
    }));

    const researchGain = doctrine === 'methodical' ? 13 : 11;
    const breakthroughs = research.filter((project) => project.active && !project.complete && project.progress + researchGain >= project.duration);
    setResearch((current) => current.map((project) => {
      if (!project.active || project.complete) return project;
      const progress = Math.min(project.duration, project.progress + researchGain);
      return { ...project, progress, complete: progress >= project.duration, active: progress < project.duration };
    }));

    breakthroughs.forEach((project) => {
      addEvent('연구 완료 — ' + project.name, project.description + ' 효과가 전군에 적용되었습니다.', 'good', nextWeek);
      if (project.id === 'radar') setGame((current) => ({ ...current, airPower: Math.min(100, current.airPower + 12), intelNetwork: Math.min(100, current.intelNetwork + 5) }));
      if (project.id === 'tank') setDivisions((current) => current.map((division) => division.type === 'armor' ? { ...division, strength: Math.min(100, division.strength + 8), experience: Math.min(100, division.experience + 3) } : division));
      if (project.id === 'logistics') setDivisions((current) => current.map((division) => ({ ...division, supply: Math.min(100, division.supply + 12) })));
      if (project.id === 'code') setGame((current) => ({ ...current, intelNetwork: Math.min(100, current.intelNetwork + 20), enemyPressure: Math.max(25, current.enemyPressure - 8) }));
      if (project.id === 'landing') setGame((current) => ({ ...current, navalPower: Math.min(100, current.navalPower + 14), commandPoints: Math.min(100, current.commandPoints + 12) }));
      if (project.id === 'penicillin') setGame((current) => ({ ...current, manpower: current.manpower + 120, warSupport: Math.min(100, current.warSupport + 3) }));
    });

    setStockpile((current) => ({
      ...current,
      tanks: current.tanks + Math.round((production.find((line) => line.id === 'sherman')?.output ?? 0) * (production.find((line) => line.id === 'sherman')?.assigned ?? 0) / 5),
      aircraft: current.aircraft + Math.round((production.find((line) => line.id === 'spitfire')?.output ?? 0) * (production.find((line) => line.id === 'spitfire')?.assigned ?? 0) / 5),
      infantryEquipment: current.infantryEquipment + Math.round((production.find((line) => line.id === 'rifle')?.output ?? 0) * (production.find((line) => line.id === 'rifle')?.assigned ?? 0) / 5),
      convoys: current.convoys + Math.max(0, Math.round((production.find((line) => line.id === 'convoy')?.output ?? 0) * (production.find((line) => line.id === 'convoy')?.assigned ?? 0) / 5) - (nextWeek % 2 === 0 ? 4 : 1)),
      artillery: current.artillery + 72,
      trucks: current.trucks + 110,
    }));

    setProduction((current) => current.map((line) => ({ ...line, efficiency: Math.min(100, line.efficiency + (line.assigned > 0 ? 1 : 0)) })));
    setGame((current) => ({
      ...current,
      week: current.week + 1,
      manpower: current.manpower + 18,
      politicalPower: Math.min(200, current.politicalPower + 3),
      fuel: Math.max(0, Math.min(200, current.fuel + 8 - current.factories * 0.18)),
      steel: Math.min(240, current.steel + 9),
      commandPoints: Math.min(100, current.commandPoints + 6),
      treasury: current.treasury + 54 - current.factories,
      airPower: Math.min(100, current.airPower + (nextWeek % 4 === 0 ? 1 : 0)),
      navalPower: Math.max(20, Math.min(100, current.navalPower + (nextWeek % 3 === 0 ? 1 : 0))),
      enemyPressure: Math.min(100, current.enemyPressure + (nextWeek % 4 === 0 ? 2 : 0)),
    }));

    if (nextWeek % 3 === 0) {
      const threatenedTerritory = territories
        .filter((territory) => territory.controller === 'allies' && territory.id !== currentOrder?.targetId)
        .filter((territory) => territory.neighbors.some((neighborId) => territories.find((item) => item.id === neighborId)?.controller === 'axis'))
        .sort((left, right) => {
          const leftDefense = divisions.filter((division) => division.territoryId === left.id).reduce((sum, division) => sum + division.strength, 0) + left.supply;
          const rightDefense = divisions.filter((division) => division.territoryId === right.id).reduce((sum, division) => sum + division.strength, 0) + right.supply;
          return leftDefense - rightDefense;
        })[0];

      if (threatenedTerritory) {
        const defender = divisions
          .filter((division) => division.territoryId === threatenedTerritory.id)
          .sort((left, right) => right.strength - left.strength)[0];
        const defenderCommander = commanders.find((commander) => commander.id === defender?.commanderId);
        const defensivePower = defender
          ? defender.strength * 0.48 + defender.organization * 0.28 + (defenderCommander?.defense ?? 60) * 0.2 + threatenedTerritory.supply * 0.12
          : threatenedTerritory.value * 4 + threatenedTerritory.supply * 0.18;
        const enemyPower = game.enemyPressure * 0.7 + threatenedTerritory.value * 2.4 + Math.random() * 26;

        if (enemyPower > defensivePower) {
          const fallbackId = threatenedTerritory.neighbors.find((neighborId) => territories.find((item) => item.id === neighborId)?.controller === 'allies');
          setTerritories((current) => current.map((territory) => territory.id === threatenedTerritory.id ? { ...territory, controller: 'axis', supply: Math.max(20, territory.supply - 18) } : territory));
          setDivisions((current) => current.map((division) => division.territoryId === threatenedTerritory.id ? {
            ...division,
            territoryId: fallbackId ?? division.territoryId,
            status: 'recovering',
            strength: Math.max(25, division.strength - 9),
            organization: Math.max(18, division.organization - 22),
          } : division));
          setGame((current) => ({ ...current, victoryScore: Math.max(0, current.victoryScore - threatenedTerritory.value), warSupport: Math.max(20, current.warSupport - 2), enemyPressure: Math.min(100, current.enemyPressure + 3) }));
          setObjectiveProgress((current) => Math.max(0, current - threatenedTerritory.value * 2));
          addEvent('적 반격 성공 — ' + threatenedTerritory.name, '추축군이 전선을 돌파했습니다. 예비대를 투입해 방어선을 복구해야 합니다.', 'bad', nextWeek);
        } else {
          if (defender) {
            setDivisions((current) => current.map((division) => division.id === defender.id ? { ...division, strength: Math.max(30, division.strength - 3), organization: Math.max(30, division.organization - 9), experience: Math.min(100, division.experience + 2) } : division));
          }
          setGame((current) => ({ ...current, commandPoints: Math.min(100, current.commandPoints + 3), enemyPressure: Math.max(25, current.enemyPressure - 2) }));
          addEvent('적 반격 격퇴 — ' + threatenedTerritory.name, '연합군 방어선이 추축군의 공세를 저지했습니다.', 'good', nextWeek);
        }
      }
    }

    if (nextWeek % 2 === 0) {
      const news = worldNews[nextWeek % worldNews.length];
      addEvent('세계 전황', news, 'neutral', nextWeek);
    }
    if (nextWeek % 5 === 0) {
      setGame((current) => ({ ...current, stability: Math.max(45, current.stability - 1) }));
      addEvent('국내 전시 피로', '장기 배급과 공습 경보로 국민 피로가 누적되고 있습니다.', 'bad', nextWeek);
    }
  }, [addEvent, divisions, doctrine, game.enemyPressure, game.week, notify, orders, production, research, territories]);

  useEffect(() => {
    if (speed === 0 || showBriefing) return;
    const delay = speed === 1 ? 4200 : speed === 2 ? 2600 : 1500;
    const timer = window.setInterval(advanceWeek, delay);
    return () => window.clearInterval(timer);
  }, [advanceWeek, showBriefing, speed]);

  useEffect(() => {
    if (showBriefing) return;
    const payload = { version: 2, game, territories, divisions, research, production, events, orders, stockpile, campaignOutcome, objectiveProgress, torchAuthorized, completedDecisions, doctrine };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }, [campaignOutcome, completedDecisions, divisions, doctrine, events, game, objectiveProgress, orders, production, research, showBriefing, stockpile, territories, torchAuthorized]);

  useEffect(() => {
    if (showBriefing || campaignOutcome) return;
    const alliedTerritories = territories.filter((territory) => territory.controller === 'allies').length;
    const axisTerritories = territories.filter((territory) => territory.controller === 'axis').length;
    if (game.victoryScore >= 90 || alliedTerritories >= 19 || axisTerritories <= 5) {
      setCampaignOutcome('victory');
      setSpeed(0);
      addEvent('전략적 승리', '추축국의 전쟁 수행 능력이 붕괴했습니다. 유럽 해방을 위한 길이 열렸습니다.', 'good', game.week);
    } else if (game.victoryScore <= 8 || game.warSupport <= 22 || game.stability <= 28 || (game.week >= 156 && game.victoryScore < 62)) {
      setCampaignOutcome('defeat');
      setSpeed(0);
      addEvent('전략적 패배', '연합국의 전쟁 수행 능력이 한계에 도달했습니다. 전쟁 내각이 사임을 요구합니다.', 'bad', game.week);
    }
  }, [addEvent, campaignOutcome, game.stability, game.victoryScore, game.warSupport, game.week, showBriefing, territories]);

  const startCampaign = () => {
    setShowBriefing(false);
    if (doctrine === 'methodical') setGame((current) => ({ ...current, factories: 33, steel: 125 }));
    if (doctrine === 'maneuver') setGame((current) => ({ ...current, fuel: 96, commandPoints: 50 }));
    if (doctrine === 'coalition') setGame((current) => ({ ...current, politicalPower: 102, stability: 82 }));
    notify('연합군 최고사령부가 작전을 개시했습니다.');
  };

  const continueCampaign = () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setGame({ ...initialGame, ...(data.game ?? {}) });
      setTerritories(data.territories ?? initialTerritories);
      setDivisions(data.divisions ?? initialDivisions);
      setResearch(data.research ?? initialResearch);
      setProduction(data.production ?? initialProduction);
      setEvents(data.events ?? initialEvents);
      setOrders(data.orders ?? []);
      setStockpile({ ...initialStockpile, ...(data.stockpile ?? {}) });
      setCampaignOutcome(data.campaignOutcome ?? null);
      setObjectiveProgress(data.objectiveProgress ?? 28);
      setTorchAuthorized(data.torchAuthorized ?? false);
      setCompletedDecisions(data.completedDecisions ?? []);
      setDoctrine(data.doctrine ?? 'coalition');
      setShowBriefing(false);
      notify('저장된 전쟁 지휘소를 복구했습니다.');
    } catch {
      notify('저장 데이터를 읽을 수 없습니다. 새 캠페인을 시작합니다.');
    }
  };

  const resetCampaign = () => {
    localStorage.removeItem(SAVE_KEY);
    setGame(initialGame);
    setTerritories(initialTerritories);
    setDivisions(initialDivisions);
    setResearch(initialResearch);
    setProduction(initialProduction);
    setEvents(initialEvents);
    setOrders([]);
    setStockpile(initialStockpile);
    setCampaignOutcome(null);
    setObjectiveProgress(28);
    setTorchAuthorized(false);
    setCompletedDecisions([]);
    setSpeed(0);
    setShowBriefing(true);
  };

  const selectTerritory = (territoryId: string) => {
    if (planningMode) {
      const currentDivision = divisions.find((item) => item.id === selectedDivisionId);
      const origin = territories.find((item) => item.id === currentDivision?.territoryId);
      const target = territories.find((item) => item.id === territoryId);
      if (!currentDivision || !origin || !target) return;
      if (!origin.neighbors.includes(target.id)) {
        notify('인접한 지역만 작전 목표로 지정할 수 있습니다.');
        return;
      }
      if (target.controller === 'allies') {
        notify('이미 연합군이 통제하는 지역입니다.');
        return;
      }
      if (game.commandPoints < 5) {
        notify('지휘 점수가 부족합니다.');
        return;
      }
      setOrders((current) => [...current, { divisionId: currentDivision.id, fromId: origin.id, targetId: target.id, startedWeek: game.week }]);
      setDivisions((current) => current.map((item) => item.id === currentDivision.id ? { ...item, status: 'moving' } : item));
      setGame((current) => ({ ...current, commandPoints: current.commandPoints - 5 }));
      setPlanningMode(false);
      setSelectedTerritoryId(target.id);
      notify(currentDivision.name + ' → ' + target.name + ' 공세 계획 승인');
      return;
    }

    setSelectedTerritoryId(territoryId);
    const divisionAtTerritory = divisions.find((division) => division.territoryId === territoryId);
    if (divisionAtTerritory) setSelectedDivisionId(divisionAtTerritory.id);
  };

  const issueOffensive = () => {
    if (selectedDivision.status !== 'ready') {
      notify('이 사단은 현재 명령을 수행할 준비가 되지 않았습니다.');
      return;
    }
    setPlanningMode(true);
    setActiveTab('army');
    notify('지도에서 인접한 적 지역을 선택하십시오.');
  };

  const authorizeTorch = () => {
    if (torchAuthorized) return;
    if (game.politicalPower < 20 || game.commandPoints < 10) {
      notify('정치력 또는 지휘 점수가 부족합니다.');
      return;
    }
    const torchDivisions = divisions.filter((division) => ['1arm', '1inf'].includes(division.id));
    setOrders((current) => [
      ...current,
      ...torchDivisions.map((division) => ({ divisionId: division.id, fromId: 'atlantic', targetId: 'morocco', startedWeek: game.week })),
    ]);
    setDivisions((current) => current.map((division) => ['1arm', '1inf'].includes(division.id) ? { ...division, status: 'moving' } : division));
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 20, commandPoints: current.commandPoints - 10 }));
    setTorchAuthorized(true);
    addEvent('횃불 작전 승인', '미·영 연합 상륙함대가 모로코와 알제리 해안으로 출항했습니다.', 'good', game.week);
    notify('횃불 작전이 개시되었습니다. 다음 주에 상륙합니다.');
  };

  const enactDecision = (id: string, title: string, cost: number, effect: () => void) => {
    if (completedDecisions.includes(id)) return;
    if (game.politicalPower < cost) {
      notify('정치력이 부족합니다.');
      return;
    }
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - cost }));
    setCompletedDecisions((current) => [...current, id]);
    effect();
    addEvent('내각 결정 — ' + title, '전쟁 내각이 결정을 승인하고 즉시 시행했습니다.', 'good', game.week);
    notify(title + ' 시행 완료');
  };

  const toggleResearch = (id: string) => {
    const activeCount = research.filter((project) => project.active).length;
    const project = research.find((item) => item.id === id);
    if (!project || project.complete) return;
    if (!project.active && activeCount >= 2) {
      notify('연구 슬롯 2개가 모두 사용 중입니다.');
      return;
    }
    setResearch((current) => current.map((item) => item.id === id ? { ...item, active: !item.active } : item));
  };

  const adjustFactories = (id: string, amount: number) => {
    const usedFactories = production.reduce((sum, line) => sum + line.assigned, 0);
    if (amount > 0 && usedFactories >= game.factories) {
      notify('배정 가능한 군수 공장이 없습니다.');
      return;
    }
    setProduction((current) => current.map((line) => line.id === id ? {
      ...line,
      assigned: Math.max(0, line.assigned + amount),
      efficiency: amount < 0 ? Math.max(15, line.efficiency - 4) : line.efficiency,
    } : line));
  };

  const assignCommander = (divisionId: string, commanderId: string) => {
    const targetDivision = divisions.find((division) => division.id === divisionId);
    if (!targetDivision || targetDivision.commanderId === commanderId) return;
    const previousCommanderId = targetDivision.commanderId;
    setDivisions((current) => current.map((division) => {
      if (division.id === divisionId) return { ...division, commanderId };
      if (division.commanderId === commanderId) return { ...division, commanderId: previousCommanderId };
      return division;
    }));
    const commander = commanders.find((item) => item.id === commanderId);
    addEvent('지휘관 인사 발령', (commander?.name ?? '신임 지휘관') + '이(가) ' + targetDivision.name + ' 지휘를 맡았습니다.', 'neutral', game.week);
    notify('지휘관 배치를 변경했습니다.');
  };

  const trainDivision = (divisionId: string) => {
    const division = divisions.find((item) => item.id === divisionId);
    if (!division || division.status !== 'ready') {
      notify('준비 상태의 사단만 야전 훈련을 진행할 수 있습니다.');
      return;
    }
    if (game.commandPoints < 8 || game.manpower < 12) {
      notify('훈련에 필요한 지휘 점수 또는 인력이 부족합니다.');
      return;
    }
    setGame((current) => ({ ...current, commandPoints: current.commandPoints - 8, manpower: current.manpower - 12 }));
    setDivisions((current) => current.map((item) => item.id === divisionId ? {
      ...item,
      organization: Math.min(100, item.organization + 7),
      experience: Math.min(100, item.experience + 5),
      strength: Math.min(100, item.strength + 2),
      status: 'recovering',
    } : item));
    addEvent('야전 훈련 — ' + division.name, '합동 기동훈련을 마치고 사단의 조직력과 경험이 향상되었습니다.', 'good', game.week);
    notify(division.name + ' 야전 훈련 완료');
  };

  const tabItems: { id: GameTab; label: string; icon: React.ReactNode }[] = [
    { id: 'command', label: '최고사령부', icon: <Shield size={17} /> },
    { id: 'army', label: '육군', icon: <Swords size={17} /> },
    { id: 'industry', label: '군수 생산', icon: <Factory size={17} /> },
    { id: 'research', label: '연구', icon: <FlaskConical size={17} /> },
    { id: 'diplomacy', label: '외교', icon: <Handshake size={17} /> },
    { id: 'intelligence', label: '정보국', icon: <Eye size={17} /> },
  ];

  return (
    <div className="game-shell">
      <header className="topbar">
        <div className="brand-block">
          <button className="icon-button menu-button" aria-label="메뉴"><Menu size={19} /></button>
          <div className="brand-mark"><span>ID</span></div>
          <div className="brand-copy">
            <strong>IRON DOMINION</strong>
            <span>ALLIED HIGH COMMAND · 1942</span>
          </div>
        </div>

        <div className="resource-row">
          <ResourceChip icon={<Users size={16} />} value={formatNumber(game.manpower) + 'K'} label="가용 인력" delta="+18" />
          <ResourceChip icon={<Landmark size={16} />} value={formatNumber(game.politicalPower)} label="정치력" delta="+3" />
          <ResourceChip icon={<Factory size={16} />} value={String(game.factories)} label="군수 공장" />
          <ResourceChip icon={<Fuel size={16} />} value={formatNumber(game.fuel) + 'K'} label="연료" delta="+2.6" />
          <ResourceChip icon={<Cog size={16} />} value={formatNumber(game.steel) + 'K'} label="강철" delta="+9" />
          <ResourceChip icon={<CircleDollarSign size={16} />} value={'£' + formatNumber(game.treasury) + 'M'} label="전시 재정" />
        </div>

        <div className="time-controls">
          <div className="weather"><CloudRain size={15} /><span>유럽<br /><b>비 · 11°C</b></span></div>
          <div className="date-block"><strong>{campaignDate.full}</strong><span>제 {game.week + 1}주 · {campaignDate.day}</span></div>
          <button className={'speed-button ' + (speed === 0 ? 'active' : '')} onClick={() => setSpeed(0)} aria-label="일시 정지"><Pause size={14} /></button>
          {[1, 2, 3].map((item) => (
            <button key={item} className={'speed-button text ' + (speed === item ? 'active' : '')} onClick={() => setSpeed(item)}>{item}×</button>
          ))}
          <button className="speed-button next" onClick={advanceWeek} aria-label="다음 주"><SkipForward size={15} /></button>
        </div>
      </header>

      <aside className="left-rail">
        <div className="nation-emblem">
          <div className="flag-union"><span>✦</span></div>
          <small>연합국</small>
        </div>
        <nav className="primary-nav" aria-label="게임 메뉴">
          {tabItems.map((tab) => (
            <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)} title={tab.label}>
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="rail-bottom">
          <button title="전쟁 일지" aria-label="전쟁 일지" onClick={() => setShowJournal(true)}><BookOpen size={18} /></button>
          <button title={soundOn ? '음향 끄기' : '음향 켜기'} aria-label={soundOn ? '음향 끄기' : '음향 켜기'} onClick={() => setSoundOn((current) => !current)}><Volume2 size={18} className={soundOn ? '' : 'muted'} /></button>
          <button title="새 캠페인" aria-label="새 캠페인" onClick={resetCampaign}><RotateCcw size={18} /></button>
          <button title="설정" aria-label="설정"><Settings size={18} /></button>
        </div>
      </aside>

      <main className="war-room">
        <section className="map-section">
          <MapBoard
            territories={territories}
            divisions={divisions}
            orders={orders}
            selectedTerritoryId={selectedTerritoryId}
            planningMode={planningMode}
            onSelect={selectTerritory}
          />
          <div className="map-top-left">
            <span className="eyebrow">전역 지도</span>
            <h1>유럽 · 지중해 전구</h1>
            <div className="map-legend">
              <span><i className="dot allies" /> 연합국</span>
              <span><i className="dot axis" /> 추축국</span>
              <span><i className="dot neutral" /> 중립국</span>
              <span><i className="front-symbol" /> 주요 전선</span>
            </div>
          </div>
          <div className="map-toolbar">
            <button className="active"><Map size={15} /> 정치</button>
            <button><Shield size={15} /> 보급</button>
            <button><CloudRain size={15} /> 기상</button>
            <button><Eye size={15} /> 정보</button>
          </div>
          {planningMode && (
            <div className="planning-banner">
              <Target size={18} />
              <div><strong>공세 목표 지정</strong><span>{selectedDivision.name}의 인접 적 지역을 선택하십시오.</span></div>
              <button onClick={() => setPlanningMode(false)}><X size={15} /></button>
            </div>
          )}
          <div className="theater-score">
            <div><span>연합군 전황</span><strong>{game.victoryScore}</strong></div>
            <ProgressBar value={game.victoryScore} />
            <div className="score-labels"><span>후퇴</span><span>승리</span></div>
          </div>
        </section>

        <aside className="intel-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">WAR CABINET</span><h2>전쟁 내각</h2></div>
            <button className="icon-button" aria-label="전쟁 전문 열기" onClick={() => setShowJournal(true)}><Radio size={17} /></button>
          </div>

          <section className="prime-objective">
            <div className="objective-top"><span>최우선 목표</span><em>D-14</em></div>
            <h3>지중해의 운명을 결정하라</h3>
            <p>북아프리카의 추축군을 격파하고 지중해 수송로를 완전히 확보하십시오.</p>
            <ProgressBar value={objectiveProgress} tone="gold" />
            <div className="objective-footer"><span>작전 달성도</span><strong>{objectiveProgress}%</strong></div>
            <ul>
              <li className={territories.find((item) => item.id === 'libya')?.controller === 'allies' ? 'done' : ''}><CheckCircle2 size={14} /> 리비아 전선 돌파</li>
              <li className={territories.find((item) => item.id === 'tunisia')?.controller === 'allies' ? 'done' : ''}><CheckCircle2 size={14} /> 튀니지 항구 확보</li>
              <li className={torchAuthorized ? 'done' : ''}><CheckCircle2 size={14} /> 횃불 작전 개시</li>
            </ul>
          </section>

          <section className="situation-card">
            <div className="section-title"><span>국가 지표</span><em>주간 변화</em></div>
            <Metric label="안정도" value={game.stability} icon={<Shield size={14} />} />
            <Metric label="전쟁 지지도" value={game.warSupport} icon={<TrendingUp size={14} />} tone="gold" />
            <Metric label="암호 해독" value={game.intelNetwork} icon={<LockKeyhole size={14} />} tone="green" />
            <Metric label="공중 우세" value={game.airPower} icon={<Plane size={14} />} />
            <Metric label="해상 통제" value={game.navalPower} icon={<Anchor size={14} />} tone="gold" />
          </section>

          <section className="dispatches">
            <div className="section-title"><span>최신 전문</span><button onClick={() => setShowJournal(true)}>모두 보기</button></div>
            {events.slice(0, 3).map((event) => (
              <button className={'dispatch ' + event.tone} key={event.id} onClick={() => setShowJournal(true)}>
                <i>{event.tone === 'good' ? <Check size={13} /> : event.tone === 'bad' ? <AlertTriangle size={13} /> : <Radio size={13} />}</i>
                <span><strong>{event.title}</strong><small>{event.detail}</small></span>
              </button>
            ))}
          </section>
        </aside>

        <section className="command-deck">
          <div className="deck-tabs">
            {tabItems.map((tab) => (
              <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.icon}{tab.label}</button>
            ))}
          </div>
          <div className="deck-content">
            {activeTab === 'command' && (
              <CommandPanel
                game={game}
                territories={territories}
                divisions={divisions}
                orders={orders}
                torchAuthorized={torchAuthorized}
                completedDecisions={completedDecisions}
                onAuthorizeTorch={authorizeTorch}
                onDecision={enactDecision}
                setGame={setGame}
                setDivisions={setDivisions}
              />
            )}
            {activeTab === 'army' && (
              <ArmyPanel
                game={game}
                divisions={divisions}
                selectedDivision={selectedDivision}
                selectedCommander={selectedCommander}
                territories={territories}
                orders={orders}
                onSelectDivision={(id) => {
                  setSelectedDivisionId(id);
                  const division = divisions.find((item) => item.id === id);
                  if (division) setSelectedTerritoryId(division.territoryId);
                }}
                onIssueOffensive={issueOffensive}
                onAssignCommander={assignCommander}
                onTrain={trainDivision}
              />
            )}
            {activeTab === 'industry' && <IndustryPanel production={production} stockpile={stockpile} factories={game.factories} onAdjust={adjustFactories} />}
            {activeTab === 'research' && <ResearchPanel research={research} onToggle={toggleResearch} />}
            {activeTab === 'diplomacy' && <DiplomacyPanel game={game} setGame={setGame} notify={notify} />}
            {activeTab === 'intelligence' && <IntelligencePanel game={game} setGame={setGame} notify={notify} addEvent={addEvent} />}
          </div>
        </section>
      </main>

      <div className="selected-province">
        <div className={'faction-stripe ' + selectedTerritory.controller} />
        <div className="province-title">
          <span>{selectedTerritory.region}</span>
          <h3>{selectedTerritory.name}</h3>
          <small>{factionLabels[selectedTerritory.controller]} 통제 · {selectedTerritory.terrain}</small>
        </div>
        <div className="province-stat"><span>보급</span><strong>{selectedTerritory.supply}%</strong><ProgressBar value={selectedTerritory.supply} thin /></div>
        <div className="province-stat"><span>전략 가치</span><strong>{selectedTerritory.value}</strong><div className="stars">{'★'.repeat(Math.min(5, Math.ceil(selectedTerritory.value / 2)))}</div></div>
        <button className="focus-button" onClick={() => setActiveTab('army')}>주둔군 보기 <ChevronRight size={15} /></button>
      </div>

      {showBriefing && (
        <BriefingModal
          doctrine={doctrine}
          setDoctrine={setDoctrine}
          hasSave={hasSave}
          onStart={startCampaign}
          onContinue={continueCampaign}
        />
      )}
      {campaignOutcome && !showBriefing && (
        <CampaignOutcomeModal
          outcome={campaignOutcome}
          game={game}
          territories={territories}
          onJournal={() => setShowJournal(true)}
          onRestart={resetCampaign}
        />
      )}
      {showJournal && <WarJournal events={events} onClose={() => setShowJournal(false)} />}
      {toast && <div className="toast"><Radio size={16} /><span>{toast}</span></div>}
    </div>
  );
}

function Metric({ label, value, icon, tone = 'allied' }: { label: string; value: number; icon: React.ReactNode; tone?: 'allied' | 'gold' | 'green' }) {
  return (
    <div className="metric-row">
      <div>{icon}<span>{label}</span></div>
      <strong>{Math.round(value)}%</strong>
      <ProgressBar value={value} tone={tone} thin />
    </div>
  );
}

function MapBoard({ territories, divisions, orders, selectedTerritoryId, planningMode, onSelect }: {
  territories: Territory[];
  divisions: Division[];
  orders: Order[];
  selectedTerritoryId: string;
  planningMode: boolean;
  onSelect: (id: string) => void;
}) {
  const divisionGroups = divisions.reduce<Record<string, Division[]>>((groups, division) => {
    groups[division.territoryId] = [...(groups[division.territoryId] ?? []), division];
    return groups;
  }, {});
  return (
    <svg className={'strategic-map ' + (planningMode ? 'planning' : '')} viewBox="0 0 1200 760" role="img" aria-label="유럽과 지중해 전략 지도">
      <defs>
        <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(255,255,255,.025)" strokeWidth="1" />
        </pattern>
        <filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.48" /></filter>
        <filter id="glow"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#172627" /><stop offset="1" stopColor="#0d191c" /></linearGradient>
        <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#333a32" /><stop offset="1" stopColor="#232a26" /></linearGradient>
      </defs>
      <rect width="1200" height="760" fill="url(#sea)" />
      <rect width="1200" height="760" fill="url(#grid)" />
      <g className="map-contours" opacity="0.22">
        <path d="M28 610 C180 500 230 620 390 535 S660 535 770 470 1050 510 1180 410" />
        <path d="M-20 675 C165 565 270 690 420 600 S700 615 850 540 1060 590 1240 475" />
        <path d="M20 165 C160 105 235 170 340 115 S620 105 745 48 1030 80 1190 22" />
      </g>
      <g className="landmass">
        <path d="M256 92 L330 45 390 60 418 115 470 142 520 130 560 84 610 52 650 70 665 135 725 160 770 148 845 103 938 90 1080 120 1190 205 1200 470 1110 480 1040 445 965 474 902 455 850 422 790 430 730 408 680 435 625 412 575 380 520 398 470 365 420 388 365 345 320 335 292 285 245 248 225 198 Z" />
        <path d="M120 348 L205 315 285 332 330 385 312 455 265 502 178 515 105 470 72 410 Z" />
        <path d="M178 535 L325 520 465 540 565 515 670 530 760 505 875 520 985 500 1115 530 1200 580 1200 760 90 760 72 650 Z" />
        <path d="M555 405 L610 422 640 482 620 535 585 515 568 465 Z" />
        <path d="M650 445 L710 435 753 475 730 520 675 508 Z" />
        <path d="M804 480 L890 470 965 510 925 550 850 540 Z" />
      </g>
      <g className="mountains" opacity="0.35">
        <path d="M430 365 l18 -24 18 26 19 -31 19 32 22 -25 20 24" />
        <path d="M835 428 l20 -28 20 27 22 -35 25 36 20 -29 24 29" />
        <path d="M180 500 l20 -25 18 22 20 -29 24 30 19 -21" />
      </g>
      <g className="sea-labels">
        <text x="115" y="370" transform="rotate(-18 115 370)">NORTH ATLANTIC</text>
        <text x="516" y="585">MEDITERRANEAN SEA</text>
        <text x="372" y="213">NORTH SEA</text>
        <text x="830" y="365">EASTERN FRONT</text>
      </g>
      <g className="front-lines">
        <path className="western" d="M302 214 C330 245 320 280 360 315 S410 360 432 398" />
        <path className="eastern" d="M760 182 C795 230 780 286 817 330 S804 405 852 455" />
        <path className="africa" d="M595 650 C660 620 724 648 786 625" />
      </g>
      <g className="supply-lines">
        <path d="M135 340 C182 270 205 235 255 190" />
        <path d="M135 340 C110 455 180 548 292 590" />
        <path d="M740 615 C840 600 914 570 1008 546" />
      </g>

      {orders.map((order) => {
        const origin = territories.find((item) => item.id === order.fromId);
        const target = territories.find((item) => item.id === order.targetId);
        if (!origin || !target) return null;
        const x1 = origin.x * 12;
        const y1 = origin.y * 7.6;
        const x2 = target.x * 12;
        const y2 = target.y * 7.6;
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        return (
          <g className="order-arrow" key={order.divisionId + '-' + order.targetId + '-' + order.startedWeek}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <polygon points={(x2 - 12) + ',' + (y2 - 7) + ' ' + (x2 + 4) + ',' + y2 + ' ' + (x2 - 12) + ',' + (y2 + 7)} transform={'rotate(' + angle + ' ' + x2 + ' ' + y2 + ')'} />
          </g>
        );
      })}

      {territories.map((territory) => {
        const x = territory.x * 12;
        const y = territory.y * 7.6;
        const group = divisionGroups[territory.id] ?? [];
        const selected = selectedTerritoryId === territory.id;
        return (
          <g
            key={territory.id}
            className={'territory-marker ' + territory.controller + (selected ? ' selected' : '')}
            transform={'translate(' + x + ' ' + y + ')'}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(territory.id)}
            onKeyDown={(event) => event.key === 'Enter' && onSelect(territory.id)}
            aria-label={territory.name + ', ' + factionLabels[territory.controller]}
          >
            {selected && <circle className="selection-ring" r="31" />}
            <circle className="territory-halo" r={territory.value > 8 ? 22 : 18} />
            <circle className="territory-core" r={territory.value > 8 ? 11 : 9} />
            <text className="territory-name" y="-23">{territory.name}</text>
            {group.length > 0 && (
              <g className="unit-counter" transform="translate(16 12)" filter="url(#shadow)">
                <rect x="0" y="0" width="43" height="28" rx="3" />
                <text x="8" y="19">{typeMeta[group[0].type].symbol}</text>
                <text x="31" y="19" textAnchor="middle">{group.length}</text>
              </g>
            )}
          </g>
        );
      })}
      <g className="compass" transform="translate(1110 650)">
        <circle r="38" /><path d="M0 -28 L7 0 0 28 -7 0 Z" /><text y="-46">N</text>
      </g>
    </svg>
  );
}

function CommandPanel({ game, territories, divisions, orders, torchAuthorized, completedDecisions, onAuthorizeTorch, onDecision, setGame, setDivisions }: {
  game: GameState;
  territories: Territory[];
  divisions: Division[];
  orders: Order[];
  torchAuthorized: boolean;
  completedDecisions: string[];
  onAuthorizeTorch: () => void;
  onDecision: (id: string, title: string, cost: number, effect: () => void) => void;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  setDivisions: React.Dispatch<React.SetStateAction<Division[]>>;
}) {
  const fronts = [
    { name: '북아프리카', detail: '알라메인 · 리비아', strength: 72, status: '우세', tone: 'good', count: divisions.filter((division) => ['egypt', 'libya', 'tunisia'].includes(division.territoryId)).length },
    { name: '서부 유럽', detail: '영불 해협 · 대서양', strength: 41, status: '대치', tone: 'neutral', count: divisions.filter((division) => ['britain', 'atlantic', 'channel'].includes(division.territoryId)).length },
    { name: '동부 전선', detail: '발트 · 우크라이나', strength: 29, status: '위기', tone: 'bad', count: 0 },
  ];
  return (
    <div className="command-grid">
      <section className="deck-section front-overview">
        <div className="deck-section-heading"><div><span className="eyebrow">THEATERS</span><h3>전구 현황</h3></div><em>{territories.filter((item) => item.controller === 'allies').length}/27 지역 통제</em></div>
        <div className="front-list">
          {fronts.map((front) => (
            <div className="front-row" key={front.name}>
              <i className={front.tone}><Swords size={15} /></i>
              <div><strong>{front.name}</strong><span>{front.detail}</span></div>
              <div className="front-force"><span>{front.count}개 사단</span><ProgressBar value={front.strength} tone={front.tone === 'good' ? 'green' : front.tone === 'bad' ? 'axis' : 'gold'} thin /></div>
              <em className={front.tone}>{front.status}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="deck-section operation-card">
        <div className="operation-visual"><Anchor size={28} /><span>JOINT OPERATION</span></div>
        <div className="operation-body">
          <div className="classified">TOP SECRET · MOST IMMEDIATE</div>
          <h3>횃불 작전</h3>
          <p>미·영 연합군을 모로코와 알제리에 상륙시켜 북아프리카 추축군을 양쪽에서 압박합니다.</p>
          <div className="operation-meta"><span><Clock3 size={13} /> 2주</span><span><Users size={13} /> 2개 사단</span><span><ShieldAlert size={13} /> 중간 위험</span></div>
          <button className={torchAuthorized ? 'approved' : ''} onClick={onAuthorizeTorch} disabled={torchAuthorized}>
            {torchAuthorized ? <><Check size={15} /> 작전 진행 중</> : <>작전 승인 <span>20 <Landmark size={12} /> · 10 CP</span></>}
          </button>
        </div>
      </section>

      <section className="deck-section decisions">
        <div className="deck-section-heading"><div><span className="eyebrow">CABINET</span><h3>내각 결정</h3></div><em>{game.politicalPower} 정치력</em></div>
        <DecisionCard
          title="전시 채권 발행"
          detail="재정 +£240M · 안정도 -2%"
          cost={12}
          done={completedDecisions.includes('bonds')}
          onClick={() => onDecision('bonds', '전시 채권 발행', 12, () => setGame((current) => ({ ...current, treasury: current.treasury + 240, stability: current.stability - 2 })))}
        />
        <DecisionCard
          title="북아프리카 우선 보급"
          detail="전체 사단 보급 +12% · 연료 -18K"
          cost={16}
          done={completedDecisions.includes('supply')}
          onClick={() => onDecision('supply', '북아프리카 우선 보급', 16, () => {
            setDivisions((current) => current.map((division) => ({ ...division, supply: Math.min(100, division.supply + 12) })));
            setGame((current) => ({ ...current, fuel: Math.max(0, current.fuel - 18) }));
          })}
        />
      </section>

      <section className="deck-section order-queue">
        <div className="deck-section-heading"><div><span className="eyebrow">ORDERS</span><h3>작전 명령</h3></div><em>{orders.length} 대기</em></div>
        {orders.length === 0 ? (
          <div className="empty-order"><Target size={22} /><span>육군 탭에서 사단을 선택해<br />새 공세 명령을 내리십시오.</span></div>
        ) : orders.map((order, index) => {
          const division = divisions.find((item) => item.id === order.divisionId);
          const target = territories.find((item) => item.id === order.targetId);
          return (
            <div className="queued-order" key={order.divisionId + '-' + order.targetId + '-' + order.startedWeek}>
              <i>{index + 1}</i><div><strong>{division?.name}</strong><span>목표: {target?.name}</span></div><em>다음 주</em>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function DecisionCard({ title, detail, cost, done, onClick }: { title: string; detail: string; cost: number; done: boolean; onClick: () => void }) {
  return (
    <button className={'decision-card ' + (done ? 'done' : '')} onClick={onClick} disabled={done}>
      <i>{done ? <Check size={15} /> : <Landmark size={15} />}</i>
      <span><strong>{title}</strong><small>{detail}</small></span>
      <em>{done ? '완료' : cost}</em>
    </button>
  );
}

function ArmyPanel({ game, divisions, selectedDivision, selectedCommander, territories, orders, onSelectDivision, onIssueOffensive, onAssignCommander, onTrain }: {
  game: GameState;
  divisions: Division[];
  selectedDivision: Division;
  selectedCommander: (typeof commanders)[number];
  territories: Territory[];
  orders: Order[];
  onSelectDivision: (id: string) => void;
  onIssueOffensive: () => void;
  onAssignCommander: (divisionId: string, commanderId: string) => void;
  onTrain: (divisionId: string) => void;
}) {
  const location = territories.find((territory) => territory.id === selectedDivision.territoryId);
  const divisionOrder = orders.find((order) => order.divisionId === selectedDivision.id);
  return (
    <div className="army-layout">
      <section className="deck-section division-roster">
        <div className="deck-section-heading"><div><span className="eyebrow">ORDER OF BATTLE</span><h3>야전군 편제</h3></div><em>{divisions.length}개 사단</em></div>
        <div className="roster-list">
          {divisions.map((division) => {
            const meta = typeMeta[division.type];
            const commander = commanders.find((item) => item.id === division.commanderId);
            const territory = territories.find((item) => item.id === division.territoryId);
            return (
              <button key={division.id} className={'division-row ' + (selectedDivision.id === division.id ? 'selected' : '')} onClick={() => onSelectDivision(division.id)}>
                <i className={meta.className}>{meta.symbol}</i>
                <span className="division-name"><strong>{division.name}</strong><small>{commander?.name} · {territory?.name}</small></span>
                <span className="compact-stat"><small>전력</small><strong>{division.strength}%</strong></span>
                <span className={'status-pill ' + division.status}>{division.status === 'ready' ? '준비' : division.status === 'moving' ? '이동' : division.status === 'combat' ? '교전' : '재편'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="deck-section division-detail">
        <div className="division-banner">
          <div className={'large-unit-icon ' + typeMeta[selectedDivision.type].className}>{typeMeta[selectedDivision.type].symbol}</div>
          <div><span>{typeMeta[selectedDivision.type].label}사단 · {location?.region}</span><h3>{selectedDivision.name}</h3><small>{location?.name} 주둔</small></div>
          <button className="order-button" onClick={onIssueOffensive} disabled={selectedDivision.status !== 'ready'}><Crosshair size={15} /> 공세 명령</button>
        </div>
        {divisionOrder && <div className="active-order-notice"><Zap size={15} /><span>{territories.find((item) => item.id === divisionOrder.targetId)?.name} 공세 준비 중</span></div>}
        <div className="division-metrics">
          <Metric label="병력 전력" value={selectedDivision.strength} icon={<Users size={14} />} tone="green" />
          <Metric label="조직력" value={selectedDivision.organization} icon={<Shield size={14} />} />
          <Metric label="보급 상태" value={selectedDivision.supply} icon={<Cog size={14} />} tone="gold" />
          <Metric label="전투 경험" value={selectedDivision.experience} icon={<Star size={14} />} tone="gold" />
        </div>
        <div className="equipment-grid">
          <div><span>주력 병력</span><strong>{formatNumber(selectedDivision.strength * 142)}명</strong><small>충원 +180 / 주</small></div>
          <div><span>전투 차량</span><strong>{selectedDivision.type === 'armor' ? 286 : 74}대</strong><small>가동률 {Math.round(selectedDivision.supply * .91)}%</small></div>
          <div><span>화력 지수</span><strong>{Math.round(selectedDivision.strength * .7 + selectedDivision.experience * .3)}</strong><small>전구 평균 +8</small></div>
        </div>
      </section>

      <section className="deck-section commander-profile">
        <div className="commander-header">
          <div className="commander-portrait" style={{ background: selectedCommander.color }}>{selectedCommander.initials}</div>
          <div><span>{selectedCommander.rank}</span><h3>{selectedCommander.name}</h3><small>{selectedCommander.specialty}</small></div>
          <div className="rating"><Star size={13} fill="currentColor" /><strong>{selectedCommander.command}</strong></div>
        </div>
        <div className="trait"><i><Zap size={14} /></i><div><strong>{selectedCommander.trait}</strong><span>지휘 특성</span></div></div>
        <div className="commander-stats">
          <div><span>공격</span><strong>{selectedCommander.attack}</strong></div>
          <div><span>방어</span><strong>{selectedCommander.defense}</strong></div>
          <div><span>군수</span><strong>{selectedCommander.logistics}</strong></div>
        </div>
        <div className="condition-row"><span>피로도</span><ProgressBar value={selectedCommander.fatigue} tone="axis" thin /><strong>{selectedCommander.fatigue}%</strong></div>
        <div className="condition-row"><span>충성도</span><ProgressBar value={selectedCommander.loyalty} tone="green" thin /><strong>{selectedCommander.loyalty}%</strong></div>
        <div className="commander-actions">
          <label>
            <span>지휘관 배치</span>
            <select value={selectedCommander.id} onChange={(event) => onAssignCommander(selectedDivision.id, event.target.value)}>
              {commanders.map((commander) => <option key={commander.id} value={commander.id}>{commander.name} · {commander.command}</option>)}
            </select>
          </label>
          <button onClick={() => onTrain(selectedDivision.id)} disabled={game.commandPoints < 8 || selectedDivision.status !== 'ready'}><TrendingUp size={13} /> 야전 훈련 <em>8 CP</em></button>
        </div>
      </section>
    </div>
  );
}

function IndustryPanel({ production, stockpile, factories, onAdjust }: { production: ProductionLine[]; stockpile: Stockpile; factories: number; onAdjust: (id: string, amount: number) => void }) {
  const used = production.reduce((sum, line) => sum + line.assigned, 0);
  return (
    <div className="industry-layout">
      <section className="deck-section production-table">
        <div className="deck-section-heading"><div><span className="eyebrow">WAR ECONOMY</span><h3>군수 생산 라인</h3></div><em>{used}/{factories} 공장 배정</em></div>
        <div className="factory-summary"><Factory size={20} /><div><strong>{factories - used}</strong><span>미배정 공장</span></div><ProgressBar value={used / factories * 100} tone="gold" /></div>
        {production.map((line) => (
          <div className="production-line" key={line.id}>
            <i>{line.icon}</i>
            <div className="production-name"><strong>{line.name}</strong><span>{line.category}</span></div>
            <div className="efficiency"><span>생산 효율 {line.efficiency}%</span><ProgressBar value={line.efficiency} tone="green" thin /></div>
            <div className="output"><span>주간 생산</span><strong>{formatNumber(line.output * Math.max(1, line.assigned) / 5)}</strong></div>
            <div className="factory-stepper"><button onClick={() => onAdjust(line.id, -1)}><Minus size={13} /></button><strong>{line.assigned}</strong><button onClick={() => onAdjust(line.id, 1)}><Plus size={13} /></button></div>
          </div>
        ))}
      </section>
      <section className="deck-section logistics-card">
        <div className="deck-section-heading"><div><span className="eyebrow">LOGISTICS</span><h3>전략 물자</h3></div></div>
        <div className="stockpile-grid">
          <div><span>보병 장비</span><strong>{formatNumber(stockpile.infantryEquipment)}</strong><em className="good">생산 중</em></div>
          <div><span>중형 전차</span><strong>{formatNumber(stockpile.tanks)}</strong><em className="good">생산 중</em></div>
          <div><span>전투기</span><strong>{formatNumber(stockpile.aircraft)}</strong><em className="good">생산 중</em></div>
          <div><span>수송선</span><strong>{formatNumber(stockpile.convoys)}</strong><em className={stockpile.convoys < 500 ? 'bad' : 'good'}>{stockpile.convoys < 500 ? '부족' : '안정'}</em></div>
          <div><span>야포</span><strong>{formatNumber(stockpile.artillery)}</strong><em className="good">+72/주</em></div>
          <div><span>트럭</span><strong>{formatNumber(stockpile.trucks)}</strong><em className="good">+110/주</em></div>
        </div>
        <div className="convoy-warning"><AlertTriangle size={15} /><span><strong>대서양 수송 손실</strong>유보트 활동으로 수송 효율이 11% 감소했습니다.</span></div>
      </section>
    </div>
  );
}

function ResearchPanel({ research, onToggle }: { research: ResearchProject[]; onToggle: (id: string) => void }) {
  const activeCount = research.filter((project) => project.active).length;
  return (
    <div className="research-layout">
      <section className="deck-section research-board">
        <div className="deck-section-heading"><div><span className="eyebrow">RESEARCH & DEVELOPMENT</span><h3>연구 위원회</h3></div><em>{activeCount}/2 연구 슬롯</em></div>
        <div className="research-grid">
          {research.map((project) => {
            const percent = project.progress / project.duration * 100;
            return (
              <button className={'research-card ' + (project.active ? 'active' : '') + (project.complete ? ' complete' : '')} key={project.id} onClick={() => onToggle(project.id)}>
                <i>{project.complete ? <Check size={19} /> : project.icon}</i>
                <span className="branch">{project.branch}</span>
                <h4>{project.name}</h4>
                <p>{project.description}</p>
                <ProgressBar value={percent} tone={project.complete ? 'green' : project.active ? 'gold' : 'allied'} thin />
                <div className="research-footer"><span>{project.complete ? '연구 완료' : project.active ? Math.round(percent) + '% 진행 중' : '대기 중'}</span><em>{project.complete ? '적용됨' : project.active ? Math.ceil((project.duration - project.progress) / 11) + '주' : '선택'}</em></div>
              </button>
            );
          })}
        </div>
      </section>
      <section className="deck-section science-advisor">
        <div className="advisor-portrait">AT</div>
        <span className="eyebrow">CHIEF SCIENTIFIC ADVISER</span>
        <h3>앨런 튜링</h3>
        <p>“전쟁의 승패는 적보다 먼저 이해하고, 더 빠르게 결정하는 쪽에 달려 있습니다.”</p>
        <div className="advisor-bonus"><LockKeyhole size={16} /><span><strong>블레츨리 파크</strong>전자전 연구 속도 +15%</span></div>
      </section>
    </div>
  );
}

function DiplomacyPanel({ game, setGame, notify }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState>>; notify: (message: string) => void }) {
  const [relations, setRelations] = useState([
    { id: 'usa', name: '미합중국', code: 'US', value: 92, status: '주요 동맹', color: '#667d93' },
    { id: 'ussr', name: '소비에트 연방', code: 'SU', value: 61, status: '공동 교전국', color: '#965d56' },
    { id: 'freefrance', name: '자유 프랑스', code: 'FR', value: 84, status: '망명 동맹', color: '#6e7f99' },
    { id: 'turkey', name: '튀르키예', code: 'TR', value: 43, status: '중립', color: '#887456' },
    { id: 'spain', name: '스페인국', code: 'ES', value: 27, status: '경계 중립', color: '#8f6b59' },
  ]);
  const influence = (id: string, name: string) => {
    if (game.politicalPower < 8) return notify('정치력이 부족합니다.');
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 8 }));
    setRelations((current) => current.map((country) => country.id === id ? { ...country, value: Math.min(100, country.value + 7) } : country));
    notify(name + '과의 관계가 개선되었습니다.');
  };
  return (
    <div className="diplomacy-layout">
      <section className="deck-section diplomatic-list">
        <div className="deck-section-heading"><div><span className="eyebrow">FOREIGN OFFICE</span><h3>외교 관계</h3></div><em>{game.politicalPower} 정치력</em></div>
        {relations.map((country) => (
          <div className="country-row" key={country.id}>
            <i style={{ background: country.color }}>{country.code}</i>
            <div><strong>{country.name}</strong><span>{country.status}</span></div>
            <div className="relation-meter"><span>관계 {country.value}</span><ProgressBar value={country.value} tone={country.value > 70 ? 'green' : country.value > 40 ? 'gold' : 'axis'} thin /></div>
            <button onClick={() => influence(country.id, country.name)}>영향력 행사 <small>8</small></button>
          </div>
        ))}
      </section>
      <section className="deck-section summit-card">
        <div className="summit-badge"><Handshake size={25} /></div>
        <span className="eyebrow">UPCOMING SUMMIT</span>
        <h3>카사블랑카 회담</h3>
        <p>루스벨트 대통령과 전후 전략, 이탈리아 진공, 무조건 항복 원칙을 논의하십시오.</p>
        <div className="summit-date"><Clock3 size={15} /><span>9주 후 · 카사블랑카</span></div>
        <div className="agenda"><span>의제 준비도</span><strong>64%</strong><ProgressBar value={64} tone="gold" /></div>
      </section>
    </div>
  );
}

function IntelligencePanel({ game, setGame, notify, addEvent }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState>>; notify: (message: string) => void; addEvent: (title: string, detail: string, tone: WarEvent['tone'], week: number) => void }) {
  const [operations, setOperations] = useState([
    { id: 'resistance', name: '프랑스 레지스탕스 지원', region: '점령 프랑스', risk: 28, progress: 72, active: true, icon: <Radio size={19} /> },
    { id: 'mincemeat', name: '민스미트 기만 작전', region: '지중해', risk: 46, progress: 34, active: true, icon: <Eye size={19} /> },
    { id: 'desert', name: '사막 장거리 정찰', region: '리비아', risk: 18, progress: 88, active: true, icon: <Crosshair size={19} /> },
  ]);
  const launchOperation = () => {
    if (game.politicalPower < 10) return notify('정보 작전에 필요한 정치력이 부족합니다.');
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 10 }));
    setOperations((current) => current.map((operation, index) => index === 0 ? { ...operation, progress: 100 } : operation));
    addEvent('정보 작전 성공', '프랑스 레지스탕스가 적 철도 허브의 운용을 중단시켰습니다.', 'good', game.week);
    notify('프랑스 레지스탕스 작전이 성공했습니다.');
  };
  return (
    <div className="intel-layout">
      <section className="deck-section operation-list">
        <div className="deck-section-heading"><div><span className="eyebrow">SPECIAL OPERATIONS EXECUTIVE</span><h3>비밀 작전</h3></div><em>요원 18명 가용</em></div>
        {operations.map((operation) => (
          <div className="covert-row" key={operation.id}>
            <i>{operation.icon}</i>
            <div className="covert-name"><strong>{operation.name}</strong><span>{operation.region}</span></div>
            <div className="covert-progress"><span>준비도 {operation.progress}%</span><ProgressBar value={operation.progress} tone={operation.risk > 40 ? 'gold' : 'green'} thin /></div>
            <span className={'risk ' + (operation.risk > 40 ? 'medium' : 'low')}>위험 {operation.risk}%</span>
          </div>
        ))}
        <button className="launch-intel" onClick={launchOperation}><Zap size={15} /> 최우선 작전 실행 <span>10 정치력</span></button>
      </section>
      <section className="deck-section enigma-card">
        <div className="enigma-rings"><LockKeyhole size={28} /></div>
        <span className="eyebrow">ULTRA · EYES ONLY</span>
        <h3>에니그마 해독</h3>
        <p>북아프리카 군단의 통신망을 추적하고 있습니다.</p>
        <div className="decode-value">{Math.round(game.intelNetwork)}<small>%</small></div>
        <ProgressBar value={game.intelNetwork} tone="green" />
        <div className="intel-bonus"><Eye size={14} /> 적 보급량과 전투 계획 일부 공개</div>
      </section>
    </div>
  );
}

function BriefingModal({ doctrine, setDoctrine, hasSave, onStart, onContinue }: {
  doctrine: 'coalition' | 'methodical' | 'maneuver';
  setDoctrine: (value: 'coalition' | 'methodical' | 'maneuver') => void;
  hasSave: boolean;
  onStart: () => void;
  onContinue: () => void;
}) {
  const choices = [
    { id: 'coalition' as const, icon: <Handshake size={23} />, title: '대연합 전략', detail: '정치력 +16 · 안정도 +4%', quote: '동맹과 조율해 전 세계의 힘을 하나로 모읍니다.' },
    { id: 'methodical' as const, icon: <Factory size={23} />, title: '물량과 준비', detail: '군수 공장 +3 · 강철 +13K', quote: '충분한 보급과 압도적 화력으로 확실히 전진합니다.' },
    { id: 'maneuver' as const, icon: <Zap size={23} />, title: '기동전 교리', detail: '연료 +22K · 지휘 점수 +8', quote: '적이 대응하기 전에 전선을 돌파하고 포위합니다.' },
  ];
  return (
    <div className="modal-backdrop">
      <div className="briefing-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-briefing-title">
        <div className="briefing-image">
          <div className="briefing-map-lines" />
          <div className="briefing-stamp">MOST SECRET<br /><strong>BIGOT</strong></div>
          <div className="briefing-quote">“이제 전쟁의 흐름을<br />바꿀 시간이 왔습니다.”</div>
          <div className="briefing-signature">W. S. Churchill</div>
        </div>
        <div className="briefing-content">
          <span className="eyebrow">ALLIED HIGH COMMAND · 25 OCT 1942</span>
          <h1 id="campaign-briefing-title">지휘관님,<br />세계가 결단을 기다립니다.</h1>
          <p className="briefing-lead">엘 알라메인에서 반격이 시작되었습니다. 동부에서는 스탈린그라드가 버티고 있고, 대서양 건너 미군은 첫 대규모 상륙전을 준비 중입니다. 북아프리카를 장악하고 유럽으로 돌아갈 길을 여십시오.</p>
          <div className="campaign-objectives">
            <div><i>01</i><span><strong>아프리카 확보</strong>리비아와 튀니지의 추축군 격파</span></div>
            <div><i>02</i><span><strong>유럽 귀환</strong>시칠리아를 교두보로 남부 전선 개방</span></div>
            <div><i>03</i><span><strong>대연합 유지</strong>연합국의 전쟁 지지와 보급망 관리</span></div>
          </div>
          <span className="choice-label">지휘 교리를 선택하십시오</span>
          <div className="doctrine-choices">
            {choices.map((choice) => (
              <button key={choice.id} className={doctrine === choice.id ? 'selected' : ''} onClick={() => setDoctrine(choice.id)}>
                <i>{choice.icon}</i><strong>{choice.title}</strong><span>{choice.detail}</span><small>{choice.quote}</small>
                {doctrine === choice.id && <CheckCircle2 size={17} />}
              </button>
            ))}
          </div>
          <div className="briefing-actions">
            {hasSave && <button className="continue-button" onClick={onContinue}><Save size={16} /> 저장된 캠페인 계속</button>}
            <button className="start-button" onClick={onStart}><Play size={16} fill="currentColor" /> 최고사령부 입장</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignOutcomeModal({ outcome, game, territories, onJournal, onRestart }: {
  outcome: Exclude<CampaignOutcome, null>;
  game: GameState;
  territories: Territory[];
  onJournal: () => void;
  onRestart: () => void;
}) {
  const alliedTerritories = territories.filter((territory) => territory.controller === 'allies').length;
  const isVictory = outcome === 'victory';
  return (
    <div className={'outcome-backdrop ' + outcome}>
      <section className="outcome-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-outcome-title">
        <div className="outcome-seal">{isVictory ? <Star size={34} /> : <ShieldAlert size={34} />}</div>
        <span className="eyebrow">ALLIED HIGH COMMAND · FINAL COMMUNIQUÉ</span>
        <h1 id="campaign-outcome-title">{isVictory ? '유럽 해방의 길이 열렸습니다' : '전쟁 내각이 신임을 잃었습니다'}</h1>
        <p>{isVictory ? '연합군은 전략적 주도권을 완전히 장악했습니다. 이제 추축국 본토를 향한 최후의 진격이 시작됩니다.' : '연합국의 전쟁 수행 능력이 임계점 아래로 떨어졌습니다. 작전 우선순위와 보급 체계를 재검토해야 합니다.'}</p>
        <div className="outcome-stats">
          <div><span>최종 전황</span><strong>{game.victoryScore}</strong></div>
          <div><span>통제 지역</span><strong>{alliedTerritories}/27</strong></div>
          <div><span>지휘 기간</span><strong>{game.week + 1}주</strong></div>
          <div><span>전쟁 지지도</span><strong>{game.warSupport}%</strong></div>
        </div>
        <div className="outcome-actions">
          <button onClick={onJournal}><BookOpen size={15} /> 전쟁 일지 검토</button>
          <button className="primary" onClick={onRestart}><RotateCcw size={15} /> 새 캠페인</button>
        </div>
      </section>
    </div>
  );
}

function WarJournal({ events, onClose }: { events: WarEvent[]; onClose: () => void }) {
  return (
    <div className="journal-overlay" onClick={onClose}>
      <aside className="war-journal" role="dialog" aria-modal="true" aria-labelledby="war-journal-title" onClick={(event) => event.stopPropagation()}>
        <div className="journal-header"><div><span className="eyebrow">WAR DIARY</span><h2 id="war-journal-title">전쟁 일지</h2></div><button aria-label="전쟁 일지 닫기" onClick={onClose}><X size={18} /></button></div>
        <div className="journal-filter"><button className="active">전체 전문</button><button>작전</button><button>국내</button><button>외교</button></div>
        <div className="journal-list">
          {events.map((event) => (
            <article className={event.tone} key={event.id}>
              <div className="journal-week">W{event.week + 1}</div>
              <i>{event.tone === 'good' ? <Check size={15} /> : event.tone === 'bad' ? <AlertTriangle size={15} /> : <Radio size={15} />}</i>
              <div><span>{getCampaignDate(event.week).full}</span><h3>{event.title}</h3><p>{event.detail}</p></div>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
