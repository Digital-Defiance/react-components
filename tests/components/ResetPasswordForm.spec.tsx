import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResetPasswordForm } from '../../src/components/ResetPasswordForm';
import { I18nProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const mockOnSubmit = jest.fn();

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders with translated labels', () => {
    renderWithI18n(<ResetPasswordForm token="test-token" onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
  });

  it('shows error when no token provided', () => {
    renderWithI18n(<ResetPasswordForm token={null} onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
  });

  it('validates password minimum length', async () => {
    renderWithI18n(<ResetPasswordForm token="test-token" onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^new password$/i);
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.blur(passwordInput);
    
    await waitFor(() => {
      expect(screen.getByText(/8/)).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    renderWithI18n(<ResetPasswordForm token="test-token" onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'different' } });
    fireEvent.blur(screen.getByLabelText(/confirm/i));
    
    await waitFor(() => {
      expect(screen.getByText(/match/i)).toBeInTheDocument();
    });
  });

  it('uses custom labels when provided', () => {
    renderWithI18n(
      <ResetPasswordForm 
        token="test-token" 
        onSubmit={mockOnSubmit}
        labels={{ title: 'Create New Password' }}
      />
    );
    
    expect(screen.getByText('Create New Password')).toBeInTheDocument();
  });
});
