import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../src/components/LoginForm';
import { I18nProvider } from '../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';
import * as Yup from 'yup';

const mockOnSubmit = jest.fn();

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

describe('LoginForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with translated labels', () => {
    renderWithI18n(<LoginForm onSubmit={mockOnSubmit} loginType="username" />);
    
    expect(screen.getByRole('heading')).toHaveTextContent('Sign In');
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
  });

  it('validates username with Constants.UsernameRegex', async () => {
    renderWithI18n(<LoginForm onSubmit={mockOnSubmit} loginType="username" />);
    
    const usernameInput = screen.getByRole('textbox', { name: /username/i });
    const passwordInput = screen.getByLabelText(/^password/i);
    
    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/username must be 3-30 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockOnSubmit.mockResolvedValue({ token: 'test-token' });
    renderWithI18n(<LoginForm onSubmit={mockOnSubmit} loginType="username" />);
    
    fireEvent.change(screen.getByRole('textbox', { name: /username/i }), { target: { value: 'testuser' } });
    const passwordInput = screen.getByLabelText(/^password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: '',
          username: 'testuser',
          password: 'password123',
          mnemonic: ''
        }),
        expect.anything()
      );
    });
  });

  it('uses custom labels when provided', () => {
    renderWithI18n(
      <LoginForm 
        onSubmit={mockOnSubmit} 
        titleText="Custom Login"
      />
    );
    
    expect(screen.getByRole('heading')).toHaveTextContent('Custom Login');
  });

  it('renders additional fields when provided', () => {
    renderWithI18n(
      <LoginForm 
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
    mockOnSubmit.mockResolvedValue({});
    renderWithI18n(
      <LoginForm 
        onSubmit={mockOnSubmit}
        additionalInitialValues={{ customField: 'customValue' }}
      />
    );
    
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customField: 'customValue'
        }),
        expect.anything()
      );
    });
  });
});
