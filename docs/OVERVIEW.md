# Overview

The **@digitaldefiance/express-suite-react-components** package provides a flexible set of React building blocks—components, hooks, and wrappers—to accelerate integration of authentication, user settings, menus, and related UI patterns in your application.

## Architecture

- **Components**  
  Presentational React components with comprehensive props for forms, menus, dialogs, and controls. No direct side effects; dependencies are passed in via props.

- **Hooks**  
  Custom React hooks encapsulating business logic and API interactions. They return state, loading/error flags, and actions (e.g., `useUserSettings`, `useBackupCodes`, `useEmailVerification`).

- **Wrappers**  
  Higher-level React components that wire components and hooks together using the library’s contexts. Wrappers handle navigation, context updates, and sensible defaults to minimize boilerplate in your app.

## Getting Started

1. Wrap your application with the context providers in `SuiteConfigProvider`, `AuthProvider`, `I18nProvider`, and `ThemeProvider`.  
2. Import and use wrappers for common flows (login, registration, settings).  
3. When you need full control, use the presentational components directly with hooks.

Refer to the individual docs for detailed API and usage examples:

- [Components](./COMPONENTS.md)  
- [Hooks](./HOOKS.md)  
- [Wrappers API](./WRAPPERS_API.md)  
- [Menu Type Extensibility](./MENU_TYPE_EXTENSIBILITY.md)  
- [Wrappers Guide](./WRAPPERS.md)
