import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '../../src/components/RegisterForm';
import { I18nProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const mockOnSubmit = jest.fn();

const mockTimezones = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'UTC',
];

const mockGetInitialTimezone = (): string => 'UTC';

const mockRegisterFormProps = {
  timezones: mockTimezones,
  getInitialTimezone: mockGetInitialTimezone,
  onSubmit: mockOnSubmit,
};

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

describe('RegisterForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders with translated labels', () => {
    renderWithI18n(<RegisterForm {...mockRegisterFormProps} onSubmit={mockOnSubmit} />);
    
    expect(screen.getByRole('heading')).toHaveTextContent(/register/i);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('validates username with Constants.UsernameRegex', async () => {
    renderWithI18n(<RegisterForm {...mockRegisterFormProps} onSubmit={mockOnSubmit} />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.blur(usernameInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Username must be at least/i)).toBeInTheDocument();
    });
  });

  it('validates password with Constants.PasswordRegex', async () => {
    renderWithI18n(<RegisterForm {...mockRegisterFormProps} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^password/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.blur(passwordInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Password must be at least/i)).toBeInTheDocument();
    });
  });

  it('displays timezone select', () => {
    renderWithI18n(<RegisterForm {...mockRegisterFormProps} onSubmit={mockOnSubmit} />);
    
    const timezoneSelect = screen.getByLabelText(/timezone/i);
    expect(timezoneSelect).toBeInTheDocument();
    expect(timezoneSelect).toHaveTextContent('UTC');
  });

  it('uses custom labels when provided', () => {
    renderWithI18n(
      <RegisterForm 
        {...mockRegisterFormProps}
        onSubmit={mockOnSubmit} 
        labels={{ title: 'Custom Register' }}
      />
    );
    
    expect(screen.getByRole('heading')).toHaveTextContent('Custom Register');
  });

  it('renders additional fields when provided', () => {
    renderWithI18n(
      <RegisterForm 
        {...mockRegisterFormProps}
        onSubmit={mockOnSubmit}
        additionalFields={() => (
          <div data-testid="custom-field">Custom Field</div>
        )}
      />
    );
    
    expect(screen.getByTestId('custom-field')).toBeInTheDocument();
    expect(screen.getByText('Custom Field')).toBeInTheDocument();
  });

  it('includes additional initial values in form', async () => {
    mockOnSubmit.mockResolvedValue({ success: true, message: 'Success' });
    renderWithI18n(
      <RegisterForm 
        {...mockRegisterFormProps}
        onSubmit={mockOnSubmit}
        additionalInitialValues={{ customField: 'customValue' }}
      />
    );
    
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customField: 'customValue'
        }),
        true
      );
    });
  });
});

describe('RegisterForm mnemonic UI', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  const getMnemonicToggle = (): HTMLElement => {
    // The mnemonic toggle button has aria-controls="mnemonic-input" to distinguish
    // it from the "Use mnemonic only" password toggle button
    const buttons = screen.getAllByRole('button');
    const toggle = buttons.find((btn) => btn.getAttribute('aria-controls') === 'mnemonic-input');
    if (!toggle) throw new Error('Mnemonic toggle button not found');
    return toggle;
  };

  it('hides mnemonic input by default and reveals it on toggle click', () => {
    renderWithI18n(
      <RegisterForm {...mockRegisterFormProps} onSubmit={mockOnSubmit} />
    );

    // Mnemonic input should not be in the document initially
    expect(document.getElementById('mnemonic-input')).toBeNull();

    // The toggle button should exist and indicate collapsed state
    const toggleButton = getMnemonicToggle();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Click the toggle to reveal the mnemonic input
    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('mnemonic-input')).toBeInTheDocument();
  });

  it('hides mnemonic input again when toggle is clicked a second time', () => {
    renderWithI18n(
      <RegisterForm {...mockRegisterFormProps} onSubmit={mockOnSubmit} />
    );

    const toggleButton = getMnemonicToggle();

    // Reveal
    fireEvent.click(toggleButton);
    expect(document.getElementById('mnemonic-input')).toBeInTheDocument();

    // Hide again
    fireEvent.click(toggleButton);
    expect(document.getElementById('mnemonic-input')).toBeNull();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('includes mnemonic value in form submission', async () => {
    const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    mockOnSubmit.mockResolvedValue({ success: true, message: 'Success' });

    renderWithI18n(
      <RegisterForm {...mockRegisterFormProps} onSubmit={mockOnSubmit} />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'Password123!' } });

    // Reveal and fill mnemonic
    fireEvent.click(getMnemonicToggle());
    const mnemonicInput = document.getElementById('mnemonic-input');
    expect(mnemonicInput).not.toBeNull();
    fireEvent.change(mnemonicInput!, { target: { value: testMnemonic } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ mnemonic: testMnemonic }),
        true
      );
    });
  });

  it('uses custom mnemonic label from labels prop', () => {
    renderWithI18n(
      <RegisterForm
        {...mockRegisterFormProps}
        onSubmit={mockOnSubmit}
        labels={{ mnemonic: 'Recovery Phrase' }}
      />
    );

    // Reveal the mnemonic input
    fireEvent.click(getMnemonicToggle());

    // The TextField should use the custom label
    expect(screen.getByLabelText('Recovery Phrase')).toBeInTheDocument();
  });
});


describe('RegisterForm mnemonic error display', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  const getMnemonicToggle = (): HTMLElement => {
    const buttons = screen.getAllByRole('button');
    const toggle = buttons.find((btn) => btn.getAttribute('aria-controls') === 'mnemonic-input');
    if (!toggle) throw new Error('Mnemonic toggle button not found');
    return toggle;
  };

  const fillAndSubmitWithMnemonic = async (mnemonic: string) => {
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'Password123!' } });

    // Reveal and fill mnemonic
    fireEvent.click(getMnemonicToggle());
    const mnemonicInput = document.getElementById('mnemonic-input');
    expect(mnemonicInput).not.toBeNull();
    fireEvent.change(mnemonicInput!, { target: { value: mnemonic } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
  };

  it('displays a backend format validation error on the mnemonic field', async () => {
    const validMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const errorMessage = 'Invalid mnemonic format';

    // Simulate express-validator field error response
    mockOnSubmit.mockResolvedValue({
      error: 'Validation failed',
      errors: [{ path: 'mnemonic', msg: errorMessage }],
    });

    renderWithI18n(
      <RegisterForm {...mockRegisterFormProps} onSubmit={mockOnSubmit} />
    );

    await fillAndSubmitWithMnemonic(validMnemonic);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays a backend collision error with the translated message', async () => {
    const validMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const collisionMessage = 'This mnemonic is already in use';

    // Simulate TranslatableSuiteError response
    mockOnSubmit.mockResolvedValue({
      error: collisionMessage,
      errorType: 'TranslatableSuiteError',
      field: 'mnemonic',
    });

    renderWithI18n(
      <RegisterForm {...mockRegisterFormProps} onSubmit={mockOnSubmit} />
    );

    await fillAndSubmitWithMnemonic(validMnemonic);

    // The collision error should appear on the mnemonic field's helper text
    await waitFor(() => {
      const helperText = document.getElementById('mnemonic-input-helper-text');
      expect(helperText).not.toBeNull();
      expect(helperText).toHaveTextContent(collisionMessage);
    });
  });
});
