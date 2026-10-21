import { expect, it, vi, afterEach } from 'vitest';
import {
  enrollBiometric,
  unlockBiometric,
  base64url,
  derToRaw,
  readBiometric,
  verifyAssertion,
  type BiometricRecord,
} from './biometric';
const origin = 'https://vucreative26.github.io',
  rpId = 'vucreative26.github.io';
const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));
function toDer(raw: Uint8Array) {
  const integer = (value: Uint8Array) => {
    let i = 0;
    while (i < value.length - 1 && value[i] === 0) i++;
    const bytes = Array.from(value.slice(i));
    if (bytes[0] & 128) bytes.unshift(0);
    return [2, bytes.length, ...bytes];
  };
  const bytes = [...integer(raw.slice(0, 32)), ...integer(raw.slice(32))];
  return new Uint8Array([48, bytes.length, ...bytes]);
}
async function fixture() {
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ]);
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const id = new Uint8Array([1, 2, 3]),
    userId = new Uint8Array([7, 8, 9]);
  const record: BiometricRecord = {
    version: 1,
    id: base64url(id),
    userId: base64url(userId),
    pinBinding: 'hash',
    origin,
    publicKey: base64url(new Uint8Array(await crypto.subtle.exportKey('spki', keys.publicKey))),
  };
  async function credential(clientPatch = {}, flags = 5, host = rpId) {
    const clientDataJSON = encode({
      type: 'webauthn.get',
      origin,
      challenge: base64url(challenge),
      crossOrigin: false,
      ...clientPatch,
    });
    const authenticatorData = new Uint8Array(37);
    authenticatorData.set(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(host))),
    );
    authenticatorData[32] = flags;
    const signed = new Uint8Array(69);
    signed.set(authenticatorData);
    signed.set(new Uint8Array(await crypto.subtle.digest('SHA-256', clientDataJSON)), 37);
    const signature = toDer(
      new Uint8Array(
        await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, signed),
      ),
    );
    return {
      type: 'public-key',
      rawId: id.buffer,
      response: {
        clientDataJSON: clientDataJSON.buffer,
        authenticatorData: authenticatorData.buffer,
        signature: signature.buffer,
        userHandle: userId.buffer,
      },
    } as unknown as PublicKeyCredential;
  }
  return { record, challenge, credential };
}
it('accepts a real P-256 signature and rejects reuse with another challenge', async () => {
  const f = await fixture(),
    c = await f.credential();
  await expect(verifyAssertion(f.record, c, f.challenge, origin, rpId)).resolves.toBeUndefined();
  await expect(verifyAssertion(f.record, c, new Uint8Array(32), origin, rpId)).rejects.toThrow();
});
it('rejects wrong origin, cross-origin requests, missing user verification and wrong relying party', async () => {
  const f = await fixture();
  for (const c of [
    await f.credential({ origin: 'https://other.example' }),
    await f.credential({ crossOrigin: true }),
    await f.credential({}, 1),
    await f.credential({}, 5, 'other.example'),
  ])
    await expect(verifyAssertion(f.record, c, f.challenge, origin, rpId)).rejects.toThrow();
});
it('rejects a different credential, user, public key, or damaged signature', async () => {
  const f = await fixture();
  const c = await f.credential();
  await expect(
    verifyAssertion(
      { ...f.record, id: base64url(new Uint8Array([9])) },
      c,
      f.challenge,
      origin,
      rpId,
    ),
  ).rejects.toThrow();
  await expect(
    verifyAssertion(
      { ...f.record, userId: base64url(new Uint8Array([9])) },
      c,
      f.challenge,
      origin,
      rpId,
    ),
  ).rejects.toThrow();
  const other = await fixture();
  await expect(
    verifyAssertion(
      { ...f.record, publicKey: other.record.publicKey },
      c,
      f.challenge,
      origin,
      rpId,
    ),
  ).rejects.toThrow();
  const sig = new Uint8Array((c.response as AuthenticatorAssertionResponse).signature);
  sig[sig.length - 1] ^= 1;
  await expect(verifyAssertion(f.record, c, f.challenge, origin, rpId)).rejects.toThrow();
});
it('rejects malformed DER encodings', () => {
  for (const bytes of [
    [],
    [48, 0],
    [48, 6, 2, 1, 128, 2, 1, 1],
    [48, 7, 2, 2, 0, 1, 2, 1, 1],
    [48, 6, 2, 1, 1, 2, 1, 1, 0],
  ])
    expect(() => derToRaw(new Uint8Array(bytes))).toThrow();
});
it('local association is invalid after PIN/origin changes, corrupt storage, or denied storage', async () => {
  const { record } = await fixture(),
    storage = { getItem: () => JSON.stringify(record) };
  expect(readBiometric(storage, 'key', 'hash', origin)).toEqual(record);
  expect(readBiometric(storage, 'key', 'new-hash', origin)).toBeNull();
  expect(readBiometric(storage, 'key', 'hash', 'https://other.example')).toBeNull();
  expect(readBiometric({ getItem: () => '{bad' }, 'key', 'hash', origin)).toBeNull();
  expect(
    readBiometric(
      {
        getItem: () => {
          throw Error();
        },
      },
      'key',
      'hash',
      origin,
    ),
  ).toBeNull();
});

afterEach(() => vi.unstubAllGlobals());
it('invokes the OS prompt inside the click and propagates cancellation without unlocking', async () => {
  const { record } = await fixture();
  const controller = new AbortController();
  const get = vi.fn().mockRejectedValue(new DOMException('Cancelled', 'NotAllowedError'));
  const create = vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError'));
  vi.stubGlobal('location', { origin, hostname: rpId });
  vi.stubGlobal('navigator', { credentials: { get, create } });
  const opening = unlockBiometric(record, controller.signal);
  expect(get).toHaveBeenCalledTimes(1);
  expect(get.mock.calls[0][0].signal).toBe(controller.signal);
  expect(get.mock.calls[0][0].publicKey.userVerification).toBe('required');
  await expect(opening).rejects.toMatchObject({ name: 'NotAllowedError' });
  const enrolling = enrollBiometric('Test', 'hash', controller.signal);
  expect(create).toHaveBeenCalledTimes(1);
  expect(create.mock.calls[0][0].signal).toBe(controller.signal);
  expect(create.mock.calls[0][0].publicKey.authenticatorSelection).toMatchObject({
    authenticatorAttachment: 'platform',
    userVerification: 'required',
  });
  await expect(enrolling).rejects.toMatchObject({ name: 'AbortError' });
});
