import { describe, expect, it } from 'vitest';
import { getInstrument } from '../core/instruments';
import { checkWrittenRange } from '../core/range';

describe('checkWrittenRange', () => {
  const clarinet = getInstrument('clarinet-bb');

  it('reports ok inside the range, including the edges', () => {
    expect(checkWrittenRange('E3', clarinet)).toBe('ok');
    expect(checkWrittenRange('G6', clarinet)).toBe('ok');
    expect(checkWrittenRange('C4', clarinet)).toBe('ok');
  });

  it('reports below and above outside the range', () => {
    expect(checkWrittenRange('D3', clarinet)).toBe('below');
    expect(checkWrittenRange('A6', clarinet)).toBe('above');
  });

  it('reports unknown when the range is not defined', () => {
    expect(checkWrittenRange('C4', getInstrument('bass-sax'))).toBe('unknown');
  });

  it('works on written pitch, not concert pitch (double bass)', () => {
    const bass = getInstrument('double-bass');
    expect(checkWrittenRange('E2', bass)).toBe('ok');
    expect(checkWrittenRange('E1', bass)).toBe('below');
  });
});
