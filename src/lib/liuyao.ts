import {
  branches,
  stems,
  jd,
  mod,
  parseDate,
  fromJD,
  solarToLunar,
  solarLongitudeAt,
} from './lunar';
import { describe, trigrams, type cast } from './oracle';
import names from '../data/64que.json';
import classic from '../data/iching-classic.json';
import meanings from '../data/iching-vi.json';

export const elements = ['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'] as const;
export type Element = (typeof elements)[number];
export const relatives = ['Huynh đệ', 'Tử tôn', 'Thê tài', 'Quan quỷ', 'Phụ mẫu'] as const;
export type Relative = (typeof relatives)[number];
export const animals = ['Thanh Long', 'Chu Tước', 'Câu Trần', 'Đằng Xà', 'Bạch Hổ', 'Huyền Vũ'];
export const branchElements: Element[] = [
  'Thủy',
  'Thổ',
  'Mộc',
  'Mộc',
  'Thổ',
  'Hỏa',
  'Hỏa',
  'Thổ',
  'Kim',
  'Kim',
  'Thổ',
  'Thủy',
];
const stageMasks = [0, 1, 3, 7, 15, 31, 23, 16];
const stageHosts = [6, 1, 2, 3, 4, 5, 4, 3];
const stageNames = [
  'Bát thuần',
  'Nhất thế',
  'Nhị thế',
  'Tam thế',
  'Tứ thế',
  'Ngũ thế',
  'Du hồn',
  'Quy hồn',
];
// Each sequence is bottom to top. Inner / outer heavenly stems follow the Na Jia song.
const naJia = [
  { branches: [0, 2, 4, 6, 8, 10], inner: 0, outer: 8 },
  { branches: [5, 3, 1, 11, 9, 7], inner: 3, outer: 3 },
  { branches: [3, 1, 11, 9, 7, 5], inner: 5, outer: 5 },
  { branches: [0, 2, 4, 6, 8, 10], inner: 6, outer: 6 },
  { branches: [1, 11, 9, 7, 5, 3], inner: 7, outer: 7 },
  { branches: [2, 4, 6, 8, 10, 0], inner: 4, outer: 4 },
  { branches: [4, 6, 8, 10, 0, 2], inner: 2, outer: 2 },
  { branches: [7, 5, 3, 1, 11, 9], inner: 1, outer: 9 },
];
export function relativeOf(palace: Element, line: Element): Relative {
  return relatives[mod(elements.indexOf(line) - elements.indexOf(palace), 5)];
}
export function relation(from: Element, to: Element) {
  return ['đồng hành với', 'sinh', 'khắc', 'bị khắc bởi', 'được sinh bởi'][
    mod(elements.indexOf(to) - elements.indexOf(from), 5)
  ];
}
export function palaceOf(bits: number) {
  describe(bits); // Normal callers supply a validated cast.
  for (const trigram of trigrams) {
    const pure = trigram.bits | (trigram.bits << 3);
    const stage = stageMasks.findIndex((mask) => (pure ^ mask) === bits);
    if (stage >= 0) {
      const host = stageHosts[stage];
      return {
        name: trigram.name,
        element: trigram.element as Element,
        pure,
        stage: stageNames[stage],
        host,
        guest: mod(host + 2, 6) + 1,
      };
    }
  }
  throw Error('Không xác định được cung của quẻ.');
}
export function calendarContext(date: string, time: string) {
  const [d, m, y] = parseDate(date),
    parts = /^(\d{2}):(\d{2})$/.exec(time);
  if (!parts || y < 1900 || y > 2100 || ![d, m, y].every(Number.isInteger))
    throw Error('Ngày giờ cần nằm trong 1900–2100.');
  const [hour, minute] = parts.slice(1).map(Number);
  if (hour > 23 || minute > 59 || fromJD(jd(d, m, y)).join() !== [d, m, y].join())
    throw Error('Ngày giờ không hợp lệ.');
  const dayIndex = mod(jd(d, m, y) + 49, 60),
    dayStem = dayIndex % 10,
    dayBranch = dayIndex % 12;
  const longitude = solarLongitudeAt(d, m, y, hour, minute);
  const monthIndex = Math.floor(mod(longitude - 315, 360) / 30),
    monthBranch = mod(monthIndex + 2, 12);
  const solarYear = y - (m <= 2 && longitude < 315 ? 1 : 0),
    yearStem = mod(solarYear + 6, 10);
  const monthStem = mod((yearStem % 5) * 2 + 2 + monthIndex, 10),
    hourBranch = mod(Math.floor((hour + 1) / 2), 12);
  const hourStem = mod(dayStem * 2 + hourBranch, 10),
    startBranch = mod(dayBranch - dayStem, 12);
  const empty = [mod(startBranch + 10, 12), mod(startBranch + 11, 12)];
  const termDistance = mod(longitude - 315, 30);
  return {
    date,
    time,
    lunar: solarToLunar(d, m, y),
    dayStem,
    dayBranch,
    monthBranch,
    empty,
    day: `${stems[dayStem]} ${branches[dayBranch]}`,
    month: `${stems[monthStem]} ${branches[monthBranch]}`,
    year: `${stems[yearStem]} ${branches[mod(solarYear + 8, 12)]}`,
    hour: `${stems[hourStem]} ${branches[hourBranch]}`,
    nearTerm: termDistance < 0.04 || termDistance > 29.96,
  };
}
export type CalendarContext = ReturnType<typeof calendarContext>;
export function monthStrength(month: Element, line: Element) {
  const offset = mod(elements.indexOf(line) - elements.indexOf(month), 5);
  return ['Vượng', 'Tướng', 'Tử', 'Tù', 'Hưu'][offset];
}
export function branchRelation(a: number, b: number) {
  const result: string[] = [];
  if (mod(a - b, 12) === 6) result.push('lục xung');
  if (mod(a + b, 12) === 1) result.push('lục hợp');
  if (a === b) result.push('đồng chi');
  return result;
}
function lineData(bits: number, i: number, palace: Element, calendar: CalendarContext) {
  const trigramBits = i < 3 ? bits & 7 : bits >> 3,
    index = trigrams.findIndex((t) => t.bits === trigramBits);
  const entry = naJia[index],
    branch = entry.branches[i],
    stem = i < 3 ? entry.inner : entry.outer;
  const element = branchElements[branch],
    animalStart = [0, 0, 1, 1, 2, 3, 4, 4, 5, 5][calendar.dayStem];
  return {
    position: i + 1,
    yang: !!((bits >> i) & 1),
    branch,
    stem,
    element,
    canChi: `${stems[stem]} ${branches[branch]}`,
    relative: relativeOf(palace, element),
    animal: animals[(animalStart + i) % 6],
    empty: calendar.empty.includes(branch),
    monthBroken: mod(branch - calendar.monthBranch, 12) === 6,
    dayClash: mod(branch - calendar.dayBranch, 12) === 6,
    monthCombined: mod(branch + calendar.monthBranch, 12) === 1,
    strength: monthStrength(branchElements[calendar.monthBranch], element),
  };
}
export function arrange(bits: number, calendar: CalendarContext, anchor = palaceOf(bits).element) {
  return Array.from({ length: 6 }, (_, i) => lineData(bits, i, anchor, calendar));
}
export const relativeMeanings: Record<Relative, string> = {
  'Huynh đệ':
    'Cùng hành với cung quẻ: anh chị em, bạn bè, người ngang hàng, đối thủ; khi hỏi tài có thể là phần chia sẻ hoặc chi phí. Không mặc định là xấu.',
  'Tử tôn':
    'Do cung quẻ sinh: con cháu, sản phẩm, đầu ra, sự thư thái; sinh Thê tài và chế Quan quỷ. Tên gọi chỉ vai trò tượng trưng, không luôn là người con thật.',
  'Thê tài':
    'Bị cung quẻ khắc: tiền, tài sản, nguồn lực có thể quản lý; sinh Quan quỷ và khắc Phụ mẫu. Không tự gán giới tính hay người phối ngẫu nếu thiếu bối cảnh.',
  'Quan quỷ':
    'Khắc cung quẻ: công việc, chức trách, quy tắc, áp lực hoặc điều lo ngại; sinh Phụ mẫu và khắc Huynh đệ. Cần xét chủ đề để hiểu thuận hay nghịch.',
  'Phụ mẫu':
    'Sinh cung quẻ: cha mẹ, người nâng đỡ, giấy tờ, học hành, nhà cửa; sinh Huynh đệ và khắc Tử tôn. Tùy việc hỏi mà chọn làm Dụng thần.',
};
export const conventions =
  'Nạp giáp Kinh Phòng; hào 1 ở dưới. Lục thân quẻ biến vẫn lấy ngũ hành cung quẻ gốc làm chuẩn. Phục thần lấy ở cùng vị trí trong quẻ bát thuần của cung, chỉ hiện Lục thân thiếu ở quẻ gốc. Lục thú khởi theo can ngày. Đổi ngày lúc 00:00 Việt Nam; giờ Tý từ 23:00. Nguyệt kiến theo tiết khí (kinh độ Mặt Trời xấp xỉ), năm theo Lập Xuân; không dùng tháng âm làm Nguyệt kiến.';
