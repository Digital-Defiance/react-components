import { CurrencyCode } from '@digitaldefiance/i18n-lib';
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
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import moment from 'moment-timezone';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import * as Yup from 'yup';
import { useI18n } from '../contexts';
import { Constants } from '@digitaldefiance/suite-core-lib';
import { TotpSetupForm } from './TotpSetupForm';

export interface UserSettingsFormValues {
  email: string;
  timezone: string;
  siteLanguage: string;
  currency: string;
  darkMode: boolean;
  directChallenge: boolean;
  displayName?: string;
  [key: string]: string | boolean | undefined;
}

export interface UserSettingsFormProps {
  initialValues: UserSettingsFormValues;
  onSubmit: (values: UserSettingsFormValues) => Promise<
    | { success: boolean; message: string }
    | {
        error: string;
        errorType?: string;
        field?: string;
        errors?: Array<{ path: string; msg: string }>;
      }
  >;
  languages: Array<{ code: string; label: string }>;
  emailValidation?: Yup.StringSchema;
  timezoneValidation?: Yup.StringSchema;
  siteLanguageValidation?: Yup.StringSchema;
  currencyValidation?: Yup.StringSchema;
  darkModeValidation?: Yup.BooleanSchema;
  directChallengeValidation?: Yup.BooleanSchema;
  displayNameValidation?: Yup.StringSchema;
  additionalFields?: (
    formik: ReturnType<typeof useFormik<UserSettingsFormValues>>
  ) => React.ReactNode;
  additionalInitialValues?: Record<string, string | boolean>;
  additionalValidation?: Record<string, Yup.Schema>;
  /**
   * Current TOTP 2FA status. When undefined (not passed), no TOTP controls are rendered.
   * When false, an "Enable 2FA" button is shown. When true, "Disable 2FA" and "Reset 2FA" buttons are shown.
   */
  totpEnabled?: boolean;
  /**
   * Called to initiate TOTP setup (e.g. AuthService.setupTotp()).
   * Must return provisioning URI and secret on success, or an error.
   */
  onTotpSetup?: () => Promise<
    | { provisioningUri: string; secret: string }
    | { error: string }
  >;
  /**
   * Called to confirm TOTP setup with a 6-digit code (e.g. AuthService.confirmTotp()).
   */
  onTotpConfirm?: (
    code: string
  ) => Promise<{ success: boolean } | { error: string }>;
  /**
   * Called to disable TOTP with a 6-digit code (e.g. AuthService.disableTotp()).
   */
  onTotpDisable?: (
    code: string
  ) => Promise<{ success: boolean } | { error: string }>;
  /**
   * Called to reset TOTP with a 6-digit code (e.g. AuthService.resetTotp()).
   * Returns new provisioning URI and secret on success.
   */
  onTotpReset?: (
    code: string
  ) => Promise<
    | { provisioningUri: string; secret: string }
    | { error: string }
  >;
  labels?: {
    title?: string;
    email?: string;
    emailHelper?: string;
    timezone?: string;
    siteLanguage?: string;
    currency?: string;
    darkMode?: string;
    directChallenge?: string;
    directChallengeHelper?: string;
    displayName?: string;
    saving?: string;
    save?: string;
    successMessage?: string;
    totpSectionTitle?: string;
    totpStatusEnabled?: string;
    totpStatusDisabled?: string;
    totpEnableButton?: string;
    totpDisableButton?: string;
    totpResetButton?: string;
    totpDisableCodeLabel?: string;
    totpDisableSubmitButton?: string;
    totpResetCodeLabel?: string;
    totpResetSubmitButton?: string;
    totpCancelButton?: string;
    totpError?: string;
  };
}

