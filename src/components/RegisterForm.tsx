import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import { FC, useState } from 'react';
import * as Yup from 'yup';
import { SuiteCoreComponentId, SuiteCoreStringKey, Constants } from '@digitaldefiance/suite-core-lib';
import { useI18n } from '../contexts';

export interface RegisterFormValues {
  username: string;
  email: string;
  timezone: string;
  password?: string;
  confirmPassword?: string;
  [key: string]: any;
}

export interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues, usePassword: boolean) => Promise<
    | { success: boolean; message: string; mnemonic?: string }
    | { error: string; errorType?: string; field?: string; errors?: Array<{ path: string; msg: string }> }
  >;
  timezones: string[];
  getInitialTimezone: () => string;
  usernameValidation?: Yup.StringSchema;
  emailValidation?: Yup.StringSchema;
  timezoneValidation?: Yup.StringSchema;
  passwordValidation?: Yup.StringSchema;
  confirmPasswordValidation?: Yup.StringSchema;
  additionalFields?: (formik: any, usePassword: boolean) => React.ReactNode;
  additionalInitialValues?: Record<string, any>;
  additionalValidation?: Record<string, Yup.Schema>;
  labels?: {
    title?: string;
    username?: string;
    email?: string;
    timezone?: string;
    password?: string;
    confirmPassword?: string;
    useMnemonic?: string;
    usePassword?: string;
    registering?: string;
    register?: string;
    successTitle?: string;
    mnemonicSuccess?: string;
    proceedToLogin?: string;
    loginLink?: string;
  };
}

