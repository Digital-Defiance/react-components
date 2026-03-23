import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangePasswordForm } from '../../src/components/ChangePasswordForm';
import { I18nProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const mockOnSubmit = jest.fn();

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders with translated labels', () => {
    renderWithI18n(<ChangePasswordForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm/i)).toBeInTheDocument();
  });

  it('validates password minimum length', async () => {
    renderWithI18n(<ChangePasswordForm onSubmit={mockOnSubmit} />);
    
    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    fireEvent.change(newPasswordInput, { target: { value: 'short' } });
    fireEvent.blur(newPasswordInput);
    
    await waitFor(() => {
      expect(screen.getByText(/8/)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('validates password confirmation match', async () => {
    renderWithI18n(<ChangePasswordForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'different' } });
    fireEvent.blur(screen.getByLabelText(/confirm/i));
    
    await waitFor(() => {
      expect(screen.getByText(/match/i)).toBeInTheDocument();
    });
  });

  it('uses custom labels when provided', () => {
    renderWithI18n(
      <ChangePasswordForm 
        onSubmit={mockOnSubmit} 
        currentPasswordLabel="Old Password"
      />
    );
    
    expect(screen.getByLabelText(/old password/i)).toBeInTheDocument();
  });

  it('displays error alert when onSubmit returns an error', async () => {
    mockOnSubmit.mockResolvedValueOnce({ error: 'Password change failed' });

    renderWithI18n(<ChangePasswordForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'oldPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: 'newPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm/i), {
      target: { value: 'newPassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText('Password change failed')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays success alert when onSubmit returns success', async () => {
    mockOnSubmit.mockResolvedValueOnce({ success: true });

    renderWithI18n(<ChangePasswordForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'oldPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: 'newPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm/i), {
      target: { value: 'newPassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
