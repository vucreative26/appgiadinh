import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export function withDeviceUIDs(rules, uids) {
  if (
    !Array.isArray(uids) ||
    uids.length < 1 ||
    uids.length > 10 ||
    uids.some(
      (uid) =>
        typeof uid !== 'string' ||
        !/^[A-Za-z0-9_-]{20,128}$/.test(uid) ||
        uid.startsWith('UID_THIET_BI_'),
    )
  )
    throw Error('Cung cấp 1–10 UID thật được Copy từ app, không phải PIN.');
  if (new Set(uids).size !== uids.length) throw Error('UID thiết bị bị trùng.');
  const pattern = /request\.auth\.uid in \[[^\]]*\]/;
  if (!pattern.test(rules)) throw Error('Không tìm thấy danh sách UID trong firestore.rules.');
  return rules.replace(
    pattern,
    `request.auth.uid in [${uids.map((uid) => JSON.stringify(uid)).join(', ')}]`,
  );
}
async function main() {
  const path = 'firestore.rules',
    rules = await readFile(path, 'utf8');
  const result = withDeviceUIDs(rules, process.argv.slice(2));
  await writeFile(path, result);
  console.log(
    'Đã cập nhật firestore.rules ở máy này. Sao chép toàn bộ Rules vào Firebase Console → Firestore → Rules → Publish. Chưa thay đổi quyền trên Firebase.',
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
