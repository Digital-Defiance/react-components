/**
 * Property-based tests for client-side mnemonic Yup validation matching MnemonicRegex.
 *
 * Feature: user-provided-mnemonic, Property 8: Client-side mnemonic Yup validation matches MnemonicRegex
 *
 * The RegisterForm uses a Yup validation schema for the mnemonic field that:
 * - Accepts empty/undefined values (field is optional)
 * - Accepts non-empty values matching Constants.MnemonicRegex
 * - Rejects non-empty values not matching Constants.MnemonicRegex
 *
 * We recreate the Yup schema in isolation to test the validation logic without
 * rendering the full RegisterForm component.
 *
 * **Validates: Requirements 5.3**
 */

import * as fc from 'fast-check';
import * as Yup from 'yup';
import { Constants } from '@digitaldefiance/suite-core-lib';

/**
 * Recreate the mnemonic Yup validation schema from RegisterForm.
 * This mirrors the exact logic used in the component:
 *
 * mnemonic: Yup.string()
 *   .optional()
 *   .test('mnemonic-format', errorMessage, (value) => {
 *     if (!value || value.trim() === '') return true;
 *     return Constants.MnemonicRegex.test(value.trim());
 *   })
 */
const mnemonicSchema = Yup.object({
  mnemonic: Yup.string()
    .optional()
    .test(
      'mnemonic-format',
      'Invalid mnemonic format',
      (value) => {
        if (!value || value.trim() === '') return true;
        return Constants.MnemonicRegex.test(value.trim());
      },
    ),
});

/** Valid BIP39 word counts */
const VALID_WORD_COUNTS = [12, 15, 18, 21, 24] as const;

/**
 * Arbitrary that generates a single word-like token (\w-compatible characters).
 */
const wordArb = fc
  .array(
    fc.oneof(
      fc.integer({ min: 0x61, max: 0x7a }).map((c) => String.fromCharCode(c)), // a-z
      fc.integer({ min: 0x41, max: 0x5a }).map((c) => String.fromCharCode(c)), // A-Z
      fc.integer({ min: 0x30, max: 0x39 }).map((c) => String.fromCharCode(c)), // 0-9
      fc.constant('_'),
    ),
    { minLength: 1, maxLength: 8 },
  )
  .map((chars) => chars.join(''));

/**
 * Arbitrary that generates a mnemonic-like phrase with a specific word count.
 */
function mnemonicWithWordCount(count: number): fc.Arbitrary<string> {
  return fc
    .array(wordArb, { minLength: count, maxLength: count })
    .map((words) => words.join(' '));
}

/**
 * Arbitrary that generates a valid-format mnemonic (12, 15, 18, 21, or 24 words).
 */
const validMnemonicArb = fc.oneof(
  ...VALID_WORD_COUNTS.map((n) => mnemonicWithWordCount(n)),
);

/**
 * Arbitrary that generates an invalid word count (not 12, 15, 18, 21, or 24).
 */
const invalidWordCountArb = fc
  .integer({ min: 1, max: 30 })
  .filter(
    (n) =>
      !VALID_WORD_COUNTS.includes(n as (typeof VALID_WORD_COUNTS)[number]),
  );

/**
 * Arbitrary that generates a mnemonic-like phrase with an invalid word count.
 */
const invalidWordCountMnemonicArb = invalidWordCountArb.chain((count) =>
  mnemonicWithWordCount(count),
);

describe('Feature: user-provided-mnemonic, Property 8: Client-side mnemonic Yup validation matches MnemonicRegex', () => {
  /**
   * Property 8a: Yup schema accepts valid mnemonic phrases (12/15/18/21/24 words).
   * For any phrase composed of \w+ tokens separated by single spaces with a valid
   * word count, the Yup validation should pass.
   *
   * **Validates: Requirements 5.3**
   */
  it('should accept mnemonic phrases with valid word counts', async () => {
    await fc.assert(
      fc.asyncProperty(validMnemonicArb, async (mnemonic) => {
        const result = await mnemonicSchema.isValid({ mnemonic });
        expect(result).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property 8b: Yup schema rejects mnemonic phrases with invalid word counts.
   * For any phrase with a word count not in {12, 15, 18, 21, 24}, the Yup
   * validation should fail.
   *
   * **Validates: Requirements 5.3**
   */
  it('should reject mnemonic phrases with invalid word counts', async () => {
    await fc.assert(
      fc.asyncProperty(invalidWordCountMnemonicArb, async (mnemonic) => {
        const result = await mnemonicSchema.isValid({ mnemonic });
        expect(result).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property 8c: Yup schema accepts empty and undefined mnemonic values.
   * The mnemonic field is optional, so empty strings and undefined should pass.
   *
   * **Validates: Requirements 5.3**
   */
  it('should accept empty and undefined mnemonic values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t'),
          fc.constant('\n'),
        ),
        async (mnemonic) => {
          const result = await mnemonicSchema.isValid({ mnemonic });
          expect(result).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 8d: Yup validation result matches direct MnemonicRegex test.
   * For any non-empty string, the Yup schema should accept it if and only if
   * Constants.MnemonicRegex matches the trimmed value.
   *
   * **Validates: Requirements 5.3**
   */
  it('should match MnemonicRegex result for arbitrary non-empty strings', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }).filter(
          (s) => s.trim().length > 0,
        ),
        async (value) => {
          const regexResult = Constants.MnemonicRegex.test(value.trim());
          const yupResult = await mnemonicSchema.isValid({ mnemonic: value });
          expect(yupResult).toBe(regexResult);
        },
      ),
      { numRuns: 100 },
    );
  });
});
