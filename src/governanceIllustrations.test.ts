import { describe, expect, it } from 'vitest';
import diplomacy from './DiplomacyDesk.tsx?raw';
import treaty from './TerritorialTreatyBoard.tsx?raw';
import settlement from './PoliticalSettlementBoard.tsx?raw';
import nation from './NationDesk.tsx?raw';
import constitution from './ConstitutionalJudiciaryBoard.tsx?raw';
import justice from './JusticeDocketBoard.tsx?raw';
import sovereign from './SovereignPowersBoard.tsx?raw';
import election from './ElectionSituationRoom.tsx?raw';
import civilian from './CivilianCareerPanel.tsx?raw';
import socialist from './SocialistWorldBoard.tsx?raw';
import korea from './KoreaCampaignBrief.tsx?raw';
import management from './NationManagementPanel.tsx?raw';

// Read sources without importing the views or the generated asset catalog. These
// contracts remain runnable while image production is still in progress.
const placements = [
  ['DiplomacyDesk', diplomacy, 'diplomatic-table'],
  ['TerritorialTreatyBoard', treaty, 'territorial-administration'],
  ['PoliticalSettlementBoard', settlement, 'territorial-administration'],
  ['NationDesk', nation, 'national-reconstruction'],
  ['ConstitutionalJudiciaryBoard', constitution, 'constitution-assembly'],
  ['JusticeDocketBoard', justice, 'justice-chamber'],
  ['SovereignPowersBoard', sovereign, 'constitution-assembly'],
  ['ElectionSituationRoom', election, 'election-campaign'],
  ['CivilianCareerPanel', civilian, 'civilian-work'],
  ['SocialistWorldBoard', socialist, 'socialist-planning'],
  ['KoreaCampaignBrief', korea, 'independence-network'],
] as const;

function slots(source: string) {
  return source.match(/<GameIllustration\b[^>]*\/>/g) ?? [];
}

function sourceBetween(source: string, start: string, end?: string) {
  const startIndex = source.indexOf(start);
  const endIndex = end ? source.indexOf(end, startIndex + start.length) : source.length;
  if (startIndex < 0 || endIndex < 0) throw new Error(`Could not inspect ${start} -> ${end ?? 'EOF'}`);
  return source.slice(startIndex, endIndex);
}

function expectCompactSlot(slot: string, scene: string) {
  // Literal scenes and only presentation props: no event, record, evidence,
  // approval callback, or mutable game-state object is passed into the artwork.
  const year = scene === 'independence-network' ? '\\s+year=\\{1942\\}' : '';
  expect(slot).toMatch(new RegExp(`^<GameIllustration\\s+scene="${scene}"${year}\\s+compact\\s*\\/>$`));
}

