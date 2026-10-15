import { describe, it, expect } from 'vitest';
import { destinationCandidates } from '../../server/utils/geo.js';

describe('destinationCandidates 目的地候选拆分', () => {
  it('整串优先，随后是拆分出的单个城市', () => {
    expect(destinationCandidates('洛杉矶、纽约')).toEqual(['洛杉矶、纽约', '洛杉矶', '纽约']);
  });

  it('国家后缀与空格被拆开', () => {
    expect(destinationCandidates('东京，日本')).toEqual(['东京，日本', '东京', '日本']);
    expect(destinationCandidates('东京 日本')).toEqual(['东京 日本', '东京', '日本']);
  });

  it('多个分隔符混用', () => {
    expect(destinationCandidates('巴黎·里昂,尼斯')).toEqual([
      '巴黎·里昂,尼斯',
      '巴黎',
      '里昂',
      '尼斯'
    ]);
  });

  it('单一城市只返回一个候选', () => {
    expect(destinationCandidates('大阪')).toEqual(['大阪']);
  });

  it('空值与非法输入返回空数组', () => {
    expect(destinationCandidates('')).toEqual([]);
    expect(destinationCandidates('  ')).toEqual([]);
    expect(destinationCandidates(null)).toEqual([]);
    expect(destinationCandidates(42)).toEqual(['42']);
  });
});
