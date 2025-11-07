import { Alert, Box, Button, Container, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { FC, useState } from 'react';
import * as Yup from 'yup';
import { Constants, SuiteCoreComponentId, SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';
import { useI18n } from '../contexts';

export interface BackupCodesFormValues {
  password?: string;
  mnemonic?: string;
}

export interface BackupCodesFormProps {
  onSubmit: (values: BackupCodesFormValues) => Promise<{
    message: string;
    backupCodes: string[];
  }>;
  backupCodesRemaining?: number | null;
  mnemonicValidation?: Yup.StringSchema;
  passwordValidation?: Yup.StringSchema;
  labels?: {
    title?: string;
    codesRemaining?: string;
    mnemonic?: string;
    password?: string;
    generateButton?: string;
    successTitle?: string;
  };
}

export const BackupCodesForm: FC<BackupCodesFormProps> = ({
  onSubmit,
  backupCodesRemaining = null,
  mnemonicValidation,
  passwordValidation,
  labels = {},
}) => {
  const { t, tComponent } = useI18n();
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const validation = {
    mnemonic: mnemonicValidation || Yup.string()
      .trim()
      .matches(Constants.MnemonicRegex, tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_MnemonicRegex))
      .optional(),
    password: passwordValidation || Yup.string()
      .trim()
      .matches(Constants.PasswordRegex, tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_PasswordRegexErrorTemplate))
      .optional(),
  };

  const translatedLabels = {
    codesRemaining: labels.codesRemaining || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.BackupCodeRecovery_CodesRemainingTemplate),
    mnemonic: labels.mnemonic || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Mnemonic),
    password: labels.password || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Password),
    generateButton: labels.generateButton || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.BackupCodeRecovery_GenerateNewCodes),
    successTitle: labels.successTitle || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.BackupCodeRecovery_YourNewCodes),
    xorError: tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Validation_MnemonicOrPasswordRequired),
    unexpectedError: tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_UnexpectedError),
  };

  const validationSchema = Yup.object({
    mnemonic: validation.mnemonic,
    password: validation.password,
  })
    .test('xor-mnemonic-password-mnemonic', translatedLabels.xorError, function (value) {
      const mnemonic = value?.mnemonic?.trim() ?? '';
      const password = value?.password?.trim() ?? '';
      const hasMnemonic = mnemonic.length > 0;
      const hasPassword = password.length > 0;

      if (!hasMnemonic && !hasPassword) {
        return this.createError({
          path: 'mnemonic',
          message: translatedLabels.xorError,
        });
      }
      if (hasMnemonic && hasPassword) {
        return this.createError({
          path: 'mnemonic',
          message: translatedLabels.xorError,
        });
      }
      return true;
    })
    .test('xor-mnemonic-password-password', translatedLabels.xorError, function (value) {
      const mnemonic = value?.mnemonic?.trim() ?? '';
      const password = value?.password?.trim() ?? '';
      const hasMnemonic = mnemonic.length > 0;
      const hasPassword = password.length > 0;

      if (!hasMnemonic && !hasPassword) {
        return this.createError({
          path: 'password',
          message: translatedLabels.xorError,
        });
      }
      if (hasMnemonic && hasPassword) {
        return this.createError({
          path: 'password',
          message: translatedLabels.xorError,
        });
      }
      return true;
    });

  const formik = useFormik<BackupCodesFormValues>({
    initialValues: {
      password: '',
      mnemonic: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const result = await onSubmit(values);
        if (result && result.backupCodes) {
          setApiSuccess(translatedLabels.successTitle);
          setBackupCodes(result.backupCodes);
        }
        if (result && result.message) {
          setApiSuccess(result.message);
        }
        setApiError(null);
      } catch (e: any) {
        setApiSuccess(null);
        setApiError(e.response?.data?.message ?? translatedLabels.unexpectedError);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Container component="main" maxWidth="xs">
      <Box>
        <Typography component="h1" variant="h5">
          {translatedLabels.codesRemaining.replace('{count}', String(backupCodesRemaining ?? 0))}
        </Typography>
      </Box>
      <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
        <TextField
          margin="normal"
          fullWidth
          id="mnemonic"
          label={translatedLabels.mnemonic}
          type="password"
          name="mnemonic"
          autoComplete="mnemonic"
          autoFocus
          value={formik.values.mnemonic}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={(formik.touched.mnemonic || formik.submitCount > 0) && Boolean(formik.errors.mnemonic)}
          helperText={(formik.touched.mnemonic || formik.submitCount > 0) && formik.errors.mnemonic}
        />
        <TextField
          margin="normal"
          fullWidth
          name="password"
          label={translatedLabels.password}
          type="password"
          id="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={(formik.touched.password || formik.submitCount > 0) && Boolean(formik.errors.password)}
          helperText={(formik.touched.password || formik.submitCount > 0) && formik.errors.password}
        />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
          {translatedLabels.generateButton}
        </Button>
      </Box>
      {apiError && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {apiError}
        </Alert>
      )}
      {backupCodes && apiSuccess && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography component="h2" variant="h6">
            {apiSuccess}
          </Typography>
          <ul>
            {backupCodes.map((code, index) => (
              <li key={index}>
                <pre>{code}</pre>
              </li>
            ))}
          </ul>
        </Box>
      )}
    </Container>
  );
};
