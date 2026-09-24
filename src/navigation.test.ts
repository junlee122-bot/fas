import { describe, expect, it } from 'vitest';
import { filterCommands } from './navigation';

const commands = [
  { id: 'army', title: '육군', description: '사단과 지휘관 관리', keywords: ['부대', '공세'] },
  { id: 'industry', title: '군수 생산', description: '공장과 장비 생산선 관리', keywords: ['공장', '무기'] },
  { id: 'asia', title: '아시아·태평양 전구', description: '동아시아와 태평양 지도', keywords: ['전구', '지도'] },
];

describe('command palette search', () => {
  it('searches titles, descriptions, and aliases', () => {
    expect(filterCommands(commands, '육군').map((command) => command.id)).toEqual(['army']);
    expect(filterCommands(commands, '공장').map((command) => command.id)).toEqual(['industry']);
    expect(filterCommands(commands, '태평양 지도').map((command) => command.id)).toEqual(['asia']);
  });

  it('returns all commands for a blank query', () => {
    expect(filterCommands(commands, '  ')).toEqual(commands);
  });
});
