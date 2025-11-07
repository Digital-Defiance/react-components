import { MenuItem, TextField } from '@mui/material';
import { FormikProps } from 'formik';
import { ChangeEvent, FC } from 'react';

export interface ExpirationSecondsSelectorProps {
  name: string;
  label: string;
  formik: FormikProps<any>;
  optionValues: number[];
  optionNames: string[];
  onChange?: (value: number) => void;
}

export const ExpirationSecondsSelector: FC<ExpirationSecondsSelectorProps> = ({
  name,
  label,
  formik,
  optionValues,
  optionNames,
  onChange,
}) => {
  return (
    <TextField
      select
      fullWidth
      label={label}
      name={name}
      value={formik.values[name] ?? ''}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const selectedValue = event.target.value;
        formik.setFieldValue(name, selectedValue);
        if (onChange) {
          onChange(parseInt(selectedValue));
        }
      }}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && (formik.errors[name] as string)}
      sx={{
        mt: 1,
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
      {optionNames.map((name: string, index: number) => (
        <MenuItem key={name} value={optionValues[index]}>
          {name}
        </MenuItem>
      ))}
    </TextField>
  );
};
