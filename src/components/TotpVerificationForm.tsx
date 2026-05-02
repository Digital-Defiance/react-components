import { Box, Button, Container, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { FC, useState } from 'react';
import * as Yup from 'yup';
import { IRequestUserDTO } from '@digitaldefiance/suite-core-lib';

export interface TotpVerificationFormValues {
  code: string;
}

export interface TotpVerificationFormProps {
  pendingTotpToken: string;
  onSubmit: (
    code: string,
    pendingTotpToken: string
  ) => Promise<
    { token: string; user: IRequestUserDTO } | { error: string }
  >;
  labels?: {
    title?: string;
    codeLabel?: string;
    submitButton?: string;
    errorMessage?: string;
  };
}

const defaultLabels = {
  title: 'Two-Factor Authentication',
  codeLabel: 'Authentication code',
  submitButton: 'Verify',
  errorMessage: 'An unexpected error occurred',
};

const totpCodeSchema = Yup.object({
  code: Yup.string()
    .required('Authentication code is required')
    .matches(/^\d{6}$/, 'Code must be exactly 6 digits'),
});

export const TotpVerificationForm: FC<TotpVerificationFormProps> = ({
  pendingTotpToken,
  onSubmit,
  labels = {},
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolvedLabels = {
    title: labels.title ?? defaultLabels.title,
    codeLabel: labels.codeLabel ?? defaultLabels.codeLabel,
    submitButton: labels.submitButton ?? defaultLabels.submitButton,
    errorMessage: labels.errorMessage ?? defaultLabels.errorMessage,
  };

  const formik = useFormik<TotpVerificationFormValues>({
    initialValues: {
      code: '',
    },
    validationSchema: totpCodeSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitError(null);
        const result = await onSubmit(values.code, pendingTotpToken);
        if ('error' in result) {
          setSubmitError(result.error);
        }
      } catch {
        setSubmitError(resolvedLabels.errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const errorId = 'totp-verification-error';

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
              ...(submitError ? { 'aria-describedby': errorId } : {}),
            }}
            autoComplete="one-time-code"
            autoFocus
            value={formik.values.code}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              (formik.touched.code && Boolean(formik.errors.code)) ||
              Boolean(submitError)
            }
            helperText={formik.touched.code && formik.errors.code}
          />

          {submitError && (
            <Typography
              id={errorId}
              color="error"
              variant="body2"
              sx={{ mt: 1 }}
              role="alert"
            >
              {submitError}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={formik.isSubmitting}
          >
            {resolvedLabels.submitButton}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default TotpVerificationForm;
