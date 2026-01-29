import {
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
  const { tComponent } = useI18n();
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string>('');

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
  };

  const translatedLabels = {
    title:
      labels.title ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.ForgotPassword_Title
      ),
    email:
      labels.email ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Common_Email
      ),
    sendResetLink:
      labels.sendResetLink ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.ForgotPassword_SendResetLink
      ),
    successMessage:
      labels.successMessage ||
      tComponent<SuiteCoreStringKeyValue>(
        SuiteCoreComponentId,
        SuiteCoreStringKey.PasswordReset_Success
      ),
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
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        setApiError(
          err.response?.data?.message ||
            tComponent<SuiteCoreStringKeyValue>(
              SuiteCoreComponentId,
              SuiteCoreStringKey.ForgotPassword_Error
            )
        );
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

        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          sx={{ mt: 1, width: '100%' }}
        >
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

export default ForgotPasswordForm;