export const RegisterForm: FC<RegisterFormProps> = ({
  onSubmit,
  timezones,
  getInitialTimezone,
  usernameValidation,
  emailValidation,
  timezoneValidation,
  passwordValidation,
  confirmPasswordValidation,
  additionalFields,
  additionalInitialValues = {},
  additionalValidation = {},
  labels = {},
}) => {
  const { t, tComponent } = useI18n();
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [usePassword, setUsePassword] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registering, setRegistering] = useState(false);

  const validation = {
    username: usernameValidation || Yup.string()
      .min(Constants.UsernameMinLength, tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_UsernameMinLengthTemplate))
      .max(Constants.UsernameMaxLength, tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_UsernameMaxLengthTemplate))
      .matches(Constants.UsernameRegex, tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_UsernameRegexErrorTemplate))
      .required(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    email: emailValidation || Yup.string()
      .email(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_InvalidEmail))
      .required(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    timezone: timezoneValidation || Yup.string()
      .required(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_TimezoneRequired))
      .oneOf(timezones, tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_TimezoneInvalid)),
    password: passwordValidation || Yup.string()
      .matches(Constants.PasswordRegex, tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_PasswordRegexErrorTemplate))
      .min(8, tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_PasswordMinLengthTemplate))
      .required(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    confirmPassword: confirmPasswordValidation || Yup.string()
      .oneOf([Yup.ref('password')], tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_PasswordMatch))
      .required(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
  };

  const formik = useFormik<RegisterFormValues>({
    initialValues: {
      username: '',
      email: '',
      timezone: getInitialTimezone(),
      password: '',
      confirmPassword: '',
      ...additionalInitialValues,
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      username: validation.username,
      email: validation.email,
      timezone: validation.timezone,
      ...(usePassword
        ? {
            password: validation.password,
            confirmPassword: validation.confirmPassword,
          }
        : {}),
      ...additionalValidation,
    }),
    onSubmit: async (values, { setSubmitting, setFieldError, setTouched }) => {
      setRegistering(true);
      const registerResult = await onSubmit(values, usePassword);
      
      if ('success' in registerResult && registerResult.success) {
        setRegistrationSuccess(true);
        if (!usePassword && registerResult?.mnemonic) {
          setMnemonic(registerResult.mnemonic);
        }
      } else {
        setRegistrationSuccess(false);
        const newApiErrors: Record<string, string> = {};
        const fieldsToTouch: Record<string, boolean> = {};

        if ('field' in registerResult && registerResult.field) {
          setFieldError(registerResult.field, registerResult.error);
          fieldsToTouch[registerResult.field] = true;
        }

        if ('errors' in registerResult && registerResult.errors) {
          registerResult.errors.forEach((err) => {
            if (err.path && err.msg) {
              setFieldError(err.path, err.msg);
              fieldsToTouch[err.path] = true;
            }
          });
        }

        if ('error' in registerResult && registerResult.error && !Object.keys(newApiErrors).length) {
          newApiErrors.general = registerResult.error;
        }

        setApiErrors(newApiErrors);
        setTouched(fieldsToTouch, false);
      }
      setSubmitting(false);
      setRegistering(false);
      setApiErrors({});
    },
  });

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {labels.title || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_Registration)}
        </Typography>

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            fullWidth
            id="username"
            name="username"
            label={labels.username || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_Username)}
            value={formik.values.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.touched.username && (formik.errors.username || apiErrors.username))}
            helperText={formik.touched.username && (formik.errors.username || apiErrors.username)}
            margin="normal"
          />
          <TextField
            fullWidth
            id="email"
            name="email"
            label={labels.email || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_Email)}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.touched.email && (formik.errors.email || apiErrors.email))}
            helperText={formik.touched.email && (formik.errors.email || apiErrors.email)}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="timezone-label">{labels.timezone || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_Timezone)}</InputLabel>
            <Select
              labelId="timezone-label"
              id="timezone"
              name="timezone"
              value={formik.values.timezone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.timezone && Boolean(formik.errors.timezone)}
              label={labels.timezone || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_Timezone)}
            >
              {timezones.map((tz) => (
                <MenuItem key={tz} value={tz}>
                  {tz}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.timezone && (formik.errors.timezone || apiErrors.timezone) && (
              <Typography color="error" variant="caption">
                {formik.errors.timezone || apiErrors.timezone}
              </Typography>
            )}
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Button variant="text" onClick={() => setUsePassword(!usePassword)}>
              {usePassword 
                ? labels.useMnemonic || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_UseMnemonic)
                : labels.usePassword || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_UsePassword)}
            </Button>
          </Box>

          {usePassword && (
            <>
              <TextField
                fullWidth
                id="password"
                name="password"
                label={labels.password || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_Password)}
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.password && formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                margin="normal"
              />
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label={labels.confirmPassword || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_ConfirmNewPassword)}
                type="password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                margin="normal"
              />
            </>
          )}

          {additionalFields && additionalFields(formik, usePassword)}

          {apiErrors.general && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {apiErrors.general}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={formik.isSubmitting}
          >
            {registering 
              ? labels.registering || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Registration_Registering)
              : labels.register || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Registration_RegisterButton)}
          </Button>

          {registering && (
            <Alert severity="success" sx={{ mt: 2, mb: 2, whiteSpace: 'pre-wrap' }}>
              <AlertTitle>{labels.registering || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Registration_Registering)}</AlertTitle>
              <Typography variant="body2" component="div">
                {tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Registration_RegisteringMessage)}
              </Typography>
            </Alert>
          )}

          {mnemonic && (
            <Alert severity="success" sx={{ mt: 2, mb: 2, whiteSpace: 'pre-wrap' }}>
              <AlertTitle>{labels.successTitle || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Registration_SuccessTitle)}</AlertTitle>
              <Typography variant="body2" component="div">
                {labels.mnemonicSuccess || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Registration_MnemonicSuccess)}
                <Typography variant="body1" component="div" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {mnemonic}
                </Typography>
                <Box sx={{ textAlign: 'center' }}>
                  <Link href="/login">{labels.proceedToLogin || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.ProceedToLogin)}</Link>
                </Box>
              </Typography>
            </Alert>
          )}

          {registrationSuccess && (
            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
              <AlertTitle>{labels.successTitle || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Registration_SuccessTitle)}</AlertTitle>
              <Typography variant="body2" component="div">
                {tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Registration_Success)}
                <Box sx={{ textAlign: 'center' }}>
                  <Link href="/login">{labels.proceedToLogin || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.ProceedToLogin)}</Link>
                </Box>
              </Typography>
            </Alert>
          )}
          {!mnemonic && !registrationSuccess && (
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/login" variant="body2">
                {labels.loginLink || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Registration_LoginLink)}
              </Link>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};
