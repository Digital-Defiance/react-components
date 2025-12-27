import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import "./Components.css";

interface Feature {
  title: string;
  description: string;
  icon: string;
  tech: string[];
  highlights: string[];
  category: "Components" | "Hooks" | "Contexts" | "Wrappers" | "UI";
}

const features: Feature[] = [
  {
    title: "Authentication Components",
    icon: "🔐",
    description:
      "Complete authentication UI with LoginForm, RegisterForm, password reset flows, and backup code management. Fully customizable with extensible fields and validation.",
    tech: ["React", "MUI", "Formik", "Yup"],
    category: "Components",
    highlights: [
      "LoginForm with email/username and password/mnemonic options",
      "RegisterForm with timezone selection and custom fields",
      "ForgotPasswordForm and ResetPasswordForm",
      "BackupCodeLoginForm and BackupCodesForm",
      "ChangePasswordForm with validation",
      "Extensible via additionalFields and additionalValidation props",
    ],
  },
  {
    title: "Protected Routing",
    icon: "🛡️",
    description:
      "Route protection components for authentication-based navigation. PrivateRoute for authenticated users, UnAuthRoute for guests, with loading states and redirects.",
    tech: ["React Router", "TypeScript", "Authentication"],
    category: "Components",
    highlights: [
      "PrivateRoute for protected pages",
      "UnAuthRoute for login/register pages",
      "Private component for conditional rendering",
      "Loading state handling during auth checks",
      "Automatic redirects based on auth status",
    ],
  },
  {
    title: "Wrapper Components",
    icon: "🔌",
    description:
      "Pre-configured components with automatic context integration. Drop-in components that handle auth, navigation, and error handling out of the box.",
    tech: ["React", "Context API", "TypeScript"],
    category: "Wrappers",
    highlights: [
      "LoginFormWrapper with auth context integration",
      "RegisterFormWrapper with automatic redirect",
      "UserSettingsFormWrapper with auto-fetch",
      "BackupCodeLoginWrapper and BackupCodesWrapper",
      "VerifyEmailPageWrapper and LogoutPageWrapper",
      "Minimal props, maximum functionality",
    ],
  },
  {
    title: "Internationalization",
    icon: "🌍",
    description:
      "Complete i18n support using @digitaldefiance/i18n-lib. I18nProvider context with language selection, automatic locale detection, and fallback support.",
    tech: ["i18n", "React Context", "TypeScript"],
    category: "Contexts",
    highlights: [
      "I18nProvider with i18n engine integration",
      "UserLanguageSelector component",
      "TranslatedTitle for document titles",
      "8+ languages supported",
      "Automatic language detection",
      "useI18n hook for translations",
    ],
  },
  {
    title: "Theme System",
    icon: "🎨",
    description:
      "MUI theme provider with dark/light mode toggle and persistent preferences. AppThemeProvider with custom theme configuration and ThemeToggleButton component.",
    tech: ["MUI", "React Context", "localStorage"],
    category: "Contexts",
    highlights: [
      "AppThemeProvider with theme management",
      "Dark/light mode toggle",
      "ThemeToggleButton component",
      "Persistent theme preferences",
      "Custom theme configuration support",
      "useTheme hook for theme access",
    ],
  },
  {
    title: "Menu System",
    icon: "📱",
    description:
      "Extensible menu system with TopMenu, SideMenu, and DropdownMenu. Support for custom menu types, icons, and priority-based ordering.",
    tech: ["React", "MUI", "TypeScript"],
    category: "UI",
    highlights: [
      "TopMenu with app bar and navigation",
      "SideMenu with drawer-based navigation",
      "Extensible MenuType system",
      "DropdownMenu and UserMenu components",
      "Custom menu type creation",
      "Priority-based menu ordering",
    ],
  },
  {
    title: "Custom Hooks",
    icon: "🪝",
    description:
      "Reusable React hooks for common patterns. localStorage sync, expiring values, backup code management, and user settings with context integration.",
    tech: ["React Hooks", "TypeScript", "State Management"],
    category: "Hooks",
    highlights: [
      "useLocalStorage for persistent state",
      "useExpiringValue for time-based data",
      "useBackupCodes for backup code management",
      "useUserSettings with context integration",
      "useEmailVerification for email flows",
      "Type-safe and well-tested",
    ],
  },
  {
    title: "Form Components",
    icon: "📝",
    description:
      "Rich form components with validation and accessibility. Currency inputs, selectors, confirmation dialogs, and more with consistent MUI styling.",
    tech: ["MUI", "Formik", "React"],
    category: "UI",
    highlights: [
      "CurrencyInput with formatting",
      "CurrencyCodeSelector and ExpirationSecondsSelector",
      "ConfirmationDialog for user confirmation",
      "Flag component for country flags",
      "UserSettingsForm with validation",
      "Consistent validation patterns",
    ],
  },
];

