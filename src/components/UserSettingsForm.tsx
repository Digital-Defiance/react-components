import {
  Alert,
  Box,
  Button,
  Container,
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
import { FC, useState, useMemo } from 'react';
import * as Yup from 'yup';
import moment from 'moment-timezone';
import { CurrencyCode } from '@digitaldefiance/i18n-lib';
import { SuiteCoreComponentId, SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';
import { useI18n } from '../contexts';

export interface UserSettingsFormValues {
  email: string;
  timezone: string;
  siteLanguage: string;
  currency: string;
  darkMode: boolean;
  directChallenge: boolean;
  [key: string]: any;
}

export interface UserSettingsFormProps {
  initialValues: UserSettingsFormValues;
  onSubmit: (values: UserSettingsFormValues) => Promise<
    | { success: boolean; message: string }
    | { error: string; errorType?: string; field?: string; errors?: Array<{ path: string; msg: string }> }
  >;
  languages: Array<{ code: string; label: string }>;
  emailValidation?: Yup.StringSchema;
  timezoneValidation?: Yup.StringSchema;
  siteLanguageValidation?: Yup.StringSchema;
  currencyValidation?: Yup.StringSchema;
  darkModeValidation?: Yup.BooleanSchema;
  directChallengeValidation?: Yup.BooleanSchema;
  additionalFields?: (formik: any) => React.ReactNode;
  additionalInitialValues?: Record<string, any>;
  additionalValidation?: Record<string, Yup.Schema>;
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
    saving?: string;
    save?: string;
    successMessage?: string;
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
  additionalFields,
  additionalInitialValues = {},
  additionalValidation = {},
  labels = {},
}) => {
  const { tComponent } = useI18n();
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const timezones = useMemo(() => moment.tz.names(), []);
  const currencies = useMemo(() => CurrencyCode.getAllData().map(c => ({ code: c.code, label: `${c.code} - ${c.currency}` })), []);

  const validation = {
    email: emailValidation || Yup.string()
      .email(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_InvalidEmail))
      .required(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    timezone: timezoneValidation || Yup.string()
      .required(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_TimezoneRequired))
      .test('valid-timezone', tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_TimezoneInvalid), (value) => !value || moment.tz.zone(value) !== null),
    siteLanguage: siteLanguageValidation || Yup.string()
      .required(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    currency: currencyValidation || Yup.string()
      .required(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required))
      .test('valid-currency', tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required), (value) => !value || CurrencyCode.isValid(value)),
    darkMode: darkModeValidation || Yup.boolean()
      .required(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
    directChallenge: directChallengeValidation || Yup.boolean()
      .required(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Validation_Required)),
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
      ...additionalValidation,
    }),
    onSubmit: async (values, { setSubmitting, setFieldError, setTouched }) => {
      setSaving(true);
      setSuccessMessage(null);
      const result = await onSubmit(values);
      
      if ('success' in result && result.success) {
        setSuccessMessage(result.message || labels.successMessage || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Settings_SaveSuccess));
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

        if ('error' in result && result.error && !Object.keys(newApiErrors).length) {
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
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {labels.title || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Settings_Title)}
        </Typography>

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label={labels.email || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_Email)}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.touched.email && (formik.errors.email || apiErrors.email))}
            helperText={
              (formik.touched.email && (formik.errors.email || apiErrors.email)) ||
              labels.emailHelper ||
              tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Settings_EmailHelper)
            }
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="timezone-label">
              {labels.timezone || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_Timezone)}
            </InputLabel>
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

          <FormControl fullWidth margin="normal">
            <InputLabel id="language-label">
              {labels.siteLanguage || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Settings_SiteLanguage)}
            </InputLabel>
            <Select
              labelId="language-label"
              id="siteLanguage"
              name="siteLanguage"
              value={formik.values.siteLanguage}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.siteLanguage && Boolean(formik.errors.siteLanguage)}
              label={labels.siteLanguage || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Settings_SiteLanguage)}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.label}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.siteLanguage && (formik.errors.siteLanguage || apiErrors.siteLanguage) && (
              <Typography color="error" variant="caption">
                {formik.errors.siteLanguage || apiErrors.siteLanguage}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="currency-label">
              {labels.currency || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Settings_Currency)}
            </InputLabel>
            <Select
              labelId="currency-label"
              id="currency"
              name="currency"
              value={formik.values.currency}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.currency && Boolean(formik.errors.currency)}
              label={labels.currency || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Settings_Currency)}
            >
              {currencies.map((curr) => (
                <MenuItem key={curr.code} value={curr.code}>
                  {curr.label}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.currency && (formik.errors.currency || apiErrors.currency) && (
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
              label={labels.darkMode || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Settings_DarkMode)}
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
              label={labels.directChallenge || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Registration_DirectChallengeLabel)}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
              {labels.directChallengeHelper || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Registration_DirectChallengeHelper)}
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
              ? labels.saving || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Settings_Saving)
              : labels.save || tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Settings_Save)}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default UserSettingsForm;
