import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import { FC, useState } from 'react';
import * as Yup from 'yup';
import { SuiteCoreComponentId, SuiteCoreStringKey, Constants } from '@digitaldefiance/suite-core-lib';
import { useI18n } from '../contexts';

export interface LoginFormValues {
  email?: string;
  username?: string;
  password?: string;
  mnemonic?: string;
  [key: string]: any;
}

export interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  loginType?: 'email' | 'username';
  authType?: 'password' | 'mnemonic';
  allowLoginTypeToggle?: boolean;
  allowAuthTypeToggle?: boolean;
  showForgotPassword?: boolean;
  showSignUp?: boolean;
  forgotPasswordLink?: string;
  signUpLink?: string;
  emailLabel?: string;
  usernameLabel?: string;
  passwordLabel?: string;
  mnemonicLabel?: string;
  signInButtonText?: string;
  forgotPasswordText?: string;
  signUpText?: string;
  useUsernameText?: string;
  useEmailText?: string;
  useMnemonicText?: string;
  usePasswordText?: string;
  toggleVisibilityLabel?: string;
  titleText?: string;
  emailValidation?: Yup.StringSchema;
  usernameValidation?: Yup.StringSchema;
  passwordValidation?: Yup.StringSchema;
  mnemonicValidation?: Yup.StringSchema;
  additionalFields?: (formik: ReturnType<typeof useFormik<LoginFormValues>>) => React.ReactNode;
  additionalInitialValues?: Record<string, any>;
  additionalValidation?: Record<string, Yup.Schema>;
}

export const LoginForm: FC<LoginFormProps> = ({
  onSubmit,
  loginType: initialLoginType = 'email',
  authType: initialAuthType = 'password',
  allowLoginTypeToggle = true,
  allowAuthTypeToggle = true,
  showForgotPassword = true,
  showSignUp = true,
  forgotPasswordLink = '/forgot-password',
  signUpLink = '/register',
  emailLabel,
  usernameLabel,
  passwordLabel,
  mnemonicLabel,
  signInButtonText,
  forgotPasswordText,
  signUpText,
  useUsernameText,
  useEmailText,
  useMnemonicText,
  usePasswordText,
  toggleVisibilityLabel,
  titleText,
  emailValidation,
  usernameValidation,
  passwordValidation,
  mnemonicValidation,
  additionalFields,
  additionalInitialValues = {},
  additionalValidation = {},
}) => {
  const { t, tComponent } = useI18n();
  const [loginType, setLoginType] = useState<'email' | 'username'>(initialLoginType);
  const [authType, setAuthType] = useState<'password' | 'mnemonic'>(initialAuthType);
  const [showSecret, setShowSecret] = useState(false);

  // Use translations with fallbacks
  const labels = {
    title: titleText || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Login_Title),
    email: emailLabel || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Email),
    username: usernameLabel || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Username),
    password: passwordLabel || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Password),
    mnemonic: mnemonicLabel || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Mnemonic),
    signIn: signInButtonText || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.SignInButton),
    forgotPassword: forgotPasswordText || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Login_ForgotPassword),
    signUp: signUpText || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Login_SignUp),
    useUsername: useUsernameText || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Login_UseUsername),
    useEmail: useEmailText || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Login_UseEmail),
    useMnemonic: useMnemonicText || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_UseMnemonic),
    usePassword: usePasswordText || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_UsePassword),
    toggleVisibility: toggleVisibilityLabel || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.TogglePasswordVisibility),
  };

  const validation = {
    email: emailValidation || Yup.string()
      .email(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_InvalidEmail))
      .required(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    username: usernameValidation || Yup.string()
      .matches(Constants.UsernameRegex, tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_UsernameRegexErrorTemplate))
      .required(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    password: passwordValidation || Yup.string()
      .min(1, tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required))
      .required(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    mnemonic: mnemonicValidation || Yup.string()
      .matches(Constants.MnemonicRegex, tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_InvalidMnemonic))
      .required(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
  };

  const validationSchema = Yup.object({
    [loginType]: loginType === 'email' ? validation.email : validation.username,
    ...(authType === 'mnemonic'
      ? { mnemonic: validation.mnemonic }
      : { password: validation.password }),
    ...additionalValidation,
  });

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: '',
      username: '',
      mnemonic: '',
      password: '',
      ...additionalInitialValues,
    },
    validationSchema,
    onSubmit,
  });

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          {labels.title}
        </Typography>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            fullWidth
            id={loginType}
            label={loginType === 'email' ? labels.email : labels.username}
            name={loginType}
            autoComplete={loginType === 'email' ? 'email' : 'username'}
            autoFocus
            value={loginType === 'email' ? formik.values.email : formik.values.username}
            onChange={formik.handleChange}
            error={formik.touched[loginType] && Boolean(formik.errors[loginType])}
            helperText={formik.touched[loginType] && formik.errors[loginType]}
          />
          {authType === 'password' ? (
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={labels.password}
              id="password"
              type={showSecret ? 'text' : 'password'}
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={labels.toggleVisibility}
                        onClick={() => setShowSecret(!showSecret)}
                        edge="end"
                      >
                        {showSecret ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          ) : (
            <TextField
              margin="normal"
              required
              fullWidth
              name="mnemonic"
              label={labels.mnemonic}
              id="mnemonic"
              multiline
              rows={3}
              value={formik.values.mnemonic}
              onChange={formik.handleChange}
              error={formik.touched.mnemonic && Boolean(formik.errors.mnemonic)}
              helperText={formik.touched.mnemonic && formik.errors.mnemonic}
              type={showSecret ? 'text' : 'password'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={labels.toggleVisibility}
                        onClick={() => setShowSecret(!showSecret)}
                        edge="end"
                      >
                        {showSecret ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
          {additionalFields && additionalFields(formik)}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={formik.isSubmitting}
          >
            {labels.signIn}
          </Button>
          {(showForgotPassword || showSignUp) && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {showForgotPassword && (
                <Link href={forgotPasswordLink} variant="body2">
                  {labels.forgotPassword}
                </Link>
              )}
              {showSignUp && (
                <Link href={signUpLink} variant="body2">
                  {labels.signUp}
                </Link>
              )}
            </Box>
          )}
          {(allowLoginTypeToggle || allowAuthTypeToggle) && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              {allowLoginTypeToggle && (
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setLoginType(loginType === 'email' ? 'username' : 'email')}
                >
                  {loginType === 'email' ? labels.useUsername : labels.useEmail}
                </Button>
              )}
              {allowAuthTypeToggle && (
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setAuthType(authType === 'password' ? 'mnemonic' : 'password')}
                >
                  {authType === 'password' ? labels.useMnemonic : labels.usePassword}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};
