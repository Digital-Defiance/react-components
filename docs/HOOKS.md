# Hooks Documentation

This package provides several custom React hooks that encapsulate business logic and API interactions related to user authentication, settings, backup codes, and email verification.

## useUserSettings

Manages fetching, updating, and refreshing user settings.

**API:**

- `settings`: Current user settings or null while loading.
- `isLoading`: Boolean indicating loading state.
- `error`: Error object if an error occurred.
- `updateSettings(values)`: Async function to update settings. Returns success or error info.
- `refreshSettings()`: Async function to refresh settings from the server.

## useBackupCodes

Manages backup code count retrieval and generation.

**API:**

- `backupCodesRemaining`: Number of backup codes remaining or null if unknown.
- `isLoading`: Boolean indicating loading state.
- `error`: Error object if an error occurred.
- `generateBackupCodes(password?, mnemonic?)`: Async function to generate new backup codes.
- `refreshCodeCount()`: Async function to refresh the backup code count.

## useEmailVerification

Handles email verification process.

**API:**

- `isVerifying`: Boolean indicating verification in progress.
- `error`: Error object if verification failed.
- `verifyEmail(token)`: Async function to verify email with a token. Returns success status and message.

## Other Hooks

- `useExpiringValue`: Manages values that expire after a set time.
- `useLocalStorage`: React hook for syncing state with localStorage.

## Usage

Hooks return state and action functions to be used in components or wrappers. They encapsulate API calls and context integration, enabling separation of concerns and reusability.

Refer to the source code for detailed implementation and examples.
