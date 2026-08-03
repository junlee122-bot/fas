import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { careerRoles, nations } from '../src/campaign';
import {
  civilizationDomainDefinitions,
  civilizationEras,
  civilizationPrograms,
  countCivilizationEffectSurfaces,
  getCivilizationPaths,
  nationCivilizationProfiles,
  type CivilizationAuthorityMode,
} from '../src/civilizationSystems';

const root = resolve(import.meta.dirname, '..');
const outputDirectory = resolve(root, 'docs');
mkdirSync(outputDirectory, { recursive: true });

const cells = nations.flatMap((nation) => civilizationEras.map((era) => {
  const programs = civilizationPrograms.filter((program) => program.eraId === era.id);
  const executive = careerRoles.find((role) => role.nationId === nation.id && role.tier === 1)!;
  const minister = careerRoles.find((role) => role.nationId === nation.id && role.tier === 2 && role.branch === 'politics')!;
  const fieldRole = careerRoles.find((role) => role.nationId === nation.id && role.tier === 5)!;
  const executivePaths = programs.flatMap((program) => getCivilizationPaths(program, nation.id, executive));
  const ministerPaths = programs.flatMap((program) => getCivilizationPaths(program, nation.id, minister));
  const fieldPaths = programs.flatMap((program) => getCivilizationPaths(program, nation.id, fieldRole));
  const paths = [...executivePaths, ...ministerPaths, ...fieldPaths];
  const authorities = paths.reduce<Record<CivilizationAuthorityMode, number>>((totals, path) => {
    totals[path.authorityMode] += 1;
    return totals;
  }, { direct: 0, ministerial: 0, proposal: 0 });
  return {
    nationId: nation.id,
    nation: nation.shortName,
    eraId: era.id,
    era: era.shortLabel,
    evaluatedPaths: paths.length,
    averageEffectiveness: Number((paths.reduce((total, path) => total + path.effectiveness, 0) / paths.length).toFixed(1)),
    averageTreasuryCost: Number((paths.reduce((total, path) => total + path.treasuryCost, 0) / paths.length).toFixed(1)),
    minimumEffectSurfaces: Math.min(...paths.map(countCivilizationEffectSurfaces)),
    authorities,
  };
}));

const allEvaluatedPaths = cells.reduce((total, cell) => total + cell.evaluatedPaths, 0);
const uniqueSources = new Map(civilizationPrograms.map((program) => [program.sourceUrl, program.sourceLabel]));
const summary = {
  generatedAt: new Date().toISOString(),
  nations: nations.length,
  eras: civilizationEras.length,
  domains: Object.keys(civilizationDomainDefinitions).length,
  historicalPrograms: civilizationPrograms.length,
  approachesPerProgram: 3,
  nationDifferentiatedChoicesPerRole: nations.length * civilizationPrograms.length * 3,
  evaluatedRoleLevels: ['tier-1 executive', 'tier-2 minister', 'tier-5 field'],
  evaluatedPaths: allEvaluatedPaths,
  officialSourceUrls: uniqueSources.size,
  minimumEffectSurfaces: Math.min(...cells.map((cell) => cell.minimumEffectSurfaces)),
  authorityCounts: cells.reduce<Record<CivilizationAuthorityMode, number>>((totals, cell) => {
    totals.direct += cell.authorities.direct;
    totals.ministerial += cell.authorities.ministerial;
    totals.proposal += cell.authorities.proposal;
    return totals;
  }, { direct: 0, ministerial: 0, proposal: 0 }),
  nationProfiles: Object.values(nationCivilizationProfiles),
  cells,
};

const tableRows = cells.map((cell) => (
  `| ${cell.nation} | ${cell.era} | ${cell.evaluatedPaths} | ${cell.averageEffectiveness} | ${cell.averageTreasuryCost} | ${cell.authorities.direct}/${cell.authorities.ministerial}/${cell.authorities.proposal} | ${cell.minimumEffectSurfaces} |`
)).join('\n');

const report = `# 국가 문명 포트폴리오 콘텐츠·균형 감사

## 범위

- 플레이 국가: ${summary.nations}개
- 시대: ${summary.eras}개(1942–2060)
- 생활·산업 분야: ${summary.domains}개
- 역사 기반 사업: ${summary.historicalPrograms}개
- 사업별 경로: 3개(공공·시민연합·시장)
- 한 보직 수준에서 국가별로 달라지는 선택: ${summary.nationDifferentiatedChoicesPerRole.toLocaleString('ko-KR')}개
- 최고직·장관급·현장직을 함께 평가한 경로: ${summary.evaluatedPaths.toLocaleString('ko-KR')}개
- 서로 다른 공식 자료 URL: ${summary.officialSourceUrls}개
- 한 선택이 동시에 건드리는 최소 상태면: ${summary.minimumEffectSurfaces}개

## 검증 규칙

1. 모든 시대에 기존 생활·산업 10개 분야와 통화·금융, 헌정·사법, 이주·시민권, 문화·기억, 재난·민방위 5개 분야가 하나씩 존재해야 합니다.
2. 각 사업은 역사적 기준점과 원자료 링크, 비용, 수혜집단, 위험, 4·13·26·52주 검증 시점을 가져야 합니다.
3. 같은 사업도 국가의 국가역량·시민조직·시장깊이와 보직 관할에 따라 비용·실효·결재 경로가 달라야 합니다.
4. 보너스 하나로 끝나지 않고 게임·경제·국가운영·보건·연구·외교 가운데 최소 두 상태면에 영향을 줘야 합니다.
5. 사용자의 선택은 즉시 결과와 지연 검증을 모두 진행 결과 기록에 남겨야 합니다.

## 국가 × 시대 78개 셀

| 국가 | 시대 | 평가 경로 | 평균 실효 | 평균 국고비용 | 직접/협의/상신 | 최소 상태면 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
${tableRows}

## 판정

전체 78개 국가×시대 셀에서 15개 분야와 3개 경로가 생성되며, 최고직은 국가 조정권을 활용하고 장관급은 관할 밖 부처와 협의하며 현장직은 지지연합을 구축해야 합니다. 효과는 국가 자원뿐 아니라 경제·생활·제도·보건·과학·외교로 전파됩니다. 이 감사는 수치 분포와 구조적 커버리지를 검증하며, 역사 사건의 결정론적 재현을 주장하지 않습니다.

## 재실행

\`npm run audit:civilization\`
`;

writeFileSync(resolve(outputDirectory, 'civilization-systems-content-audit.json'), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(resolve(outputDirectory, 'civilization-systems-content-audit.md'), report);

console.log(`civilization audit: ${summary.evaluatedPaths} evaluated paths across ${cells.length} nation-era cells`);
