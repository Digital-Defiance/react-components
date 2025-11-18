# Wrappers API Documentation

Wrapper components combine presentational components and hooks with context integration, navigation handling, and sensible defaults. They simplify common authentication and user flows.

## BackupCodeLoginWrapper

Wraps `BackupCodeLoginForm` with Auth context.

**Props:**
- `onSuccess?: () => void` — Callback after successful login.
- `componentProps?: Partial<React.ComponentProps<typeof BackupCodeLoginForm>>` — Pass-through props to the form component.

**Usage:**
```tsx
<BackupCodeLoginWrapper onSuccess={() => alert('Logged in!')} />
```

## BackupCodesWrapper

Wraps `BackupCodesForm` and `useBackupCodes`.

**Props:**
- `componentProps?: Partial<React.ComponentProps<typeof BackupCodesForm>>` — Pass-through props.

**Usage:**
```tsx
<BackupCodesWrapper />
```

## ChangePasswordFormWrapper

Wraps `ChangePasswordForm` with `useAuth.changePassword`.

**Props:**
- `onSuccess?: () => void` — Callback after successful password change.
- `componentProps?: Partial<React.ComponentProps<typeof ChangePasswordForm>>` — Pass-through props.

**Usage:**
```tsx
<ChangePasswordFormWrapper onSuccess={() => console.log('Password changed')} />
```

## LoginFormWrapper

Wraps `LoginForm` with `useAuth` and navigation.

**Props:**
- `onSuccess?: () => void` — Callback after successful login.
- `redirectTo?: string` — Override default post-login route.
- `componentProps?: Partial<Omit<LoginFormProps, 'onSubmit'>>` — Pass-through props without `onSubmit`.

**Usage:**
```tsx
<LoginFormWrapper redirectTo="/dashboard" />
```

## RegisterFormWrapper

Wraps `RegisterForm` with `useAuth.register` and navigation.

**Props:**
- `onSuccess?: () => void` — Callback after successful registration.
- `redirectTo?: string` — Override default post-registration route.
- `componentProps?: Partial<Omit<RegisterFormProps, 'onSubmit' | 'timezones' | 'getInitialTimezone'>>` — Pass-through props.

**Usage:**
```tsx
<RegisterFormWrapper onSuccess={() => navigate('/welcome')} />
```

## LogoutPageWrapper

Wraps `LogoutPage` with `useAuth.logout` and navigation.

**Props:**
- `onSuccess?: () => void` — Callback after logout.
- `redirectTo?: string` — Override post-logout route.
- `componentProps?: Partial<React.ComponentProps<typeof LogoutPage>>` — Pass-through props.

**Usage:**
```tsx
<LogoutPageWrapper redirectTo="/login" />
```

## VerifyEmailPageWrapper

Wraps `VerifyEmailPage` with `useEmailVerification`.

**Props:**
- `onSuccess?: () => void` — Callback after successful verification.
- `componentProps?: Partial<React.ComponentProps<typeof VerifyEmailPage>>` — Pass-through props.

**Usage:**
```tsx
<VerifyEmailPageWrapper onSuccess={() => alert('Email verified')} />
```

## UserSettingsFormWrapper

Wraps `UserSettingsForm` with `useUserSettings`.

**Props:**
- `onSuccess?: () => void` — Callback after successful update.
- `componentProps?: Partial<Omit<UserSettingsFormProps, 'initialValues' | 'onSubmit' | 'languages'>>` — Pass-through props.

**Usage:**
```tsx
<UserSettingsFormWrapper onSuccess={() => showToast('Settings saved')} />
