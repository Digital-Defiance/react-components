# Component Wrappers Guide

This library provides both **presentational components** and **wrapper components** that integrate with your application's contexts and services.

## Architecture Overview

### Components (Presentational)
Pure React components that:
- Accept all dependencies as props
- Have no side effects
- Can be customized via extensive prop interfaces
- Support custom validation, labels, and additional fields

### Wrappers (Integration)
Pre-configured components that:
- Connect to application contexts (Auth, SuiteConfig)
- Handle business logic via custom hooks
- Provide sensible defaults
- Can be customized via `componentProps`

### Hooks (Business Logic)
Reusable hooks that:
- Encapsulate API interactions
- Manage state and side effects
- Can be used independently of wrappers
- Return data and actions

## Quick Start

### 1. Wrap Your App with Providers

```tsx
import { 
  AuthProvider, 
  SuiteConfigProvider, 
  I18nProvider,
  ThemeProvider 
} from '@digitaldefiance/express-suite-react-components';

function App() {
  return (
    <SuiteConfigProvider
      baseUrl="https://api.example.com"
      routes={{
        dashboard: '/dashboard',
        login: '/login',
        register: '/register',
        // ... other routes
      }}
      languages={[
        { code: 'en-US', label: 'English (US)' },
        { code: 'es-ES', label: 'Español' },
      ]}
    >
      <AuthProvider>
        <I18nProvider>
          <ThemeProvider>
            <YourApp />
          </ThemeProvider>
        </I18nProvider>
      </AuthProvider>
    </SuiteConfigProvider>
  );
}
```

### 2. Use Wrappers (Easiest)

```tsx
import { LoginFormWrapper } from '@digitaldefiance/express-suite-react-components';

function LoginPage() {
  return <LoginFormWrapper />;
}
```

### 3. Customize Wrappers

```tsx
import { LoginFormWrapper } from '@digitaldefiance/express-suite-react-components';

function LoginPage() {
  return (
    <LoginFormWrapper
      redirectTo="/custom-dashboard"
      onSuccess={() => console.log('Login successful!')}
      componentProps={{
        loginType: 'username',
        showForgotPassword: false,
        emailLabel: 'Your Email',
      }}
    />
  );
}
```

### 4. Use Hooks Directly (Maximum Control)

```tsx
import { useAuth, useSuiteConfig } from '@digitaldefiance/express-suite-react-components';
import { LoginForm } from '@digitaldefiance/express-suite-react-components';

function CustomLoginPage() {
  const { passwordLogin } = useAuth();
  const { routes } = useSuiteConfig();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    const result = await passwordLogin(/* ... */);
    if (!('error' in result)) {
      navigate(routes.dashboard);
    }
  };

  return (
    <LoginForm 
      onSubmit={handleSubmit}
      emailLabel="Company Email"
      showSignUp={false}
    />
  );
}
```

### 5. Use Components Only (Full Control)

```tsx
import { LoginForm } from '@digitaldefiance/express-suite-react-components';

function FullyCustomLogin() {
  const handleSubmit = async (values) => {
    // Your completely custom logic
    await myCustomAuthService.login(values);
  };

  return (
    <LoginForm 
      onSubmit={handleSubmit}
      allowLoginTypeToggle={false}
      additionalFields={(formik) => (
        <TextField name="department" label="Department" />
      )}
    />
  );
}
```

## Available Wrappers

### LoginFormWrapper
Pre-configured login form with Auth context integration.

**Props:**
- `onSuccess?: () => void` - Called after successful login
- `redirectTo?: string` - Override default redirect route
- `componentProps?: Partial<LoginFormProps>` - Pass-through to LoginForm

**Example:**
```tsx
<LoginFormWrapper
  onSuccess={() => analytics.track('login')}
  redirectTo="/welcome"
  componentProps={{
    loginType: 'username',
    authType: 'mnemonic',
  }}
/>
```

### RegisterFormWrapper
Pre-configured registration form with Auth context integration.

**Props:**
- `onSuccess?: () => void` - Called after successful registration
- `redirectTo?: string` - Override default redirect route
- `componentProps?: Partial<RegisterFormProps>` - Pass-through to RegisterForm

**Example:**
```tsx
<RegisterFormWrapper
  onSuccess={() => sendWelcomeEmail()}
  componentProps={{
    labels: {
      title: 'Join Our Platform',
    },
  }}
/>
```

### UserSettingsFormWrapper
Pre-configured settings form using `useUserSettings` hook.

