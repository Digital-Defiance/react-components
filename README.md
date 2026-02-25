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

### Wrapper Components

Pre-configured components that integrate with application contexts. See the [Component Wrappers Guide](WRAPPERS.md) for detailed usage.

- **LoginFormWrapper** - Pre-configured login with auth context integration
- **RegisterFormWrapper** - Pre-configured registration with auth context integration
- **ChangePasswordFormWrapper** - Pre-configured password change with auth context
- **BackupCodeLoginWrapper** - Pre-configured backup code login
- **BackupCodesWrapper** - Pre-configured backup codes management
- **UserSettingsFormWrapper** - Pre-configured settings form with auto-fetch
- **VerifyEmailPageWrapper** - Pre-configured email verification
- **LogoutPageWrapper** - Pre-configured logout with navigation

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
- **UserMenu** - User account dropdown menu
- **UserSettingsForm** - User settings form component

### Hooks

- **useLocalStorage** - React hook for localStorage with state sync
- **useExpiringValue** - React hook for values that expire after a duration
- **useBackupCodes** - Manage backup code generation and retrieval
- **useUserSettings** - Fetch and update user settings with context integration
- **useEmailVerification** - Handle email verification flow

### Contexts & Providers

- **I18nProvider** - Internationalization context with i18n engine integration
- **AppThemeProvider** - MUI theme provider with dark/light mode toggle
- **ThemeToggleButton** - Button component for theme switching
- **SuiteConfigProvider** - Centralized configuration context (baseUrl, routes, languages)
- **useI18n** - Hook for accessing i18n context
- **useTheme** - Hook for accessing theme context
- **useSuiteConfig** - Hook for accessing suite configuration

### Services

- **createApiClient** - Factory for axios API client with language headers
- **createAuthenticatedApiClient** - Factory for authenticated axios client

### Types & Interfaces

- **IMenuOption** - Menu option interface
- **MenuType** - Extensible menu type system (see [Menu Type Extensibility Guide](docs/MENU_TYPE_EXTENSIBILITY.md))

## Usage

### Getting Started with Wrappers

For the quickest setup, use wrapper components that handle context integration automatically. See the [Component Wrappers Guide](WRAPPERS.md) for comprehensive examples.

```tsx
import { 
  SuiteConfigProvider,
  AuthProvider,
  LoginFormWrapper 
} from '@digitaldefiance/express-suite-react-components';

function App() {
  return (
    <SuiteConfigProvider
      baseUrl="https://api.example.com"
      routes={{
        dashboard: '/dashboard',
        login: '/login',
      }}
      languages={[
        { code: 'en-US', label: 'English (US)' },
      ]}
    >
      <AuthProvider baseUrl="https://api.example.com" onAuthError={() => {}}>
        {/* Use wrappers for instant integration */}
        <LoginFormWrapper />
        
        {/* Or customize via props */}
        <LoginFormWrapper
          redirectTo="/custom-dashboard"
          componentProps={{ loginType: 'username' }}
        />
      </AuthProvider>
    </SuiteConfigProvider>
  );
}
```

### Menu System

The menu system supports extensible menu types. See the [Menu Type Extensibility Guide](docs/MENU_TYPE_EXTENSIBILITY.md) for details on creating custom menus.

```tsx
import { TopMenu, MenuTypes, createMenuType } from '@digitaldefiance/express-suite-react-components';

// Use built-in menu types
const menuOptions = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    link: '/dashboard',
    includeOnMenus: [MenuTypes.SideMenu, MenuTypes.TopMenu],
    index: 0,
    requiresAuth: true,
  },
];

// Create custom menu types
const AdminMenu = createMenuType('AdminMenu');

function App() {
  return (
    <TopMenu 
      Logo={<MyLogo />}
      additionalMenus={[{
        menuType: AdminMenu,
        menuIcon: <AdminIcon />,
        priority: 10,
      }]}
    />
  );
}
```

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

