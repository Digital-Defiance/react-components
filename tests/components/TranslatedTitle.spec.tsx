import { describe, it, expect, afterEach } from '@jest/globals';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { TranslatedTitle } from '../../src/components/TranslatedTitle';
import { I18nProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { SuiteCoreStringKey, SuiteCoreComponentId } from '@digitaldefiance/suite-core-lib';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engine = I18nEngine.getInstance('default');
  return <I18nProvider i18nEngine={engine}>{children}</I18nProvider>;
};

describe('TranslatedTitle', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  it('renders nothing', () => {
    const { container } = render(
      <TestWrapper>
        <TranslatedTitle<SuiteCoreStringKey>
          componentId={SuiteCoreComponentId}
          stringKey={SuiteCoreStringKey.Common_Dashboard}
        />
      </TestWrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  it('sets document title', async () => {
    render(
      <TestWrapper>
        <TranslatedTitle<SuiteCoreStringKey>
          componentId={SuiteCoreComponentId}
          stringKey={SuiteCoreStringKey.Common_Dashboard}
        />
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(document.title).not.toBe(originalTitle);
        expect(document.title.length).toBeGreaterThan(0);
      },
      { timeout: 1000 }
    );
  });
});
