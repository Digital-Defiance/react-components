import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import { FC, useState } from 'react';
import * as Yup from 'yup';
import { Constants, SuiteCoreComponentId, SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';
import { useI18n } from '../contexts';

export interface BackupCodeLoginFormValues {
  email: string;
  username: string;
  code: string;
  newPassword?: string;
  confirmNewPassword?: string;
  recoverMnemonic: boolean;
}

export interface BackupCodeLoginFormProps {
  onSubmit: (
    identifier: string,
    code: string,
    isEmail: boolean,
    recoverMnemonic: boolean,
    newPassword?: string
  ) => Promise<
    | { token: string; codeCount: number; mnemonic?: string; message?: string }
    | { error: string; status?: number }
  >;
  onNavigate?: (path: string, state?: any) => void;
  isAuthenticated?: boolean;
  emailValidation?: Yup.StringSchema;
  usernameValidation?: Yup.StringSchema;
  codeValidation?: Yup.StringSchema;
  passwordValidation?: Yup.StringSchema;
  confirmPasswordValidation?: Yup.StringSchema;
  labels?: {
    title?: string;
    email?: string;
    username?: string;
    code?: string;
    newPassword?: string;
    confirmPassword?: string;
    recoverMnemonic?: string;
    login?: string;
    useUsername?: string;
    useEmail?: string;
    dashboard?: string;
    generateNewCodes?: string;
    mnemonicLabel?: string;
    codesRemaining?: string;
  };
}

export const BackupCodeLoginForm: FC<BackupCodeLoginFormProps> = ({
  onSubmit,
  onNavigate,
  isAuthenticated = false,
  emailValidation,
  usernameValidation,
  codeValidation,
  passwordValidation,
  confirmPasswordValidation,
  labels = {},
}) => {
  const { t, tComponent } = useI18n();
  const [loginType, setLoginType] = useState<'email' | 'username'>('email');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [recoveredMnemonic, setRecoveredMnemonic] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [codesRemaining, setCodesRemaining] = useState<number | null>(null);

  const validation = {
    email: emailValidation || Yup.string()
      .email(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_InvalidEmail))
      .required(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    username: usernameValidation || Yup.string()
      .matches(Constants.UsernameRegex, tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_UsernameRegexErrorTemplate))
      .required(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    code: codeValidation || Yup.string()
      .required(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required))
      .matches(Constants.BACKUP_CODES.DisplayRegex, tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_InvalidBackupCode)),
    password: passwordValidation || Yup.string()
      .matches(Constants.PasswordRegex, tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_PasswordRegexErrorTemplate)),
    confirmPassword: confirmPasswordValidation || Yup.string()
      .oneOf([Yup.ref('newPassword')], tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_PasswordMatch)),
  };

  const translatedLabels = {
    title: labels.title || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.BackupCodeRecovery_Title),
    email: labels.email || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Email),
    username: labels.username || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Username),
    code: labels.code || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_BackupCode),
    newPassword: labels.newPassword || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_NewPassword),
    confirmPassword: labels.confirmPassword || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_ConfirmNewPassword),
    recoverMnemonic: labels.recoverMnemonic || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.BackupCodeRecovery_RecoverMnemonic),
    login: labels.login || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.BackupCodeRecovery_Login),
    useUsername: labels.useUsername || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Login_UseUsername),
    useEmail: labels.useEmail || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Login_UseEmail),
    dashboard: labels.dashboard || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Dashboard),
    generateNewCodes: labels.generateNewCodes || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.BackupCodeRecovery_GenerateNewCodes),
    mnemonicLabel: labels.mnemonicLabel || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Mnemonic),
    codesRemaining: labels.codesRemaining || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.BackupCodeRecovery_CodesRemainingTemplate),
    unexpectedError: tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_UnexpectedError),
  };

  const validationSchema = Yup.object({
    [loginType]: loginType === 'email' ? validation.email : validation.username,
    code: validation.code,
    newPassword: validation.password,
    confirmNewPassword: validation.confirmPassword,
  });

  const formik = useFormik<BackupCodeLoginFormValues>({
    initialValues: {
      email: '',
      username: '',
      code: '',
      newPassword: '',
      confirmNewPassword: '',
      recoverMnemonic: false,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const loginResult = await onSubmit(
          loginType === 'email' ? values.email : values.username,
          values.code,
          loginType === 'email',
          values.recoverMnemonic,
          values.newPassword && values.newPassword.length > 0 ? values.newPassword : undefined
        );
        if ('error' in loginResult) {
          setLoginError(loginResult.error);
          setCodesRemaining(null);
          setRecoveredMnemonic(null);
          return;
        }
        setLoginError(null);
        if (loginResult.codeCount) {
          setCodesRemaining(loginResult.codeCount);
        }
        if (loginResult.mnemonic) {
          setRecoveredMnemonic(loginResult.mnemonic);
        }
        if (loginResult.message) {
          setSuccessMessage(loginResult.message);
        }
      } catch {
        setLoginError(translatedLabels.unexpectedError);
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (isAuthenticated && recoveredMnemonic === null && codesRemaining === null) {
    onNavigate?.('/dashboard');
    return null;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          {translatedLabels.title}
        </Typography>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
          {!isAuthenticated && (
            <>
              <TextField
                margin="normal"
                fullWidth
                id={loginType}
                label={loginType === 'email' ? translatedLabels.email : translatedLabels.username}
                name={loginType}
                autoComplete={loginType === 'email' ? 'email' : 'username'}
                autoFocus
                value={loginType === 'email' ? formik.values.email : formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched[loginType] && Boolean(formik.errors[loginType])}
                helperText={formik.touched[loginType] && formik.errors[loginType]}
                disabled={isAuthenticated}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="code"
                label={translatedLabels.code}
                id="code"
                value={formik.values.code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.code && Boolean(formik.errors.code)}
                helperText={formik.touched.code && formik.errors.code}
                disabled={isAuthenticated}
              />
              <TextField
                margin="normal"
                fullWidth
                name="newPassword"
                label={translatedLabels.newPassword}
                type="password"
                id="newPassword"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
                helperText={formik.touched.newPassword && formik.errors.newPassword}
                disabled={isAuthenticated}
              />
              <TextField
                margin="normal"
                fullWidth
                name="confirmNewPassword"
                label={translatedLabels.confirmPassword}
                type="password"
                id="confirmNewPassword"
                value={formik.values.confirmNewPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmNewPassword && Boolean(formik.errors.confirmNewPassword)}
                helperText={formik.touched.confirmNewPassword && formik.errors.confirmNewPassword}
                disabled={isAuthenticated}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formik.values.recoverMnemonic}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    name="recoverMnemonic"
                  />
                }
                label={translatedLabels.recoverMnemonic}
                disabled={isAuthenticated}
              />
            </>
          )}
          {successMessage && (
            <Typography color="success.main" variant="body2" sx={{ mt: 1 }}>
              {successMessage}
            </Typography>
          )}
          {recoveredMnemonic && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {translatedLabels.mnemonicLabel}:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {recoveredMnemonic}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => onNavigate?.('/dashboard')}
              >
                {translatedLabels.dashboard}
              </Button>
            </Box>
          )}
          {codesRemaining !== null && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                {translatedLabels.codesRemaining.replace('{count}', String(codesRemaining))}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => onNavigate?.('/backup-codes', { codeCount: codesRemaining })}
              >
                {translatedLabels.generateNewCodes}
              </Button>
            </Box>
          )}
          {loginError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {loginError}
            </Typography>
          )}
          {!isAuthenticated && (
            <>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={formik.isSubmitting}
              >
                {translatedLabels.login}
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setLoginType(loginType === 'email' ? 'username' : 'email')}
                >
                  {loginType === 'email' ? translatedLabels.useUsername : translatedLabels.useEmail}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};
