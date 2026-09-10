export type KoreanParticlePair = '이/가' | '은/는' | '을/를' | '과/와' | '으로/로';

function finalConsonantIndex(text: string): number {
  const characters = [...text.trim()];
  for (let index = characters.length - 1; index >= 0; index -= 1) {
    const syllable = characters[index].charCodeAt(0) - 0xac00;
    if (syllable >= 0 && syllable <= 11171) return syllable % 28;
    if (/[A-Za-z0-9]/.test(characters[index])) return 0;
  }
  return 0;
}

export function hasBatchim(text: string): boolean {
  return finalConsonantIndex(text) !== 0;
}

export function withJosa(text: string, pair: KoreanParticlePair): string {
  const finalIndex = finalConsonantIndex(text);
  const hasFinal = finalIndex !== 0;
  if (pair === '으로/로') return `${text}${hasFinal && finalIndex !== 8 ? '으로' : '로'}`;
  const [withFinal, withoutFinal] = pair.split('/');
  return `${text}${hasFinal ? withFinal : withoutFinal}`;
}
