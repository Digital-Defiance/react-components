import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BackupCodesForm } from '../../src/components/BackupCodesForm';
import { I18nProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const mockOnSubmit = jest.fn();

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

describe('BackupCodesForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders with translated labels', () => {
    renderWithI18n(<BackupCodesForm onSubmit={mockOnSubmit} backupCodesRemaining={5} />);
    
    expect(screen.getByText(/5.*codes remaining/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mnemonic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('validates mnemonic with Constants.MnemonicRegex', async () => {
    renderWithI18n(<BackupCodesForm onSubmit={mockOnSubmit} />);
    
    const mnemonicInput = screen.getByLabelText(/^mnemonic$/i);
    fireEvent.change(mnemonicInput, { target: { value: 'invalid' } });
    fireEvent.blur(mnemonicInput);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid mnemonic/i)).toBeInTheDocument();
    });
  });

  it('validates password with Constants.PasswordRegex', async () => {
    renderWithI18n(<BackupCodesForm onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.blur(passwordInput);
    
    await waitFor(() => {
      expect(screen.getByText(/password.*must/i)).toBeInTheDocument();
    });
  });

  it('validates XOR mnemonic or password', async () => {
    renderWithI18n(<BackupCodesForm onSubmit={mockOnSubmit} />);
    
    fireEvent.click(screen.getByText(/generate/i));
    
    await waitFor(() => {
      expect(screen.getAllByText(/either mnemonic or password/i).length).toBeGreaterThan(0);
    });
  });

  it('uses custom labels when provided', () => {
    renderWithI18n(
      <BackupCodesForm 
        onSubmit={mockOnSubmit} 
        labels={{ generateButton: 'Create Codes' }}
      />
    );
    
    expect(screen.getByText('Create Codes')).toBeInTheDocument();
  });
});
