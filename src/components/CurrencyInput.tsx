import { TextField } from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { getCurrencyFormat } from '@digitaldefiance/i18n-lib';

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currencyCode?: string;
  locale?: string;
  label: string;
  error?: boolean;
  helperText?: string;
  name: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currencyCode = 'USD',
  locale = 'en-US',
  label,
  error,
  helperText,
  name,
}) => {
  const format = getCurrencyFormat(locale, currencyCode);

  if (format.position === 'infix') {
    const [whole, decimal] = value.toString().split('.');
    const displayValue = `${whole}${format.symbol}${format.decimalSeparator}${
      decimal || '00'
    }`;

    return (
      <NumericFormat
        customInput={TextField}
        fullWidth
        margin="normal"
        label={label}
        value={displayValue}
        thousandSeparator={format.groupSeparator}
        decimalSeparator={format.decimalSeparator}
        decimalScale={2}
        fixedDecimalScale
        valueIsNumericString
        onValueChange={(values) => {
          onChange(values.floatValue || 0);
        }}
        error={error}
        helperText={helperText}
        name={name}
      />
    );
  }

  return (
    <NumericFormat
      customInput={TextField}
      fullWidth
      margin="normal"
      label={label}
      value={value}
      thousandSeparator={format.groupSeparator}
      decimalSeparator={format.decimalSeparator}
      decimalScale={2}
      fixedDecimalScale
      prefix={format.position === 'prefix' ? format.symbol + ' ' : undefined}
      suffix={format.position === 'postfix' ? ' ' + format.symbol : undefined}
      valueIsNumericString
      onValueChange={(values) => {
        onChange(values.floatValue || 0);
      }}
      error={error}
      helperText={helperText}
      name={name}
    />
  );
};

export default CurrencyInput;