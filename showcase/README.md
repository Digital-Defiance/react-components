# @digitaldefiance/express-suite-react-components Showcase

This is the GitHub Pages showcase site for **@digitaldefiance/express-suite-react-components**, the official React MUI components library designed to work seamlessly with **Express Suite** backend applications. Built with React, TypeScript, and Vite.

## About Express Suite React Components

`@digitaldefiance/express-suite-react-components` is the frontend companion to the Express Suite backend framework, providing:
- Complete authentication components that integrate with Express Suite auth endpoints
- Protected routing with PrivateRoute and UnAuthRoute for Express Suite sessions
- Pre-configured wrapper components with automatic Express Suite API integration
- Internationalization with I18nProvider matching Express Suite's i18n backend
- Theme support with AppThemeProvider
- Menu system with extensible menu types
- User settings and backup code management connected to Express Suite backend
- Custom hooks for localStorage, expiring values, and Express Suite API calls

## Development

```bash
cd showcase
npm install
npm run dev
```

Visit `http://localhost:5173` to see the site.

## Building

```bash
npm run build
```

The built site will be in the `dist` directory.

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch. The deployment is handled by the `.github/workflows/deploy-showcase.yml` workflow.

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Framer Motion** - Animations
- **React Icons** - Icon library
- **React Intersection Observer** - Scroll animations

## Structure

- `/src/components` - React components
- `/src/assets` - Static assets
- `/public` - Public files
- `index.html` - Entry HTML file
- `vite.config.ts` - Vite configuration
