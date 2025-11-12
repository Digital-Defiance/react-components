# @digitaldefiance/express-suite-react-components

React MUI components library for Digital Defiance Express Suite applications.

Part of [Express Suite](https://github.com/Digital-Defiance/express-suite)

## Installation

```bash
npm install @digitaldefiance/express-suite-react-components
# or
yarn add @digitaldefiance/express-suite-react-components
```

## Components

### Authentication & Routing

- **PrivateRoute** - Protected route wrapper requiring authentication
- **UnAuthRoute** - Route wrapper for unauthenticated users only
- **Private** - Conditional rendering based on authentication
- **LoginForm** - Flexible login form with email/username and password/mnemonic options (extensible)
- **RegisterForm** - User registration form with timezone selection (extensible)
- **ForgotPasswordForm** - Password reset request form
- **ResetPasswordForm** - Password reset form with token validation
- **ChangePasswordForm** - Password change form with validation
- **BackupCodeLoginForm** - Backup code login with mnemonic recovery
- **BackupCodesForm** - Generate new backup codes with mnemonic/password
- **VerifyEmailPage** - Email verification page with token handling
- **LogoutPage** - Logout handler with redirect
- **DashboardPage** - Basic dashboard layout
- **ApiAccess** - API token display and copy component

### UI Components

- **ConfirmationDialog** - Reusable confirmation dialog
- **CurrencyCodeSelector** - Currency selection dropdown
- **CurrencyInput** - Formatted currency input field
- **DropdownMenu** - Generic dropdown menu component
- **ExpirationSecondsSelector** - Time duration selector for expiring values
- **Flag** - Country flag display component
- **SideMenu** - Drawer-based side navigation menu
- **SideMenuListItem** - Menu list item for side navigation
- **TopMenu** - App bar with navigation and menu
- **TranslatedTitle** - Document title updater with i18n support
- **UserLanguageSelector** - Language selection component

### Hooks

- **useLocalStorage** - React hook for localStorage with state sync
- **useExpiringValue** - React hook for values that expire after a duration

### Contexts & Providers

- **I18nProvider** - Internationalization context with i18n engine integration
- **AppThemeProvider** - MUI theme provider with dark/light mode toggle
- **ThemeToggleButton** - Button component for theme switching
- **useI18n** - Hook for accessing i18n context
- **useTheme** - Hook for accessing theme context

### Services

- **createApiClient** - Factory for axios API client with language headers
- **createAuthenticatedApiClient** - Factory for authenticated axios client

### Types & Interfaces

- **IMenuOption** - Menu option interface
- **IncludeOnMenu** - Menu location enumeration

## Usage

### Authentication

```tsx
import { PrivateRoute, LoginForm } from '@digitaldefiance/express-suite-react-components';

function App() {
  return (
    <Routes>
      <Route path="/login" element={
        <LoginForm onSubmit={handleLogin} />
      } />
      <Route path="/dashboard" element={
        <PrivateRoute isAuthenticated={isAuth} isCheckingAuth={checking}>
          <Dashboard />
        </PrivateRoute>
      } />
    </Routes>
  );
}
```

### Providers

```tsx
import { I18nProvider, AppThemeProvider } from '@digitaldefiance/express-suite-react-components';
import { getCoreI18nEngine } from '@digitaldefiance/i18n-lib';

function App() {
  const i18nEngine = getCoreI18nEngine();
  
  return (
    <AppThemeProvider>
      <I18nProvider i18nEngine={i18nEngine}>
        <YourApp />
      </I18nProvider>
    </AppThemeProvider>
  );
}
```

### Forms & UI

```tsx
import { ConfirmationDialog, CurrencyInput, ChangePasswordForm } from '@digitaldefiance/express-suite-react-components';

function MyComponent() {
  return (
    <>
      <CurrencyInput value={100} onChange={handleChange} />
      <ConfirmationDialog open={true} onConfirm={handleConfirm} />
      <ChangePasswordForm onSubmit={handlePasswordChange} />
    </>
  );
}
```

### Extensible Forms

LoginForm and RegisterForm support custom fields via render props:

```tsx
import { LoginForm } from '@digitaldefiance/express-suite-react-components';
import * as Yup from 'yup';

function CustomLoginPage() {
  return (
    <LoginForm
      onSubmit={handleSubmit}
      additionalInitialValues={{
        customField: 'defaultValue',
      }}
      additionalValidation={{
        customField: Yup.string().required(),
      }}
      additionalFields={(formik) => (
        <TextField
          name="customField"
          label="Custom Field"
          value={formik.values.customField}
          onChange={formik.handleChange}
          error={formik.touched.customField && Boolean(formik.errors.customField)}
          helperText={formik.touched.customField && formik.errors.customField}
        />
      )}
    />
  );
}
```

```tsx
import { RegisterForm } from '@digitaldefiance/express-suite-react-components';
import moment from 'moment-timezone';

function CustomRegisterPage() {
  return (
    <RegisterForm
      onSubmit={handleSubmit}
      timezones={moment.tz.names()}
      getInitialTimezone={() => Intl.DateTimeFormat().resolvedOptions().timeZone}
      additionalInitialValues={{
        referralCode: '',
      }}
      additionalValidation={{
        referralCode: Yup.string().optional(),
      }}
      additionalFields={(formik, usePassword) => (
        <TextField
          name="referralCode"
          label="Referral Code (Optional)"
          value={formik.values.referralCode}
          onChange={formik.handleChange}
        />
      )}
    />
  );
}
```

## API Reference

### LoginForm Props

```typescript
interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  loginType?: 'email' | 'username';
  authType?: 'password' | 'mnemonic';
  allowLoginTypeToggle?: boolean;
  allowAuthTypeToggle?: boolean;
  showForgotPassword?: boolean;
  showSignUp?: boolean;
  forgotPasswordLink?: string;
  signUpLink?: string;
  
  // Extensibility
  additionalFields?: (formik) => React.ReactNode;
  additionalInitialValues?: Record<string, any>;
  additionalValidation?: Record<string, Yup.Schema>;
  
  // Customization
  emailLabel?: string;
  usernameLabel?: string;
  passwordLabel?: string;
  mnemonicLabel?: string;
  signInButtonText?: string;
  // ... more label props
  
  // Validation overrides
  emailValidation?: Yup.StringSchema;
  usernameValidation?: Yup.StringSchema;
  passwordValidation?: Yup.StringSchema;
  mnemonicValidation?: Yup.StringSchema;
}
```

### RegisterForm Props

```typescript
interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues, usePassword: boolean) => Promise<Result>;
  timezones: string[];
  getInitialTimezone: () => string;
  
  // Extensibility
  additionalFields?: (formik, usePassword: boolean) => React.ReactNode;
  additionalInitialValues?: Record<string, any>;
  additionalValidation?: Record<string, Yup.Schema>;
  
  // Validation overrides
  usernameValidation?: Yup.StringSchema;
  emailValidation?: Yup.StringSchema;
  timezoneValidation?: Yup.StringSchema;
  passwordValidation?: Yup.StringSchema;
  confirmPasswordValidation?: Yup.StringSchema;
  
  // Labels
  labels?: {
    title?: string;
    username?: string;
    email?: string;
    // ... more labels
  };
}
```

## License

MIT © Digital Defiance

## ChangeLog

### v2.1.54

- Fix authprovider

### v2.1.53

- Fix authprovider

### v2.1.52

- Export wrappers

### v2.1.51

- Try to fix exports again

### v2.1.50

- Fix PrivateRoute/UnAuthRoute

### v2.1.49

- Add default exports

### v2.1.48

- Fix ApiAccess

### v2.1.47

- Big update

### v2.1.43

- Update TranslatedTitle to be generic

### v2.1.40

- Alignment/upgrade all packages

### v2.1.40

- Alignment with Express Suite packages
- All packages updated to v2.1.40 (i18n, ecies-lib, node-ecies-lib, suite-core-lib, node-express-suite, express-suite-react-components)
- Test utilities remain at v1.0.7

### v2.1.38

- Fix package/exports/index

### v2.1.37

- Fix package/exports/index

### v2.1.36

- Fix package/exports/index

### v2.1.35

- Initial version (starting number matches rest of Express Suite)
- Added extensibility to LoginForm and RegisterForm
- Added `additionalFields`, `additionalInitialValues`, and `additionalValidation` props
- Added index signatures to form value types for custom fields
- Added tests for extensibility features
