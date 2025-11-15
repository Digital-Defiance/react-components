import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '../src/components/RegisterForm';
import { I18nProvider } from '../src/contexts';
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
