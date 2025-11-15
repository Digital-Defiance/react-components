import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BackupCodeLoginForm } from '../../src/components/BackupCodeLoginForm';
import { I18nProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const mockOnSubmit = jest.fn();

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

describe('BackupCodeLoginForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders with translated labels', () => {
    renderWithI18n(<BackupCodeLoginForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByRole('heading', { name: /backup code/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
  });

  it('validates backup code with Constants.BACKUP_CODES.DisplayRegex', async () => {
    renderWithI18n(<BackupCodeLoginForm onSubmit={mockOnSubmit} />);
    
    const codeInput = screen.getByRole('textbox', { name: /backup code/i });
    fireEvent.change(codeInput, { target: { value: 'invalid' } });
    fireEvent.blur(codeInput);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid.*backup code/i)).toBeInTheDocument();
    });
  });

  it('toggles between email and username', () => {
    renderWithI18n(<BackupCodeLoginForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    
    fireEvent.click(screen.getByText(/use username/i));
    
    expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
  });

  it('validates password with Constants.PasswordRegex', async () => {
    renderWithI18n(<BackupCodeLoginForm onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getAllByLabelText(/password/i).find(el => el.getAttribute('name') === 'newPassword');
    if (!passwordInput) throw new Error('Password input not found');
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.blur(passwordInput);
    
    await waitFor(() => {
      expect(screen.getByText(/password.*must/i)).toBeInTheDocument();
    });
  });

  it('uses custom labels when provided', () => {
    renderWithI18n(
      <BackupCodeLoginForm 
        onSubmit={mockOnSubmit} 
        labels={{ title: 'Custom Backup Login' }}
      />
    );
    
    expect(screen.getByText('Custom Backup Login')).toBeInTheDocument();
  });
});
