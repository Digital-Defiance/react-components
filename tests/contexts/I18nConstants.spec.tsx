/**
 * Integration test: verifies that constants registered via createI18nSetup
 * flow through to the I18nProvider's translation functions correctly.
 *
 * Simulates a third-party app that:
 * 1. Uses createSuiteCoreComponentPackage() as a library component
 * 2. Overrides Site/SiteTagline/SiteDescription with app-specific values
 * 3. Renders translations via I18nProvider's t() and tBranded()
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import {
  createI18nSetup,
  I18nEngine,
  LanguageCodes,
} from '@digitaldefiance/i18n-lib';
import {
  createSuiteCoreComponentPackage,
  SuiteCoreStringKey,
} from '@digitaldefiance/suite-core-lib';
import { I18nProvider, useI18n } from '../../src/contexts/I18nProvider';

describe('I18nProvider Constants Integration', () => {
  let engine: I18nEngine;

  beforeEach(() => {
    I18nEngine.resetAll();
  });

  afterEach(() => {
    I18nEngine.resetAll();
  });

  /**
   * Helper: creates a setup mimicking a third-party app that overrides
   * SuiteCore's default constants with its own values.
   */
  function createAppSetup(appConstants: Record<string, unknown>) {
    // Minimal branded enum for the "app" component
    // We only need SuiteCore's strings, so the app component is a stub
    const setup = createI18nSetup({
      componentId: 'test-app',
      stringKeyEnum: SuiteCoreStringKey,
      strings: {},
      constants: appConstants,
      libraryComponents: [createSuiteCoreComponentPackage()],
    });
    engine = setup.engine as I18nEngine;
    return setup;
  }

  function createWrapper(i18nEngine: I18nEngine) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <I18nProvider i18nEngine={i18nEngine}>{children}</I18nProvider>
      );
    };
  }

  describe('default SuiteCore constants', () => {
    it('should resolve {Site} to the default value when no app override', () => {
      const setup = createI18nSetup({
        componentId: 'test-app',
        stringKeyEnum: SuiteCoreStringKey,
        strings: {},
        libraryComponents: [createSuiteCoreComponentPackage()],
      });
      engine = setup.engine as I18nEngine;

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      // Common_SiteTemplate is '{Site}' — should resolve to CORE.Site default
      const site = result.current.tBranded(
        SuiteCoreStringKey.Common_SiteTemplate,
      );
      expect(site).toBe('New Site');
    });

    it('should resolve {SiteTagline} to the default value', () => {
      const setup = createI18nSetup({
        componentId: 'test-app',
        stringKeyEnum: SuiteCoreStringKey,
        strings: {},
        libraryComponents: [createSuiteCoreComponentPackage()],
      });
      engine = setup.engine as I18nEngine;

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      const tagline = result.current.tBranded(
        SuiteCoreStringKey.Common_SiteTaglineTemplate,
      );
      expect(tagline).toBe('New Site Tagline');
    });

    it('should resolve {SiteDescription} to the default value', () => {
      const setup = createI18nSetup({
        componentId: 'test-app',
        stringKeyEnum: SuiteCoreStringKey,
        strings: {},
        libraryComponents: [createSuiteCoreComponentPackage()],
      });
      engine = setup.engine as I18nEngine;

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      const desc = result.current.tBranded(
        SuiteCoreStringKey.Common_SiteDescriptionTemplate,
      );
      expect(desc).toBe('Description of the new site');
    });
  });

  describe('app-overridden constants', () => {
    it('should resolve {Site} to the app override value', () => {
      createAppSetup({ Site: 'Acme Corp' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      const site = result.current.tBranded(
        SuiteCoreStringKey.Common_SiteTemplate,
      );
      expect(site).toBe('Acme Corp');
    });

    it('should resolve {SiteTagline} to the app override value', () => {
      createAppSetup({ SiteTagline: 'Building the future' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      const tagline = result.current.tBranded(
        SuiteCoreStringKey.Common_SiteTaglineTemplate,
      );
      expect(tagline).toBe('Building the future');
    });

    it('should resolve {SiteDescription} to the app override value', () => {
      createAppSetup({ SiteDescription: 'A platform for innovation' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      const desc = result.current.tBranded(
        SuiteCoreStringKey.Common_SiteDescriptionTemplate,
      );
      expect(desc).toBe('A platform for innovation');
    });

    it('should override all constants simultaneously', () => {
      createAppSetup({
        Site: 'TestSite',
        SiteTagline: 'Test Tagline',
        SiteDescription: 'Test Description',
        SiteEmailDomain: 'test.example.com',
        SiteHostname: 'test.example.com',
        EmailTokenResendIntervalMinutes: 10,
      });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      expect(
        result.current.tBranded(SuiteCoreStringKey.Common_SiteTemplate),
      ).toBe('TestSite');
      expect(
        result.current.tBranded(SuiteCoreStringKey.Common_SiteTaglineTemplate),
      ).toBe('Test Tagline');
      expect(
        result.current.tBranded(
          SuiteCoreStringKey.Common_SiteDescriptionTemplate,
        ),
      ).toBe('Test Description');
    });
  });

  describe('constants in compound templates via t()', () => {
    it('should resolve {Site} in email subject templates', () => {
      createAppSetup({ Site: 'Acme Corp' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      // Email_ConfirmationSubjectTemplate is '{Site} email confirmation'
      const subject = result.current.tBranded(
        SuiteCoreStringKey.Email_ConfirmationSubjectTemplate,
      );
      expect(subject).toBe('Acme Corp email confirmation');
    });

    it('should resolve {Site} in login request subject', () => {
      createAppSetup({ Site: 'Acme Corp' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      const subject = result.current.tBranded(
        SuiteCoreStringKey.Email_LoginRequestSubjectTemplate,
      );
      expect(subject).toBe('Acme Corp login request');
    });

    it('should resolve {Site} in password reset subject', () => {
      createAppSetup({ Site: 'Acme Corp' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      const subject = result.current.tBranded(
        SuiteCoreStringKey.Email_ResetPasswordSubjectTemplate,
      );
      expect(subject).toBe('Acme Corp password reset');
    });

    it('should resolve {EmailTokenResendIntervalMinutes} in link expiry', () => {
      createAppSetup({ EmailTokenResendIntervalMinutes: 15 });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      const text = result.current.tBranded(
        SuiteCoreStringKey.Email_LinkExpiresInTemplate,
      );
      expect(text).toBe('Link expires in 15 minutes.');
    });
  });

  describe('constants with t() template syntax', () => {
    it('should resolve constants in {{component.key}} templates', () => {
      createAppSetup({ Site: 'Acme Corp' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      // t() processes {{SuiteCoreStringKey.Common_SiteTemplate}} patterns
      const rendered = result.current.t(
        'Welcome to {{SuiteCoreStringKey.common_siteTemplate}}',
      );
      expect(rendered).toBe('Welcome to Acme Corp');
    });

    it('should resolve {variable} constants in t() directly', () => {
      createAppSetup({ Site: 'Acme Corp', SiteTagline: 'We build things' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      const rendered = result.current.t('{Site} - {SiteTagline}');
      expect(rendered).toBe('Acme Corp - We build things');
    });
  });

  describe('language switching with constants', () => {
    it('should resolve constants in French translations', () => {
      createAppSetup({ Site: 'Acme Corp' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      // French: '{Site} confirmation d\'e-mail'
      const subject = result.current.tBranded(
        SuiteCoreStringKey.Email_ConfirmationSubjectTemplate,
        undefined,
        LanguageCodes.FR,
      );
      expect(subject).toContain('Acme Corp');
      expect(subject).toContain('confirmation');
    });

    it('should resolve constants in German translations', () => {
      createAppSetup({ Site: 'Acme Corp' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      // German: '{Site} E-Mail-Bestätigung'
      const subject = result.current.tBranded(
        SuiteCoreStringKey.Email_ConfirmationSubjectTemplate,
        undefined,
        LanguageCodes.DE,
      );
      expect(subject).toContain('Acme Corp');
      expect(subject).toContain('E-Mail');
    });

    it('should resolve constants in Spanish translations', () => {
      createAppSetup({ Site: 'Acme Corp' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      const subject = result.current.tBranded(
        SuiteCoreStringKey.Email_ConfirmationSubjectTemplate,
        undefined,
        LanguageCodes.ES,
      );
      expect(subject).toContain('Acme Corp');
    });

    it('should resolve constants in Japanese translations', () => {
      createAppSetup({ Site: 'Acme Corp' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      // Japanese: '{Site}メール確認'
      const subject = result.current.tBranded(
        SuiteCoreStringKey.Email_ConfirmationSubjectTemplate,
        undefined,
        LanguageCodes.JA,
      );
      expect(subject).toContain('Acme Corp');
    });
  });

  describe('partial overrides', () => {
    it('should override only specified constants, keeping library defaults', () => {
      // Only override Site, leave SiteTagline as default
      createAppSetup({ Site: 'Acme Corp' });

      const { result } = renderHook(() => useI18n(), {
        wrapper: createWrapper(engine),
      });

      expect(
        result.current.tBranded(SuiteCoreStringKey.Common_SiteTemplate),
      ).toBe('Acme Corp');
      // SiteTagline should still be the SuiteCore default
      expect(
        result.current.tBranded(SuiteCoreStringKey.Common_SiteTaglineTemplate),
      ).toBe('New Site Tagline');
    });
  });

  describe('registry ownership', () => {
    it('should report app as owner of overridden constants', () => {
      createAppSetup({ Site: 'Acme Corp' });

      // The app component ('test-app') should own 'Site' after updateConstants
      const owner = engine.resolveConstantOwner('Site');
      expect(owner).toBe('test-app');
    });

    it('should report library as owner of non-overridden constants', () => {
      createAppSetup({ Site: 'Acme Corp' });

      // SiteEmailDomain was not overridden, so suite-core should own it
      const suiteCoreComponentId = createSuiteCoreComponentPackage().config.id;
      const owner = engine.resolveConstantOwner('SiteEmailDomain');
      expect(owner).toBe(suiteCoreComponentId);
    });
  });
});
