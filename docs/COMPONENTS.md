# Components Documentation

This package provides a variety of presentational React components designed for authentication flows, user settings, menus, and UI controls. These components are designed to be flexible and customizable via props, with no direct side effects.

## Key Components

### Authentication Forms

- **LoginForm**  
  A login form supporting username/email and password or mnemonic login.  
  Props include handlers for submission, labels, toggles for login types, and additional fields.

- **RegisterForm**  
  User registration form with timezone selection and validation.  
  Supports password-based registration and customizable labels.

- **ForgotPasswordForm**  
  Form to initiate password reset via email.

- **ResetPasswordForm**  
  Form to reset password using a token.

- **BackupCodeLoginForm**  
  Login form for backup codes.

- **BackupCodesForm**  
  UI to generate and display backup codes.

- **ChangePasswordForm**  
  Form to change the user's password.

### User Settings

- **UserSettingsForm**  
  Form to view and update user settings such as email, timezone, language, currency, dark mode, and security options.

### Navigation and Menus

- **SideMenu** and **TopMenu**  
  Navigation menus with support for custom menu types and extensibility.

- **UserMenu**  
  User-specific dropdown menu.

- **DropdownMenu**  
  Generic dropdown menu component.

- **SideMenuListItem**  
  Individual menu item for side menus.

### Other UI Components

- **ConfirmationDialog**  
  Modal dialog for user confirmations.

- **CurrencyInput** and **CurrencyCodeSelector**  
  Inputs for currency values and currency code selection.

- **Flag**  
  Displays country flags.

- **TranslatedTitle**  
  Title component supporting translations.

- **LogoutPage**  
  Page component handling logout flow.

- **VerifyEmailPage**  
  Page component for email verification.

## Usage

Components accept props for customization and event handling. They are designed to be used directly or wrapped by higher-level wrappers for integration with application contexts.

Refer to the source code and wrapper components for detailed usage examples.
