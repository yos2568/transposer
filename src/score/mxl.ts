import { DOMParser } from '@xmldom/xmldom';

/*
 * Reads a compressed MusicXML (.mxl) file: a zip archive whose root score is named
 * in META-INF/container.xml. Uses the zip central directory so it works even when
 * local headers carry zero sizes (streamed writers).
 */

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localOffset: number;
}

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

export function isZip(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

function readZipEntries(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Not a valid .mxl file (no zip directory found).');

  const count = view.getUint16(eocd + 10, true);
  let pos = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries: ZipEntry[] = [];

  for (let i = 0; i < count; i++) {
    if (view.getUint32(pos, true) !== SIG_CENTRAL) throw new Error('Corrupt .mxl central directory.');
    const method = view.getUint16(pos + 10, true);
    const compressedSize = view.getUint32(pos + 20, true);
    const nameLength = view.getUint16(pos + 28, true);
    const extraLength = view.getUint16(pos + 30, true);
    const commentLength = view.getUint16(pos + 32, true);
    const localOffset = view.getUint32(pos + 42, true);
    const name = decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLength));
    entries.push({ name, method, compressedSize, localOffset });
    pos += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser cannot read compressed .mxl files. Save the score as .musicxml instead.');
  }
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function extract(bytes: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(entry.localOffset, true) !== SIG_LOCAL) throw new Error(`Corrupt entry: ${entry.name}`);
  const nameLength = view.getUint16(entry.localOffset + 26, true);
  const extraLength = view.getUint16(entry.localOffset + 28, true);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  const data = bytes.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return data;
  if (entry.method === 8) return inflateRaw(data);
  throw new Error(`Unsupported compression in .mxl: method ${entry.method}`);
}

/** Return the MusicXML text inside a .mxl archive. */
export async function readMxl(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const entries = readZipEntries(bytes);
  const decoder = new TextDecoder();

  let rootPath: string | null = null;
  const container = entries.find((e) => e.name === 'META-INF/container.xml');
  if (container) {
    const xml = decoder.decode(await extract(bytes, container));
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const rootfile = doc.getElementsByTagName('rootfile')[0];
    rootPath = rootfile?.getAttribute('full-path') ?? null;
  }

  const target =
    (rootPath && entries.find((e) => e.name === rootPath)) ||
    entries.find((e) => /\.(musicxml|xml)$/i.test(e.name) && !e.name.startsWith('META-INF/'));
  if (!target) throw new Error('No MusicXML score found inside the .mxl file.');

  return decoder.decode(await extract(bytes, target));
}

/** Read a score file the user picked: compressed (.mxl or zipped) or plain MusicXML. */
export async function readScoreFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  if (/\.mxl$/i.test(file.name) || isZip(new Uint8Array(buffer))) return readMxl(buffer);
  return new TextDecoder().decode(buffer);
}