## Documentation

- **[Overview](docs/OVERVIEW.md)** - Package architecture and getting started guide
- **[Components Documentation](docs/COMPONENTS.md)** - API reference for presentational components
- **[Hooks Documentation](docs/HOOKS.md)** - API reference for custom React hooks
- **[Wrappers API Documentation](docs/WRAPPERS_API.md)** - API reference for wrapper components
- **[Component Wrappers Guide](WRAPPERS.md)** - Comprehensive guide to using wrappers, hooks, and components
- **[Menu Type Extensibility Guide](docs/MENU_TYPE_EXTENSIBILITY.md)** - Creating custom menu types

## ChangeLog

### Version 4.19.11

- Version sync release; re-applies all changes from v2.14.x line (see below)

### Version 3.6.12

- Version sync release; reverts to pre-v2.14.x codebase baseline

### Versions 2.14.13 - 2.14.15

- Dependency updates

### Version 2.14.14

- Added `ForgotPasswordFormWrapper` and `ResetPasswordFormWrapper` components
- Exported new wrappers from `wrappers/index.tsx`

### Version 2.14.12

- Expanded TopMenu tests with `createI18nSetup` integration coverage

### Version 2.14.11

- TopMenu: removed hard `Constants` import; site title now resolves from i18n constants registry when `constants` prop is omitted
- AuthService: added `extractErrorMessage` helper for structured API error objects
- Added comprehensive `authService.spec.ts` test suite
- Expanded TopMenu test coverage

### Version 2.14.9

- Dependency updates

### Version 2.14.8

- I18nProvider: added null guard for optional `t()` method on engine

### Version 2.14.7

- I18nProvider: simplified `tBranded` to delegate directly to `i18nEngine.t()`

### Version 2.14.6

- I18nProvider: added template-pattern detection to route `{{…}}` / `{var}` keys through `i18nEngine.t()`

### Version 2.14.5

- I18nProvider: introduced `II18nEngineCompat` interface replacing direct `I18nEngine` import; supports both `I18nEngine` and `PluginI18nEngine`
- Added `t()` and optional `translateStringKey()` to engine compat interface

### Versions 2.14.3 - 2.14.4

- Dependency updates

### Version 2.14.2

- Expanded I18nConstants integration tests

### Version 2.14.1

- TopMenu: added `additionalMenus` prop with priority-based merge into context menus
- Added I18nConstants integration test suite (375 lines) verifying constant override flow

### Version 2.13.15

- TopMenu: added `constants` prop to pass `IConstants` for site title template variable

### Version 2.13.14

- TranslatedTitle: added `vars` prop for template variable support

### Version 2.13.13

- Added `Tbranded` (`T.tsx`) and `TDivBranded` (`TDiv.tsx`) translation components
- Exported new components from `components/index.ts`
- Added `tBranded` function to I18nProvider context

### Versions 2.13.10 - 2.13.12

- Dependency updates

### Versions 2.13.1 - 2.13.5

- README: documented UserMenu and UserSettingsForm components
- Dependency updates

### Versions 2.12.0 - 2.12.31

- Dependency updates

### Versions 2.11.2 - 2.11.4

- Dependency updates

### Version 2.11.1

- Removed committed `yarn.lock` and `showcase/yarn.lock` from repository

### Version 2.10.0

- Migrated all components to use `SuiteCoreStringKeyValue` type parameter for translation calls
- Updated PrivateRoute, UnAuthRoute, and all form components with stricter i18n typing
- Refactored AuthProvider and MenuContext for improved type safety

### Versions 2.9.46 - 2.9.48

- Dependency updates

### Version 2.9.40

- TopMenu: replaced `@ts-expect-error` with `Link as ElementType` cast for MUI/react-router compatibility
- Fixed wrapper test import

### Versions 2.9.38 - 2.9.39

- Dependency updates

### Version 2.9.37

- Dependency updates (added `@digitaldefiance/i18n-lib` peer dependency)

