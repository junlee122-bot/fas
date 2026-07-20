import { ChevronRight, MapPinned } from 'lucide-react';
import { GameIcon } from './GameIcon';
import { deriveKoreaLiberationTracks, getKoreaRoleGuide } from './koreaExperience';
import type { CareerRole, Division, GameState, GameTab, Territory } from './types';

interface KoreaCommandCenterProps {
  role: CareerRole;
  game: GameState;
  territories: Territory[];
  divisions: Division[];
  objectiveProgress: number;
  onNavigate: (tab: GameTab) => void;
}

export function KoreaCommandCenter({ role, game, territories, divisions, objectiveProgress, onNavigate }: KoreaCommandCenterProps) {
  const averageStrength = divisions.reduce((sum, division) => sum + division.strength, 0) / Math.max(1, divisions.length);
  const averageSupply = divisions.reduce((sum, division) => sum + division.supply, 0) / Math.max(1, divisions.length);
  const tracks = deriveKoreaLiberationTracks({
    politicalPower: game.politicalPower,
    stability: game.stability,
    warSupport: game.warSupport,
    intelNetwork: game.intelNetwork,
    averageStrength,
    averageSupply,
    objectiveProgress,
    territories,
  });
  const roleGuide = getKoreaRoleGuide(role.branch);

  return (
    <section className="korea-command-center" data-tour="korea-command-center" aria-labelledby="korea-command-title">
      <header>
        <span className="korea-command-location"><MapPinned size={17} /><i><small>현재 지휘 거점</small><strong>중화민국 충칭</strong></i></span>
        <span className="korea-command-heading"><em>LIBERATION COMMAND · 1942</em><h3 id="korea-command-title">대한민국 임시정부 독립 준비 상황판</h3><p>조선 본토의 점령 상태와 충칭 지휘부의 역량을 혼동하지 않도록 네 준비축을 분리했습니다.</p></span>
        <button type="button" onClick={() => onNavigate('governance')}><GameIcon name="organization" size={15} tone="gold" /> 해방·건국 설계<ChevronRight size={13} /></button>
      </header>
      <div className="korea-liberation-tracks">
        {tracks.map((track) => (
          <button type="button" className={`tone-${track.tone}`} key={track.id} onClick={() => onNavigate(track.tab)}>
            <GameIcon name={track.icon} size={20} tone={track.tone} framed />
            <span><small>{track.label}<em>{track.state}</em></small><strong>{track.value}%</strong><p>{track.detail}</p></span>
            <b>{track.action}<ChevronRight size={12} /></b>
            <i aria-hidden="true"><span style={{ width: `${track.value}%` }} /></i>
          </button>
        ))}
      </div>
      <footer>
        <span><small>현재 보직의 첫 우선순위</small><strong>{roleGuide.firstAction}</strong></span>
        <button type="button" onClick={() => onNavigate(roleGuide.destination)}>{roleGuide.destinationLabel}<ChevronRight size={13} /></button>
      </footer>
    </section>
  );
}
