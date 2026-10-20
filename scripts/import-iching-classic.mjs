// Import only public-domain classical Chinese passages, never modern commentary or code.
// Source transcription: https://github.com/bollwarm/ZHOUYI/blob/master/lib/ZHOUYI.pm
import fs from 'node:fs';
const raw = fs.readFileSync(process.argv[2], 'utf8');
const headers = [...raw.matchAll(/^《易經》第[^\n]+/gm)];
const records = headers.map((header, i) => {
  const body = raw
    .slice(header.index + header[0].length, headers[i + 1]?.index || raw.length)
    .trim();
  const lines = [...body.matchAll(/^(初[九六]|[九六][二三四五]|上[九六])[：:．。，]([^\n]+)/gm)]
    .slice(0, 6)
    .map((match) => `${match[1]}：${match[2].trim()}`);
  return {
    number: i + 1,
    judgement: body.split('\n')[0].trim(),
    lines,
    extra: body.match(/^用[九六][：:．。，][^\n]+/m)?.[0] || '',
    tuan: body.match(/《彖》曰[：:]([\s\S]*?)《象》曰/)?.[1].replace(/\s+/g, '') || '',
    image:
      body
        .match(
          /《象》曰[：:]([\s\S]*?)(?=《象》曰|\n\s*(?:初[九六]|[九六][二三四五]|上[九六]|《文言》)|$)/,
        )?.[1]
        .replace(/\s+/g, '') || '',
  };
});
// Correct a transcription typo against 周易/乾 on Wikisource.
records[0].lines[1] = records[0].lines[1].replace('見龍再田', '見龍在田');
records[3].judgement = records[3].judgement.replace('初噬告', '初筮告');
if (
  records.length !== 64 ||
  records.some((r) => r.lines.length !== 6 || !r.judgement || !r.tuan || !r.image)
)
  throw Error('The source must contain 64 judgments, 384 line texts, 64 Tuan and 64 Great Images.');
fs.writeFileSync('src/data/iching-classic.json', JSON.stringify(records, null, 2) + '\n');
console.log('Imported 64 hexagrams and 384 classical line texts.');