### Versions 2.9.34 - 2.9.36

- Dependency updates

### Version 2.9.33

- AuthProvider: integrated `AESGCMService` into `PasswordLoginService` construction

### Versions 2.9.29 - 2.9.32

- Dependency updates

### Version 2.9.28

- Added ECIESService mock to AuthProvider test suite for ID provider validation

### Versions 2.9.25 - 2.9.27

- Dependency updates

### Versions 2.9.21 - 2.9.24

- Dependency updates

### Version 2.9.20

- Added showcase app with Hero, About, and Components pages
- Added GitHub Actions workflow for showcase deployment

### Version 2.9.19

- Added `docs/WRAPPERS.md` documentation
- Updated test setup

### Version 2.9.18

- Jest config: added `transformIgnorePatterns` for ESM dependencies
- Extended test setup with additional mocks

### Versions 2.9.16 - 2.9.17

- Dependency updates

### Versions 2.9.14 - 2.9.16

- Dependency updates
- Added `yarn.lock` and `.yarn/install-state.gz` to repository

### Version 2.9.13

- TopMenu: removed `@ts-expect-error` comments (cleanup)
- Dependency updates

### Version 2.9.12

- Major ESLint and accessibility overhaul across all components
- Enhanced form components (LoginForm, RegisterForm, BackupCodeLoginForm, etc.) with improved accessibility attributes and error handling
- Refactored AuthProvider, I18nProvider, and MenuContext with stricter typing
- Updated hooks (`useBackupCodes`, `useEmailVerification`, `useUserSettings`) for better error handling
- Improved test suites across auth, components, contexts, and hooks

### Version 2.9.11

- Refactored `jest.config.js`; removed key-generation spec file

### Version 2.9.10

- AuthService: refactored key handling to use `getPublicKey()` for compressed public keys
- Reformatted authService for consistent code style
- Added `authService-key-generation.spec.ts` test suite

### Versions 2.9.8 - 2.9.9

- Dependency updates

### Version 2.9.6

- TopMenu: added `@ts-expect-error` annotations for MUI Button / react-router Link type incompatibility

### Versions 2.9.4 - 2.9.5

- Dependency updates

### Version 2.9.1

- Upgrade libraries

### Version 2.9.0

- Upgrade libraries

### Version 2.7.5

**Type Safety Improvements**

- **ELIMINATED**: All unsafe `as any` type casts from production code
- **IMPROVED**: Window interface extension for `APP_CONFIG` property
- **ENHANCED**: Navigation state type handling with proper type guards
- **IMPROVED**: Menu option link type to support both react-router `To` and state passing
- **VERIFIED**: All 227 tests passing with full type safety
- **VERIFIED**: TypeScript compilation successful with strict checking

**Technical Details**

- Added local Window interface extension in TopMenu component for APP_CONFIG
- Replaced `(option.link as any).state` with type-safe property access using `'state' in option.link` guard
- Enhanced `IMenuOption.link` to support `To | { pathname: string; state?: unknown }` for flexible navigation
- Updated `tsconfig.lib.json` to include global type definitions
- Fixed `typeRoots` path in `tsconfig.base.json`

### Version 2.5.14

- Update suite-core-lib

### Version 2.5.13

- Try to fix saving of settings

### Version 2.5.12

- Try to fix settings/darkMode

### Version 2.5.11

- Try to fix settings/darkMode

### Version 2.5.10

- Fix /user/settings email value

### Version 2.5.9

- Fix /user/verify loop

### Version 2.5.8

#### Changed

- **User Settings Storage** - Removed localStorage for userSettings (never read, server is source of truth)
  - User settings are now only stored in-memory and persisted to the server via API
  - Settings are loaded from the server on login/token verification
  - Eliminates risk of stale data from localStorage
  - Reduces unnecessary localStorage operations

### Version 2.5.7

- Relax isRestricted check to default false if no roles available

### Version 2.5.6

