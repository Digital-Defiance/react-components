import { render, screen, waitFor } from '@testing-library/react';
import { VerifyEmailPage } from '../src/components/VerifyEmailPage';
import { I18nProvider } from '../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const mockOnVerify = jest.fn();

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    mockOnVerify.mockClear();
  });

  it('renders with translated labels', async () => {
    mockOnVerify.mockResolvedValue({ success: true });
    renderWithI18n(<VerifyEmailPage token="test-token" onVerify={mockOnVerify} />);
    
    await waitFor(() => {
      expect(screen.getByText(/email verification/i)).toBeInTheDocument();
    });
  });

  it('shows error when no token provided', async () => {
    renderWithI18n(<VerifyEmailPage token={null} onVerify={mockOnVerify} />);
    
    await waitFor(() => {
      expect(screen.getByText(/no.*token/i)).toBeInTheDocument();
    });
  });

  it('shows success message on successful verification', async () => {
    mockOnVerify.mockResolvedValue({ success: true });
    renderWithI18n(<VerifyEmailPage token="test-token" onVerify={mockOnVerify} />);
    
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failed verification', async () => {
    mockOnVerify.mockResolvedValue({ success: false });
    renderWithI18n(<VerifyEmailPage token="test-token" onVerify={mockOnVerify} />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  it('uses custom labels when provided', async () => {
    mockOnVerify.mockResolvedValue({ success: true });
    renderWithI18n(
      <VerifyEmailPage 
        token="test-token" 
        onVerify={mockOnVerify}
        labels={{ title: 'Custom Verification' }}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Custom Verification')).toBeInTheDocument();
    });
  });
});
