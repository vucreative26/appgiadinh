// Local UI unlock, like the device PIN. It does not replace Firebase authentication/Rules.
export interface BiometricRecord {
  version: 1;
  id: string;
  publicKey: string;
  userId: string;
  pinBinding: string;
  origin: string;
}
const buffer = (bytes: Uint8Array) => new Uint8Array(bytes).buffer;
export function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}
export function decode64(value: string) {
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (c) =>
    c.charCodeAt(0),
  );
}
const equal = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
export function readBiometric(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  pinBinding: string,
  origin: string,
): BiometricRecord | null {
  try {
    const record = JSON.parse(storage.getItem(key) || 'null');
    const encoded = (value: unknown, max: number) =>
      typeof value === 'string' &&
      value.length > 0 &&
      value.length <= max &&
      /^[A-Za-z0-9_-]+$/.test(value);
    if (
      record?.version === 1 &&
      record.pinBinding === pinBinding &&
      record.origin === origin &&
      encoded(record.id, 2048) &&
      encoded(record.publicKey, 512) &&
      encoded(record.userId, 128)
    )
      return record;
  } catch {
    /* PIN remains available if the local association cannot be read. */
  }
  return null;
}
export async function biometricAvailable() {
  try {
    return (
      window.isSecureContext &&
      typeof PublicKeyCredential !== 'undefined' &&
      !!navigator.credentials &&
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function' &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}
export function biometricError(error: unknown) {
  const name = (error as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'AbortError')
    return 'Chưa xác nhận bằng khóa máy. Bạn có thể thử lại hoặc nhập PIN.';
  if (name === 'NotSupportedError')
    return 'Trình duyệt này chưa hỗ trợ cách mở khóa này. Hãy dùng Safari bản mới hoặc tiếp tục bằng PIN.';
  if (name === 'SecurityError')
    return 'Mở app bằng địa chỉ HTTPS chính thức rồi thiết lập lại Face ID / Touch ID.';
  return error instanceof Error
    ? error.message
    : 'Chưa mở khóa được bằng thiết bị. Hãy dùng PIN rồi thử thiết lập lại.';
}
async function checkClient(
  clientDataJSON: ArrayBuffer,
  challenge: Uint8Array,
  type: string,
  origin: string,
) {
  const client = JSON.parse(new TextDecoder().decode(clientDataJSON));
  if (
    client.type !== type ||
    client.origin !== origin ||
    client.challenge !== base64url(challenge) ||
    client.crossOrigin === true ||
    client.topOrigin !== undefined
  )
    throw Error('Phản hồi mở khóa không khớp yêu cầu của app.');
}
async function checkAuthenticator(authData: ArrayBuffer, rpId: string) {
  const bytes = new Uint8Array(authData);
  const rpHash = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rpId)),
  );
  if (bytes.length < 37 || !equal(bytes.slice(0, 32), rpHash) || (bytes[32] & 5) !== 5)
    throw Error('Máy chưa xác nhận đầy đủ danh tính người dùng.');
}
// WebAuthn ES256 is DER encoded; Web Crypto ECDSA verification expects r || s (64 bytes).
export function derToRaw(signature: Uint8Array) {
  if (signature[0] !== 0x30 || signature.length < 8 || signature[1] !== signature.length - 2)
    throw Error('Chữ ký thiết bị không hợp lệ.');
  let at = 2;
  function integer() {
    if (signature[at++] !== 2) throw Error('Chữ ký thiết bị không hợp lệ.');
    const length = signature[at++];
    if (length < 1 || length > 33 || at + length > signature.length)
      throw Error('Chữ ký thiết bị không hợp lệ.');
    let bytes = signature.slice(at, at + length);
    at += length;
    if (bytes[0] & 0x80 || (bytes.length > 1 && bytes[0] === 0 && !(bytes[1] & 0x80)))
      throw Error('Chữ ký thiết bị không hợp lệ.');
    if (bytes[0] === 0) bytes = bytes.slice(1);
    if (bytes.length > 32) throw Error('Chữ ký thiết bị không hợp lệ.');
    const value = new Uint8Array(32);
    value.set(bytes, 32 - bytes.length);
    return value;
  }
  const r = integer(),
    s = integer();
  if (at !== signature.length) throw Error('Chữ ký thiết bị không hợp lệ.');
  const raw = new Uint8Array(64);
  raw.set(r);
  raw.set(s, 32);
  return raw;
}
export async function verifyAssertion(
  record: BiometricRecord,
  credential: PublicKeyCredential,
  challenge: Uint8Array,
  origin: string,
  rpId: string,
) {
  if (
    record.origin !== origin ||
    credential.type !== 'public-key' ||
    !equal(new Uint8Array(credential.rawId), decode64(record.id))
  )
    throw Error('Khóa máy không khớp bản cài này.');
  const response = credential.response as AuthenticatorAssertionResponse;
  await checkClient(response.clientDataJSON, challenge, 'webauthn.get', origin);
  await checkAuthenticator(response.authenticatorData, rpId);
  if (response.userHandle && !equal(new Uint8Array(response.userHandle), decode64(record.userId)))
    throw Error('Khóa máy thuộc hồ sơ khác.');
  const clientHash = new Uint8Array(await crypto.subtle.digest('SHA-256', response.clientDataJSON));
  const authData = new Uint8Array(response.authenticatorData),
    signed = new Uint8Array(authData.length + clientHash.length);
  signed.set(authData);
  signed.set(clientHash, authData.length);
  const key = await crypto.subtle.importKey(
    'spki',
    buffer(decode64(record.publicKey)),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );
  if (
    !(await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      buffer(derToRaw(new Uint8Array(response.signature))),
      buffer(signed),
    ))
  )
    throw Error('Chưa xác minh được chữ ký của khóa máy.');
}
export async function enrollBiometric(name: string, pinBinding: string, signal?: AbortSignal) {
  const challenge = crypto.getRandomValues(new Uint8Array(32)),
    userId = crypto.getRandomValues(new Uint8Array(32));
  // Invoke credentials.create before the first await to preserve Safari's user gesture.
  const credential = (await navigator.credentials.create({
    signal,
    publicKey: {
      challenge: buffer(challenge),
      rp: { id: location.hostname, name: 'Nhà mình' },
      user: { id: buffer(userId), name: name || 'Nhà mình', displayName: name || 'Nhà mình' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'discouraged',
        userVerification: 'required',
      },
      attestation: 'none',
      timeout: 60000,
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw Error('Chưa tạo được khóa mở app.');
  const response = credential.response as AuthenticatorAttestationResponse;
  if (
    typeof response.getPublicKeyAlgorithm !== 'function' ||
    typeof response.getPublicKey !== 'function' ||
    typeof response.getAuthenticatorData !== 'function'
  )
    throw new DOMException('Không đọc được khóa công khai.', 'NotSupportedError');
  const key = response.getPublicKey();
  if (!key || response.getPublicKeyAlgorithm() !== -7)
    throw new DOMException('Không có khóa ES256.', 'NotSupportedError');
  await checkClient(response.clientDataJSON, challenge, 'webauthn.create', location.origin);
  const authData = response.getAuthenticatorData();
  await checkAuthenticator(authData, location.hostname);
  const data = new Uint8Array(authData),
    id = new Uint8Array(credential.rawId);
  if (
    !(data[32] & 0x40) ||
    data.length < 55 ||
    !equal(data.slice(55, 55 + ((data[53] << 8) | data[54])), id)
  )
    throw Error('Đăng ký khóa máy không hợp lệ.');
  await crypto.subtle.importKey('spki', key, { name: 'ECDSA', namedCurve: 'P-256' }, false, [
    'verify',
  ]);
  return {
    version: 1,
    id: base64url(id),
    publicKey: base64url(new Uint8Array(key)),
    userId: base64url(userId),
    pinBinding,
    origin: location.origin,
  } satisfies BiometricRecord;
}
export async function unlockBiometric(record: BiometricRecord, signal?: AbortSignal) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credential = (await navigator.credentials.get({
    signal,
    publicKey: {
      challenge: buffer(challenge),
      rpId: location.hostname,
      allowCredentials: [{ id: buffer(decode64(record.id)), type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw Error('Chưa xác nhận mở khóa.');
  await verifyAssertion(record, credential, challenge, location.origin, location.hostname);
}
