import { Award, BedDouble, BookOpen, Check, LockKeyhole, Shield, Swords, Truck } from 'lucide-react';
import { commanderSkills, getAvailableSkillPoints, getCommanderLevelProgress } from './development';
import type { Commander, CommanderDevelopment, CommanderSkillId, Division } from './types';

interface CommanderDevelopmentPanelProps {
  commander: Commander;
  development: CommanderDevelopment;
  division: Division;
  commandPoints: number;
  onUnlockSkill: (skillId: CommanderSkillId) => void;
  onRestCommander: () => void;
}

const skillIcons: Record<CommanderSkillId, React.ReactNode> = {
  'operational-planner': <BookOpen size={14} />,
  'breakthrough-specialist': <Swords size={14} />,
  'defense-in-depth': <Shield size={14} />,
  'master-logistician': <Truck size={14} />,
};

export function CommanderDevelopmentPanel({
  commander,
  development,
  division,
  commandPoints,
  onUnlockSkill,
  onRestCommander,
}: CommanderDevelopmentPanelProps) {
  const level = getCommanderLevelProgress(development.xp);
  const availablePoints = getAvailableSkillPoints(development);
  const winRate = development.battles > 0 ? Math.round(development.victories / development.battles * 100) : 0;
  const honors = division.battleHonors ?? [];

  return (
    <section className="commander-development-panel">
      <header>
        <div><span>OFFICER DEVELOPMENT</span><h3>지휘관 성장과 전투 유산</h3></div>
        <em>{availablePoints > 0 ? `특기 ${availablePoints}개 선택 가능` : `복무 레벨 ${level.level}`}</em>
      </header>

      <div className="officer-progress-card">
        <div className="officer-level"><span>LV</span><strong>{level.level}</strong></div>
        <div className="officer-progress-copy">
          <div><strong>{commander.name}</strong><span>{level.level >= 5 ? '최고 숙련도' : `${development.xp} / ${level.next} XP`}</span></div>
          <div className="officer-xp-track" role="progressbar" aria-label="지휘관 경험치" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level.percent}><span style={{ width: `${level.percent}%` }} /></div>
          <small>전투가 능력치를 자동으로 올리지는 않습니다. 레벨마다 얻는 특기 점수로 지휘관의 운용 방향을 선택합니다.</small>
        </div>
        <dl>
          <div><dt>참전</dt><dd>{development.battles}</dd></div>
          <div><dt>승리</dt><dd>{development.victories}</dd></div>
          <div><dt>승률</dt><dd>{winRate}%</dd></div>
          <div><dt>피로</dt><dd className={development.fatigue >= 65 ? 'warning' : ''}>{development.fatigue}%</dd></div>
        </dl>
        <button onClick={onRestCommander} disabled={commandPoints < 6 || development.fatigue < 10} title={development.fatigue < 10 ? '피로도 10 이상일 때 휴양할 수 있습니다.' : commandPoints < 6 ? '지휘 점수 6이 필요합니다.' : '피로도 22를 회복합니다.'}>
          <BedDouble size={14} /> 참모 휴양 <em>6 CP</em>
        </button>
      </div>

      <div className="officer-skill-grid">
        {commanderSkills.map((skill) => {
          const selected = development.skills.includes(skill.id);
          const unavailable = !selected && availablePoints <= 0;
          return (
            <button
              key={skill.id}
              className={selected ? 'selected' : ''}
              aria-pressed={selected}
              disabled={selected || unavailable}
              onClick={() => onUnlockSkill(skill.id)}
              title={selected ? '이미 습득한 지휘 특기입니다.' : unavailable ? '복무 레벨을 올려 특기 점수를 획득하십시오.' : `${skill.title}: ${skill.effect}`}
            >
              <i>{selected ? <Check size={14} /> : unavailable ? <LockKeyhole size={13} /> : skillIcons[skill.id]}</i>
              <span><strong>{skill.title}</strong><small>{skill.description}</small><em>{selected ? '습득 완료' : skill.effect}</em></span>
            </button>
          );
        })}
      </div>

      <div className="battle-honors-strip">
        <span><Award size={15} /> {division.name} 전투명예</span>
        <div>
          {honors.length > 0
            ? honors.slice(-4).reverse().map((honor) => <em key={honor}><Award size={12} />{honor}</em>)
            : <small>아직 수여된 전투명예가 없습니다. 승리한 작전의 성과에 따라 종군장·전공장·돌파장이 기록됩니다.</small>}
        </div>
      </div>
    </section>
  );
}
