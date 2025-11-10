import { CurrencyCode } from '@digitaldefiance/i18n-lib';
import { MenuItem, TextField } from '@mui/material';
import { Field, FieldProps } from 'formik';
import { ChangeEvent, FC } from 'react';

export interface CurrencyCodeSelectorProps {
  name: string;
  label: string;
  onCurrencyChange?: (code: string) => void;
}

export const CurrencyCodeSelector: FC<CurrencyCodeSelectorProps> = ({
  name,
  label,
  onCurrencyChange,
}) => {
  return (
    <Field name={name}>
      {({ field, form }: FieldProps) => (
        <TextField
          select
          fullWidth
          label={label}
          {...field}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const selectedCode = event.target.value;
            form.setFieldValue(name, selectedCode);
            onCurrencyChange?.(selectedCode);
          }}
          error={form.touched[name] && Boolean(form.errors[name])}
          helperText={form.touched[name] && (form.errors[name] as string)}
          sx={{
            '& .MuiSelect-select': {
              paddingRight: '32px',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.87)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
        >
          {CurrencyCode.getAll().map((code: string) => (
            <MenuItem key={code} value={code}>
              {code}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Field>
  );
};

export default CurrencyCodeSelector;