const Components = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="components section" id="components" ref={ref}>
      <motion.div
        className="components-container"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          Core <span className="gradient-text">Components</span> & Features
        </h2>
        <p className="components-subtitle">
          Production-ready React components and hooks for Express Suite applications
        </p>

        <motion.div
          className="suite-intro"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3>
            The <em>official</em> React UI library designed to work with{" "}
            <em>Express Suite</em> backend applications.
          </h3>
          <p>
            <strong>
              @digitaldefiance/express-suite-react-components is the frontend companion to Express Suite
            </strong>{" "}
            — providing React components that integrate seamlessly with Express Suite's authentication,
            i18n, and API structure. From authentication forms and protected routing to
            internationalization and theme management, this library offers{" "}
            <strong>everything you need</strong> to build production-ready Express Suite frontends
            with zero backend integration hassle.
          </p>
          <div className="problem-solution">
            <div className="problem">
              <h4>❌ The Challenge: Frontend Development Is Time-Consuming</h4>
              <ul>
                <li>Building authentication forms with validation</li>
                <li>Implementing protected routes and navigation</li>
                <li>Setting up internationalization and themes</li>
                <li>Creating consistent, accessible UI components</li>
                <li>Managing user settings and preferences</li>
              </ul>
              <p>
                <strong>Result:</strong> You spend weeks building UI infrastructure
                instead of your unique features.
              </p>
            </div>
            <div className="solution">
              <h4>✅ The Solution: Express Suite Frontend Components</h4>
              <p>
                <strong>express-suite-react-components</strong> is designed to work with{" "}
                <strong>Express Suite backend</strong>, providing{" "}
                <strong>complete authentication components</strong> that integrate with your auth endpoints,
                <strong> protected routing</strong> with Express Suite session handling,{" "}
                <strong>wrapper components</strong> that automatically connect to your API,
                and <strong>i18n matching your backend</strong> translations.
              </p>
              <p>
                Built with <strong>React 19 and MUI</strong> and designed to integrate with{" "}
                <strong>Express Suite backend</strong>, this library includes 227 passing tests
                and comprehensive accessibility features. It provides the complete frontend
                component library that works seamlessly with Express Suite's authentication,
                i18n, and API structure out of the box.
              </p>
            </div>
          </div>
          <div className="value-props">
            <div className="value-prop">
              <strong>🔐 Express Suite Integration</strong>
              <p>
                Auth forms, protected routing, and wrapper components designed
                to work seamlessly with Express Suite backend API
              </p>
            </div>
            <div className="value-prop">
              <strong>🚀 Production Ready</strong>
              <p>
                227 passing tests, accessibility support, and battle-tested
                in real-world applications
              </p>
            </div>
            <div className="value-prop">
              <strong>🌍 Global Ready</strong>
              <p>
                Multi-language support via @digitaldefiance/i18n-lib with 8+
                languages and automatic locale detection
              </p>
            </div>
            <div className="value-prop">
              <strong>⚙️ Extensible Components</strong>
              <p>
                Custom fields, validation, menu types, and theme configuration
                for maximum flexibility
              </p>
            </div>
          </div>
        </motion.div>

        <div className="components-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="component-card card"
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div className="component-header">
                <div className="component-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <span
                  className={`component-badge ${feature.category.toLowerCase()}`}
                >
                  {feature.category}
                </span>
              </div>

              <p className="component-description">{feature.description}</p>

              <ul className="component-highlights">
                {feature.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>

              <div className="component-tech">
                {feature.tech.map((tech) => (
                  <span key={tech} className="tech-badge">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Components;
