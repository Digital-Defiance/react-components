import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiAccess } from '../src/components/ApiAccess';
import { I18nProvider } from '../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

describe('ApiAccess', () => {
  it('renders with translated labels', () => {
    renderWithI18n(<ApiAccess token="test-token" />);
    
    expect(screen.getByText(/your access token/i)).toBeInTheDocument();
    expect(screen.getByText(/copy to clipboard/i)).toBeInTheDocument();
  });

  it('displays token when provided', () => {
    renderWithI18n(<ApiAccess token="test-token-123" />);
    
    expect(screen.getByDisplayValue('test-token-123')).toBeInTheDocument();
  });

  it('displays not available message when token is null', () => {
    renderWithI18n(<ApiAccess token={null} />);
    
    expect(screen.getByText(/not available/i)).toBeInTheDocument();
  });

  it('shows success dialog after copy', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    renderWithI18n(<ApiAccess token="test-token" />);
    
    fireEvent.click(screen.getByText(/copy to clipboard/i));
    
    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });

  it('uses custom labels when provided', () => {
    renderWithI18n(
      <ApiAccess 
        token="test" 
        labels={{ title: 'Custom API' }}
      />
    );
    
    expect(screen.getByText('Custom API')).toBeInTheDocument();
  });
});
