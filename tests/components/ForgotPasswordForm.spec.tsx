import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForgotPasswordForm } from '../../src/components/ForgotPasswordForm';
import { I18nProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const mockOnSubmit = jest.fn();

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders with translated labels', () => {
    renderWithI18n(<ForgotPasswordForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    renderWithI18n(<ForgotPasswordForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid email', async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    renderWithI18n(<ForgotPasswordForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  it('uses custom labels when provided', () => {
    renderWithI18n(
      <ForgotPasswordForm 
        onSubmit={mockOnSubmit} 
        labels={{ title: 'Reset Your Password' }}
      />
    );
    
    expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
  });
});
