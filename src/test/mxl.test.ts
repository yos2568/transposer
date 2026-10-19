import { describe, expect, it } from 'vitest';
import { isZip, readMxl } from '../score/mxl';

/** Build a zip archive with stored (uncompressed) entries, for testing the reader. */
function storedZip(files: Record<string, string>): ArrayBuffer {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(content);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(8, 0, true); // stored
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    chunks.push(new Uint8Array(local.buffer), nameBytes, data);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(10, 0, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, nameBytes.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }

  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, Object.keys(files).length, true);
  eocd.setUint16(10, Object.keys(files).length, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, offset, true);

  const all = [...chunks, ...central, new Uint8Array(eocd.buffer)];
  const out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out.buffer;
}

describe('readMxl', () => {
  it('reads the root score named in container.xml', async () => {
    const container = `<?xml version="1.0"?><container><rootfiles><rootfile full-path="score.musicxml"/></rootfiles></container>`;
    const score = '<score-partwise version="4.0"></score-partwise>';
    const zip = storedZip({ 'META-INF/container.xml': container, 'score.musicxml': score });
    expect(await readMxl(zip)).toBe(score);
  });

  it('falls back to the first score file when there is no container', async () => {
    const score = '<score-partwise version="4.0"></score-partwise>';
    const zip = storedZip({ 'piece.xml': score });
    expect(await readMxl(zip)).toBe(score);
  });

  it('rejects an archive with no score', async () => {
    const zip = storedZip({ 'readme.txt': 'hello' });
    await expect(readMxl(zip)).rejects.toThrow(/No MusicXML score/);
  });

  it('detects zip files by their signature', () => {
    expect(isZip(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0]))).toBe(true);
    expect(isZip(new Uint8Array([0x3c, 0x3f, 0x78]))).toBe(false);
  });
});
