import { useState } from 'preact/hooks';
import names from '../../data/64que.json';
import classic from '../../data/iching-classic.json';
import meanings from '../../data/iching-vi.json';
import { describe } from '../../lib/oracle';
import {
  palaceOf,
  relativeMeanings,
  relatives,
  elements,
  branchElements,
  animals,
  conventions,
} from '../../lib/liuyao';
import { branches, stems } from '../../lib/lunar';

export const allHexagrams = Array.from({ length: 64 }, (_, bits) => describe(bits)).sort(
  (a, b) => a.number - b.number,
);
const images: Record<string, string> = {
  Càn: 'trời, sức sáng tạo và chủ động',
  Đoài: 'đầm, giao tiếp và niềm vui',
  Ly: 'lửa, sự sáng rõ và nương tựa',
  Chấn: 'sấm, khởi động và biến chuyển',
  Tốn: 'gió, sự thâm nhập mềm và đều',
  Khảm: 'nước, chiều sâu và tình thế hiểm',
  Cấn: 'núi, sự dừng lại và giới hạn',
  Khôn: 'đất, tiếp nhận và nuôi dưỡng',
};
const positions = [
  'Sơ hào: mầm việc, nền tảng, điều cần chuẩn bị trước khi đi xa.',
  'Hào 2: ở giữa nội quái, thường được gọi là đắc trung; chú ý cách vận hành bên trong.',
  'Hào 3: cuối nội quái, điểm chuyển tiếp từ trong ra ngoài; cần xem sức mình và ranh giới.',
  'Hào 4: bước vào ngoại quái; quan hệ với môi trường và người có vai trò quyết định trở nên rõ hơn.',
  'Hào 5: giữa ngoại quái, thường được gọi là đắc trung; gợi vai trò điều phối và trách nhiệm.',
  'Thượng hào: cuối một quá trình; chú ý giới hạn, thời điểm dừng hoặc chuyển sang giai đoạn mới.',
];
export function HexagramContent({ number, moving = [] }: { number: number; moving?: number[] }) {
  const hex = allHexagrams[number - 1],
    text = classic[number - 1],
    palace = palaceOf(hex.bits);
  return (
    <div className="hex-content">
      <div className="hex-identity">
        <span className="hex-unicode" aria-hidden="true">
          {String.fromCodePoint(0x4dc0 + number - 1)}
        </span>
        <div>
          <h3>
            #{number} · {names[number - 1][0]}
          </h3>
          <p>
            Cung {palace.name} · {palace.element} · {palace.stage}
          </p>
        </div>
      </div>
      <p className="oracle-meaning">{names[number - 1][1]}</p>
      <h4>Tượng quẻ và cách đọc</h4>
      <p>
        Trên là {hex.upper.name}: {images[hex.upper.name]}. Dưới là {hex.lower.name}:{' '}
        {images[hex.lower.name]}. Hạ quái gợi nền tảng hoặc phần bên trong; thượng quái gợi môi
        trường hoặc phần bên ngoài. Đây là gợi ý đọc tượng, không thay thế hào từ và bối cảnh.
      </p>
      <h4>Diễn nghĩa quái từ</h4>
      <p>{meanings[number - 1]}</p>
      <p className="small-note">
        Phần tiếng Việt do app diễn nghĩa, không phải bản dịch học thuật đối chiếu từng chữ. Cổ văn
        bên dưới giữ riêng để tra cứu.
      </p>
      <details className="oracle-disclosure">
        <summary>Quái từ, Thoán truyện & Đại tượng · cổ văn</summary>
        <h4>Quái từ</h4>
        <p lang="zh-Hant" className="classic-text">
          {text.judgement}
        </p>
        <h4>Thoán truyện</h4>
        <p lang="zh-Hant" className="classic-text">
          {text.tuan}
        </p>
        <h4>Đại tượng</h4>
        <p lang="zh-Hant" className="classic-text">
          {text.image}
        </p>
      </details>
      <h4>Sáu hào từ · từ dưới lên</h4>
      <p className="small-note">
        Hào đang động được đánh dấu. Gợi ý vị trí là kiến thức cấu trúc, không phải bản dịch riêng
        của hào từ.
      </p>
      <div className="classical-lines">
        {text.lines.map((line, i) => {
          const yang = !!(hex.bits & (1 << i)),
            correct = yang === (i % 2 === 0),
            paired = !!(hex.bits & (1 << ((i + 3) % 6))) !== yang;
          return (
            <details
              className={moving.includes(i + 1) ? 'active-line' : ''}
              open={moving.includes(i + 1)}
              key={`${number}-${i}`}
            >
              <summary>
                Hào {i + 1} · {yang ? 'Dương' : 'Âm'} {moving.includes(i + 1) ? '· ĐỘNG' : ''}
              </summary>
              <p lang="zh-Hant" className="classic-text">
                {line}
              </p>
              <p>
                {positions[i]} Theo vị trí âm/dương: {correct ? 'đắc vị' : 'chưa đắc vị'}; với hào{' '}
                {((i + 3) % 6) + 1}{' '}
                {paired ? 'khác tính âm/dương (tương ứng về cấu trúc)' : 'cùng tính âm/dương'}. Các
                dấu hiệu này cần đọc cùng nội dung hào, không tự quy thành cát/hung.
              </p>
            </details>
          );
        })}
      </div>
      {text.extra && (
        <p lang="zh-Hant" className="classic-text">
          {text.extra}
        </p>
      )}
      <p className="small-note">
        Nguồn cổ văn:{' '}
        <a href="https://zh.wikisource.org/wiki/周易" target="_blank" rel="noreferrer">
          Chu Dịch
        </a>{' '}
        ·{' '}
        <a
          href="https://github.com/bollwarm/ZHOUYI/blob/master/lib/ZHOUYI.pm"
          target="_blank"
          rel="noreferrer"
        >
          bản chép dùng trong app
        </a>
        . Có dị bản về chữ và dấu câu.
      </p>
    </div>
  );
}
function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('đ', 'd');
}
export function HexagramLibrary() {
  const [query, setQuery] = useState(''),
    [palace, setPalace] = useState('all'),
    [selected, setSelected] = useState(1);
  const filtered = allHexagrams.filter(
    (hex) =>
      (palace === 'all' || palaceOf(hex.bits).name === palace) &&
      normalize(`${hex.number} ${names[hex.number - 1][0]} ${names[hex.number - 1][1]}`).includes(
        normalize(query),
      ),
  );
  return (
    <div className="hex-library">
      <section className="card padded">
        <h2>Thư viện 64 quẻ</h2>
        <p>
          Đủ 64 quái từ, 384 hào từ, Thoán truyện và Đại tượng. Chọn quẻ để đọc diễn nghĩa tiếng
          Việt và cổ văn.
        </p>
        <div className="form-grid">
          <label>
            Tìm số hoặc tên quẻ
            <input
              type="search"
              placeholder="Ví dụ: 64, Vi Te, Khiêm…"
              value={query}
              onInput={(e) => setQuery(e.currentTarget.value)}
            />
          </label>
          <label>
            Lọc theo cung
            <select value={palace} onChange={(e) => setPalace(e.currentTarget.value)}>
              <option value="all">Tất cả tám cung</option>
              {['Càn', 'Đoài', 'Ly', 'Chấn', 'Tốn', 'Khảm', 'Cấn', 'Khôn'].map((name) => (
                <option value={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="small-note">{filtered.length} / 64 quẻ</p>
        <div className="hex-library-grid">
          {filtered.map((hex) => (
            <button
              aria-pressed={selected === hex.number}
              className={selected === hex.number ? 'selected' : ''}
              onClick={() => setSelected(hex.number)}
              key={hex.number}
            >
              <span aria-hidden="true">{String.fromCodePoint(0x4dc0 + hex.number - 1)}</span>
              <span>
                <small>
                  #{hex.number} · Cung {palaceOf(hex.bits).name}
                </small>
                <strong>{names[hex.number - 1][0]}</strong>
              </span>
            </button>
          ))}
        </div>
        {!filtered.length && <p>Không thấy quẻ phù hợp. Thử tên ngắn hoặc bỏ bộ lọc.</p>}
      </section>
      <section className="card padded" aria-live="polite">
        <HexagramContent number={selected} />
      </section>
    </div>
  );
}
export function OracleReference() {
  return (
    <div className="oracle-reference">
      <section className="card padded">
        <h2>Lục thân ảnh hưởng nhau thế nào?</h2>
        <p>
          Cung quẻ gốc là “ta”. Cùng hành là Huynh đệ; ta sinh là Tử tôn; ta khắc là Thê tài; khắc
          ta là Quan quỷ; sinh ta là Phụ mẫu. “Lục thân” là tên hệ thống; bảng này có năm nhóm quan
          hệ, còn bản thân được định vị qua Thế.
        </p>
        <div className="relationship-cycle">
          <strong>Vòng sinh</strong>
          <p>Phụ mẫu → Huynh đệ → Tử tôn → Thê tài → Quan quỷ → Phụ mẫu</p>
          <strong>Vòng khắc</strong>
          <p>Huynh đệ → Thê tài → Phụ mẫu → Tử tôn → Quan quỷ → Huynh đệ</p>
        </div>
        {relatives.map((kind) => (
          <details className="oracle-disclosure">
            <summary>{kind}</summary>
            <p>{relativeMeanings[kind]}</p>
          </details>
        ))}
        <h4>Ví dụ Huynh đệ và Tử tôn</h4>
        <p>
          Huynh đệ sinh Tử tôn; Tử tôn sinh Thê tài và khắc Quan quỷ. Vì vậy Huynh đệ động không chỉ
          mang nghĩa “hao tiền”: còn có thể hỗ trợ đầu ra qua Tử tôn. Muốn luận việc cụ thể phải xét
          hào nào động, hành nào đang vượng, Dụng thần và các điều kiện Không/Phá.
        </p>
        <h4>Dụng thần, Nguyên thần, Kỵ thần, Cừu thần</h4>
        <p>
          Dụng thần là hào đại diện điều đang hỏi. Nguyên thần sinh Dụng thần; Kỵ thần khắc Dụng
          thần; Cừu thần sinh Kỵ thần, đồng thời khắc Nguyên thần. Đây là vai trò tương đối theo câu
          hỏi, không phải nhãn tốt/xấu cố định cho một người.
        </p>
      </section>
      <section className="card padded">
        <h2>Thiên can, địa chi & ngũ hành</h2>
        <p>
          Vòng sinh: Mộc → Hỏa → Thổ → Kim → Thủy → Mộc. Vòng khắc: Mộc → Thổ → Thủy → Hỏa → Kim →
          Mộc.
        </p>
        <div className="reference-chips">
          {stems.map((name, i) => (
            <span>
              {name} · {i % 2 === 0 ? 'Dương' : 'Âm'} {elements[Math.floor(i / 2)]}
            </span>
          ))}
        </div>
        <div className="table-scroll">
          <table className="liuyao-table">
            <thead>
              <tr>
                <th>Địa chi</th>
                <th>Ngũ hành</th>
                <th>Xung</th>
                <th>Hợp</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((name, i) => (
                <tr>
                  <th>{name}</th>
                  <td>{branchElements[i]}</td>
                  <td>{branches[(i + 6) % 12]}</td>
                  <td>{branches[(13 - i) % 12]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="oracle-disclosure">
          <summary>60 hoa giáp · Can Chi</summary>
          <div className="reference-chips">
            {Array.from({ length: 60 }, (_, i) => (
              <span>
                {i + 1}. {stems[i % 10]} {branches[i % 12]}
              </span>
            ))}
          </div>
        </details>
      </section>
      <section className="card padded">
        <h2>Lục thú, Thế–Ứng & Phục thần</h2>
        <p>
          Lục thú (còn gọi Lục thần) từ hào 1 đi lên theo thứ tự: {animals.join(' → ')}. Ngày
          Giáp/Ất khởi Thanh Long; Bính/Đinh khởi Chu Tước; Mậu khởi Câu Trần; Kỷ khởi Đằng Xà;
          Canh/Tân khởi Bạch Hổ; Nhâm/Quý khởi Huyền Vũ.
        </p>
        <p>
          Thế gợi phía người hỏi; Ứng gợi phía đối diện hoặc hoàn cảnh. Cung Bát thuần đặt Thế ở hào
          6; Nhất–Ngũ thế lần lượt ở 1–5; Du hồn ở 4; Quy hồn ở 3. Ứng luôn cách Thế ba hào.
        </p>
        <p>
          Phục thần là Lục thân không xuất hiện trong chính quẻ, lấy từ quẻ bát thuần cùng cung ở
          đúng vị trí. Hào nằm trên được gọi Phi thần. Cần xét Phi sinh Phục, Phi khắc Phục, trạng
          thái phục và thời điểm có thể xuất phục, không coi “ẩn” đồng nghĩa mất hẳn.
        </p>
        <details className="oracle-disclosure">
          <summary>Tuần không, Nguyệt phá, Nhật xung</summary>
          <p>
            Tuần không là hai chi chưa có trong tuần mười ngày của ngày gieo. Nguyệt phá là chi hào
            xung với Nguyệt kiến; Nhật xung là chi hào xung với chi ngày. Nhật xung không tự động
            đồng nghĩa ám động; cần xét vượng suy và phép luận. Vượng/Tướng/Hưu/Tù/Tử ở bảng là quan
            hệ hành với tháng, chưa phải điểm tổng hợp toàn bộ sức hào.
          </p>
        </details>
        <details className="oracle-disclosure">
          <summary>Quy ước và nguồn đối chiếu</summary>
          <p>{conventions}</p>
          <p>
            Nguyệt kiến dùng kinh độ Mặt Trời tính xấp xỉ; sát giờ giao tiết cần đối chiếu lịch tiết
            khí. App chưa tự kết luận trọn hệ tam hợp, tam hình, tiến thoái thần, mộ tuyệt, ám động
            hoặc ứng kỳ.
          </p>
          <p>
            <a target="_blank" rel="noreferrer" href="https://eee-learning.com/book/1665">
              Bảng Nạp giáp trong Bốc Phệ Toàn Thư
            </a>{' '}
            ·{' '}
            <a
              target="_blank"
              rel="noreferrer"
              href="https://www.shidianguji.com/zh/mingju/7623585340431319091"
            >
              Khởi Lục thần quyết
            </a>{' '}
            ·{' '}
            <a target="_blank" rel="noreferrer" href="https://zh.wikisource.org/wiki/周易">
              Chu Dịch: 64 quẻ và Bát cung
            </a>
          </p>
        </details>
      </section>
    </div>
  );
}