export const UserSettingsForm: FC<UserSettingsFormProps> = ({
  initialValues,
  onSubmit,
  languages,
  emailValidation,
  timezoneValidation,
  siteLanguageValidation,
  currencyValidation,
  darkModeValidation,
  directChallengeValidation,
  displayNameValidation,
  additionalFields,
  additionalInitialValues = {},
  additionalValidation = {},
  totpEnabled,
  onTotpSetup,
  onTotpConfirm,
  onTotpDisable,
  onTotpReset,
  labels = {},
}) => {
  const { tComponent } = useI18n();
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // TOTP management state
  const [totpStatus, setTotpStatus] = useState<boolean | undefined>(totpEnabled);

  // Sync totpStatus when the totpEnabled prop transitions from undefined to a
  // concrete value (i.e. after the wrapper fetches it asynchronously).
  useEffect(() => {
    if (totpEnabled !== undefined) {
      setTotpStatus(totpEnabled);
    }
  }, [totpEnabled]);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpProvisioningUri, setTotpProvisioningUri] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpSetupLoading, setTotpSetupLoading] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [showDisablePrompt, setShowDisablePrompt] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableSubmitting, setDisableSubmitting] = useState(false);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const handleEnableTotp = useCallback(async () => {
    if (!onTotpSetup) return;
    setTotpSetupLoading(true);
    setTotpError(null);
    try {
      const result = await onTotpSetup();
      if ('error' in result) {
        setTotpError(result.error);
      } else {
        setTotpProvisioningUri(result.provisioningUri);
        setTotpSecret(result.secret);
        setShowTotpSetup(true);
      }
    } catch {
      setTotpError(labels.totpError || 'Failed to set up two-factor authentication');
    } finally {
      setTotpSetupLoading(false);
    }
  }, [onTotpSetup, labels.totpError]);

  const handleTotpConfirm = useCallback(
    async (code: string): Promise<{ success: boolean } | { error: string }> => {
      if (!onTotpConfirm) {
        return { error: 'TOTP confirmation is not available' };
      }
      const result = await onTotpConfirm(code);
      if ('success' in result && result.success) {
        setTotpStatus(true);
        setShowTotpSetup(false);
        setTotpProvisioningUri(null);
        setTotpSecret(null);
      }
      return result;
    },
    [onTotpConfirm]
  );

  const handleDisableTotp = useCallback(async () => {
    if (!onTotpDisable || !disableCode) return;
    setDisableSubmitting(true);
    setTotpError(null);
    try {
      const result = await onTotpDisable(disableCode);
      if ('error' in result) {
        setTotpError(result.error);
      } else {
        setTotpStatus(false);
        setShowDisablePrompt(false);
        setDisableCode('');
      }
    } catch {
      setTotpError(labels.totpError || 'Failed to disable two-factor authentication');
    } finally {
      setDisableSubmitting(false);
    }
  }, [onTotpDisable, disableCode, labels.totpError]);

  const handleResetTotp = useCallback(async () => {
    if (!onTotpReset || !resetCode) return;
    setResetSubmitting(true);
    setTotpError(null);
    try {
      const result = await onTotpReset(resetCode);
      if ('error' in result) {
        setTotpError(result.error);
      } else {
        setTotpProvisioningUri(result.provisioningUri);
        setTotpSecret(result.secret);
        setShowResetPrompt(false);
        setResetCode('');
        setShowTotpSetup(true);
      }
    } catch {
      setTotpError(labels.totpError || 'Failed to reset two-factor authentication');
    } finally {
      setResetSubmitting(false);
    }
  }, [onTotpReset, resetCode, labels.totpError]);

  const handleCancelTotpAction = useCallback(() => {
    setShowTotpSetup(false);
    setShowDisablePrompt(false);
    setShowResetPrompt(false);
    setTotpProvisioningUri(null);
    setTotpSecret(null);
    setDisableCode('');
    setResetCode('');
    setTotpError(null);
  }, []);

  const timezones = useMemo(() => moment.tz.names(), []);
  const currencies = useMemo(
    () =>
      CurrencyCode.getAllData().map((c) => ({
        code: c.code,
        label: `${c.code} - ${c.currency}`,
      })),
    []
  );

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
    timezone:
      timezoneValidation ||
      Yup.string()
        .required(
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_TimezoneRequired
          )
        )
        .test(
          'valid-timezone',
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_TimezoneInvalid
          ),
          (value) => !value || moment.tz.zone(value) !== null
        ),
    siteLanguage:
      siteLanguageValidation ||
      Yup.string().required(
        tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.Validation_Required
        )
      ),
    currency:
      currencyValidation ||
      Yup.string()
        .required(
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_Required
          )
        )
        .test(
          'valid-currency',
          tComponent<SuiteCoreStringKeyValue>(
            SuiteCoreComponentId,
            SuiteCoreStringKey.Validation_Required
          ),
          (value) => !value || CurrencyCode.isValid(value)
        ),
    darkMode:
      darkModeValidation ||
      Yup.boolean().required(
        tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.Validation_Required
        )
      ),
    directChallenge:
      directChallengeValidation ||
      Yup.boolean().required(
        tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.Validation_Required
        )
      ),
    ...(Constants.EnableDisplayName ? {
      displayName: displayNameValidation ||
        Yup.string()
          .min(
            Constants.DisplayNameMinLength,
            tComponent<SuiteCoreStringKeyValue>(
              SuiteCoreComponentId,
              SuiteCoreStringKey.Validation_DisplayNameMinLengthTemplate
            )
          )
          .max(
            Constants.DisplayNameMaxLength,
            tComponent<SuiteCoreStringKeyValue>(
              SuiteCoreComponentId,
              SuiteCoreStringKey.Validation_DisplayNameMaxLengthTemplate
            )
          )
          .matches(
            Constants.DisplayNameRegex,
            tComponent<SuiteCoreStringKeyValue>(
              SuiteCoreComponentId,
              SuiteCoreStringKey.Validation_DisplayNameRegexErrorTemplate
            )
          ),
    } : {}),
  };

  const formik = useFormik<UserSettingsFormValues>({
    initialValues: {
      ...initialValues,
      ...additionalInitialValues,
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      email: validation.email,
      timezone: validation.timezone,
      siteLanguage: validation.siteLanguage,
      currency: validation.currency,
      darkMode: validation.darkMode,
      directChallenge: validation.directChallenge,
      ...(Constants.EnableDisplayName && validation.displayName ? { displayName: validation.displayName } : {}),
      ...additionalValidation,
    }),
    onSubmit: async (values, { setSubmitting, setFieldError, setTouched }) => {
      setSaving(true);
      setSuccessMessage(null);
      const result = await onSubmit(values);

      if ('success' in result && result.success) {
        setSuccessMessage(
          result.message ||
            labels.successMessage ||
            tComponent<SuiteCoreStringKeyValue>(
              SuiteCoreComponentId,
              SuiteCoreStringKey.Settings_SaveSuccess
            )
        );
        setApiErrors({});
      } else {
        const newApiErrors: Record<string, string> = {};
        const fieldsToTouch: Record<string, boolean> = {};

        if ('field' in result && result.field) {
          setFieldError(result.field, result.error);
          fieldsToTouch[result.field] = true;
        }

        if ('errors' in result && result.errors) {
          result.errors.forEach((err) => {
            if (err.path && err.msg) {
              setFieldError(err.path, err.msg);
              fieldsToTouch[err.path] = true;
            }
          });
        }

        if (
          'error' in result &&
          result.error &&
          !Object.keys(newApiErrors).length
        ) {
          newApiErrors.general = result.error;
        }

        setApiErrors(newApiErrors);
        setTouched(fieldsToTouch, false);
      }
      setSubmitting(false);
      setSaving(false);
    },
  });

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          {labels.title ||
            tComponent<SuiteCoreStringKeyValue>(
              SuiteCoreComponentId,
              SuiteCoreStringKey.Settings_Title
            )}
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
            label={
              labels.email ||
              tComponent<SuiteCoreStringKeyValue>(
                SuiteCoreComponentId,
                SuiteCoreStringKey.Common_Email
              )
            }
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(
              formik.touched.email && (formik.errors.email || apiErrors.email)
            )}
            helperText={
              (formik.touched.email &&
                (formik.errors.email || apiErrors.email)) ||
              labels.emailHelper ||
              tComponent<SuiteCoreStringKeyValue>(
                SuiteCoreComponentId,
                SuiteCoreStringKey.Settings_EmailHelper
              )
            }
            margin="normal"
          />

          {Constants.EnableDisplayName && (
            <TextField
              fullWidth
              id="displayName"
              name="displayName"
              label={
                labels.displayName ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Common_DisplayName
                )
              }
              value={formik.values.displayName ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(
                formik.touched.displayName && (formik.errors.displayName || apiErrors.displayName)
              )}
              helperText={
                formik.touched.displayName && (formik.errors.displayName || apiErrors.displayName)
              }
              margin="normal"
            />
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel id="timezone-label">
              {labels.timezone ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Common_Timezone
                )}
            </InputLabel>
            <Select
              labelId="timezone-label"
              id="timezone"
              name="timezone"
              value={formik.values.timezone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.timezone && Boolean(formik.errors.timezone)}
              label={
                labels.timezone ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Common_Timezone
                )
              }
            >
              {timezones.map((tz) => (
                <MenuItem key={tz} value={tz}>
                  {tz}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.timezone &&
              (formik.errors.timezone || apiErrors.timezone) && (
                <Typography color="error" variant="caption">
                  {formik.errors.timezone || apiErrors.timezone}
                </Typography>
              )}
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="language-label">
              {labels.siteLanguage ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Settings_SiteLanguage
                )}
            </InputLabel>
            <Select
              labelId="language-label"
              id="siteLanguage"
              name="siteLanguage"
              value={formik.values.siteLanguage}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.siteLanguage &&
                Boolean(formik.errors.siteLanguage)
              }
              label={
                labels.siteLanguage ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Settings_SiteLanguage
                )
              }
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.label}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.siteLanguage &&
              (formik.errors.siteLanguage || apiErrors.siteLanguage) && (
                <Typography color="error" variant="caption">
                  {formik.errors.siteLanguage || apiErrors.siteLanguage}
                </Typography>
              )}
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="currency-label">
              {labels.currency ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Settings_Currency
                )}
            </InputLabel>
            <Select
              labelId="currency-label"
              id="currency"
              name="currency"
              value={formik.values.currency}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.currency && Boolean(formik.errors.currency)}
              label={
                labels.currency ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Settings_Currency
                )
              }
            >
              {currencies.map((curr) => (
                <MenuItem key={curr.code} value={curr.code}>
                  {curr.label}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.currency &&
              (formik.errors.currency || apiErrors.currency) && (
                <Typography color="error" variant="caption">
                  {formik.errors.currency || apiErrors.currency}
                </Typography>
              )}
          </FormControl>

          <FormControl fullWidth margin="normal">
            <FormControlLabel
              control={
                <Switch
                  id="darkMode"
                  name="darkMode"
                  checked={formik.values.darkMode}
                  onChange={formik.handleChange}
                />
              }
              label={
                labels.darkMode ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Settings_DarkMode
                )
              }
            />
          </FormControl>

          <FormControl fullWidth margin="normal">
            <FormControlLabel
              control={
                <Switch
                  id="directChallenge"
                  name="directChallenge"
                  checked={formik.values.directChallenge}
                  onChange={formik.handleChange}
                />
              }
              label={
                labels.directChallenge ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Registration_DirectChallengeLabel
                )
              }
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 4, mt: -1 }}
            >
              {labels.directChallengeHelper ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Registration_DirectChallengeHelper
                )}
            </Typography>
          </FormControl>

          {additionalFields && additionalFields(formik)}

          {apiErrors.general && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {apiErrors.general}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
              {successMessage}
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
            {saving
              ? labels.saving ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Settings_Saving
                )
              : labels.save ||
                tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Settings_Save
                )}
          </Button>
        </Box>

        {/* TOTP Two-Factor Authentication Management Section — outside the form
            to prevent TotpSetupForm's nested <form> from being swallowed by the
            outer form (nested <form> elements are invalid HTML). */}
        {totpStatus !== undefined && (
            <>
              <Divider sx={{ mt: 3, mb: 2 }} />
              <Typography variant="h6" component="h2" gutterBottom>
                {labels.totpSectionTitle || 'Two-Factor Authentication'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {totpStatus
                  ? (labels.totpStatusEnabled || '2FA is currently enabled')
                  : (labels.totpStatusDisabled || '2FA is currently disabled')}
              </Typography>

              {totpError && (
                <Alert severity="error" sx={{ mb: 2 }} role="alert">
                  {totpError}
                </Alert>
              )}

              {/* Enable 2FA flow */}
              {!totpStatus && !showTotpSetup && (
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleEnableTotp}
                  disabled={totpSetupLoading}
                  data-testid="enable-totp-button"
                >
                  {totpSetupLoading
                    ? 'Setting up...'
                    : (labels.totpEnableButton || 'Enable 2FA')}
                </Button>
              )}

              {/* TotpSetupForm inline (for enable or reset flows) */}
              {showTotpSetup && totpProvisioningUri && totpSecret && (
                <Box sx={{ mt: 2 }}>
                  <TotpSetupForm
                    provisioningUri={totpProvisioningUri}
                    secret={totpSecret}
                    onConfirm={handleTotpConfirm}
                  />
                  <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Button
                      type="button"
                      variant="text"
                      onClick={handleCancelTotpAction}
                      data-testid="cancel-totp-setup-button"
                    >
                      {labels.totpCancelButton || 'Cancel'}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Disable 2FA and Reset 2FA buttons */}
              {totpStatus && !showTotpSetup && !showDisablePrompt && !showResetPrompt && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    color="error"
                    onClick={() => { setShowDisablePrompt(true); setTotpError(null); }}
                    data-testid="disable-totp-button"
                  >
                    {labels.totpDisableButton || 'Disable 2FA'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => { setShowResetPrompt(true); setTotpError(null); }}
                    data-testid="reset-totp-button"
                  >
                    {labels.totpResetButton || 'Reset 2FA'}
                  </Button>
                </Box>
              )}

              {/* Disable 2FA code prompt */}
              {showDisablePrompt && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Enter your current 2FA code to disable two-factor authentication:
                  </Typography>
                  <TextField
                    fullWidth
                    id="totp-disable-code"
                    name="totp-disable-code"
                    label={labels.totpDisableCodeLabel || 'TOTP Code'}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    inputProps={{
                      'aria-label': labels.totpDisableCodeLabel || 'TOTP Code',
                      inputMode: 'numeric',
                      maxLength: 6,
                      pattern: '\\d{6}',
                    }}
                    autoComplete="one-time-code"
                    margin="normal"
                  />
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Button
                      type="button"
                      variant="contained"
                      color="error"
                      onClick={handleDisableTotp}
                      disabled={disableSubmitting || !/^\d{6}$/.test(disableCode)}
                      data-testid="disable-totp-submit-button"
                    >
                      {disableSubmitting
                        ? 'Disabling...'
                        : (labels.totpDisableSubmitButton || 'Confirm Disable')}
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      onClick={handleCancelTotpAction}
                      data-testid="cancel-disable-totp-button"
                    >
                      {labels.totpCancelButton || 'Cancel'}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Reset 2FA code prompt */}
              {showResetPrompt && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Enter your current 2FA code to reset two-factor authentication:
                  </Typography>
                  <TextField
                    fullWidth
                    id="totp-reset-code"
                    name="totp-reset-code"
                    label={labels.totpResetCodeLabel || 'TOTP Code'}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    inputProps={{
                      'aria-label': labels.totpResetCodeLabel || 'TOTP Code',
                      inputMode: 'numeric',
                      maxLength: 6,
                      pattern: '\\d{6}',
                    }}
                    autoComplete="one-time-code"
                    margin="normal"
                  />
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Button
                      type="button"
                      variant="contained"
                      onClick={handleResetTotp}
                      disabled={resetSubmitting || !/^\d{6}$/.test(resetCode)}
                      data-testid="reset-totp-submit-button"
                    >
                      {resetSubmitting
                        ? 'Resetting...'
                        : (labels.totpResetSubmitButton || 'Confirm Reset')}
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      onClick={handleCancelTotpAction}
                      data-testid="cancel-reset-totp-button"
                    >
                      {labels.totpCancelButton || 'Cancel'}
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}
      </Box>
    </Container>
  );
};

export default UserSettingsForm;
