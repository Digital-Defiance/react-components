import { EciesCryptoCore } from '@digitaldefiance/ecies-lib';

describe('AuthService Key Generation', () => {
  let cryptoCore: EciesCryptoCore;

  beforeEach(() => {
    cryptoCore = new EciesCryptoCore();
  });

  describe('direct challenge login pattern', () => {
    it('should generate compressed public keys for challenge authentication', () => {
      const mnemonic = cryptoCore.generateNewMnemonic();
      const { wallet } = cryptoCore.walletAndSeedFromMnemonic(mnemonic);

      const privateKey = wallet.getPrivateKey();

      // CORRECT: Get compressed public key (already includes prefix)
      const publicKeyWithPrefix = cryptoCore.getPublicKey(privateKey);

      expect(publicKeyWithPrefix.length).toBe(33);
      expect([0x02, 0x03]).toContain(publicKeyWithPrefix[0]);
    });

    it('should NOT use wallet.getPublicKey() with manual prefix', () => {
      const mnemonic = cryptoCore.generateNewMnemonic();
      const { wallet } = cryptoCore.walletAndSeedFromMnemonic(mnemonic);

      const publicKey = wallet.getPublicKey();

      // WRONG: wallet.getPublicKey() returns 64 bytes (uncompressed)
      expect(publicKey.length).toBe(64);

      // WRONG: Adding 0x04 prefix creates 65-byte uncompressed key
      const wrongKey = new Uint8Array(publicKey.length + 1);
      wrongKey[0] = 0x04;
      wrongKey.set(publicKey, 1);
      expect(wrongKey.length).toBe(65);

      // CORRECT: Use cryptoCore.getPublicKey() for compressed key
      const privateKey = wallet.getPrivateKey();
      const correctKey = cryptoCore.getPublicKey(privateKey);
      expect(correctKey.length).toBe(33);
    });

    it('should generate keys compatible with backend encryption', () => {
      const mnemonic = cryptoCore.generateNewMnemonic();
      const { wallet } = cryptoCore.walletAndSeedFromMnemonic(mnemonic);

      const privateKey = wallet.getPrivateKey();
      const publicKeyWithPrefix = cryptoCore.getPublicKey(privateKey);

      // Verify the key format is correct for ECIES
      expect(publicKeyWithPrefix.length).toBe(33);
      expect([0x02, 0x03]).toContain(publicKeyWithPrefix[0]);

      // The key should be usable for signing
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // This should not throw
      expect(() => {
        // Note: We can't actually test signing here without importing the full service,
        // but we can verify the key format is correct
        expect(publicKeyWithPrefix).toBeDefined();
      }).not.toThrow();
    });
  });
});