export function analyse(
  result: ReturnType<typeof cast>,
  date: string,
  time: string,
  target = 'Thế',
) {
  const calendar = calendarContext(date, time),
    palace = palaceOf(result.main.bits);
  const rows = arrange(result.main.bits, calendar),
    changedRows = result.changed ? arrange(result.changed.bits, calendar, palace.element) : null;
  const present = new Set(rows.map((r) => r.relative));
  const hidden = arrange(palace.pure, calendar).filter((r) => !present.has(r.relative));
  const selected = rows.filter((r) =>
    target === 'Thế'
      ? r.position === palace.host
      : target === 'Ứng'
        ? r.position === palace.guest
        : r.relative === target,
  );
  const selectedHidden = hidden.filter((r) => r.relative === target);
  const host = rows[palace.host - 1],
    guest = rows[palace.guest - 1];
  const explanations = [
    `Quẻ gốc #${result.main.number} ${names[result.main.number - 1][0]}: thượng ${result.main.upper.name} (${result.main.upper.element}), hạ ${result.main.lower.name} (${result.main.lower.element}). Sáu hào được đếm từ dưới lên.`,
    `Quẻ hỗ #${result.mutual.number} ${names[result.mutual.number - 1][0]} lấy hào 2–3–4 làm hạ quái và 3–4–5 làm thượng quái. Đây là cấu trúc bên trong, không phải một lần gieo khác.`,
    result.changed
      ? `Hào ${result.movingLines.join(', ')} động: đảo âm ↔ dương ở đúng các hào này, giữ các hào còn lại, thành #${result.changed.number} ${names[result.changed.number - 1][0]}. ${names[result.changed.number - 1][1]}`
      : 'Quẻ tĩnh: không có hào động nên không tạo quẻ biến khác. Quẻ hỗ vẫn có thể trùng quẻ gốc; đây là kết quả hợp lệ.',
    `Quẻ thuộc cung ${palace.name} – ${palace.element}, loại ${palace.stage}. Thế ở hào ${palace.host}, Ứng ở hào ${palace.guest}. Thế ${host.element} ${relation(host.element, guest.element)} Ứng ${guest.element}${branchRelation(host.branch, guest.branch).length ? `; hai chi ${branchRelation(host.branch, guest.branch).join(', ')}` : ''}. Đây là quan hệ chủ–khách theo ngũ hành, chưa đủ để kết luận việc thành hay bại.`,
  ];
  const influence: string[] = [];
  for (const i of result.movingLines) {
    const source = rows[i - 1],
      after = changedRows![i - 1];
    const effect = relation(after.element, source.element);
    const returning =
      effect === 'sinh'
        ? 'hồi đầu sinh'
        : effect === 'khắc'
          ? 'hồi đầu khắc'
          : 'không có hồi đầu sinh/khắc trực tiếp';
    influence.push(
      `Hào ${i} ${source.relative}, ${source.canChi} – ${source.element} động → ${after.relative}, ${after.canChi} – ${after.element}: ${returning}. Chi trước/sau ${branchRelation(source.branch, after.branch).join(', ') || 'không thuộc cặp lục hợp/lục xung'}.`,
    );
    for (const receiver of rows.filter((r) => r.position !== i)) {
      const rel = relation(source.element, receiver.element);
      if (rel === 'sinh' || rel === 'khắc')
        influence.push(
          `Hào ${i} ${source.relative} (${source.element}) ${rel} hào ${receiver.position} ${receiver.relative} (${receiver.element})${receiver.position === palace.host ? ' · Thế' : receiver.position === palace.guest ? ' · Ứng' : ''}. Tác động thực tế còn tùy vượng suy, Không/Phá và Dụng thần.`,
        );
    }
  }
  const useNotes = [...selected, ...selectedHidden].map(
    (row) =>
      `Dụng thần ${target}: hào ${row.position}, ${row.canChi} – ${row.element}, ${row.strength.toLowerCase()} theo hành tháng${row.empty ? ', Tuần không' : ''}${row.monthBroken ? ', Nguyệt phá' : ''}${row.dayClash ? ', Nhật xung' : ''}${selectedHidden.includes(row) ? ', đang phục dưới hào cùng vị trí' : ''}. Nhật thần ${branchElements[calendar.dayBranch]} ${relation(branchElements[calendar.dayBranch], row.element)} hành của hào này.`,
  );
  if (!useNotes.length)
    useNotes.push(
      `Chưa thấy ${target} ở chính quẻ hoặc Phục thần. Cần kiểm tra lại cách chọn Dụng thần, không tự suy thành “không có kết quả”.`,
    );
  const chosenElements = [...new Set([...selected, ...selectedHidden].map((row) => row.element))];
  for (const chosen of chosenElements) {
    const index = elements.indexOf(chosen);
    for (const [label, offset] of [
      ['Nguyên thần', -1],
      ['Kỵ thần', -2],
      ['Cừu thần', -3],
    ] as const) {
      const element = elements[mod(index + offset, 5)];
      const visible = rows
        .filter((row) => row.element === element)
        .map((row) => `hào ${row.position} ${row.relative}`);
      const concealed = hidden
        .filter((row) => row.element === element)
        .map((row) => `Phục thần hào ${row.position} ${row.relative}`);
      useNotes.push(
        `${label} của Dụng thần hành ${chosen} là hành ${element}: ${[...visible, ...concealed].join('; ') || 'không hiện trong chính quẻ hoặc Phục thần'}. Vai trò sinh/khắc chưa tự quyết định khả năng phát huy; cần xét động/tĩnh, vượng suy và Không/Phá.`,
      );
    }
  }
  for (const concealed of hidden) {
    const flying = rows[concealed.position - 1];
    influence.push(
      `Phục thần hào ${concealed.position}: Phi thần ${flying.relative} (${flying.element}) ${relation(flying.element, concealed.element)} Phục thần ${concealed.relative} (${concealed.element}). Đây là quan hệ Phi–Phục cùng vị trí, không tự khẳng định đã xuất phục.`,
    );
  }
  let maiHoa =
    'Mai Hoa: chỉ xác định Thể/Dụng kiểu một hào động khi có đúng một hào động; quẻ tĩnh hoặc nhiều hào động không tự gán Thể/Dụng.';
  if (result.movingLines.length === 1) {
    const lowerMoves = result.movingLines[0] <= 3;
    const body = lowerMoves ? result.main.upper : result.main.lower,
      use = lowerMoves ? result.main.lower : result.main.upper;
    const later = lowerMoves ? result.changed!.lower : result.changed!.upper;
    maiHoa = `Mai Hoa: hào ${result.movingLines[0]} nằm ở ${lowerMoves ? 'hạ' : 'thượng'} quái nên phần đó là Dụng (${use.name} – ${use.element}); phần không động là Thể (${body.name} – ${body.element}). Dụng ${use.element} ${relation(use.element as Element, body.element as Element)} Thể ${body.element}. Sau biến, Dụng thành ${later.name} – ${later.element}, ${relation(later.element as Element, body.element as Element)} Thể. Đây là phép đọc Thể–Dụng, khác với Lục thân theo cung.`;
  }
  return {
    calendar,
    palace,
    rows,
    changedRows,
    hidden,
    explanations,
    influence,
    useNotes,
    maiHoa,
    target,
  };
}
export type Reading = ReturnType<typeof analyse>;
export function hexagramText(number: number) {
  const item = classic[number - 1];
  return `#${number} ${names[number - 1][0]}\nDiễn giải ngắn do app biên soạn: ${names[number - 1][1]}\nDiễn nghĩa quái từ do app biên soạn: ${meanings[number - 1]}\nQuái từ (cổ văn): ${item.judgement}\nThoán truyện: ${item.tuan}\nĐại tượng: ${item.image}\n${item.lines.map((line, i) => `Hào ${i + 1}: ${line}`).join('\n')}${item.extra ? `\n${item.extra}` : ''}`;
}
export function detailedPrompt(
  result: ReturnType<typeof cast>,
  reading: Reading,
  note: string,
  question: string,
) {
  const { calendar: c, palace: p } = reading;
  const table = reading.rows
    .map((row) => {
      const next = reading.changedRows?.[row.position - 1],
        hidden = reading.hidden.find((r) => r.position === row.position);
      return [
        `Hào ${row.position}: ${row.yang ? 'Dương' : 'Âm'}${result.movingLines.includes(row.position) ? ' ĐỘNG' : ' tĩnh'}`,
        row.position === p.host ? 'THẾ' : row.position === p.guest ? 'ỨNG' : '',
        `${row.relative}; ${row.canChi} – ${row.element}; ${row.animal}; ${row.strength}`,
        [
          row.empty && 'Tuần không',
          row.monthBroken && 'Nguyệt phá',
          row.dayClash && 'Nhật xung',
          row.monthCombined && 'Nguyệt hợp',
        ]
          .filter(Boolean)
          .join(', ') || 'Không cờ Không/Phá/Xung/Hợp tháng',
        hidden
          ? `Phục thần: ${hidden.relative}, ${hidden.canChi} – ${hidden.element}`
          : 'Phục thần: không',
        next
          ? `Quẻ biến cùng vị trí: ${next.yang ? 'Dương' : 'Âm'}, ${next.relative}, ${next.canChi} – ${next.element}${result.movingLines.includes(row.position) ? ' (hào biến cần xét)' : ' (tham chiếu, hào này không động)'}`
          : '',
      ]
        .filter(Boolean)
        .join(' | ');
    })
    .reverse()
    .join('\n');
  const numbers = [
    ...new Set([
      result.main.number,
      result.mutual.number,
      ...(result.changed ? [result.changed.number] : []),
    ]),
  ];
  return `Hãy luận giải hồ sơ Kinh Dịch dưới đây bằng tiếng Việt, chi tiết và dễ hiểu.\nCÂU HỎI / BỐI CẢNH: ${question.trim() || '[Chưa cung cấp; hãy hỏi bối cảnh trước khi kết luận cụ thể.]'}\nDỤNG THẦN NGƯỜI DÙNG CHỌN: ${reading.target} (nếu chưa phù hợp, giải thích và đề nghị sửa, không âm thầm thay).\n\nPHƯƠNG PHÁP VÀ THỜI ĐIỂM\n${note}\nNgày ${c.date}, giờ ${c.time}, UTC+7. Âm lịch ${c.lunar.day}/${c.lunar.month}${c.lunar.leap ? ' nhuận' : ''}/${c.lunar.year}. Năm ${c.year} (Lập Xuân), tháng ${c.month} (tiết khí), ngày ${c.day}, giờ ${c.hour}. Tuần không: ${c.empty.map((n) => branches[n]).join(', ')}.\n${conventions}${c.nearTerm ? '\nGẦN RANH TIẾT KHÍ: cần đối chiếu lịch tiết khí chính xác trước khi luận vượng suy.' : ''}\nQuy ước lập Mai Hoa theo số: Càn 1, Đoài 2, Ly 3, Chấn 4, Tốn 5, Khảm 6, Cấn 7, Khôn 8; dư 0 lấy 8 hoặc 6. Không coi sê-ri là phép gieo tiền ba đồng.\n\nCẤU TRÚC QUẺ\n${reading.explanations.join('\n')}\n${reading.maiHoa}\n\nBẢNG LỤC HÀO (trên xuống: 6 → 1; quẻ biến dùng cung gốc ${p.name} – ${p.element} để định Lục thân)\n${table}\n\nPHÂN TÍCH CƠ HỌC DO APP TÍNH\n${reading.useNotes.join('\n')}\n${reading.influence.join('\n') || 'Không có hào động; không tạo ảnh hưởng động giả định.'}\n\nCỔ VĂN VÀ GỢI Ý CỦA CÁC QUẺ LIÊN QUAN\n${numbers.map(hexagramText).join('\n\n')}\n\nYÊU CẦU LUẬN GIẢI\n1. Kiểm tra lại cấu trúc quẻ, hào động, cung, Nạp giáp, Thế/Ứng và Dụng thần; nêu rõ nếu gặp dị bản hoặc khác quy ước.\n2. Giải thích từng bước vì sao có quẻ gốc → hỗ → biến; dịch nghĩa quái từ và từng hào từ liên quan, tách bản dịch khỏi lời bình.\n3. Đọc riêng Mai Hoa và Lục hào; không dùng cung quẻ biến để đổi Lục thân của hào biến, không trộn Thể/Dụng với Thế/Ứng.\n4. Phân tích Dụng thần, Nguyên thần, Kỵ thần, Cừu thần; chỉ rõ hào nào sinh/khắc hào nào và vì sao. Giải thích cụ thể Huynh đệ, Tử tôn, Thê tài, Quan quỷ, Phụ mẫu trong đúng việc hỏi.\n5. Xét Nhật/Nguyệt, vượng suy, Tuần không, Nguyệt phá, động–biến, hồi đầu sinh/khắc, Phục thần/Phi thần; phân biệt cờ hình thức với kết luận. App chưa tính trọn tam hợp, tam hình, tiến thoái thần, nhập mộ, ám động và ứng kỳ: tự kiểm tra trước khi dùng, không giả vờ đã có trong dữ liệu.\n6. Nếu nhiều hào động, nêu rõ phép chọn hào từ trước khi áp dụng; không tự mặc định một hào đại diện. Không coi toàn bộ hào quẻ biến đều phát động.\n7. Kết luận theo điều kiện: thuận lợi, trở lực, điều cần làm và điều cần kiểm chứng. Không hứa chắc tương lai, không quy kết người thân gây hại chỉ từ tên Lục thân.\n\nNguồn cổ văn: Chu Dịch, bản chép https://github.com/bollwarm/ZHOUYI/blob/master/lib/ZHOUYI.pm ; đối chiếu https://zh.wikisource.org/wiki/周易 . Phần tiếng Việt và phân tích cơ học là nội dung app biên soạn.`;
}