**Props:**
- `onSuccess?: () => void` - Called after successful save
- `componentProps?: Partial<UserSettingsFormProps>` - Pass-through to UserSettingsForm

**Example:**
```tsx
<UserSettingsFormWrapper
  onSuccess={() => showToast('Settings saved!')}
  componentProps={{
    labels: {
      title: 'Account Preferences',
    },
  }}
/>
```

### BackupCodesWrapper
Manages backup codes using `useBackupCodes` hook.

**Props:**
- `componentProps?: Partial<BackupCodesFormProps>` - Pass-through to BackupCodesForm

### ChangePasswordFormWrapper
Pre-configured password change form.

**Props:**
- `onSuccess?: () => void` - Called after successful password change
- `componentProps?: Partial<ChangePasswordFormProps>` - Pass-through to ChangePasswordForm

### BackupCodeLoginWrapper
Login form for backup codes.

**Props:**
- `onSuccess?: () => void` - Called after successful login
- `componentProps?` - Pass-through to BackupCodeLoginForm

### LogoutPageWrapper
Logout page with navigation handling.

**Props:**
- `onSuccess?: () => void` - Called after successful logout
- `redirectTo?: string` - Override default redirect route
- `componentProps?` - Pass-through to LogoutPage

### VerifyEmailPageWrapper
Email verification page using `useEmailVerification` hook.

**Props:**
- `onSuccess?: () => void` - Called after successful verification
- `componentProps?` - Pass-through to VerifyEmailPage

## Available Hooks

### useBackupCodes
Manages backup code generation and retrieval.

```tsx
const { 
  backupCodesRemaining, 
  isLoading, 
  error,
  generateBackupCodes,
  refreshCodeCount 
} = useBackupCodes({ initialCodeCount: 5 });
```

### useUserSettings
Manages user settings fetching and updating.

```tsx
const { 
  settings, 
  isLoading, 
  error,
  updateSettings,
  refreshSettings 
} = useUserSettings();
```

### useEmailVerification
Handles email verification.

```tsx
const { 
  isVerifying, 
  error,
  verifyEmail 
} = useEmailVerification();
```

### useSuiteConfig
Access configuration context.

```tsx
const { baseUrl, routes, languages } = useSuiteConfig();
```

### useAuth
Access authentication context (see AuthProvider documentation).

```tsx
const { 
  login, 
  logout, 
  register,
  isAuthenticated,
  userData 
} = useAuth();
```

## When to Use Each Approach

### Use Wrappers When:
- ✅ You want to get started quickly
- ✅ Default behavior meets your needs
- ✅ You only need minor customization
- ✅ You want to follow recommended patterns

### Use Hooks When:
- ✅ You need custom UI/UX
- ✅ You're integrating with existing components
- ✅ You need fine-grained control over logic
- ✅ You want to test business logic separately

### Use Components Directly When:
- ✅ You're not using the provided contexts
- ✅ You have completely custom backend
- ✅ You need maximum flexibility
- ✅ You're building a custom authentication flow

## Configuration Context

The `SuiteConfigProvider` centralizes configuration for all wrappers:

```tsx
<SuiteConfigProvider
  baseUrl="https://api.example.com"
  routes={{
    dashboard: '/dashboard',
    login: '/login',
    register: '/register',
    verifyEmail: '/verify-email',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    settings: '/settings',
  }}
  languages={[
    { code: 'en-US', label: 'English (US)' },
    { code: 'es-ES', label: 'Español' },
  ]}
  timezones={['UTC', 'America/New_York', /* ... */]}
>
```

All wrappers will automatically use these settings.

## Best Practices

1. **Start with wrappers** - Use them unless you need customization
2. **Extract to hooks** - When you need custom UI but want the logic
3. **Use components directly** - Only when you need full control
4. **Pass-through props** - Customize wrappers via `componentProps` before creating your own
5. **Composition over configuration** - For complex needs, compose your own wrappers using the hooks

## Migration Path

If you're currently using components directly, here's how to migrate:

**Before (manual integration):**
```tsx
function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (values) => {
    await login(values.email, values.password);
    navigate('/dashboard');
  };
  
  return <LoginForm onSubmit={handleSubmit} />;
}
```

**After (using wrapper):**
```tsx
function LoginPage() {
  return <LoginFormWrapper />;
}
```

**After (with customization):**
```tsx
function LoginPage() {
  return (
    <LoginFormWrapper
      componentProps={{
        emailLabel: 'Work Email',
        showForgotPassword: false,
      }}
    />
  );
}
```
