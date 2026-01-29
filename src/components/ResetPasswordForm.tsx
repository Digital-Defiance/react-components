import {
  Constants,
  SuiteCoreComponentId,
  SuiteCoreStringKey,
  SuiteCoreStringKeyValue,
} from '@digitaldefiance/suite-core-lib';
import {
  Alert,
  Box,
  Button,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import { FC, useState } from 'react';
import * as Yup from 'yup';
import { useI18n } from '../contexts';

export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordFormProps {
  token: string | null;
  onSubmit: (token: string, password: string) => Promise<void>;
  passwordValidation?: Yup.StringSchema;
  confirmPasswordValidation?: Yup.StringSchema;
  labels?: {
    title?: string;
    password?: string;
    confirmPassword?: string;
    resetButton?: string;
    successMessage?: string;
    invalidToken?: string;
  };
}

export const ResetPasswordForm: FC<ResetPasswordFormProps> = ({
  token,
  onSubmit,
  passwordValidation,
  confirmPasswordValidation,
  labels = {},
}) => {
  const { tComponent } = useI18n();
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  const validation = {
    password:
      passwordValidation ||
      Yup.string()
        .min(
          Constants.PasswordMinLength,
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_PasswordMinLengthTemplate
          )
        )
        .required(
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_Required
          )
        ),
    confirmPassword:
      confirmPasswordValidation ||
      Yup.string()
        .oneOf(
          [Yup.ref('password')],
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_PasswordMatch
          )
        )
        .required(
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_Required
          )
        ),
  };

  const translatedLabels = {
    title:
      labels.title ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.PasswordReset_Title
      ),
    password:
      labels.password ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Common_NewPassword
      ),
    confirmPassword:
      labels.confirmPassword ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Common_ConfirmNewPassword
      ),
    resetButton:
      labels.resetButton ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.PasswordReset_Button
      ),
    successMessage:
      labels.successMessage ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.PasswordReset_Success
      ),
    invalidToken:
      labels.invalidToken ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.ForgotPassword_InvalidToken
      ),
  };

  const formik = useFormik<ResetPasswordFormValues>({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      password: validation.password,
      confirmPassword: validation.confirmPassword,
    }),
    onSubmit: async (values) => {
      if (!token) {
        setApiError(translatedLabels.invalidToken);
        return;
      }

      try {
        await onSubmit(token, values.password);
        setSuccess(true);
        setApiError('');
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        setApiError(
          err.response?.data?.message ||
            tComponent<SuiteCoreStringKeyValue>(
              SuiteCoreComponentId,
              SuiteCoreStringKey.Error_PasswordChange
            )
        );
        setSuccess(false);
      }
    },
  });

  if (!token) {
    return (
      <Container maxWidth="sm">
        <Alert severity="error" sx={{ mt: 4 }}>
          {translatedLabels.invalidToken}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          {translatedLabels.title}
        </Typography>

        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          sx={{ mt: 1, width: '100%' }}
        >
          <TextField
            fullWidth
            id="password"
            name="password"
            label={translatedLabels.password}
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
            label={translatedLabels.confirmPassword}
            type="password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(
              formik.touched.confirmPassword && formik.errors.confirmPassword
            )}
            helperText={
              formik.touched.confirmPassword && formik.errors.confirmPassword
            }
            margin="normal"
          />

          {apiError && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {apiError}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
              {translatedLabels.successMessage}
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
            {translatedLabels.resetButton}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ResetPasswordForm;