describe('governance illustration integration contracts', () => {
  it.each(placements)('%s imports one compact literal scene', (_name, source, scene) => {
    expect(source).toMatch(/import\s*\{[^}]*\bGameIllustration\b[^}]*\}\s*from\s*['"]\.\/GameIllustration['"]/);
    const illustrations = slots(source);
    expect(illustrations).toHaveLength(1);
    expect(source.match(/<GameIllustration\b/g)).toHaveLength(1);
    expectCompactSlot(illustrations[0]!, scene);
  });

  it.each([
    ['ConstitutionalJudiciaryBoard', constitution, 'compact'],
    ['JusticeDocketBoard', justice, 'p.compact'],
    ['SovereignPowersBoard', sovereign, 'compact'],
    ['SocialistWorldBoard', socialist, 'compact'],
  ] as const)('%s omits its artwork in compact mode', (_name, source, compactFlag) => {
    const prefix = source.slice(0, source.indexOf('<GameIllustration')).slice(-240);
    const escapedFlag = compactFlag.replace('.', '\\.');
    expect(prefix).toMatch(new RegExp(`\\{\\s*!${escapedFlag}\\s*(?:\\?|&&)\\s*(?:<div\\s+className="governance-illustration-slot">\\s*)?$`));
  });

  it('limits NationManagementPanel to exactly three compact scene slots', () => {
    expect(management).toMatch(/import\s*\{[^}]*\bGameIllustration\b[^}]*\}\s*from\s*['"]\.\/GameIllustration['"]/);
    const illustrations = slots(management);
    expect(illustrations).toHaveLength(3);
    expect(management.match(/<GameIllustration\b/g)).toHaveLength(3);
    expectCompactSlot(illustrations[0]!, 'national-reconstruction');
    expectCompactSlot(illustrations[1]!, 'civilian-work');
    expectCompactSlot(illustrations[2]!, 'royal-council');
  });

  it.each([
    ['strategy', 'national-reconstruction', "{view === 'personal'"],
    ['personal', 'civilian-work', "{view === 'media'"],
    ['dynasty', 'royal-council', "{view === 'records'"],
  ])('keeps the %s artwork inside its own tab', (view, scene, nextView) => {
    const branch = sourceBetween(management, `{view === '${view}'`, nextView);
    expect(slots(branch)).toHaveLength(1);
    expectCompactSlot(slots(branch)[0]!, scene);
  });

  it('requires a monarchy before rendering the royal council', () => {
    const branch = sourceBetween(management, "{view === 'dynasty'", "{view === 'records'");
    const prefix = branch.slice(0, branch.indexOf('<GameIllustration')).slice(-240);
    expect(prefix).toMatch(/\{\s*currentGovernmentForm\.monarchy\s*(?:\?|&&)\s*(?:<div\s+className="governance-illustration-slot">\s*)?$/);
  });

  it('does not attach illustration state to the shared workspace header', () => {
    const header = sourceBetween(management, 'const workspaceHeader =', 'const workspaceOverview =');
    expect(header).not.toContain('GameIllustration');
  });

  it.each([
    'ConstitutionalJudiciaryBoard',
    'JusticeDocketBoard',
    'SovereignPowersBoard',
    'SocialistWorldBoard',
  ])('passes compact to %s only in the wartime embedded workspace', (component) => {
    const wartime = sourceBetween(management, "if (phase === 'war') {", 'const objectiveRows =');
    const national = sourceBetween(management, 'const objectiveRows =');
    const openingTag = new RegExp(`<${component}\\b[\\s\\S]*?\\/>`);
    const wartimeTag = wartime.match(openingTag)?.[0];
    const nationalTag = national.match(openingTag)?.[0];
    expect(wartimeTag).toBeDefined();
    expect(nationalTag).toBeDefined();
    expect(wartimeTag).toMatch(/\scompact(?:\s|=)/);
    expect(nationalTag).not.toMatch(/\scompact(?:\s|=)/);
  });

  it.each([
    ['diplomatic approval and records', diplomacy, '{review ? <section', undefined],
    ['territorial consent records', treaty, 'export function TerritorialTreatyConsentRecord', 'export function TerritorialTreatyReviewSubject'],
    ['territorial approval and records', treaty, '{review ? <section', undefined],
    ['political approval and records', settlement, '{review ? <section', undefined],
    ['budget approval and editing', nation, 'export function NationBudgetProposalView', undefined],
    ['constitutional approval and records', constitution, '{review ? <section', undefined],
    ['justice evidence and case facts', justice, 'function EvidenceRows', 'export function JusticeDocketView'],
    ['justice approval and records', justice, '{review ? <section', undefined],
    ['sovereign sources, approval and records', sovereign, '<details className="sovereign-desk-source"', undefined],
    ['election action records', election, '<div className="campaign-action-log"', undefined],
    ['civilian action records', civilian, '<section className="civilian-dashboard-card civilian-record"', undefined],
    ['socialist historical sources and records', socialist, '<div className="socialist-historical-basis"', undefined],
    ['national outcome records', management, "{view === 'records'", undefined],
  ] as const)('keeps %s separate from atmosphere art', (_label, source, start, end) => {
    expect(sourceBetween(source, start, end)).not.toContain('<GameIllustration');
  });
});
