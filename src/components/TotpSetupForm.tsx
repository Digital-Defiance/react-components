import { Box, Button, Container, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { QRCodeSVG } from 'qrcode.react';
import { FC, useState } from 'react';
import * as Yup from 'yup';

export interface TotpSetupFormValues {
  code: string;
}

export interface TotpSetupFormProps {
  provisioningUri: string;
  secret: string;
  onConfirm: (
    code: string
  ) => Promise<{ success: boolean } | { error: string }>;
  labels?: {
    title?: string;
    qrCodeAlt?: string;
    secretLabel?: string;
    codeLabel?: string;
    confirmButton?: string;
    errorMessage?: string;
  };
}

const defaultLabels = {
  title: 'Set Up Two-Factor Authentication',
  qrCodeAlt: 'QR code for TOTP authenticator app setup',
  secretLabel: 'Manual entry key',
  codeLabel: 'Confirmation code',
  confirmButton: 'Confirm',
  errorMessage: 'An unexpected error occurred',
};

const totpCodeSchema = Yup.object({
  code: Yup.string()
    .required('Confirmation code is required')
    .matches(/^\d{6}$/, 'Code must be exactly 6 digits'),
});

export const TotpSetupForm: FC<TotpSetupFormProps> = ({
  provisioningUri,
  secret,
  onConfirm,
  labels = {},
}) => {
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const resolvedLabels = {
    title: labels.title ?? defaultLabels.title,
    qrCodeAlt: labels.qrCodeAlt ?? defaultLabels.qrCodeAlt,
    secretLabel: labels.secretLabel ?? defaultLabels.secretLabel,
    codeLabel: labels.codeLabel ?? defaultLabels.codeLabel,
    confirmButton: labels.confirmButton ?? defaultLabels.confirmButton,
    errorMessage: labels.errorMessage ?? defaultLabels.errorMessage,
  };

  const formik = useFormik<TotpSetupFormValues>({
    initialValues: {
      code: '',
    },
    validationSchema: totpCodeSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setConfirmError(null);
        const result = await onConfirm(values.code);
        if ('error' in result) {
          setConfirmError(result.error);
        }
      } catch {
        setConfirmError(resolvedLabels.errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const errorId = 'totp-setup-error';

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
          {resolvedLabels.title}
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <QRCodeSVG
            value={provisioningUri}
            size={200}
            role="img"
            aria-label={resolvedLabels.qrCodeAlt}
          />
        </Box>

        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 1,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {resolvedLabels.secretLabel}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              userSelect: 'all',
            }}
          >
            {secret}
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          sx={{ mt: 2, width: '100%' }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="code"
            name="code"
            label={resolvedLabels.codeLabel}
            inputProps={{
              'aria-label': resolvedLabels.codeLabel,
              inputMode: 'numeric',
              maxLength: 6,
              pattern: '\\d{6}',
              ...(confirmError ? { 'aria-describedby': errorId } : {}),
            }}
            autoComplete="one-time-code"
            autoFocus
            value={formik.values.code}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              (formik.touched.code && Boolean(formik.errors.code)) ||
              Boolean(confirmError)
            }
            helperText={formik.touched.code && formik.errors.code}
          />

          {confirmError && (
            <Typography
              id={errorId}
              color="error"
              variant="body2"
              sx={{ mt: 1 }}
              role="alert"
            >
              {confirmError}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={formik.isSubmitting}
          >
            {resolvedLabels.confirmButton}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default TotpSetupForm;
