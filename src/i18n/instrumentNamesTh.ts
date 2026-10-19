/*
 * Thai instrument names, built from base-name rules so every instrument in the
 * table gets a Thai name. The key ("in B♭") is kept as written. These are
 * working translations and should be checked by a Thai musician.
 */

const BASE_TH: Array<[RegExp, string]> = [
  [/^Piccolo trumpet/i, 'ทรัมเป็ตพิคโคโล'],
  [/^Trumpet/i, 'ทรัมเป็ต'],
  [/^Piccolo/i, 'พิคโคโล'],
  [/^Flute/i, 'ฟลูต'],
  [/^Alto flute/i, 'อัลโตฟลูต'],
  [/^Bass flute/i, 'เบสฟลูต'],
  [/^Oboe d'amore/i, 'โอโบดามอร์'],
  [/^Oboe/i, 'โอโบ'],
  [/^Cor anglais/i, 'คอร์อองเกลส์'],
  [/^Contrabassoon/i, 'คอนทราบาสซูน'],
  [/^Bassoon/i, 'บาสซูน'],
  [/^Clarinet/i, 'คลาริเน็ต'],
  [/^Basset horn/i, 'เบสเซ็ตฮอร์น'],
  [/^Alto clarinet/i, 'อัลโตคลาริเน็ต'],
  [/^Bass clarinet/i, 'เบสคลาริเน็ต'],
  [/^Contra-alto clarinet/i, 'คอนทราอัลโตคลาริเน็ต'],
  [/^Contrabass clarinet/i, 'คอนทราเบสคลาริเน็ต'],
  [/^Sopranino saxophone/i, 'โซปรานิโนแซกโซโฟน'],
  [/^Soprano saxophone/i, 'โซปราโนแซกโซโฟน'],
  [/^C soprano saxophone/i, 'โซปราโนแซกโซโฟน'],
  [/^C melody saxophone/i, 'เมโลดีแซกโซโฟน'],
  [/^Alto saxophone/i, 'อัลโตแซกโซโฟน'],
  [/^Tenor saxophone/i, 'เทเนอร์แซกโซโฟน'],
  [/^Baritone saxophone/i, 'บาริโทนแซกโซโฟน'],
  [/^Bass saxophone/i, 'เบสแซกโซโฟน'],
  [/^Contrabass saxophone/i, 'คอนทราเบสแซกโซโฟน'],
  [/^Subcontrabass saxophone/i, 'ซับคอนทราเบสแซกโซโฟน'],
  [/^Horn/i, 'ฮอร์น'],
  [/^Mellophone/i, 'เมลโลโฟน'],
  [/^Flugelhorn/i, 'ฟลูเกิลฮอร์น'],
  [/^Soprano cornet/i, 'โซปราโนคอร์เน็ต'],
  [/^Tenor horn/i, 'เทเนอร์ฮอร์น'],
  [/^Euphonium/i, 'ยูโฟเนียม'],
  [/^Tenor trombone/i, 'เทเนอร์ทรอมโบน'],
  [/^Bass trombone/i, 'เบสทรอมโบน'],
  [/^Tuba/i, 'ทูบา'],
  [/^Violin/i, 'ไวโอลิน'],
  [/^Viola/i, 'วิโอลา'],
  [/^Cello/i, 'เชลโล'],
  [/^Double bass/i, 'ดับเบิลเบส'],
  [/^Bass guitar/i, 'เบสกีตาร์'],
  [/^Guitar/i, 'กีตาร์'],
  [/^Timpani/i, 'ทิมปานี'],
  [/^Glockenspiel/i, 'กล็อกเกนสปีล'],
  [/^Xylophone/i, 'ไซโลโฟน'],
  [/^Marimba/i, 'มาริมบา'],
  [/^Vibraphone/i, 'วิบราโฟน'],
  [/^Crotales/i, 'โครตาลส์'],
  [/^Celesta/i, 'เซเลสตา'],
  [/^Piano/i, 'เปียโน'],
  [/^Harp/i, 'ฮาร์ป'],
  [/^Sarrusophone sopranino/i, 'ซารูโซโฟนโซปรานิโน'],
  [/^Sarrusophone soprano/i, 'ซารูโซโฟนโซปราโน'],
];

/** Thai name for an English instrument name. Returns the input when no rule matches. */
export function instrumentNameTh(name: string): string {
  const core = name.replace(/\(.*?\)/g, '').trim();
  const base = BASE_TH.find(([re]) => re.test(core))?.[1];
  if (!base) return name;

  const keyMatch = core.match(/\bin ([A-G](?:♭|♯)?)(?=\s|$|\/)/);
  let out = base;
  if (keyMatch) out += ` (คีย์ ${keyMatch[1]})`;
  if (/non-transposing/i.test(name)) out += ' (ไม่ย้ายเสียง)';
  if (/brass band/i.test(name)) out += ' (บรัสแบนด์)';
  if (/unverified/i.test(name)) out += ' (ยังไม่ยืนยัน)';
  return out;
}