- Use new toggleColorMode on MenuContext

### Version 2.5.5

- Fix /user/verify repeat calls
- Add toggleColorMode to authService

### Version 2.5.4

- Fix currency/session storage

### Version 2.5.3

- Update libs

### Version 2.5.2

- Use i18n for loading string

### Version 2.5.1

- Upgrade libs

### Version 2.5.0

#### Added

- **SuiteConfigProvider** - Centralized configuration context for baseUrl, routes, languages, and timezones
- **Component Wrappers** - Pre-configured wrapper components for all major forms and pages
  - LoginFormWrapper, RegisterFormWrapper, ChangePasswordFormWrapper
  - BackupCodeLoginWrapper, BackupCodesWrapper
  - UserSettingsFormWrapper, VerifyEmailPageWrapper, LogoutPageWrapper
- **Business Logic Hooks** - Reusable hooks for common operations
  - useBackupCodes - Manage backup code generation and retrieval
  - useUserSettings - Fetch and update user settings with context integration
  - useEmailVerification - Handle email verification flow
- **Component Wrappers Guide** - Comprehensive documentation at `WRAPPERS.md`

#### Changed

- **Wrapper Architecture** - All wrappers now use centralized SuiteConfigProvider
- **Consistent API** - All wrappers support `onSuccess`, `componentProps`, and configurable routing
- **Improved Testability** - Business logic extracted into hooks for easier testing
- **Better DX** - Three levels of abstraction: Wrappers (easy), Hooks (flexible), Components (full control)

#### Breaking Changes

- **BackupCodesWrapper** - No longer requires `baseUrl` prop (uses SuiteConfigProvider)
- **VerifyEmailPageWrapper** - No longer requires `baseUrl` prop (uses SuiteConfigProvider)
- **UserSettingsFormWrapper** - No longer requires `baseUrl` or `languages` props (uses SuiteConfigProvider)

#### Migration Guide

```tsx
// Old (v2.4.x)
<BackupCodesWrapper baseUrl="https://api.example.com" />
<UserSettingsFormWrapper 
  baseUrl="https://api.example.com"
  languages={[...]}
/>

// New (v2.5.0)
<SuiteConfigProvider 
  baseUrl="https://api.example.com"
  languages={[...]}
>
  <BackupCodesWrapper />
  <UserSettingsFormWrapper />
</SuiteConfigProvider>
```

See [Component Wrappers Guide](WRAPPERS.md) for complete migration examples.

### Version 2.4.5

- DarkMode improvements

### Version 2.4.4

