import { Alert, Box, Button, Container, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { FC, useState } from 'react';
import * as Yup from 'yup';
import { SuiteCoreComponentId, SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';
import { useI18n } from '../contexts';

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ForgotPasswordFormProps {
  onSubmit: (values: ForgotPasswordFormValues) => Promise<void>;
  emailValidation?: Yup.StringSchema;
  labels?: {
    title?: string;
    email?: string;
    sendResetLink?: string;
    successMessage?: string;
  };
}

export const ForgotPasswordForm: FC<ForgotPasswordFormProps> = ({
  onSubmit,
  emailValidation,
  labels = {},
}) => {
  const { t, tComponent } = useI18n();
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  const validation = {
    email: emailValidation || Yup.string()
      .email(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_InvalidEmail))
      .required(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
  };

  const translatedLabels = {
    title: labels.title || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.ForgotPassword_Title),
    email: labels.email || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Email),
    sendResetLink: labels.sendResetLink || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.ForgotPassword_SendResetLink),
    successMessage: labels.successMessage || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.PasswordReset_Success),
  };

  const formik = useFormik<ForgotPasswordFormValues>({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: validation.email,
    }),
    onSubmit: async (values) => {
      try {
        await onSubmit(values);
        setSuccess(true);
        setApiError('');
      } catch (error: any) {
        setApiError(error.response?.data?.message || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.ForgotPassword_Error));
        setSuccess(false);
      }
    },
  });

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

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label={translatedLabels.email}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.touched.email && formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
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
            {translatedLabels.sendResetLink}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
