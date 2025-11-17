import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { BackupCodeLoginForm } from '../../src/components/BackupCodeLoginForm';
import { I18nProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const mockOnSubmit = jest.fn();

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

describe('BackupCodeLoginForm', () => {
  // Suppress act() warnings from Formik's internal state management
  const originalError = console.error;
  beforeAll(() => {
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('not wrapped in act')
      ) {
        return;
      }
      originalError.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders with translated labels', () => {
    act(() => {
      renderWithI18n(<BackupCodeLoginForm onSubmit={mockOnSubmit} />);
    });
    
    expect(screen.getByRole('heading', { name: /backup code/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
  });

  it('validates backup code with Constants.BACKUP_CODES.DisplayRegex', async () => {
    act(() => {
      renderWithI18n(<BackupCodeLoginForm onSubmit={mockOnSubmit} />);
    });
    
    const codeInput = screen.getByRole('textbox', { name: /backup code/i });
    act(() => {
      fireEvent.change(codeInput, { target: { value: 'invalid' } });
      fireEvent.blur(codeInput);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/invalid.*backup code/i)).toBeInTheDocument();
    });
  });

  it('toggles between email and username', () => {
    act(() => {
      renderWithI18n(<BackupCodeLoginForm onSubmit={mockOnSubmit} />);
    });
    
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    
    act(() => {
      fireEvent.click(screen.getByText(/use username/i));
    });
    
    expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
  });

  it('validates password with Constants.PasswordRegex', async () => {
    act(() => {
      renderWithI18n(<BackupCodeLoginForm onSubmit={mockOnSubmit} />);
    });
    
    const passwordInput = screen.getAllByLabelText(/password/i).find(el => el.getAttribute('name') === 'newPassword');
    if (!passwordInput) throw new Error('Password input not found');
    act(() => {
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.blur(passwordInput);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/password.*must/i)).toBeInTheDocument();
    });
  });

  it('uses custom labels when provided', () => {
    act(() => {
      renderWithI18n(
        <BackupCodeLoginForm 
          onSubmit={mockOnSubmit} 
          labels={{ title: 'Custom Backup Login' }}
        />
      );
    });
    
    expect(screen.getByText('Custom Backup Login')).toBeInTheDocument();
  });
});