- Fix t(tComponent( calls
- Add enableBackupCode to MenuProvider
- Add User Settings to menu

### Version 2.4.3

- Simplify UserSettingsForm/Wrapper
- Upgrade i18n/CurrencyInput

### Version 2.4.2

- Add UserSettingsFormWrapper

### Version 2.4.1

- Add directChallenge configuration option to registration
- Add user settings form
- Update suite core lib

### Version 2.4.0

#### Changed

- **Version Bump**: Updated from 2.3.5 to 2.4.0
- **Dependency Update**: Upgraded `@digitaldefiance/suite-core-lib` from ^2.2.5 to ^2.2.10
- **Translation Keys**: Replaced `Login_UseEmail` with `Login_UseEmailAddress` in BackupCodeLoginForm and LoginForm
- **Error Messages**: Updated password login error to use `Error_Login_PasswordLoginNotSetup` instead of `PasswordLogin_Setup_NotAvailable` in AuthProvider

#### Added

- **Error Handling**: LoginForm now displays error messages via Alert component with Formik status
- **Error Recovery**: LoginForm onSubmit wrapped with try-catch to capture and display errors
- **Menu Context Integration**: TopMenu now uses `useMenu()` hook and `getTopMenus()` method
- **Menu Types**: Added `AccountCircle` icon import and `IMenuConfig` interface import

#### Fixed

- **Import Path**: Corrected `IAppConfig` import path from `../interfaces/AppConfig` to `../interfaces/IAppConfig`
- **Menu Rendering**: Simplified TopMenu additional menus logic to use centralized menu context
- **Error Type**: Added `errorType: 'PasswordLoginNotSetup'` to password login error responses

#### Technical

- Enhanced error propagation in authentication flows
- Improved menu configuration architecture with context-based management
- Better alignment with suite-core-lib translation key naming conventions

### v2.3.5

- Login/BackupLogin form improvements

### v2.3.4

- Simplify Private to use AuthContext and not need props

### v2.3.3

- Fix missing UnAuth component

### v2.3.2

- Add missing UnAuth component, redo

### v2.3.1

- Add missing UnAuth component

### v2.3.0

#### Breaking Changes

- **Removed `IncludeOnMenu` enum** - Replaced with extensible `MenuType` system using branded string types
- Menu system now requires `MenuTypes` constant instead of enum values

#### Added

- **Extensible Menu Type System** - New `MenuType` branded string type with `createMenuType()` factory function
- **`MenuTypes` constant** - Built-in menu types (SideMenu, TopMenu, UserMenu) replacing enum
- **`createMenuType()` function** - Factory for creating custom menu types with type safety
- **`AdditionalDropdownMenu` interface** - Support for custom dropdown menus in TopMenu component
- **`additionalMenus` prop** on TopMenu - Allows adding custom menu dropdowns with priority ordering
- **Menu Type Extensibility Guide** - Comprehensive documentation at `docs/MENU_TYPE_EXTENSIBILITY.md`

#### Changed

- **IMenuOption.includeOnMenus** - Now uses `MenuType[]` instead of `IncludeOnMenu[]`
- **DropdownMenu.menuType** - Now accepts `MenuType` instead of `IncludeOnMenu`
- **MenuContext.getMenuOptions** - Now accepts `MenuType` parameter instead of `IncludeOnMenu`
- All menu components updated to use `MenuTypes` constant
- Updated README with menu system usage examples and extensibility guide link

#### Migration Guide

```typescript
// Old (v2.2.x)
import { IncludeOnMenu } from '@digitaldefiance/express-suite-react-components';
includeOnMenus: [IncludeOnMenu.SideMenu, IncludeOnMenu.UserMenu]

// New (v2.3.0)
import { MenuTypes } from '@digitaldefiance/express-suite-react-components';
includeOnMenus: [MenuTypes.SideMenu, MenuTypes.UserMenu]

// Create custom menu types
import { createMenuType } from '@digitaldefiance/express-suite-react-components';
const AdminMenu = createMenuType('AdminMenu');

### v2.2.1

- Update BackupCodeLoginForm

### v2.2.0

#### Changed
- Updated peer dependencies: pinned `react-router-dom` to `6.29.0`
- Updated dependencies: `@digitaldefiance/i18n-lib` to `3.6.0`, `@digitaldefiance/suite-core-lib` to `2.2.1`
- Updated dev dependencies: pinned `react` and `react-dom` to `19.0.0`, downgraded `@testing-library/react` to `16.0.1`
- Replaced `BrowserRouter` with `MemoryRouter` in test files for better test isolation

#### Added
- Jest environment options: `resources: 'usable'` and `runScripts: 'dangerously'` for improved test compatibility
- `@testing-library/react-hooks` dev dependency (`8.0.1`)
- React strict mode configuration in test setup
- Custom render utility with `MemoryRouter` wrapper in `tests/test-utils.tsx`

#### Fixed
- Test environment configuration for React 19 compatibility
- Router setup in AuthProvider tests to use `MemoryRouter`

#### Removed
- Unused `renderWithProviders` helper function in UnAuthRoute tests
- External mock dependency for RegisterForm tests (inlined mock data)

### v2.1.57

- Update libs

### v2.1.56

- Fix SideMenu

### v2.1.55

- Fix peerDeps

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
