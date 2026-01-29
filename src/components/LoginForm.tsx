import {
  Constants,
  SuiteCoreComponentId,
  SuiteCoreStringKey,
  SuiteCoreStringKeyValue,
} from '@digitaldefiance/suite-core-lib';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert,
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
import { useI18n } from '../contexts';

export interface LoginFormValues {
  email?: string;
  username?: string;
  password?: string;
  mnemonic?: string;
  [key: string]: string | boolean | undefined;
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
  additionalFields?: (
    formik: ReturnType<typeof useFormik<LoginFormValues>>
  ) => React.ReactNode;
  additionalInitialValues?: Record<string, string | boolean>;
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
  const { tComponent } = useI18n();
  const [loginType, setLoginType] = useState<'email' | 'username'>(
    initialLoginType
  );
  const [authType, setAuthType] = useState<'password' | 'mnemonic'>(
    initialAuthType
  );
  const [showSecret, setShowSecret] = useState(false);

  // Use translations with fallbacks
  const labels = {
    title:
      titleText ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Login_Title
      ),
    email:
      emailLabel ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Common_Email
      ),
    username:
      usernameLabel ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Common_Username
      ),
    password:
      passwordLabel ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Common_Password
      ),
    mnemonic:
      mnemonicLabel ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Common_Mnemonic
      ),
    signIn:
      signInButtonText ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.SignInButton
      ),
    forgotPassword:
      forgotPasswordText ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Login_ForgotPassword
      ),
    signUp:
      signUpText ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Login_SignUp
      ),
    useUsername:
      useUsernameText ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Login_UseUsername
      ),
    useEmail:
      useEmailText ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Login_UseEmailAddress
      ),
    useMnemonic:
      useMnemonicText ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Common_UseMnemonic
      ),
    usePassword:
      usePasswordText ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Common_UsePassword
      ),
    toggleVisibility:
      toggleVisibilityLabel ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.TogglePasswordVisibility
      ),
  };

  const validation = {
    email:
      emailValidation ||
      Yup.string()
        .email(
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_InvalidEmail
          )
        )
        .required(
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_Required
          )
        ),
    username:
      usernameValidation ||
      Yup.string()
        .matches(
          Constants.UsernameRegex,
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_UsernameRegexErrorTemplate
          )
        )
        .required(
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_Required
          )
        ),
    password:
      passwordValidation ||
      Yup.string()
        .min(
          1,
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_Required
          )
        )
        .required(
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_Required
          )
        ),
    mnemonic:
      mnemonicValidation ||
      Yup.string()
        .matches(
          Constants.MnemonicRegex,
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_InvalidMnemonic
          )
        )
        .required(
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_Required
          )
        ),
  };

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: '',
      username: '',
      mnemonic: '',
      password: '',
      ...additionalInitialValues,
    },
    validationSchema: Yup.object({
      [loginType]:
        loginType === 'email' ? validation.email : validation.username,
      ...(authType === 'mnemonic'
        ? { mnemonic: validation.mnemonic }
        : { password: validation.password }),
      ...additionalValidation,
    }),
    enableReinitialize: true,
    onSubmit: async (values, { setStatus }) => {
      try {
        setStatus(null);
        await onSubmit(values);
      } catch (error: unknown) {
        const err = error as { message?: string };
        setStatus(
          err.message ||
            tComponent<SuiteCoreStringKeyValue>(
              SuiteCoreComponentId,
              SuiteCoreStringKey.Common_UnexpectedError
            )
        );
        throw error;
      }
    },
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
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          sx={{ mt: 1, width: '100%' }}
        >
          {formik.status && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formik.status}
            </Alert>
          )}
          <TextField
            margin="normal"
            fullWidth
            id={loginType}
            label={loginType === 'email' ? labels.email : labels.username}
            name={loginType}
            autoComplete={loginType === 'email' ? 'email' : 'username'}
            autoFocus
            value={
              loginType === 'email'
                ? formik.values.email
                : formik.values.username
            }
            onChange={formik.handleChange}
            error={
              formik.touched[loginType] && Boolean(formik.errors[loginType])
            }
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
                  onClick={() => {
                    const newType =
                      loginType === 'email' ? 'username' : 'email';
                    formik.setFieldValue(loginType, '');
                    setLoginType(newType);
                  }}
                >
                  {loginType === 'email' ? labels.useUsername : labels.useEmail}
                </Button>
              )}
              {allowAuthTypeToggle && (
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => {
                    const newType =
                      authType === 'password' ? 'mnemonic' : 'password';
                    formik.setFieldValue(authType, '');
                    setAuthType(newType);
                  }}
                >
                  {authType === 'password'
                    ? labels.useMnemonic
                    : labels.usePassword}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default LoginForm;
