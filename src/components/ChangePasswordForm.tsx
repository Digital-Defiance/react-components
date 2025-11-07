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
import { Constants, SuiteCoreComponentId, SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';
import { useI18n } from '../contexts';

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordFormProps {
  onSubmit: (values: ChangePasswordFormValues) => Promise<{ success?: boolean; error?: string }>;
  titleText?: string;
  currentPasswordLabel?: string;
  newPasswordLabel?: string;
  confirmPasswordLabel?: string;
  submitButtonText?: string;
  submittingButtonText?: string;
  successMessage?: string;
  currentPasswordValidation?: Yup.StringSchema;
  newPasswordValidation?: Yup.StringSchema;
  confirmPasswordValidation?: Yup.StringSchema;
}

export const ChangePasswordForm: FC<ChangePasswordFormProps> = ({
  onSubmit,
  titleText,
  currentPasswordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
  submitButtonText,
  submittingButtonText,
  successMessage,
  currentPasswordValidation,
  newPasswordValidation,
  confirmPasswordValidation,
}) => {
  const { t, tComponent } = useI18n();
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  const validation = {
    currentPassword: currentPasswordValidation || Yup.string().required(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    newPassword: newPasswordValidation || Yup.string()
      .min(Constants.PasswordMinLength, tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_PasswordMinLengthTemplate))
      .required(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    confirmPassword: confirmPasswordValidation || Yup.string()
      .oneOf([Yup.ref('newPassword')], tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_PasswordMatch))
      .required(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
  };

  const labels = {
    title: titleText || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_ChangePassword),
    currentPassword: currentPasswordLabel || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_CurrentPassword),
    newPassword: newPasswordLabel || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_NewPassword),
    confirmPassword: confirmPasswordLabel || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_ConfirmNewPassword),
    submitButton: submitButtonText || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_ChangePassword),
    submittingButton: submittingButtonText || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_ChangingPassword),
    success: successMessage || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.PasswordChange_Success),
  };

  const formik = useFormik<ChangePasswordFormValues>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: validation.currentPassword,
      newPassword: validation.newPassword,
      confirmPassword: validation.confirmPassword,
    }),
    onSubmit: async (values, { resetForm }) => {
      const result = await onSubmit(values);

      if ('success' in result) {
        setSuccess(true);
        setApiError('');
        resetForm();
      } else if ('error' in result && result.error) {
        setApiError(result.error);
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
          {labels.title}
        </Typography>

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            fullWidth
            id="currentPassword"
            name="currentPassword"
            label={labels.currentPassword}
            type="password"
            value={formik.values.currentPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.touched.currentPassword && formik.errors.currentPassword)}
            helperText={formik.touched.currentPassword && formik.errors.currentPassword}
            margin="normal"
          />

          <TextField
            fullWidth
            id="newPassword"
            name="newPassword"
            label={labels.newPassword}
            type="password"
            value={formik.values.newPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.touched.newPassword && formik.errors.newPassword)}
            helperText={formik.touched.newPassword && formik.errors.newPassword}
            margin="normal"
          />

          <TextField
            fullWidth
            id="confirmPassword"
            name="confirmPassword"
            label={labels.confirmPassword}
            type="password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            margin="normal"
          />

          {apiError && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {apiError}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
              {labels.success}
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
            {formik.isSubmitting ? labels.submittingButton : labels.submitButton}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
